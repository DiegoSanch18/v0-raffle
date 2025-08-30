"""
Script para configurar el entorno de desarrollo Polkadot
"""

import os
import subprocess
import sys
from pathlib import Path

def run_command(command, description):
    """Ejecuta un comando y maneja errores"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completado")
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"❌ Error en {description}: {e.stderr}")
        return None

def check_rust_installation():
    """Verifica si Rust está instalado"""
    result = subprocess.run("rustc --version", shell=True, capture_output=True)
    return result.returncode == 0

def check_cargo_contract():
    """Verifica si cargo-contract está instalado"""
    result = subprocess.run("cargo-contract --version", shell=True, capture_output=True)
    return result.returncode == 0

def setup_substrate_node():
    """Configura un nodo local de Substrate para desarrollo"""
    print("🔧 Configurando nodo local de Substrate...")
    
    # Crear directorio para el nodo si no existe
    node_dir = Path("substrate-node")
    if not node_dir.exists():
        node_dir.mkdir()
    
    # Descargar substrate-contracts-node si no existe
    node_binary = node_dir / "substrate-contracts-node"
    if not node_binary.exists():
        print("📥 Descargando substrate-contracts-node...")
        download_cmd = """
        cd substrate-node && 
        curl -L https://github.com/paritytech/substrate-contracts-node/releases/latest/download/substrate-contracts-node-linux.tar.gz | tar xz
        """
        run_command(download_cmd, "Descarga de substrate-contracts-node")
    
    return node_binary.exists()

def create_test_accounts():
    """Crea cuentas de prueba para desarrollo"""
    print("👤 Configurando cuentas de prueba...")
    
    test_accounts = {
        "alice": "//Alice",
        "bob": "//Bob", 
        "charlie": "//Charlie"
    }
    
    accounts_file = Path("test_accounts.json")
    
    import json
    with open(accounts_file, 'w') as f:
        json.dump(test_accounts, f, indent=2)
    
    print(f"✅ Cuentas de prueba guardadas en {accounts_file}")

def main():
    print("🚀 Configurando entorno de desarrollo Polkadot")
    print("=" * 50)
    
    # Verificar Rust
    if not check_rust_installation():
        print("❌ Rust no está instalado. Por favor instálalo desde https://rustup.rs/")
        sys.exit(1)
    print("✅ Rust está instalado")
    
    # Verificar cargo-contract
    if not check_cargo_contract():
        print("📦 Instalando cargo-contract...")
        run_command("cargo install --force --locked cargo-contract", "Instalación de cargo-contract")
    else:
        print("✅ cargo-contract está instalado")
    
    # Configurar nodo local
    setup_substrate_node()
    
    # Crear cuentas de prueba
    create_test_accounts()
    
    # Crear estructura de directorios
    dirs_to_create = ["tests", "deployments", "logs"]
    for dir_name in dirs_to_create:
        Path(dir_name).mkdir(exist_ok=True)
    
    print("\n🎉 Configuración completada!")
    print("\nPróximos pasos:")
    print("1. Compilar el contrato: npm run contract:build")
    print("2. Ejecutar nodo local: ./substrate-node/substrate-contracts-node --dev")
    print("3. Desplegar contrato: npm run contract:deploy")
    print("4. Ejecutar frontend: npm run dev")

if __name__ == "__main__":
    main()
