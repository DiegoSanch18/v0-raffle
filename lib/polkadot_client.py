"""
Cliente Python para interactuar con el smart contract de rifas en Polkadot
Utiliza py-substrate-interface para comunicarse con la blockchain
"""

import json
import logging
from typing import Optional, List, Dict, Any, Tuple
from dataclasses import dataclass
from datetime import datetime

from substrateinterface import SubstrateInterface, Keypair, KeypairType
from substrateinterface.contracts import ContractInstance, ContractCode
from substrateinterface.exceptions import SubstrateRequestException

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class RaffleInfo:
    """Información de una rifa"""
    raffle_id: int
    organizer: str
    title: str
    max_tickets: int
    ticket_price: int  # En planck (unidad más pequeña de DOT)
    fee_percent: int
    stake_percent: int
    tickets_sold: int
    winner: Optional[str]
    is_closed: bool
    total_stake: int
    created_at: int
    participants: List[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convierte a diccionario para JSON"""
        return {
            'raffle_id': self.raffle_id,
            'organizer': self.organizer,
            'title': self.title,
            'max_tickets': self.max_tickets,
            'ticket_price': self.ticket_price,
            'fee_percent': self.fee_percent,
            'stake_percent': self.stake_percent,
            'tickets_sold': self.tickets_sold,
            'winner': self.winner,
            'is_closed': self.is_closed,
            'total_stake': self.total_stake,
            'created_at': self.created_at,
            'participants': self.participants or []
        }

class PolkadotRaffleClient:
    """Cliente para interactuar con el smart contract de rifas en Polkadot"""
    
    def __init__(
        self, 
        ws_url: str = "wss://rpc.polkadot.io",
        contract_address: Optional[str] = None,
        contract_metadata_path: Optional[str] = None
    ):
        """
        Inicializa el cliente de Polkadot
        
        Args:
            ws_url: URL del nodo Polkadot/Substrate
            contract_address: Dirección del contrato desplegado
            contract_metadata_path: Ruta al archivo de metadata del contrato
        """
        self.ws_url = ws_url
        self.contract_address = contract_address
        self.substrate = None
        self.contract = None
        
        try:
            # Conectar a la blockchain
            self.substrate = SubstrateInterface(url=ws_url)
            logger.info(f"Conectado a {ws_url}")
            
            # Cargar el contrato si se proporciona
            if contract_address and contract_metadata_path:
                self.load_contract(contract_address, contract_metadata_path)
                
        except Exception as e:
            logger.error(f"Error conectando a Polkadot: {e}")
            raise

    def load_contract(self, contract_address: str, metadata_path: str):
        """Carga el contrato usando su dirección y metadata"""
        try:
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
            
            self.contract = ContractInstance.create_from_address(
                contract_address=contract_address,
                metadata_file=metadata_path,
                substrate=self.substrate
            )
            
            self.contract_address = contract_address
            logger.info(f"Contrato cargado: {contract_address}")
            
        except Exception as e:
            logger.error(f"Error cargando contrato: {e}")
            raise

    def create_keypair(self, mnemonic: str) -> Keypair:
        """Crea un keypair desde una frase mnemónica"""
        return Keypair.create_from_mnemonic(mnemonic, crypto_type=KeypairType.SR25519)

    def get_balance(self, address: str) -> int:
        """Obtiene el balance de una cuenta en planck"""
        try:
            result = self.substrate.query(
                module='System',
                storage_function='Account',
                params=[address]
            )
            return result.value['data']['free']
        except Exception as e:
            logger.error(f"Error obteniendo balance: {e}")
            return 0

    def create_raffle(
        self,
        keypair: Keypair,
        title: str,
        max_tickets: int,
        ticket_price: int,  # En planck
        fee_percent: int,
        stake_percent: int
    ) -> Tuple[bool, Optional[str]]:
        """
        Crea una nueva rifa
        
        Returns:
            Tuple[bool, Optional[str]]: (éxito, hash_transacción)
        """
        if not self.contract:
            raise ValueError("Contrato no cargado")
        
        try:
            # Preparar la llamada al contrato
            call = self.contract.functions.create_raffle(
                title=title,
                max_tickets=max_tickets,
                ticket_price=ticket_price,
                fee_percent=fee_percent,
                stake_percent=stake_percent
            )
            
            # Estimar gas
            gas_estimate = call.estimate_gas(keypair.ss58_address)
            
            # Ejecutar transacción
            receipt = call.exec(
                keypair,
                gas_limit=gas_estimate['gas_required'],
                value=0
            )
            
            if receipt.is_success:
                logger.info(f"Rifa creada exitosamente: {receipt.extrinsic_hash}")
                return True, receipt.extrinsic_hash
            else:
                logger.error(f"Error creando rifa: {receipt.error_message}")
                return False, None
                
        except Exception as e:
            logger.error(f"Error en create_raffle: {e}")
            return False, None

    def buy_ticket(
        self,
        keypair: Keypair,
        raffle_id: int,
        ticket_price: int
    ) -> Tuple[bool, Optional[str]]:
        """
        Compra un ticket para una rifa
        
        Args:
            keypair: Keypair del comprador
            raffle_id: ID de la rifa
            ticket_price: Precio del ticket en planck
            
        Returns:
            Tuple[bool, Optional[str]]: (éxito, hash_transacción)
        """
        if not self.contract:
            raise ValueError("Contrato no cargado")
        
        try:
            # Preparar la llamada al contrato (payable)
            call = self.contract.functions.buy_ticket(raffle_id=raffle_id)
            
            # Estimar gas
            gas_estimate = call.estimate_gas(keypair.ss58_address, value=ticket_price)
            
            # Ejecutar transacción con valor (pago del ticket)
            receipt = call.exec(
                keypair,
                gas_limit=gas_estimate['gas_required'],
                value=ticket_price
            )
            
            if receipt.is_success:
                logger.info(f"Ticket comprado exitosamente: {receipt.extrinsic_hash}")
                return True, receipt.extrinsic_hash
            else:
                logger.error(f"Error comprando ticket: {receipt.error_message}")
                return False, None
                
        except Exception as e:
            logger.error(f"Error en buy_ticket: {e}")
            return False, None

    def close_raffle(
        self,
        keypair: Keypair,
        raffle_id: int
    ) -> Tuple[bool, Optional[str]]:
        """
        Cierra una rifa y selecciona ganador (solo organizador)
        
        Returns:
            Tuple[bool, Optional[str]]: (éxito, hash_transacción)
        """
        if not self.contract:
            raise ValueError("Contrato no cargado")
        
        try:
            call = self.contract.functions.close_raffle(raffle_id=raffle_id)
            
            gas_estimate = call.estimate_gas(keypair.ss58_address)
            
            receipt = call.exec(
                keypair,
                gas_limit=gas_estimate['gas_required'],
                value=0
            )
            
            if receipt.is_success:
                logger.info(f"Rifa cerrada exitosamente: {receipt.extrinsic_hash}")
                return True, receipt.extrinsic_hash
            else:
                logger.error(f"Error cerrando rifa: {receipt.error_message}")
                return False, None
                
        except Exception as e:
            logger.error(f"Error en close_raffle: {e}")
            return False, None

    def claim_prize(
        self,
        keypair: Keypair,
        raffle_id: int
    ) -> Tuple[bool, Optional[str]]:
        """
        Reclama el premio de una rifa (solo ganador)
        
        Returns:
            Tuple[bool, Optional[str]]: (éxito, hash_transacción)
        """
        if not self.contract:
            raise ValueError("Contrato no cargado")
        
        try:
            call = self.contract.functions.claim_prize(raffle_id=raffle_id)
            
            gas_estimate = call.estimate_gas(keypair.ss58_address)
            
            receipt = call.exec(
                keypair,
                gas_limit=gas_estimate['gas_required'],
                value=0
            )
            
            if receipt.is_success:
                logger.info(f"Premio reclamado exitosamente: {receipt.extrinsic_hash}")
                return True, receipt.extrinsic_hash
            else:
                logger.error(f"Error reclamando premio: {receipt.error_message}")
                return False, None
                
        except Exception as e:
            logger.error(f"Error en claim_prize: {e}")
            return False, None

    def get_raffle_info(self, raffle_id: int) -> Optional[RaffleInfo]:
        """Obtiene información de una rifa"""
        if not self.contract:
            raise ValueError("Contrato no cargado")
        
        try:
            # Llamada de solo lectura
            result = self.contract.functions.get_raffle_info(
                raffle_id=raffle_id
            ).read()
            
            if result and result.value:
                raffle_data = result.value
                
                # Obtener participantes
                participants_result = self.contract.functions.get_raffle_participants(
                    raffle_id=raffle_id
                ).read()
                
                participants = participants_result.value if participants_result else []
                
                return RaffleInfo(
                    raffle_id=raffle_id,
                    organizer=raffle_data['organizer'],
                    title=raffle_data['title'],
                    max_tickets=raffle_data['max_tickets'],
                    ticket_price=raffle_data['ticket_price'],
                    fee_percent=raffle_data['fee_percent'],
                    stake_percent=raffle_data['stake_percent'],
                    tickets_sold=raffle_data['tickets_sold'],
                    winner=raffle_data['winner'],
                    is_closed=raffle_data['is_closed'],
                    total_stake=raffle_data['total_stake'],
                    created_at=raffle_data['created_at'],
                    participants=participants
                )
            
            return None
            
        except Exception as e:
            logger.error(f"Error obteniendo info de rifa: {e}")
            return None

    def get_all_raffles(self, max_raffles: int = 100) -> List[RaffleInfo]:
        """Obtiene información de todas las rifas"""
        if not self.contract:
            raise ValueError("Contrato no cargado")
        
        raffles = []
        
        try:
            # Obtener el número total de rifas
            count_result = self.contract.functions.get_raffle_count().read()
            total_raffles = count_result.value if count_result else 0
            
            # Limitar la cantidad de rifas a obtener
            limit = min(total_raffles, max_raffles)
            
            for raffle_id in range(limit):
                raffle_info = self.get_raffle_info(raffle_id)
                if raffle_info:
                    raffles.append(raffle_info)
            
            return raffles
            
        except Exception as e:
            logger.error(f"Error obteniendo todas las rifas: {e}")
            return []

    def has_user_participated(self, raffle_id: int, user_address: str) -> bool:
        """Verifica si un usuario participó en una rifa"""
        if not self.contract:
            raise ValueError("Contrato no cargado")
        
        try:
            result = self.contract.functions.has_user_participated(
                raffle_id=raffle_id,
                user=user_address
            ).read()
            
            return result.value if result else False
            
        except Exception as e:
            logger.error(f"Error verificando participación: {e}")
            return False

    def get_platform_authority(self) -> Optional[str]:
        """Obtiene la dirección de la autoridad de la plataforma"""
        if not self.contract:
            raise ValueError("Contrato no cargado")
        
        try:
            result = self.contract.functions.get_platform_authority().read()
            return result.value if result else None
            
        except Exception as e:
            logger.error(f"Error obteniendo autoridad: {e}")
            return None

    def planck_to_dot(self, planck: int) -> float:
        """Convierte planck a DOT"""
        return planck / 10**10

    def dot_to_planck(self, dot: float) -> int:
        """Convierte DOT a planck"""
        return int(dot * 10**10)

    def close_connection(self):
        """Cierra la conexión con la blockchain"""
        if self.substrate:
            self.substrate.close()
            logger.info("Conexión cerrada")

# Funciones de utilidad
def create_test_client() -> PolkadotRaffleClient:
    """Crea un cliente de prueba conectado a un nodo local"""
    return PolkadotRaffleClient(
        ws_url="ws://127.0.0.1:9944",  # Nodo local de desarrollo
    )

def create_mainnet_client() -> PolkadotRaffleClient:
    """Crea un cliente conectado a Polkadot mainnet"""
    return PolkadotRaffleClient(
        ws_url="wss://rpc.polkadot.io"
    )

# Ejemplo de uso
if __name__ == "__main__":
    # Ejemplo básico de uso del cliente
    print("=== Cliente Polkadot para Rifas ===")
    
    try:
        # Crear cliente (usar nodo local para desarrollo)
        client = create_test_client()
        
        # Crear keypair de prueba
        mnemonic = "bottom drive obey lake curtain smoke basket hold race lonely fit walk"
        keypair = client.create_keypair(mnemonic)
        
        print(f"Dirección: {keypair.ss58_address}")
        print(f"Balance: {client.planck_to_dot(client.get_balance(keypair.ss58_address))} DOT")
        
        # Aquí irían las operaciones con el contrato una vez desplegado
        print("Cliente listo para interactuar con contratos de rifas")
        
    except Exception as e:
        print(f"Error: {e}")
