"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Wallet, Copy, CheckCircle, Ticket, Plus, Settings, Trophy, Shield, Zap, Eye } from "lucide-react"

// Polkadot.js extension types
interface InjectedAccountWithMeta {
  address: string
  meta: {
    genesisHash?: string
    name?: string
    source: string
  }
  type?: string
}

interface InjectedExtension {
  accounts: {
    get: () => Promise<InjectedAccountWithMeta[]>
  }
  signer: {
    signPayload?: (payload: any) => Promise<{ signature: string }>
  }
}

interface PolkadotProvider {
  enable: (appName: string) => Promise<InjectedExtension>
  version: string
}

declare global {
  interface Window {
    injectedWeb3?: {
      "polkadot-js"?: PolkadotProvider
      talisman?: PolkadotProvider
      "subwallet-js"?: PolkadotProvider
    }
  }
}

interface Raffle {
  id: string
  title: string
  ticketPrice: number // in DOT
  ticketsIssued: number
  maxTickets: number
  organizer: string
  isActive: boolean
  stakePercent: number
  feePercent: number
  totalRaised: number
  participants: string[]
  winner: string | null
}

// NFT ticket interface
interface NFTTicket {
  id: string
  raffleId: string
  raffleTitle: string
  ticketNumber: number
  purchaseDate: string
  qrCode: string
}

const mockRaffles: Raffle[] = [
  {
    id: "1",
    title: "Rifa AVEIT 2025",
    ticketPrice: 1.0, // DOT
    ticketsIssued: 45,
    maxTickets: 100,
    organizer: "15oF4...uHnS", // Formato de dirección Polkadot
    isActive: true,
    stakePercent: 10,
    feePercent: 5,
    totalRaised: 45.0,
    participants: [],
    winner: null,
  },
  {
    id: "2",
    title: "Rifa Tech UTN",
    ticketPrice: 0.5, // DOT
    ticketsIssued: 23,
    maxTickets: 50,
    organizer: "13UVJ...kLmN", // Formato de dirección Polkadot
    isActive: true,
    stakePercent: 15,
    feePercent: 5,
    totalRaised: 11.5,
    participants: [],
    winner: null,
  },
  {
    id: "3",
    title: "Rifa Blockchain FRC",
    ticketPrice: 2.0, // DOT
    ticketsIssued: 12,
    maxTickets: 30,
    organizer: "14gHi...pQrS", // Formato de dirección Polkadot
    isActive: true,
    stakePercent: 12,
    feePercent: 5,
    totalRaised: 24.0,
    participants: [],
    winner: null,
  },
]

// Mock raffle data - will be replaced with Solana contract data
// const mockRaffles: Raffle[] = [
//   {
//     id: "1",
//     title: "Rifa AVEIT 2025",
//     ticketPrice: 0.1,
//     ticketsIssued: 45,
//     maxTickets: 100,
//     organizer: "8sj...39F",
//     isActive: true, // Ensuring raffle is active
//     stakePercent: 10,
//     feePercent: 5,
//     totalRaised: 4.5,
//     participants: [],
//     winner: null,
//   },
//   {
//     id: "2",
//     title: "Rifa Tech UTN",
//     ticketPrice: 0.05,
//     ticketsIssued: 23,
//     maxTickets: 50,
//     organizer: "9kL...28A",
//     isActive: true, // Ensuring raffle is active
//     stakePercent: 15,
//     feePercent: 5,
//     totalRaised: 1.15,
//     participants: [],
//     winner: null,
//   },
//   {
//     id: "3",
//     title: "Rifa Blockchain FRC",
//     ticketPrice: 0.2,
//     ticketsIssued: 12,
//     maxTickets: 30,
//     organizer: "7mN...45B",
//     isActive: true, // Ensuring raffle is active
//     stakePercent: 12,
//     feePercent: 5,
//     totalRaised: 2.4,
//     participants: [],
//     winner: null,
//   },
// ]

// declare global {
//   interface Window {
//     solana?: PhantomProvider
//   }
// }

// const connection = new Connection("https://api.mainnet-beta.solana.com") // Replace with your Solana RPC endpoint

