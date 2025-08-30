# Guía de Despliegue - Rifas en Polkadot

Esta guía te ayudará a desplegar y configurar la aplicación de rifas migrada de Solana a Polkadot.

## Requisitos Previos

### 1. Herramientas Necesarias
- **Rust** (versión estable): https://rustup.rs/
- **Node.js** (versión 18+): https://nodejs.org/
- **Python** (versión 3.8+): https://python.org/
- **Git**: https://git-scm.com/

### 2. Extensiones de Wallet
- **Polkadot.js Extension**: https://polkadot.js.org/extension/
- **Talisman** (opcional): https://talisman.xyz/
- **SubWallet** (opcional): https://subwallet.app/

## Configuración del Entorno

### 1. Clonar y Configurar el Proyecto
\`\`\`bash
git clone <tu-repositorio>
cd polkadot-raffle-dapp

# Ejecutar script de configuración automática
chmod +x scripts/setup_environment.sh
./scripts/setup_environment.sh
\`\`\`

### 2. Configuración Manual (si el script falla)
\`\`\`bash
# Instalar cargo-contract
cargo install --force --locked cargo-contract

# Crear entorno virtual Python
python3 -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias Python
pip install -r requirements.txt

# Instalar dependencias Node.js
npm install
\`\`\`

## Compilación del Smart Contract

### 1. Compilar el Contrato ink!
\`\`\`bash
# Opción 1: Usar npm script
npm run contract:build

# Opción 2: Manual
cd contracts
cargo contract build
\`\`\`

### 2. Verificar la Compilación
Después de la compilación exitosa, deberías ver:
- `contracts/target/ink/raffle.wasm` - Código compilado
- `contracts/target/ink/raffle.json` - Metadata del contrato

## Despliegue del Contrato

### 1. Configurar Nodo Local (Desarrollo)
\`\`\`bash
# Descargar y ejecutar substrate-contracts-node
./substrate-node/substrate-contracts-node --dev
\`\`\`

### 2. Desplegar el Contrato
\`\`\`bash
# Activar entorno Python
source venv/bin/activate

# Desplegar usando el script
npm run contract:deploy

# O manualmente
python scripts/deploy_contract.py
\`\`\`

### 3. Verificar el Despliegue
El script creará un archivo `deployment_info.json` con:
- Dirección del contrato
- Hash de la transacción
- Metadata del contrato

## Configuración del Frontend

### 1. Actualizar Variables de Entorno
Crea un archivo `.env.local`:
\`\`\`env
NEXT_PUBLIC_CONTRACT_ADDRESS=<dirección-del-contrato>
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:9944
NEXT_PUBLIC_NETWORK=development
\`\`\`

### 2. Ejecutar el Frontend
\`\`\`bash
npm run dev
\`\`\`

La aplicación estará disponible en `http://localhost:3000`

## Despliegue en Producción

### 1. Redes Soportadas
- **Polkadot Mainnet**: `wss://rpc.polkadot.io`
- **Kusama**: `wss://kusama-rpc.polkadot.io`
- **Westend (Testnet)**: `wss://westend-rpc.polkadot.io`

### 2. Desplegar en Testnet
\`\`\`bash
# Configurar para Westend
export WS_URL="wss://westend-rpc.polkadot.io"
python scripts/deploy_contract.py
\`\`\`

### 3. Configurar Frontend para Producción
\`\`\`env
NEXT_PUBLIC_CONTRACT_ADDRESS=<dirección-producción>
NEXT_PUBLIC_WS_URL=wss://westend-rpc.polkadot.io
NEXT_PUBLIC_NETWORK=westend
\`\`\`

## Testing

### 1. Tests del Contrato
\`\`\`bash
npm run contract:test
\`\`\`

### 2. Tests del Cliente Python
\`\`\`bash
npm run test:python
\`\`\`

### 3. Tests de Integración
\`\`\`bash
# Asegúrate de que el nodo local esté ejecutándose
python -m pytest tests/test_contract_integration.py -m integration
\`\`\`

## Monitoreo y Mantenimiento

### 1. Logs del Contrato
Los eventos del contrato se pueden monitorear usando:
\`\`\`python
from lib.polkadot_client import PolkadotRaffleClient

client = PolkadotRaffleClient()
# Implementar listener de eventos
\`\`\`

### 2. Backup de Datos
- Respaldar `deployment_info.json`
- Mantener copias de las claves privadas de forma segura
- Documentar todas las transacciones importantes

## Solución de Problemas

### Errores Comunes

1. **Error de compilación del contrato**
   \`\`\`bash
   cargo clean
   cargo contract build
   \`\`\`

2. **Error de conexión al nodo**
   - Verificar que el nodo esté ejecutándose
   - Comprobar la URL de conexión

3. **Error de fondos insuficientes**
   - Asegurar que las cuentas tengan suficiente DOT/KSM
   - Usar faucets para testnets

4. **Error de extensión de wallet**
   - Verificar que Polkadot.js extension esté instalada
   - Autorizar la aplicación en la extensión

### Contacto y Soporte

Para problemas específicos:
1. Revisar los logs en `logs/`
2. Consultar la documentación de Polkadot
3. Crear un issue en el repositorio

## Recursos Adicionales

- [Documentación de ink!](https://use.ink/)
- [Polkadot.js API](https://polkadot.js.org/docs/)
- [Substrate Contracts Node](https://github.com/paritytech/substrate-contracts-node)
- [py-substrate-interface](https://github.com/polkascan/py-substrate-interface)
