"""
Script para desplegar el smart contract de rifas en Polkadot
"""

import json
import os
from substrateinterface import SubstrateInterface, Keypair
from substrateinterface.contracts import ContractCode, ContractInstance

def deploy_raffle_contract(
    substrate_url: str = "ws://127.0.0.1:9944",
    deployer_mnemonic: str = None,
    platform_fee_account: str = None
):
    """
    Despliega el contrato de rifas en la blockchain
    
    Args:
        substrate_url: URL del nodo Substrate
        deployer_mnemonic: Frase mnemónica del desplegador
        platform_fee_account: Cuenta que recibirá los fees de la plataforma
    """
    
    if not deployer_mnemonic:
        deployer_mnemonic = "bottom drive obey lake curtain smoke basket hold race lonely fit walk"
    
    try:
        # Conectar a la blockchain
        substrate = SubstrateInterface(url=substrate_url)
        print(f"Conectado a {substrate_url}")
        
        # Crear keypair del desplegador
        deployer = Keypair.create_from_mnemonic(deployer_mnemonic)
        print(f"Desplegador: {deployer.ss58_address}")
        
        # Usar la misma cuenta como fee account si no se especifica
        if not platform_fee_account:
            platform_fee_account = deployer.ss58_address
        
        # Cargar el código del contrato compilado
        contract_wasm_path = "contracts/target/ink/raffle.wasm"
        contract_metadata_path = "contracts/target/ink/raffle.json"
        
        if not os.path.exists(contract_wasm_path):
            print(f"Error: No se encuentra {contract_wasm_path}")
            print("Asegúrate de compilar el contrato primero con: cargo contract build")
            return None
        
        # Crear instancia del código del contrato
        contract_code = ContractCode.create_from_contract_files(
            metadata_file=contract_metadata_path,
            wasm_file=contract_wasm_path,
            substrate=substrate
        )
        
        print("Código del contrato cargado")
        
        # Desplegar el contrato
        print("Desplegando contrato...")
        contract = contract_code.deploy(
            keypair=deployer,
            constructor="new",
            args={
                'platform_fee_account': platform_fee_account
            },
            gas_limit=1000000000000,  # Ajustar según sea necesario
            value=0
        )
        
        print(f"✅ Contrato desplegado exitosamente!")
        print(f"📍 Dirección del contrato: {contract.contract_address}")
        print(f"🔗 Hash de la transacción: {contract.deploy_receipt.extrinsic_hash}")
        
        # Guardar información del despliegue
        deployment_info = {
            "contract_address": contract.contract_address,
            "deployer": deployer.ss58_address,
            "platform_fee_account": platform_fee_account,
            "deploy_hash": contract.deploy_receipt.extrinsic_hash,
            "substrate_url": substrate_url,
            "metadata_path": contract_metadata_path
        }
        
        with open("deployment_info.json", "w") as f:
            json.dump(deployment_info, f, indent=2)
        
        print("📄 Información de despliegue guardada en deployment_info.json")
        
        return contract
        
    except Exception as e:
        print(f"❌ Error desplegando contrato: {e}")
        return None

def test_deployed_contract(contract_address: str, metadata_path: str):
    """Prueba básica del contrato desplegado"""
    
    try:
        substrate = SubstrateInterface(url="ws://127.0.0.1:9944")
        
        # Cargar el contrato desplegado
        contract = ContractInstance.create_from_address(
            contract_address=contract_address,
            metadata_file=metadata_path,
            substrate=substrate
        )
        
        print(f"Contrato cargado: {contract_address}")
        
        # Probar función de solo lectura
        authority_result = contract.functions.get_platform_authority().read()
        if authority_result:
            print(f"Autoridad de la plataforma: {authority_result.value}")
        
        count_result = contract.functions.get_raffle_count().read()
        if count_result:
            print(f"Número de rifas: {count_result.value}")
        
        print("✅ Contrato funcionando correctamente")
        
    except Exception as e:
        print(f"❌ Error probando contrato: {e}")

if __name__ == "__main__":
    print("=== Despliegue de Contrato de Rifas ===")
    
    # Desplegar contrato
    contract = deploy_raffle_contract()
    
    if contract:
        # Probar el contrato desplegado
        print("\n=== Probando Contrato ===")
        test_deployed_contract(
            contract.contract_address,
            "contracts/target/ink/raffle.json"
        )