// export default function SolanaWalletApp() {
//   const [wallet, setWallet] = useState<PhantomProvider | null>(null)
//   const [isConnected, setIsConnected] = useState(false)
//   const [publicKey, setPublicKey] = useState<string>("")
//   const [isConnecting, setIsConnecting] = useState(false)
//   const [copied, setCopied] = useState(false)
//   const [showPurchaseModal, setShowPurchaseModal] = useState(false)
//   const [selectedRaffle, setSelectedRaffle] = useState<Raffle | null>(null)
//   const [isPurchasing, setIsPurchasing] = useState(false)
//   const [showSuccessModal, setShowSuccessModal] = useState(false)
//   const [userTickets, setUserTickets] = useState<NFTTicket[]>([])
//   const [showTicketsModal, setShowTicketsModal] = useState(false)
//   const [isAdmin, setIsAdmin] = useState(false)
//   const [showCreateRaffleModal, setShowCreateRaffleModal] = useState(false)
//   const [showAdminDashboard, setShowAdminDashboard] = useState(false)
//   const [newRaffle, setNewRaffle] = useState({
//     title: "",
//     maxTickets: "",
//     ticketPrice: "",
//     stakePercent: "",
//     feePercent: "",
//   })
//   const [isCreatingRaffle, setIsCreatingRaffle] = useState(false)
//   const [showWinnerModal, setShowWinnerModal] = useState(false)
//   const [selectedWinner, setSelectedWinner] = useState<{ raffle: Raffle; winner: string } | null>(null)
//   const [showLandingPage, setShowLandingPage] = useState(true)
//   const [isLoading, setIsLoading] = useState(false)
//   const [purchaseStep, setPurchaseStep] = useState<"confirm" | "processing" | "success">("confirm")

