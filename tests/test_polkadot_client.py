"""
Tests para el cliente Polkadot
"""

import pytest
import asyncio
from unittest.mock import Mock, patch
import sys
import os

# Agregar el directorio lib al path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'lib'))

from polkadot_client import PolkadotRaffleClient, RaffleInfo

class TestPolkadotRaffleClient:
    """Tests para el cliente de rifas de Polkadot"""
    
    @pytest.fixture
    def client(self):
        """Fixture para crear un cliente de prueba"""
        return PolkadotRaffleClient(ws_url="ws://127.0.0.1:9944")
    
    @pytest.fixture
    def mock_keypair(self):
        """Fixture para crear un keypair mock"""
        mock_keypair = Mock()
        mock_keypair.ss58_address = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
        return mock_keypair
    
    def test_client_initialization(self, client):
        """Test de inicialización del cliente"""
        assert client.ws_url == "ws://127.0.0.1:9944"
        assert client.contract_address is None
        assert client.substrate is not None
    
    def test_create_keypair(self, client):
        """Test de creación de keypair"""
        mnemonic = "bottom drive obey lake curtain smoke basket hold race lonely fit walk"
        keypair = client.create_keypair(mnemonic)
        
        assert keypair is not None
        assert hasattr(keypair, 'ss58_address')
    
    def test_planck_to_dot_conversion(self, client):
        """Test de conversión planck a DOT"""
        planck = 10000000000  # 1 DOT
        dot = client.planck_to_dot(planck)
        assert dot == 1.0
    
    def test_dot_to_planck_conversion(self, client):
        """Test de conversión DOT a planck"""
        dot = 1.5
        planck = client.dot_to_planck(dot)
        assert planck == 15000000000
    
    @patch('polkadot_client.ContractInstance')
    def test_get_raffle_info_success(self, mock_contract, client):
        """Test de obtención exitosa de información de rifa"""
        # Mock del contrato
        client.contract = Mock()
        
        # Mock de la respuesta del contrato
        mock_result = Mock()
        mock_result.value = {
            'organizer': '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
            'title': 'Test Raffle',
            'max_tickets': 100,
            'ticket_price': 1000000000,
            'fee_percent': 5,
            'stake_percent': 10,
            'tickets_sold': 25,
            'winner': None,
            'is_closed': False,
            'total_stake': 250000000,
            'created_at': 1640995200
        }
        
        client.contract.functions.get_raffle_info.return_value.read.return_value = mock_result
        client.contract.functions.get_raffle_participants.return_value.read.return_value.value = []
        
        # Ejecutar test
        raffle_info = client.get_raffle_info(0)
        
        # Verificaciones
        assert raffle_info is not None
        assert raffle_info.title == 'Test Raffle'
        assert raffle_info.max_tickets == 100
        assert raffle_info.tickets_sold == 25
        assert raffle_info.is_closed == False
    
    def test_get_raffle_info_not_found(self, client):
        """Test cuando no se encuentra la rifa"""
        client.contract = Mock()
        client.contract.functions.get_raffle_info.return_value.read.return_value = None
        
        raffle_info = client.get_raffle_info(999)
        assert raffle_info is None
    
    @patch('polkadot_client.ContractInstance')
    def test_create_raffle_success(self, mock_contract, client, mock_keypair):
        """Test de creación exitosa de rifa"""
        client.contract = Mock()
        
        # Mock de estimación de gas
        mock_gas_estimate = {'gas_required': 1000000}
        client.contract.functions.create_raffle.return_value.estimate_gas.return_value = mock_gas_estimate
        
        # Mock de recibo exitoso
        mock_receipt = Mock()
        mock_receipt.is_success = True
        mock_receipt.extrinsic_hash = "0x123456789"
        client.contract.functions.create_raffle.return_value.exec.return_value = mock_receipt
        
        # Ejecutar test
        success, tx_hash = client.create_raffle(
            keypair=mock_keypair,
            title="Test Raffle",
            max_tickets=100,
            ticket_price=1000000000,
            fee_percent=5,
            stake_percent=10
        )
        
        # Verificaciones
        assert success == True
        assert tx_hash == "0x123456789"
    
    @patch('polkadot_client.ContractInstance')
    def test_buy_ticket_success(self, mock_contract, client, mock_keypair):
        """Test de compra exitosa de ticket"""
        client.contract = Mock()
        
        # Mock de estimación de gas
        mock_gas_estimate = {'gas_required': 500000}
        client.contract.functions.buy_ticket.return_value.estimate_gas.return_value = mock_gas_estimate
        
        # Mock de recibo exitoso
        mock_receipt = Mock()
        mock_receipt.is_success = True
        mock_receipt.extrinsic_hash = "0xabcdef123"
        client.contract.functions.buy_ticket.return_value.exec.return_value = mock_receipt
        
        # Ejecutar test
        success, tx_hash = client.buy_ticket(
            keypair=mock_keypair,
            raffle_id=0,
            ticket_price=1000000000
        )
        
        # Verificaciones
        assert success == True
        assert tx_hash == "0xabcdef123"

class TestRaffleInfo:
    """Tests para la clase RaffleInfo"""
    
    def test_raffle_info_creation(self):
        """Test de creación de RaffleInfo"""
        raffle = RaffleInfo(
            raffle_id=1,
            organizer="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
            title="Test Raffle",
            max_tickets=100,
            ticket_price=1000000000,
            fee_percent=5,
            stake_percent=10,
            tickets_sold=25,
            winner=None,
            is_closed=False,
            total_stake=250000000,
            created_at=1640995200
        )
        
        assert raffle.raffle_id == 1
        assert raffle.title == "Test Raffle"
        assert raffle.max_tickets == 100
        assert raffle.is_closed == False
    
    def test_raffle_info_to_dict(self):
        """Test de conversión a diccionario"""
        raffle = RaffleInfo(
            raffle_id=1,
            organizer="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
            title="Test Raffle",
            max_tickets=100,
            ticket_price=1000000000,
            fee_percent=5,
            stake_percent=10,
            tickets_sold=25,
            winner=None,
            is_closed=False,
            total_stake=250000000,
            created_at=1640995200
        )
        
        raffle_dict = raffle.to_dict()
        
        assert isinstance(raffle_dict, dict)
        assert raffle_dict['raffle_id'] == 1
        assert raffle_dict['title'] == "Test Raffle"
        assert raffle_dict['participants'] == []

# Configuración de pytest
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
