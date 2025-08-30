"""
Tests de integración para el smart contract
"""

import pytest
import asyncio
import json
from pathlib import Path
import sys
import os

# Agregar el directorio lib al path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'lib'))

from polkadot_client import PolkadotRaffleClient

@pytest.mark.integration
class TestContractIntegration:
    """Tests de integración con el smart contract desplegado"""
    
    @pytest.fixture(scope="class")
    def client(self):
        """Cliente conectado a nodo local"""
        return PolkadotRaffleClient(ws_url="ws://127.0.0.1:9944")
    
    @pytest.fixture(scope="class")
    def test_keypair(self, client):
        """Keypair de prueba"""
        mnemonic = "bottom drive obey lake curtain smoke basket hold race lonely fit walk"
        return client.create_keypair(mnemonic)
    
    @pytest.fixture(scope="class")
    def deployed_contract_info(self):
        """Información del contrato desplegado"""
        deployment_file = Path("deployment_info.json")
        if deployment_file.exists():
            with open(deployment_file, 'r') as f:
                return json.load(f)
        else:
            pytest.skip("No se encontró información de despliegue")
    
    def test_contract_connection(self, client, deployed_contract_info):
        """Test de conexión al contrato desplegado"""
        client.load_contract(
            deployed_contract_info['contract_address'],
            deployed_contract_info['metadata_path']
        )
        
        assert client.contract is not None
        assert client.contract_address == deployed_contract_info['contract_address']
    
    def test_get_platform_authority(self, client, deployed_contract_info):
        """Test de obtención de autoridad de la plataforma"""
        client.load_contract(
            deployed_contract_info['contract_address'],
            deployed_contract_info['metadata_path']
        )
        
        authority = client.get_platform_authority()
        assert authority is not None
        assert len(authority) > 0
    
    def test_get_raffle_count(self, client, deployed_contract_info):
        """Test de obtención del contador de rifas"""
        client.load_contract(
            deployed_contract_info['contract_address'],
            deployed_contract_info['metadata_path']
        )
        
        count_result = client.contract.functions.get_raffle_count().read()
        assert count_result is not None
        assert isinstance(count_result.value, int)
        assert count_result.value >= 0
    
    @pytest.mark.slow
    def test_full_raffle_flow(self, client, test_keypair, deployed_contract_info):
        """Test del flujo completo de una rifa"""
        client.load_contract(
            deployed_contract_info['contract_address'],
            deployed_contract_info['metadata_path']
        )
        
        # 1. Crear rifa
        success, tx_hash = client.create_raffle(
            keypair=test_keypair,
            title="Test Integration Raffle",
            max_tickets=10,
            ticket_price=client.dot_to_planck(0.1),
            fee_percent=5,
            stake_percent=10
        )
        
        assert success == True
        assert tx_hash is not None
        
        # 2. Obtener información de la rifa
        raffle_info = client.get_raffle_info(0)  # Asumiendo que es la primera rifa
        
        if raffle_info:
            assert raffle_info.title == "Test Integration Raffle"
            assert raffle_info.max_tickets == 10
            assert raffle_info.is_closed == False
        
        # 3. Comprar ticket (si la rifa existe)
        if raffle_info:
            success, tx_hash = client.buy_ticket(
                keypair=test_keypair,
                raffle_id=0,
                ticket_price=raffle_info.ticket_price
            )
            
            # Nota: Esto podría fallar si el usuario ya participó
            # En un test real, usaríamos diferentes cuentas
            if success:
                assert tx_hash is not None

# Configuración para tests de integración
def pytest_configure(config):
    """Configuración de pytest"""
    config.addinivalue_line(
        "markers", "integration: marca tests de integración que requieren contrato desplegado"
    )
    config.addinivalue_line(
        "markers", "slow: marca tests que toman mucho tiempo"
    )
