#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod raffle {
    use ink::storage::Mapping;
    use ink::prelude::vec::Vec;
    use ink::prelude::string::String;

    /// Estructura para almacenar información de la rifa
    #[ink(storage)]
    pub struct Raffle {
        /// Configuración de la plataforma
        platform_authority: AccountId,
        platform_fee_account: AccountId,
        
        /// Mapeo de ID de rifa a información de rifa
        raffles: Mapping<u32, RaffleInfo>,
        
        /// Contador de rifas creadas
        raffle_counter: u32,
        
        /// Mapeo de rifa_id -> participantes
        raffle_participants: Mapping<u32, Vec<AccountId>>,
        
        /// Mapeo de (rifa_id, usuario) -> bool para evitar compras duplicadas
        user_participated: Mapping<(u32, AccountId), bool>,
    }

    /// Información de una rifa individual
    #[derive(scale::Decode, scale::Encode, Clone, PartialEq, Eq, Debug)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct RaffleInfo {
        pub organizer: AccountId,
        pub title: String,
        pub max_tickets: u32,
        pub ticket_price: Balance,
        pub fee_percent: u8,
        pub stake_percent: u8,
        pub tickets_sold: u32,
        pub winner: Option<AccountId>,
        pub is_closed: bool,
        pub total_stake: Balance,
        pub created_at: u64,
    }

    /// Eventos del contrato
    #[ink(event)]
    pub struct RaffleCreated {
        #[ink(topic)]
        raffle_id: u32,
        #[ink(topic)]
        organizer: AccountId,
        title: String,
        max_tickets: u32,
        ticket_price: Balance,
    }

    #[ink(event)]
    pub struct TicketPurchased {
        #[ink(topic)]
        raffle_id: u32,
        #[ink(topic)]
        buyer: AccountId,
        ticket_number: u32,
        amount_paid: Balance,
    }

    #[ink(event)]
    pub struct RaffleClosed {
        #[ink(topic)]
        raffle_id: u32,
        #[ink(topic)]
        winner: AccountId,
        prize_amount: Balance,
    }

    /// Errores del contrato
    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum RaffleError {
        /// Parámetros inválidos
        InvalidParameters,
        /// Rifa no encontrada
        RaffleNotFound,
        /// Rifa ya cerrada
        RaffleClosed,
        /// No quedan tickets disponibles
        NoTicketsAvailable,
        /// Usuario ya participó en esta rifa
        AlreadyParticipated,
        /// Solo el organizador puede realizar esta acción
        OnlyOrganizer,
        /// Solo el ganador puede reclamar el premio
        OnlyWinner,
        /// No hay premio para reclamar
        NoPrizeToCllaim,
        /// Transferencia fallida
        TransferFailed,
        /// Fondos insuficientes
        InsufficientFunds,
        /// Solo la autoridad de la plataforma puede realizar esta acción
        OnlyPlatformAuthority,
    }

    pub type Result<T> = core::result::Result<T, RaffleError>;

    impl Raffle {
        /// Constructor - inicializa la plataforma
        #[ink(constructor)]
        pub fn new(platform_fee_account: AccountId) -> Self {
            Self {
                platform_authority: Self::env().caller(),
                platform_fee_account,
                raffles: Mapping::default(),
                raffle_counter: 0,
                raffle_participants: Mapping::default(),
                user_participated: Mapping::default(),
            }
        }

        /// Crear una nueva rifa
        #[ink(message)]
        pub fn create_raffle(
            &mut self,
            title: String,
            max_tickets: u32,
            ticket_price: Balance,
            fee_percent: u8,
            stake_percent: u8,
        ) -> Result<u32> {
            // Validaciones
            if max_tickets == 0 || max_tickets > 10000 {
                return Err(RaffleError::InvalidParameters);
            }
            if ticket_price < 1_000_000_000 { // Mínimo 1 DOT (en planck)
                return Err(RaffleError::InvalidParameters);
            }
            if fee_percent > 20 {
                return Err(RaffleError::InvalidParameters);
            }
            if stake_percent > 50 {
                return Err(RaffleError::InvalidParameters);
            }
            if fee_percent + stake_percent > 70 {
                return Err(RaffleError::InvalidParameters);
            }

            let organizer = self.env().caller();
            let raffle_id = self.raffle_counter;
            
            let raffle_info = RaffleInfo {
                organizer,
                title: title.clone(),
                max_tickets,
                ticket_price,
                fee_percent,
                stake_percent,
                tickets_sold: 0,
                winner: None,
                is_closed: false,
                total_stake: 0,
                created_at: self.env().block_timestamp(),
            };

            self.raffles.insert(raffle_id, &raffle_info);
            self.raffle_participants.insert(raffle_id, &Vec::new());
            self.raffle_counter += 1;

            // Emitir evento
            self.env().emit_event(RaffleCreated {
                raffle_id,
                organizer,
                title,
                max_tickets,
                ticket_price,
            });

            Ok(raffle_id)
        }

        /// Comprar un ticket para la rifa
        #[ink(message, payable)]
        pub fn buy_ticket(&mut self, raffle_id: u32) -> Result<()> {
            let buyer = self.env().caller();
            let payment = self.env().transferred_value();

            // Obtener información de la rifa
            let mut raffle_info = self.raffles.get(raffle_id).ok_or(RaffleError::RaffleNotFound)?;

            // Validaciones
            if raffle_info.is_closed {
                return Err(RaffleError::RaffleClosed);
            }
            if raffle_info.tickets_sold >= raffle_info.max_tickets {
                return Err(RaffleError::NoTicketsAvailable);
            }
            if payment != raffle_info.ticket_price {
                return Err(RaffleError::InsufficientFunds);
            }

            // Verificar que el usuario no haya comprado ya un ticket
            if self.user_participated.get((raffle_id, buyer)).unwrap_or(false) {
                return Err(RaffleError::AlreadyParticipated);
            }

            // Agregar al comprador a la lista de participantes
            let mut participants = self.raffle_participants.get(raffle_id).unwrap_or_default();
            participants.push(buyer);
            self.raffle_participants.insert(raffle_id, &participants);
            self.user_participated.insert((raffle_id, buyer), &true);

            // Actualizar información de la rifa
            raffle_info.tickets_sold += 1;

            // Calcular distribución del pago
            let total_price = payment;
            let fee_amount = (total_price * raffle_info.fee_percent as Balance) / 100;
            let stake_amount = (total_price * raffle_info.stake_percent as Balance) / 100;
            let organizer_amount = total_price - fee_amount - stake_amount;

            // Transferir fee a la cuenta de la plataforma
            if fee_amount > 0 {
                if self.env().transfer(self.platform_fee_account, fee_amount).is_err() {
                    return Err(RaffleError::TransferFailed);
                }
            }

            // Transferir al organizador
            if organizer_amount > 0 {
                if self.env().transfer(raffle_info.organizer, organizer_amount).is_err() {
                    return Err(RaffleError::TransferFailed);
                }
            }

            // El stake se mantiene en el contrato
            raffle_info.total_stake += stake_amount;

            // Guardar cambios
            self.raffles.insert(raffle_id, &raffle_info);

            // Emitir evento
            self.env().emit_event(TicketPurchased {
                raffle_id,
                buyer,
                ticket_number: raffle_info.tickets_sold,
                amount_paid: payment,
            });

            Ok(())
        }

        /// Cerrar la rifa y seleccionar un ganador
        #[ink(message)]
        pub fn close_raffle(&mut self, raffle_id: u32) -> Result<()> {
            let caller = self.env().caller();
            
            // Obtener información de la rifa
            let mut raffle_info = self.raffles.get(raffle_id).ok_or(RaffleError::RaffleNotFound)?;

            // Validaciones
            if raffle_info.organizer != caller {
                return Err(RaffleError::OnlyOrganizer);
            }
            if raffle_info.is_closed {
                return Err(RaffleError::RaffleClosed);
            }
            if raffle_info.tickets_sold == 0 {
                return Err(RaffleError::InvalidParameters);
            }

            // Obtener participantes
            let participants = self.raffle_participants.get(raffle_id).unwrap_or_default();

            // Generar número aleatorio usando el hash del bloque
            let block_hash = self.env().block_hash(self.env().block_number());
            let random_seed = u32::from_le_bytes([
                block_hash[0], block_hash[1], block_hash[2], block_hash[3]
            ]);

            // Seleccionar ganador
            let winner_index = (random_seed as usize) % participants.len();
            let winner = participants[winner_index];

            // Actualizar información de la rifa
            raffle_info.winner = Some(winner);
            raffle_info.is_closed = true;

            self.raffles.insert(raffle_id, &raffle_info);

            // Emitir evento
            self.env().emit_event(RaffleClosed {
                raffle_id,
                winner,
                prize_amount: raffle_info.total_stake,
            });

            Ok(())
        }

        /// Reclamar el premio (solo el ganador)
        #[ink(message)]
        pub fn claim_prize(&mut self, raffle_id: u32) -> Result<()> {
            let caller = self.env().caller();
            
            // Obtener información de la rifa
            let mut raffle_info = self.raffles.get(raffle_id).ok_or(RaffleError::RaffleNotFound)?;

            // Validaciones
            if !raffle_info.is_closed {
                return Err(RaffleError::InvalidParameters);
            }
            if raffle_info.winner != Some(caller) {
                return Err(RaffleError::OnlyWinner);
            }
            if raffle_info.total_stake == 0 {
                return Err(RaffleError::NoPrizeToCllaim);
            }

            // Transferir el premio al ganador
            let prize_amount = raffle_info.total_stake;
            raffle_info.total_stake = 0;

            if self.env().transfer(caller, prize_amount).is_err() {
                return Err(RaffleError::TransferFailed);
            }

            // Guardar cambios
            self.raffles.insert(raffle_id, &raffle_info);

            Ok(())
        }

        /// Obtener información de una rifa
        #[ink(message)]
        pub fn get_raffle_info(&self, raffle_id: u32) -> Option<RaffleInfo> {
            self.raffles.get(raffle_id)
        }

        /// Obtener participantes de una rifa
        #[ink(message)]
        pub fn get_raffle_participants(&self, raffle_id: u32) -> Vec<AccountId> {
            self.raffle_participants.get(raffle_id).unwrap_or_default()
        }

        /// Obtener el número total de rifas
        #[ink(message)]
        pub fn get_raffle_count(&self) -> u32 {
            self.raffle_counter
        }

        /// Verificar si un usuario participó en una rifa
        #[ink(message)]
        pub fn has_user_participated(&self, raffle_id: u32, user: AccountId) -> bool {
            self.user_participated.get((raffle_id, user)).unwrap_or(false)
        }

        /// Obtener la autoridad de la plataforma
        #[ink(message)]
        pub fn get_platform_authority(&self) -> AccountId {
            self.platform_authority
        }

        /// Actualizar la cuenta de fees de la plataforma (solo autoridad)
        #[ink(message)]
        pub fn update_platform_fee_account(&mut self, new_fee_account: AccountId) -> Result<()> {
            if self.env().caller() != self.platform_authority {
                return Err(RaffleError::OnlyPlatformAuthority);
            }
            
            self.platform_fee_account = new_fee_account;
            Ok(())
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[ink::test]
        fn test_create_raffle() {
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            let mut raffle = Raffle::new(accounts.bob);
            
            let result = raffle.create_raffle(
                "Test Raffle".to_string(),
                100,
                1_000_000_000, // 1 DOT
                5,  // 5% fee
                10, // 10% stake
            );
            
            assert!(result.is_ok());
            let raffle_id = result.unwrap();
            assert_eq!(raffle_id, 0);
            
            let raffle_info = raffle.get_raffle_info(raffle_id).unwrap();
            assert_eq!(raffle_info.title, "Test Raffle");
            assert_eq!(raffle_info.max_tickets, 100);
            assert_eq!(raffle_info.ticket_price, 1_000_000_000);
        }

        #[ink::test]
        fn test_buy_ticket() {
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            let mut raffle = Raffle::new(accounts.bob);
            
            // Crear rifa
            let raffle_id = raffle.create_raffle(
                "Test Raffle".to_string(),
                100,
                1_000_000_000,
                5,
                10,
            ).unwrap();
            
            // Simular pago
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(1_000_000_000);
            
            // Comprar ticket
            let result = raffle.buy_ticket(raffle_id);
            assert!(result.is_ok());
            
            // Verificar que el usuario participó
            assert!(raffle.has_user_participated(raffle_id, accounts.alice));
            
            // Verificar información actualizada
            let raffle_info = raffle.get_raffle_info(raffle_id).unwrap();
            assert_eq!(raffle_info.tickets_sold, 1);
        }
    }
}
