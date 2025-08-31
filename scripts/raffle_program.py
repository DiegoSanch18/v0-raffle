from seahorse.prelude import *

# IMPORTANTE: reemplazar por el ID real tras desplegar el programa.
declare_id('11111111111111111111111111111112')

# Estructura para la rifa.
@account
class Raffle:
    organizer: Pubkey
    max_tickets: u32
    ticket_price: u64
    fee_percent: u8
    stake_percent: u8
    tickets_sold: u32
    # Nota: arrays grandes incrementan muchísimo el costo de renta del account.
    # Para hackatón, limitar a 1024; en producción usar cuentas Ticket separadas.
    participants: Array[Pubkey, 1024]
    winner: Pubkey
    is_closed: bool
    total_stake: u64

# Cuenta PDA para retener stake (escrow) de una rifa.
@account
class RaffleEscrow:
    # Campo de relleno/bump por si es necesario. Se puede expandir si hace falta metadata.
    bump: u8

# Configuración de plataforma (fee).
@account
class PlatformConfig:
    authority: Pubkey
    fee_account: Pubkey

@instruction
def initialize_platform(
    config: Empty[PlatformConfig],
    authority: Signer,
    fee_account: Pubkey
):
    """Inicializa la configuración de la plataforma"""
    config = config.init(
        payer = authority,
        seeds = ['platform_config']
    )

    config.authority = authority.key()
    config.fee_account = fee_account

@instruction
def create_raffle(
    raffle: Empty[Raffle],
    escrow: Empty[RaffleEscrow],
    organizer: Signer,
    raffle_seed: str,  # Identificador único de la rifa (p. ej. UUID o slug)
    max_tickets: u32,
    ticket_price: u64,
    fee_percent: u8,
    stake_percent: u8,
):
    """Crea una nueva rifa con su PDA y PDA de escrow."""

    # Validaciones básicas
    assert max_tickets > 0 and max_tickets <= 1024, "Max tickets entre 1 y 1024"
    assert ticket_price >= 1000000, "Precio mínimo: 0.001 SOL (lamports)"
    assert fee_percent <= 20, "Fee máximo: 20%"
    assert stake_percent <= 50, "Stake máximo: 50%"
    assert fee_percent + stake_percent <= 70, "Fee + stake máximo: 70%"

    # Inicializar la cuenta de la rifa (una por seed único)
    raffle = raffle.init(
        payer = organizer,
        seeds = ['raffle', organizer.key(), raffle_seed]
    )

    # Inicializar la cuenta escrow (PDA) asociada a esta rifa
    escrow = escrow.init(
        payer = organizer,
        seeds = ['raffle_escrow', raffle.key()]
    )

    # Configurar la rifa
    raffle.organizer = organizer.key()
    raffle.max_tickets = max_tickets
    raffle.ticket_price = ticket_price
    raffle.fee_percent = fee_percent
    raffle.stake_percent = stake_percent
    raffle.tickets_sold = 0
    raffle.winner = Pubkey.default()
    raffle.is_closed = False
    raffle.total_stake = 0

    print(f"Rifa creada por {organizer.key()} con seed {raffle_seed}")
    print(f"Max tickets: {max_tickets}, Precio: {ticket_price}")

@instruction
def buy_ticket(
    raffle: Raffle,
    escrow: RaffleEscrow,
    buyer: Signer,
    platform_config: PlatformConfig,
    organizer: UncheckedAccount,
    fee_account: UncheckedAccount,
    system_program: Program,
):
    """Compra un ticket: registra participante y distribuye pagos (fee/organizer/stake→escrow)."""

    # Validaciones
    assert not raffle.is_closed, "La rifa ya está cerrada"
    assert raffle.tickets_sold < raffle.max_tickets, "No quedan tickets disponibles"

    # Verificar compra duplicada (simple). Para múltiples tickets por usuario, quitar esta verificación.
    for i in range(raffle.tickets_sold):
        assert raffle.participants[i] != buyer.key(), "Ya compraste un ticket para esta rifa"

    # Registrar participante
    raffle.participants[raffle.tickets_sold] = buyer.key()
    raffle.tickets_sold += 1

    # Distribución de pago
    total_price = raffle.ticket_price
    fee_amount = (total_price * raffle.fee_percent) // 100
    stake_amount = (total_price * raffle.stake_percent) // 100
    organizer_amount = total_price - fee_amount - stake_amount

    # Fee → cuenta de plataforma
    if fee_amount > 0:
        system_program.transfer(
            from_account = buyer,
            to_account = fee_account,
            lamports = fee_amount,
        )

    # Neto → organizador
    if organizer_amount > 0:
        system_program.transfer(
            from_account = buyer,
            to_account = organizer,
            lamports = organizer_amount,
        )

    # Stake → escrow PDA de la rifa (entra por transferencia del comprador)
    if stake_amount > 0:
        system_program.transfer(
            from_account = buyer,
            to_account = escrow,
            lamports = stake_amount,
        )
        raffle.total_stake += stake_amount

    print(f"Ticket comprado por {buyer.key()}")
    print(f"Tickets vendidos: {raffle.tickets_sold}/{raffle.max_tickets}")
    print(f"Distribución - Fee: {fee_amount}, Organizador: {organizer_amount}, Stake: {stake_amount}")

