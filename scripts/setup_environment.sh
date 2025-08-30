#!/bin/bash

echo "🚀 Configurando entorno de desarrollo Polkadot..."

# Verificar si Rust está instalado
if ! command -v rustc &> /dev/null; then
    echo "❌ Rust no está instalado. Instalando..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
    source ~/.cargo/env
else
    echo "✅ Rust ya está instalado"
fi

# Instalar cargo-contract
if ! command -v cargo-contract &> /dev/null; then
    echo "📦 Instalando cargo-contract..."
    cargo install --force --locked cargo-contract
else
    echo "✅ cargo-contract ya está instalado"
fi

# Verificar si Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 no está instalado. Por favor instálalo manualmente."
    exit 1
else
    echo "✅ Python 3 está instalado"
fi

# Crear entorno virtual Python
if [ ! -d "venv" ]; then
    echo "🐍 Creando entorno virtual Python..."
    python3 -m venv venv
fi

# Activar entorno virtual e instalar dependencias
echo "📦 Instalando dependencias Python..."
source venv/bin/activate
pip install -r requirements.txt

# Instalar dependencias Node.js
echo "📦 Instalando dependencias Node.js..."
npm install

echo "✅ Entorno configurado exitosamente!"
echo ""
echo "Para activar el entorno Python:"
echo "source venv/bin/activate"
echo ""
echo "Para compilar el contrato:"
echo "npm run contract:build"
echo ""
echo "Para ejecutar el frontend:"
echo "npm run dev"
