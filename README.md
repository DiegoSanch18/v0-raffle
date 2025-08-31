# RaffleProgram - Contrato de Rifas para Solana

Este es un contrato inteligente desarrollado con Seahorse (Python) para crear y gestionar rifas en la blockchain de Solana.

## Características

### 1. Creación de Rifas
- **max_tickets**: Número máximo de tickets disponibles
- **ticket_price**: Precio de cada ticket en lamports
- **fee_percent**: Porcentaje que va a la plataforma
- **stake_percent**: Porcentaje que se acumula como premio
- **organizer**: Cuenta pública del organizador

### 2. Compra de Tickets
- Valida disponibilidad de tickets
- Previene compras duplicadas por usuario
- Distribuye automáticamente los pagos:
  - Fee → Cuenta de la plataforma
  - Stake → Se acumula en el contrato
  - Resto → Organizador

### 3. Cierre de Rifa
- Usa blockhash reciente como fuente de aleatoriedad
- Selecciona ganador de forma pseudoaleatoria
- Marca la rifa como cerrada

### 4. Funciones Adicionales
- **claim_prize**: Permite al ganador reclamar el premio
- **get_raffle_info**: Muestra información completa de la rifa

## Instrucciones Disponibles

1. `initialize_platform` - Configura la plataforma
2. `create_raffle` - Crea una nueva rifa
3. `buy_ticket` - Compra un ticket
4. `close_raffle` - Cierra la rifa y selecciona ganador
5. `claim_prize` - Reclama el premio
6. `get_raffle_info` - Obtiene información de la rifa

## Compilación (Seahorse)

En una terminal con Solana CLI instalado (ideal WSL Ubuntu):

```bash
# Ver ayuda y comandos disponibles según tu versión
seahorse --help

# Compilar el programa (según versión puede ser build/compile)
seahorse build scripts/raffle_program.py
# o
seahorse compile scripts/raffle_program.py
```

Esto genera un proyecto Anchor/Rust y el binario `.so` del programa dentro de `target/`.

## Despliegue a Devnet

```bash
solana config set --url https://api.devnet.solana.com
solana-keygen new            # si no tenés wallet local
solana airdrop 2             # fondos de prueba

# Despliegue del binario (ajustá la ruta al .so generado)
solana program deploy target/deploy/raffle_program.so
```

Anotá el `PROGRAM ID` que imprime el despliegue. Reemplázalo en `declare_id` del contrato y en el frontend via env.

## Configuración del Frontend

Agregá un archivo `.env.local` en la raíz del proyecto con:

```
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=<TU_PROGRAM_ID_EN_DEVNET>
```

Levantá la app:

```bash
pnpm dev
```

## Seguridad

- Validaciones completas en todas las instrucciones
- Prevención de compras duplicadas
- Solo el organizador puede cerrar la rifa
- Solo el ganador puede reclamar el premio

## Notas Técnicas

- Un solo programa; cada rifa es una cuenta PDA (`seeds=['raffle', organizer, raffle_seed]`).
- Stake se deposita en una PDA escrow (`seeds=['raffle_escrow', raffle_pubkey]`).
- Array de participantes limitado a 1024 por costo de renta; para producción, usar cuentas `Ticket`.
- Aleatoriedad con blockhash es pseudoaleatoriedad; para producción usar VRF (Switchboard) o commit-reveal.
- `claim_prize` intenta transferir desde la PDA (requiere `invoke_signed`). Verificá soporte de tu versión de Seahorse.