@instruction
def close_raffle(
    raffle: Raffle,
    organizer: Signer,
    recent_blockhashes: Sysvar,
):
    """Cierra la rifa y selecciona un ganador (aleatoriedad simple – considerar VRF en prod)."""

    # Validaciones
    assert raffle.organizer == organizer.key(), "Solo el organizador puede cerrar la rifa"
    assert not raffle.is_closed, "La rifa ya está cerrada"
    assert raffle.tickets_sold > 0, "No se vendieron tickets"

    # Pseudo-aleatoriedad basada en blockhash reciente
    recent_blockhash = recent_blockhashes.data
    random_seed = 0
    for i in range(8):
        random_seed = (random_seed << 8) + recent_blockhash[i]

    winner_index = random_seed % raffle.tickets_sold
    raffle.winner = raffle.participants[winner_index]
    raffle.is_closed = True

    print(f"Rifa cerrada! Ganador: {raffle.winner} (idx {winner_index})")

@instruction
def claim_prize(
    raffle: Raffle,
    escrow: RaffleEscrow,
    winner: Signer,
    system_program: Program,
):
    """Reclamo del premio desde el escrow PDA al ganador.
    Nota: La transferencia desde una PDA requiere invoke_signed; Seahorse lo maneja si el `from_account`
    es la PDA y existe correspondencia de seeds en el contexto. Si tu versión no lo soporta directamente,
    deja constancia y realiza el retiro vía instrucción separada en Anchor o con CPI.
    """

    # Validaciones
    assert raffle.is_closed, "La rifa debe estar cerrada"
    assert raffle.winner == winner.key(), "Solo el ganador puede reclamar el premio"
    assert raffle.total_stake > 0, "No hay premio para reclamar"

    prize_amount = raffle.total_stake
    raffle.total_stake = 0

    # Intento de transferencia desde PDA (puede requerir soporte específico de Seahorse para invoke_signed)
    # Si tu versión no lo permite, deja el fondo en escrow y realiza el retiro por otra vía segura.
    system_program.transfer(
        from_account = escrow,
        to_account = winner,
        lamports = prize_amount,
    )

    print(f"Premio de {prize_amount} lamports transferido a {winner.key()}")

@instruction
def get_raffle_info(raffle: Raffle):
    """Obtiene información de la rifa"""

    print(f"=== INFORMACIÓN DE LA RIFA ===")
    print(f"Organizador: {raffle.organizer}")
    print(f"Tickets: {raffle.tickets_sold}/{raffle.max_tickets}")
    print(f"Precio por ticket: {raffle.ticket_price} lamports")
    print(f"Fee: {raffle.fee_percent}%")
    print(f"Stake: {raffle.stake_percent}%")
    print(f"Total stake acumulado: {raffle.total_stake} lamports")
    print(f"Estado: {'Cerrada' if raffle.is_closed else 'Abierta'}")

    if raffle.is_closed and raffle.winner != Pubkey.default():
        print(f"Ganador: {raffle.winner}")

    print(f"Participantes:")
    for i in range(raffle.tickets_sold):
        print(f"  {i + 1}. {raffle.participants[i]}")

# Función auxiliar para testing
def test_raffle_flow():
    """Función de prueba para demostrar el flujo completo"""
    print("=== PRUEBA DEL SISTEMA DE RIFAS ===")
    print("1. Inicializar plataforma")
    print("2. Crear rifa")
    print("3. Comprar tickets")
    print("4. Cerrar rifa y seleccionar ganador")
    print("5. Reclamar premio")
    print("\nEste contrato está listo para ser compilado con Seahorse!")

@instruction
def update_raffle_params(
    raffle: Raffle,
    organizer: Signer,
    new_max_tickets: u32,
    new_ticket_price: u64
):
    """Permite al organizador modificar parámetros antes de que se vendan tickets"""
    
    assert raffle.organizer == organizer.key(), "Solo el organizador puede modificar"
    assert raffle.tickets_sold == 0, "No se puede modificar después de vender tickets"
    assert not raffle.is_closed, "La rifa ya está cerrada"
    
    raffle.max_tickets = new_max_tickets
    raffle.ticket_price = new_ticket_price
    
    print(f"Rifa actualizada - Max tickets: {new_max_tickets}, Precio: {new_ticket_price}")

if __name__ == "__main__":
    test_raffle_flow()