export default function PolkadotWalletApp() {
  const [extension, setExtension] = useState<InjectedExtension | null>(null)
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([])
  const [selectedAccount, setSelectedAccount] = useState<InjectedAccountWithMeta | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [selectedRaffle, setSelectedRaffle] = useState<Raffle | null>(null)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [userTickets, setUserTickets] = useState<NFTTicket[]>([])
  const [showTicketsModal, setShowTicketsModal] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showCreateRaffleModal, setShowCreateRaffleModal] = useState(false)
  const [showAdminDashboard, setShowAdminDashboard] = useState(false)
  const [newRaffle, setNewRaffle] = useState({
    title: "",
    maxTickets: "",
    ticketPrice: "",
    stakePercent: "",
    feePercent: "",
  })
  const [isCreatingRaffle, setIsCreatingRaffle] = useState(false)
  const [showWinnerModal, setShowWinnerModal] = useState(false)
  const [selectedWinner, setSelectedWinner] = useState<{ raffle: Raffle; winner: string } | null>(null)
  const [showLandingPage, setShowLandingPage] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [purchaseStep, setPurchaseStep] = useState<"confirm" | "processing" | "success">("confirm")

  useEffect(() => {
    const style = document.createElement("style")
    style.textContent = `
      @keyframes confetti-fall {
        0% {
          transform: translateY(-10px) rotate(0deg);
          opacity: 1;
        }
        100% {
          transform: translateY(100vh) rotate(720deg);
          opacity: 0;
        }
      }
      
      @keyframes pulse-success {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      
      @keyframes slide-up {
        0% { transform: translateY(20px); opacity: 0; }
        100% { transform: translateY(0); opacity: 1; }
      }
      
      .animate-pulse-success {
        animation: pulse-success 2s ease-in-out infinite;
      }
      
      .animate-slide-up {
        animation: slide-up 0.3s ease-out forwards;
      }
      
      .loading-dots::after {
        content: '';
        animation: loading-dots 1.5s infinite;
      }
      
      @keyframes loading-dots {
        0%, 20% { content: ''; }
        40% { content: '.'; }
        60% { content: '..'; }
        80%, 100% { content: '...'; }
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  useEffect(() => {
    const checkPolkadotWallets = async () => {
      if (typeof window !== "undefined" && window.injectedWeb3) {
        const availableWallets = Object.keys(window.injectedWeb3)
        console.log("[v0] Available Polkadot wallets:", availableWallets)

        // Intentar conectar con Polkadot.js extension primero
        if (window.injectedWeb3["polkadot-js"]) {
          console.log("[v0] Polkadot.js extension found")
        }
      }
    }

    checkPolkadotWallets()

    if (isConnected && selectedAccount) {
      // Mock admin check - replace with actual contract logic
      setIsAdmin(selectedAccount.address.startsWith("15oF4") || selectedAccount.address.startsWith("13UVJ"))
    }
  }, [isConnected, selectedAccount])

  const connectWallet = async () => {
    if (!window.injectedWeb3?.["polkadot-js"]) {
      window.open("https://polkadot.js.org/extension/", "_blank")
      return
    }

    try {
      setIsConnecting(true)

      // Habilitar la extensión
      const injected = await window.injectedWeb3["polkadot-js"].enable("Raffle DApp")
      setExtension(injected)

      // Obtener cuentas
      const accounts = await injected.accounts.get()
      setAccounts(accounts)

      if (accounts.length > 0) {
        setSelectedAccount(accounts[0])
        setIsConnected(true)
        console.log("[v0] Wallet connected:", accounts[0].address)
      }
    } catch (error) {
      console.error("[v0] Failed to connect wallet:", error)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = async () => {
    setExtension(null)
    setAccounts([])
    setSelectedAccount(null)
    setIsConnected(false)
    console.log("[v0] Wallet disconnected")
  }

  const copyAddress = async () => {
    if (selectedAccount) {
      await navigator.clipboard.writeText(selectedAccount.address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatAddress = (address: string) => {
    if (!address) return ""
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  const handlePurchaseTicket = (raffle: Raffle) => {
    console.log("[v0] Purchase ticket clicked for raffle:", raffle.id)
    console.log("[v0] Raffle active:", raffle.isActive)
    console.log("[v0] Tickets available:", raffle.maxTickets - raffle.ticketsIssued)

    if (!isConnected || !selectedAccount) {
      alert("Conecta tu wallet primero")
      return
    }

    setSelectedRaffle(raffle)
    setShowPurchaseModal(true)
  }

  const confirmPurchase = async () => {
    if (!selectedRaffle || !selectedAccount) return

    setIsPurchasing(true)
    setPurchaseStep("processing")

    try {
      await new Promise((resolve) => setTimeout(resolve, 800)) // Wallet confirmation
      setPurchaseStep("processing")
      await new Promise((resolve) => setTimeout(resolve, 1200)) // Transaction processing

      // Mock transaction
      const newTicket: NFTTicket = {
        id: `ticket-${Date.now()}`,
        raffleId: selectedRaffle.id,
        raffleTitle: selectedRaffle.title,
        ticketNumber: selectedRaffle.ticketsIssued + 1,
        purchaseDate: new Date().toLocaleDateString(),
        qrCode: `${selectedRaffle.id}-${Date.now()}`,
      }

      // Update raffle data
      const updatedRaffles = mockRaffles.map((raffle) =>
        raffle.id === selectedRaffle.id
          ? {
              ...raffle,
              ticketsIssued: raffle.ticketsIssued + 1,
              totalRaised: raffle.totalRaised + raffle.ticketPrice,
            }
          : raffle,
      )

      setUserTickets((prev) => [...prev, newTicket])

      setPurchaseStep("success")
      // playSuccessSound()
      // createConfetti()

      setTimeout(() => {
        setShowPurchaseModal(false)
        setShowSuccessModal(true)
        setPurchaseStep("confirm")
      }, 1500)
    } catch (error) {
      console.error("Purchase failed:", error)
    } finally {
      setIsPurchasing(false)
    }
  }

  const createRaffle = async () => {
    if (
      !newRaffle.title ||
      !newRaffle.maxTickets ||
      !newRaffle.ticketPrice ||
      !newRaffle.stakePercent ||
      !newRaffle.feePercent
    ) {
      alert("Por favor completa todos los campos")
      return
    }

    setIsCreatingRaffle(true)

    try {
      // Simulate contract interaction
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const raffleData: Raffle = {
        id: (mockRaffles.length + 1).toString(),
        title: newRaffle.title,
        ticketPrice: Number.parseFloat(newRaffle.ticketPrice),
        ticketsIssued: 0,
        maxTickets: Number.parseInt(newRaffle.maxTickets),
        organizer: formatAddress(selectedAccount?.address || ""),
        isActive: true,
        stakePercent: Number.parseInt(newRaffle.stakePercent),
        feePercent: Number.parseInt(newRaffle.feePercent),
        totalRaised: 0,
        participants: [],
        winner: null,
      }

      mockRaffles.push(raffleData)

      setNewRaffle({
        title: "",
        maxTickets: "",
        ticketPrice: "",
        stakePercent: "",
        feePercent: "",
      })

      setShowCreateRaffleModal(false)
      alert("¡Rifa creada exitosamente!")
    } catch (error) {
      console.error("[v0] Failed to create raffle:", error)
      alert("Error al crear la rifa. Intenta nuevamente.")
    } finally {
      setIsCreatingRaffle(false)
    }
  }

  const closeRaffle = async (raffleId: string) => {
    const raffle = mockRaffles.find((r) => r.id === raffleId)
    if (!raffle || !raffle.isActive) return

    try {
      // Simulate contract interaction
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock winner selection
      const participants = Array.from({ length: raffle.ticketsIssued }, (_, i) => `participant-${i + 1}`)
      const winner = participants[Math.floor(Math.random() * participants.length)]

      // Update raffle
      const raffleIndex = mockRaffles.findIndex((r) => r.id === raffleId)
      if (raffleIndex !== -1) {
        mockRaffles[raffleIndex] = {
          ...mockRaffles[raffleIndex],
          isActive: false,
          winner: winner,
        }
      }

      setSelectedWinner({ raffle, winner })
      setShowWinnerModal(true)
    } catch (error) {
      console.error("[v0] Failed to close raffle:", error)
      alert("Error al cerrar la rifa. Intenta nuevamente.")
    }
  }

  const generateQRCode = (data: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data)}`
  }

  const goToDashboard = () => {
    setShowLandingPage(false)
  }

  const goToLandingPage = () => {
    setShowLandingPage(true)
  }

  if (showLandingPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Shield className="w-4 h-4 text-pink-400" />
              <span className="text-sm text-white/90">Powered by Polkadot</span>
            </div>
            <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
              Rifas en
              <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                {" "}
                Polkadot
              </span>
            </h1>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed">
              Participa en rifas descentralizadas, transparentes y seguras en la blockchain de Polkadot. Conecta tu
              wallet y comienza a ganar.
            </p>
            <Button
              onClick={() => setShowLandingPage(false)}
              size="lg"
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Zap className="w-5 h-5 mr-2" />
              Explorar Rifas
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Rifas Polkadot</h1>
              <p className="text-sm text-gray-400">Blockchain descentralizada</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isConnected && selectedAccount ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{selectedAccount.meta.name || "Cuenta"}</p>
                  <p className="text-xs text-gray-400">{formatAddress(selectedAccount.address)}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyAddress}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent"
                >
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  onClick={disconnectWallet}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent"
                >
                  Desconectar
                </Button>
              </div>
            ) : (
              <Button
                onClick={connectWallet}
                disabled={isConnecting}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                <Wallet className="w-4 h-4 mr-2" />
                {isConnecting ? "Conectando..." : "Conectar Wallet"}
              </Button>
            )}
          </div>
        </div>

        {/* Admin Controls */}
        {isConnected && isAdmin && (
          <div className="mb-6">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Panel de Administrador
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button
                    onClick={() => setShowCreateRaffleModal(true)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Rifa
                  </Button>
                  <Button
                    onClick={() => setShowAdminDashboard(!showAdminDashboard)}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {showAdminDashboard ? "Ocultar" : "Ver"} Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Raffles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {mockRaffles.map((raffle) => (
            <Card key={raffle.id} className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-white text-lg">{raffle.title}</CardTitle>
                  <Badge variant={raffle.isActive ? "default" : "secondary"}>
                    {raffle.isActive ? "Activa" : "Cerrada"}
                  </Badge>
                </div>
                <CardDescription className="text-gray-400">Organizada por {raffle.organizer}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Precio por ticket:</span>
                    <span className="text-white font-medium">{raffle.ticketPrice} DOT</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Tickets vendidos:</span>
                    <span className="text-white">
                      {raffle.ticketsIssued}/{raffle.maxTickets}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total recaudado:</span>
                    <span className="text-white font-medium">{raffle.totalRaised} DOT</span>
                  </div>

                  {raffle.winner && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Ganador:</span>
                      <span className="text-green-400 font-medium">{formatAddress(raffle.winner)}</span>
                    </div>
                  )}

                  <div className="pt-4">
                    {raffle.isActive ? (
                      <div className="space-y-2">
                        <Button
                          onClick={() => handlePurchaseTicket(raffle)}
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                          disabled={!isConnected || raffle.ticketsIssued >= raffle.maxTickets}
                        >
                          <Ticket className="w-4 h-4 mr-2" />
                          {raffle.ticketsIssued >= raffle.maxTickets ? "Agotado" : "Comprar Ticket"}
                        </Button>

                        {isAdmin && (
                          <Button
                            onClick={() => closeRaffle(raffle.id)}
                            variant="outline"
                            size="sm"
                            className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                          >
                            Cerrar Rifa
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Button disabled className="w-full bg-gray-700 text-gray-400">
                        <Trophy className="w-4 h-4 mr-2" />
                        Rifa Finalizada
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* User Tickets */}
        {isConnected && userTickets.length > 0 && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Ticket className="w-5 h-5" />
                Mis Tickets ({userTickets.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userTickets.map((ticket) => (
                  <div key={ticket.id} className="bg-gray-700/50 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">{ticket.raffleTitle}</h4>
                    <div className="text-sm text-gray-400 space-y-1">
                      <p>Ticket #{ticket.ticketNumber.toString().padStart(4, "0")}</p>
                      <p>Comprado: {ticket.purchaseDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Purchase Modal */}
        <Dialog open={showPurchaseModal} onOpenChange={setShowPurchaseModal}>
          <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Confirmar Compra</DialogTitle>
              <DialogDescription className="text-gray-400">
                {selectedRaffle && `Comprando ticket para: ${selectedRaffle.title}`}
              </DialogDescription>
            </DialogHeader>

            {selectedRaffle && (
              <div className="space-y-4">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Precio del ticket:</span>
                    <span className="text-white font-medium">{selectedRaffle.ticketPrice} DOT</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Tickets disponibles:</span>
                    <span className="text-white">{selectedRaffle.maxTickets - selectedRaffle.ticketsIssued}</span>
                  </div>
                </div>

                {purchaseStep === "processing" && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
                    <p className="text-gray-400">Procesando transacción...</p>
                  </div>
                )}

                {purchaseStep === "success" && (
                  <div className="text-center py-4">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    <p className="text-green-400 font-medium">¡Ticket comprado exitosamente!</p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowPurchaseModal(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
                disabled={isPurchasing}
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmPurchase}
                disabled={isPurchasing || purchaseStep !== "confirm"}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                {isPurchasing ? "Comprando..." : "Confirmar Compra"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Raffle Modal */}
        <Dialog open={showCreateRaffleModal} onOpenChange={setShowCreateRaffleModal}>
          <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Crear Nueva Rifa</DialogTitle>
              <DialogDescription className="text-gray-400">Configura los parámetros de tu rifa</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-gray-300">
                  Título de la rifa
                </Label>
                <Input
                  id="title"
                  value={newRaffle.title}
                  onChange={(e) => setNewRaffle({ ...newRaffle, title: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Ej: Rifa Hackathon 2025"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxTickets" className="text-gray-300">
                    Máximo de tickets
                  </Label>
                  <Input
                    id="maxTickets"
                    type="number"
                    value={newRaffle.maxTickets}
                    onChange={(e) => setNewRaffle({ ...newRaffle, maxTickets: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="100"
                  />
                </div>

                <div>
                  <Label htmlFor="ticketPrice" className="text-gray-300">
                    Precio por ticket (DOT)
                  </Label>
                  <Input
                    id="ticketPrice"
                    type="number"
                    step="0.1"
                    value={newRaffle.ticketPrice}
                    onChange={(e) => setNewRaffle({ ...newRaffle, ticketPrice: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="1.0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stakePercent" className="text-gray-300">
                    % para premio
                  </Label>
                  <Input
                    id="stakePercent"
                    type="number"
                    value={newRaffle.stakePercent}
                    onChange={(e) => setNewRaffle({ ...newRaffle, stakePercent: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="10"
                  />
                </div>

                <div>
                  <Label htmlFor="feePercent" className="text-gray-300">
                    % comisión
                  </Label>
                  <Input
                    id="feePercent"
                    type="number"
                    value={newRaffle.feePercent}
                    onChange={(e) => setNewRaffle({ ...newRaffle, feePercent: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="5"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateRaffleModal(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
                disabled={isCreatingRaffle}
              >
                Cancelar
              </Button>
              <Button
                onClick={createRaffle}
                disabled={isCreatingRaffle}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                {isCreatingRaffle ? "Creando..." : "Crear Rifa"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Success Modal */}
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white text-center">¡Ticket Comprado!</DialogTitle>
            </DialogHeader>

            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-300 mb-2">Tu ticket ha sido comprado exitosamente</p>
              <p className="text-sm text-gray-400">¡Buena suerte en la rifa!</p>
            </div>

            <DialogFooter>
              <Button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                Continuar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Winner Modal */}
        <Dialog open={showWinnerModal} onOpenChange={setShowWinnerModal}>
          <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white text-center">¡Ganador Seleccionado!</DialogTitle>
            </DialogHeader>

            {selectedWinner && (
              <div className="text-center py-6">
                <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">{selectedWinner.raffle.title}</h3>
                <p className="text-gray-300 mb-2">Ganador:</p>
                <p className="text-lg font-mono text-yellow-400">{selectedWinner.winner}</p>
                <p className="text-sm text-gray-400 mt-4">
                  Premio: {selectedWinner.raffle.totalRaised * (selectedWinner.raffle.stakePercent / 100)} DOT
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                onClick={() => setShowWinnerModal(false)}
                className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white"
              >
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
