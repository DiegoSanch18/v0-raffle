"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation" // Changed from next/router to next/navigation for App Router
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Trophy,
  Users,
  DollarSign,
  ArrowRight,
  Shield,
  Zap,
  CheckCircle,
  Ticket,
  Hash,
  Sparkles,
  Eye,
} from "lucide-react"

const createConfetti = () => {
  const colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57", "#ff9ff3", "#54a0ff"]
  const confettiCount = 50

  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement("div")
    confetti.style.position = "fixed"
    confetti.style.left = Math.random() * 100 + "vw"
    confetti.style.top = "-10px"
    confetti.style.width = "10px"
    confetti.style.height = "10px"
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
    confetti.style.borderRadius = "50%"
    confetti.style.pointerEvents = "none"
    confetti.style.zIndex = "9999"
    confetti.style.animation = `confetti-fall ${Math.random() * 3 + 2}s linear forwards`

    document.body.appendChild(confetti)

    setTimeout(() => {
      confetti.remove()
    }, 5000)
  }
}

const playSuccessSound = () => {
  if (typeof window === "undefined") return

  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime) // C5
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1) // E5
    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2) // G5

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  } catch (error) {
    console.log("[v0] Audio not supported")
  }
}

interface PolkadotExtension {
  name: string
  version: string
  enable: (dappName: string) => Promise<{
    accounts: {
      get: () => Promise<Array<{ address: string; name?: string }>>
    }
    signer: any
  }>
}

interface PolkadotWallet {
  name: string
  version: string
  accounts: {
    get: () => Promise<Array<{ address: string; name?: string }>>
  }
  signer: any
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  isConnected: boolean
}

// Mock raffle data structure
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
  ticketNumber: string
  purchaseDate: string
  qrCode: string
  transactionHash: string
  purchasePrice: number
}

interface StakeParticipation {
  userId: string
  amount: number
  timestamp: string
  raffleId: string
  expectedReturn: number
}

interface StakePool {
  totalStaked: number
  participants: StakeParticipation[]
  currentAPY: number
  minimumStake: number
  lockPeriod: number // in days
}

// Mock raffle data - will be replaced with Polkadot contract data
const mockRaffles: Raffle[] = [
  {
    id: "1",
    title: "RIFA AVEIT 2025",
    ticketPrice: 2.5, // Updated to DOT pricing
    ticketsIssued: 45,
    maxTickets: 100,
    organizer: "PepitoGrillo87", // Updated to creative username
    isActive: true,
    stakePercent: 10,
    feePercent: 5,
    totalRaised: 112.5, // Updated to reflect DOT pricing
    participants: [],
    winner: null,
  },
  {
    id: "2",
    title: "Tech Raffle UTN",
    ticketPrice: 1.25, // Updated to DOT pricing
    ticketsIssued: 23,
    maxTickets: 50,
    organizer: "MCOS02", // Updated to creative username
    isActive: true,
    stakePercent: 15,
    feePercent: 5,
    totalRaised: 28.75, // Updated to reflect DOT pricing
    participants: [],
    winner: null,
  },
  {
    id: "3",
    title: "Blockchain FRC Raffle",
    ticketPrice: 5.0, // Updated to DOT pricing
    ticketsIssued: 12,
    maxTickets: 30,
    organizer: "CryptoNinja99", // Updated to creative username
    isActive: true,
    stakePercent: 12,
    feePercent: 5,
    totalRaised: 60.0, // Updated to reflect DOT pricing
    participants: [],
    winner: null,
  },
]

declare global {
  interface Window {
    injectedWeb3?: {
      "polkadot-js"?: PolkadotExtension
      talisman?: PolkadotExtension
      "subwallet-js"?: PolkadotExtension
    }
  }
}

// const connection = new Connection("https://api.mainnet-beta.polkadot.com") // Replace with your Polkadot RPC endpoint

const generateRaffleData = () => {
  return Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    sales: Math.floor(Math.random() * 15) + 5,
    revenue: Math.floor(Math.random() * 3000) + 1000,
    totalStake: Math.floor(Math.random() * 500) + 100,
    totalTicketsSold: Math.floor(Math.random() * 1000) + 100,
  }))
}

const raffleNumbers = Array.from({ length: 1000 }, (_, i) => ({
  number: String(i + 1).padStart(4, "0"),
  sold: Math.random() > 0.3,
  buyer: Math.random() > 0.3 ? `User ${Math.floor(Math.random() * 200) + 1}` : null,
}))

const topBuyers = [
  {
    id: 1,
    name: "Anonymous User #1",
    tickets: 15,
    amount: 15000,
    avatar: "/diverse-user-avatars.png",
    specialty: "Wallet: 0x7A9f...3B2c",
  },
  {
    id: 2,
    name: "Anonymous User #2",
    tickets: 12,
    amount: 12000,
    avatar: "/diverse-user-avatars.png",
    specialty: "Wallet: 0x4E8d...9F1a",
  },
  {
    id: 3,
    name: "Anonymous User #3",
    tickets: 10,
    amount: 10000,
    avatar: "/diverse-user-avatars.png",
    specialty: "Wallet: 0x2C5b...7D4e",
  },
  {
    id: 4,
    name: "Anonymous User #4",
    tickets: 8,
    amount: 8000,
    avatar: "/diverse-user-avatars.png",
    specialty: "Wallet: 0x9A1f...6E8c",
  },
  {
    id: 5,
    name: "Anonymous User #5",
    tickets: 7,
    amount: 7000,
    avatar: "/diverse-user-avatars.png",
    specialty: "Wallet: 0x3F7a...2B9d",
  },
]

const prizes = [
  { name: "1st Prize - Gaming Laptop", value: 800000, color: "hsl(var(--chart-1))" },
  { name: "2nd Prize - Smartphone", value: 300000, color: "hsl(var(--chart-2))" },
  { name: "3rd Prize - Tablet", value: 150000, color: "hsl(var(--chart-3))" },
  { name: "4th Prize - Headphones", value: 50000, color: "hsl(var(--chart-4))" },
  { name: "5th Prize - Voucher", value: 25000, color: "hsl(var(--primary))" },
]

const stakePool: StakePool = {
  totalStaked: 0,
  participants: [],
  currentAPY: 5,
  minimumStake: 100,
  lockPeriod: 30,
}

export default function RaffleApp() {
  const [isConnected, setIsConnected] = useState(false)
  const [publicKey, setPublicKey] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [wallet, setWallet] = useState<PolkadotWallet | null>(null)
  const [showCreateRaffleModal, setShowCreateRaffleModal] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [selectedRaffle, setSelectedRaffle] = useState<Raffle | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showWinnerModal, setShowWinnerModal] = useState(false)
  const [winnerInfo, setWinnerInfo] = useState<{ raffle: Raffle; winner: string } | null>(null)
  const [showTicketsModal, setShowTicketsModal] = useState(false)
  const [userTickets, setUserTickets] = useState<NFTTicket[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAdminDashboard, setShowAdminDashboard] = useState(false)
  const [newRaffle, setNewRaffle] = useState({
    title: "",
    maxTickets: "",
    ticketPrice: "",
    stakePercent: "",
    feePercent: "",
  })
  const [isCreatingRaffle, setIsCreatingRaffle] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [purchaseStep, setPurchaseStep] = useState<"confirm" | "processing" | "success">("confirm")
  const [raffleData, setRaffleData] = useState(generateRaffleData())
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showLandingPage, setShowLandingPage] = useState(true)
  const [availableWallets, setAvailableWallets] = useState<string[]>([])
  const router = useRouter()
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [demoMode, setDemoMode] = useState(false)

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
    const interval = setInterval(() => {
      setRaffleData(generateRaffleData())
      setCurrentTime(new Date())
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    console.log("[v0] Browser:", navigator.userAgent.includes("Chrome") ? "Chrome-based" : "Other")
    console.log("[v0] Window injectedWeb3:", (window as any).injectedWeb3)
    console.log("[v0] Available extensions:", Object.keys((window as any).injectedWeb3 || {}))

    // Check for Polkadot extensions with delay to allow extension loading
    setTimeout(() => {
      if (typeof window !== "undefined") {
        const polkadotExtension = (window as any).injectedWeb3?.["polkadot-js"]
        const talismanExtension = (window as any).injectedWeb3?.["talisman"]
        const subwalletExtension = (window as any).injectedWeb3?.["subwallet-js"]

        console.log("[v0] Polkadot.js detected:", !!polkadotExtension)
        console.log("[v0] Talisman detected:", !!talismanExtension)
        console.log("[v0] SubWallet detected:", !!subwalletExtension)

        if (window.injectedWeb3) {
          const wallets = Object.keys(window.injectedWeb3)
          setAvailableWallets(wallets)
          console.log("[v0] Available wallets:", wallets)

          // Try to connect to the first available wallet
          if (wallets.length > 0) {
            const firstWallet = window.injectedWeb3[wallets[0] as keyof typeof window.injectedWeb3]
            if (firstWallet) {
              setWallet(firstWallet)
              console.log("[v0] Set wallet:", wallets[0])
            }
          }
        } else {
          console.log("[v0] No injectedWeb3 found - extensions may not be installed or enabled")
          setDemoMode(true)
        }
      }
    }, 1000) // Wait 1 second for extensions to load

    if (isConnected && publicKey) {
      // Mock admin check - replace with actual contract logic
      setIsAdmin(publicKey.startsWith("5") || publicKey.startsWith("1"))
    }
  }, [isConnected, publicKey])

  const copyAddress = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatAddress = (address: string) => {
    if (!address) return ""
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const buyTicket = async (raffle: Raffle) => {
    console.log("[v0] Buy ticket clicked - isConnected:", isConnected)
    console.log("[v0] Raffle active:", raffle.isActive)
    console.log("[v0] Tickets available:", raffle.maxTickets - raffle.ticketsIssued)

    if (!isConnected || !wallet) {
      alert("Connect your wallet first")
      return
    }

    if (raffle.ticketsIssued >= raffle.maxTickets) {
      alert("Sorry, this raffle is sold out!")
      return
    }

    if (!raffle.isActive) {
      alert("This raffle is no longer active")
      return
    }

    // Check if user already has a ticket for this raffle
    const hasTicket = userTickets.some((ticket) => ticket.raffleId === raffle.id)
    if (hasTicket) {
      alert("You already have a ticket for this raffle!")
      return
    }

    setSelectedRaffle(raffle)
    setShowPurchaseModal(true)
  }

  const confirmPurchase = async () => {
    if (!selectedRaffle || !isConnected) return

    setIsProcessing(true)
    setPurchaseStep("processing")

    try {
      console.log("[v0] Starting ticket purchase process...")

      // Step 1: Validate wallet balance (mock)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log("[v0] Wallet balance validated")

      // Step 2: Create transaction (mock)
      await new Promise((resolve) => setTimeout(resolve, 1500))
      console.log("[v0] Transaction created")

      // Step 3: Submit to Polkadot network (mock)
      await new Promise((resolve) => setTimeout(resolve, 2000))
      console.log("[v0] Transaction submitted to network")

      // Step 4: Generate NFT ticket
      const ticketId = `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const newTicket: NFTTicket = {
        id: ticketId,
        raffleId: selectedRaffle.id,
        raffleTitle: selectedRaffle.title,
        ticketNumber: selectedRaffle.ticketsIssued + 1,
        purchaseDate: new Date().toISOString(),
        price: selectedRaffle.ticketPrice,
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${ticketId}`,
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        owner: publicKey,
      }

      // Step 5: Update raffle data
      const updatedRaffles = mockRaffles.map((raffle) =>
        raffle.id === selectedRaffle.id
          ? {
              ...raffle,
              ticketsIssued: raffle.ticketsIssued + 1,
              totalRaised: raffle.totalRaised + raffle.ticketPrice,
              participants: [...raffle.participants, publicKey],
            }
          : raffle,
      )

      // Add ticket to user's collection
      setUserTickets((prev) => [...prev, newTicket])

      setPurchaseStep("success")

      // Show success message with confetti
      setTimeout(() => {
        // Trigger confetti effect
        const canvas = document.createElement("canvas")
        canvas.style.position = "fixed"
        canvas.style.top = "0"
        canvas.style.left = "0"
        canvas.style.width = "100%"
        canvas.style.height = "100%"
        canvas.style.pointerEvents = "none"
        canvas.style.zIndex = "9999"
        document.body.appendChild(canvas)

        // Simple confetti animation
        const ctx = canvas.getContext("2d")
        if (ctx) {
          canvas.width = window.innerWidth
          canvas.height = window.innerHeight

          const colors = ["#0EA5E9", "#06B6D4", "#10B981", "#F59E0B"]
          const particles: any[] = []

          for (let i = 0; i < 100; i++) {
            particles.push({
              x: Math.random() * canvas.width,
              y: -10,
              vx: (Math.random() - 0.5) * 4,
              vy: Math.random() * 3 + 2,
              color: colors[Math.floor(Math.random() * colors.length)],
              size: Math.random() * 6 + 2,
            })
          }

          const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            particles.forEach((particle, index) => {
              particle.x += particle.vx
              particle.y += particle.vy
              particle.vy += 0.1

              ctx.fillStyle = particle.color
              ctx.fillRect(particle.x, particle.y, particle.size, particle.size)

              if (particle.y > canvas.height) {
                particles.splice(index, 1)
              }
            })

            if (particles.length > 0) {
              requestAnimationFrame(animate)
            } else {
              document.body.removeChild(canvas)
            }
          }

          animate()
        }

        // Play success sound (mock)
        console.log("[v0] Playing success sound")
      }, 500)

      console.log("[v0] Ticket purchase completed successfully")
    } catch (error) {
      console.error("[v0] Purchase failed:", error)
      alert("Purchase failed. Please try again.")
      setPurchaseStep("confirm")
    } finally {
      setIsProcessing(false)
      setTimeout(() => {
        setShowPurchaseModal(false)
        setPurchaseStep("confirm")
      }, 3000)
    }
  }

  const generateQRCode = (data: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data)}`
  }

  const createRaffle = async () => {
    if (
      !newRaffle.title ||
      !newRaffle.maxTickets ||
      !newRaffle.ticketPrice ||
      !newRaffle.stakePercent ||
      !newRaffle.feePercent
    ) {
      alert("Please complete all fields")
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
        organizer: formatAddress(publicKey),
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
      alert("Raffle created successfully!")
    } catch (error) {
      console.error("[v0] Failed to create raffle:", error)
      alert("Error creating raffle. Please try again.")
    } finally {
      setIsCreatingRaffle(false)
    }
  }

  const closeRaffle = async (raffleId: string) => {
    const raffle = mockRaffles.find((r) => r.id === raffleId)
    if (!raffle || raffle.ticketsIssued === 0) {
      alert("Cannot close a raffle without participants")
      return
    }

    try {
      // Simulate random winner selection
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Generate random winner from ticket holders (mock)
      const winnerTicketNumber = Math.floor(Math.random() * raffle.ticketsIssued) + 1
      const mockWinnerAddress = `${Math.random().toString(36).substring(2, 5)}...${Math.random().toString(36).substring(2, 5)}`

      // Update raffle
      const raffleIndex = mockRaffles.findIndex((r) => r.id === raffleId)
      if (raffleIndex !== -1) {
        mockRaffles[raffleIndex].isActive = false
        mockRaffles[raffleIndex].winner = mockWinnerAddress
      }

      setWinnerInfo({ raffle, winner: mockWinnerAddress })
      setShowWinnerModal(true)
    } catch (error) {
      console.error("[v0] Failed to close raffle:", error)
      alert("Error closing raffle. Please try again.")
    }
  }

  const calculateTotalStakeFromRaffles = () => {
    return mockRaffles.reduce((total, raffle) => {
      const stakeFromRaffle = (raffle.totalRaised * raffle.stakePercent) / 100
      return total + stakeFromRaffle
    }, 0)
  }

  const totalStakeRetained = calculateTotalStakeFromRaffles()
  const stakeTarget = 500 // DOT
  const stakeProgress = (totalStakeRetained / stakeTarget) * 100

  const goToDashboard = () => {
    setShowLandingPage(false)
  }

  const goToLandingPage = () => {
    setShowLandingPage(true)
  }

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  const soldTickets = raffleNumbers.filter((ticket) => ticket.sold).length
  const availableTickets = 1000 - soldTickets
  const totalRevenue = soldTickets * 1000
  const uniqueBuyers = new Set(raffleNumbers.filter((t) => t.buyer).map((t) => t.buyer)).size

  const stats = [
    {
      title: "Tickets Sold",
      value: soldTickets.toString(),
      change: `${Math.round((soldTickets / 1000) * 100)}%`,
      icon: Ticket,
      color: "text-chart-1",
    },
    {
      title: "Available Tickets",
      value: availableTickets.toString(),
      change: `${Math.round((availableTickets / 1000) * 100)}%`,
      icon: Hash,
      color: "text-chart-2",
    },
    {
      title: "Anonymous Users",
      value: uniqueBuyers.toString(),
      change: "+12%",
      icon: Users,
      color: "text-chart-3",
    },
    {
      title: "Total Revenue",
      value: `$${(totalRevenue / 1000).toFixed(0)}K`,
      change: "+25%",
      icon: DollarSign,
      color: "text-chart-4",
    },
  ]

  const goToRafflesDashboard = () => {
    if (typeof window !== "undefined") {
      router.push("/rifas")
    }
  }

  const connectWallet = async () => {
    if (isConnecting) return

    setIsConnecting(true)
    console.log("[v0] Attempting to connect wallet...")

    try {
      if (demoMode || !wallet) {
        // Demo mode - simulate wallet connection
        console.log("[v0] Using demo mode wallet connection")
        const mockAddress = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
        setPublicKey(mockAddress)
        setIsConnected(true)
        alert("Demo wallet connected successfully!")
        return
      }

      // Real wallet connection
      console.log("[v0] Enabling wallet extension...")
      const injected = await wallet.enable("RIFA AVEIT")

      if (injected && injected.accounts) {
        const accounts = await injected.accounts.get()
        console.log("[v0] Retrieved accounts:", accounts)

        if (accounts.length > 0) {
          setPublicKey(accounts[0].address)
          setIsConnected(true)
          console.log("[v0] Wallet connected successfully:", accounts[0].address)
        } else {
          throw new Error("No accounts found")
        }
      } else {
        throw new Error("Failed to get accounts from wallet")
      }
    } catch (error) {
      console.error("[v0] Wallet connection failed:", error)
      alert(`Failed to connect wallet: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsConnecting(false)
    }
  }

  const createConfetti = useCallback(() => {
    if (typeof window === "undefined") return

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.style.position = "fixed"
    canvas.style.top = "0"
    canvas.style.left = "0"
    canvas.style.pointerEvents = "none"
    canvas.style.zIndex = "9999"
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57", "#ff9ff3", "#54a0ff"]
    const confettiCount = 200

    for (let i = 0; i < confettiCount; i++) {
      const confettiPiece = document.createElement("div")
      confettiPiece.style.position = "absolute"
      confettiPiece.style.width = "10px"
      confettiPiece.style.height = "10px"
      confettiPiece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
      confettiPiece.style.borderRadius = "50%"
      confettiPiece.style.left = `${Math.random() * 100}vw`
      confettiPiece.style.top = `${Math.random() * 100}vh`
      confettiPiece.style.zIndex = "9999"
      confettiPiece.style.transition = "transform 0.5s ease-out, opacity 0.5s ease-out"

      canvas.appendChild(confettiPiece)

      const angle = Math.random() * Math.PI * 2
      const distance = Math.random() * 50

      const x = Math.cos(angle) * distance
      const y = Math.sin(angle) * distance

      setTimeout(() => {
        confettiPiece.style.transform = `translate(${x}px, ${y}px)`
        confettiPiece.style.opacity = "0"
      }, 10)

      setTimeout(() => {
        if (confettiPiece.parentNode) {
          confettiPiece.parentNode.removeChild(confettiPiece)
        }
      }, 500)
    }

    document.body.appendChild(canvas)

    setTimeout(() => {
      if (canvas.parentNode) {
        document.body.removeChild(canvas)
      }
    }, 500)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {showLandingPage && (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center">
                    <Ticket className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-balance">Blockchain Raffle</h1>
                    <p className="text-xs text-muted-foreground">AVEIT UTN FRC</p>
                  </div>
                </div>
                <nav className="hidden md:flex items-center space-x-6">
                  <button
                    onClick={() => scrollToSection("inicio")}
                    className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                  >
                    Home
                  </button>
                  <button
                    onClick={() => scrollToSection("quienes-somos")}
                    className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                  >
                    About Us
                  </button>
                  <button
                    onClick={() => scrollToSection("como-funciona")}
                    className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                  >
                    How It Works
                  </button>
                  <button
                    onClick={() => scrollToSection("stake-garantia")}
                    className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                  >
                    Stake Guarantee
                  </button>
                  <button
                    onClick={() => scrollToSection("rifas-disponibles")}
                    className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                  >
                    Buy Your Ticket
                  </button>
                </nav>
                <div className="flex items-center space-x-4">
                  {!isConnected ? (
                    <Button
                      onClick={connectWallet}
                      disabled={isConnecting}
                      variant="outline"
                      className="border-primary text-primary hover:bg-primary hover:text-white bg-transparent"
                    >
                      {isConnecting ? "Connecting..." : "Connect Wallet"}
                    </Button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">{formatAddress(publicKey)}</span>
                    </div>
                  )}
                  <Button
                    variant="default"
                    onClick={goToRafflesDashboard}
                    className="bg-gradient-to-r from-secondary to-blue-500 hover:from-secondary/90 hover:to-blue-500/90 text-white font-semibold"
                  >
                    📊 Analytics Dashboard
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <main className="container mx-auto px-4">
            {/* Hero Section */}
            <section id="inicio" className="py-20 text-center">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-blue-600 to-green-600 bg-clip-text text-transparent mb-6 text-balance animate-slide-up">
                  Transparent Blockchain Raffle
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground mb-12 text-pretty max-w-3xl mx-auto leading-relaxed animate-slide-up">
                  An AVEIT project that replaces Lottery certification with a decentralized system on Polkadot.
                </p>

                <Button
                  onClick={goToRafflesDashboard}
                  size="lg"
                  className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 animate-slide-up"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Try Demo - View Dashboard
                </Button>
              </div>
            </section>

            {/* About Us Section */}
            <section id="quienes-somos" className="py-16">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl font-bold text-foreground mb-6">About Us</h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                  We are a non-profit association formed by students from the National Technological University, Córdoba
                  Regional Faculty. We seek to enrich the university journey of our members by conducting social impact,
                  training, and recreational activities.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">Student Community</h3>
                    <p className="text-sm text-muted-foreground">
                      Formed by students and engineers passionate about technology
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">Innovation</h3>
                    <p className="text-sm text-muted-foreground">
                      We develop projects that transform ideas into real solutions
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">Transparency</h3>
                    <p className="text-sm text-muted-foreground">
                      We believe in transparency and decentralization as fundamental pillars
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Features Section */}
            <section id="como-funciona" className="py-16">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-foreground mb-4">How It Works</h2>
                <p className="text-lg text-muted-foreground">Blockchain technology for transparent raffles</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <Card className="text-center hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 animate-slide-up">
                  <CardHeader className="pb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Ticket className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Tickets tokenized as NFTs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      Each ticket is a unique NFT on the Polkadot blockchain, guaranteeing authenticity and complete
                      traceability of all participations.
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card
                  className="text-center hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 animate-slide-up"
                  style={{ animationDelay: "0.1s" }}
                >
                  <CardHeader className="pb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-8 h-8 text-green-600" />
                    </div>
                    <CardTitle className="text-xl">Stake as transparent guarantee</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      A percentage of each sale is retained as a guarantee, eliminating the need for central authorities
                      and ensuring total transparency.
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card
                  className="text-center hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 animate-slide-up"
                  style={{ animationDelay: "0.2s" }}
                >
                  <CardHeader>
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Eye className="w-8 h-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl">Auditable draw on blockchain</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      Winner selection uses verifiable algorithms on blockchain, allowing anyone to audit the drawing
                      process.
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Stake Section */}
            <section id="stake-garantia" className="py-16">
              <div className="w-full">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-foreground mb-4">Stake Guarantee</h2>
                  <p className="text-lg text-muted-foreground">
                    Participate in our transparent staking system and earn rewards.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-t border-b border-green-200 py-12 px-6 animate-slide-up">
                  <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-8">
                      <div className="flex items-center justify-center space-x-2 text-green-800 mb-4">
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold">Stake Guarantee Pool</h3>
                      </div>
                      <p className="text-green-700 text-lg">
                        The stake functions as a transparency guarantee, replacing the role of the Lottery.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                      <div className="text-center bg-white/50 p-6 rounded-lg border border-green-200">
                        <div className="text-3xl font-bold text-green-800">{totalStakeRetained.toFixed(2)} DOT</div>
                        <div className="text-sm text-green-600 mt-2">Total Staked</div>
                      </div>
                      <div className="text-center bg-white/50 p-6 rounded-lg border border-green-200">
                        <div className="text-3xl font-bold text-green-800">{stakeProgress.toFixed(1)}%</div>
                        <div className="text-sm text-green-600 mt-2">Progress</div>
                      </div>
                      <div className="text-center bg-white/50 p-6 rounded-lg border border-green-200">
                        <div className="text-3xl font-bold text-green-800">{stakeTarget} DOT</div>
                        <div className="text-sm text-green-600 mt-2">Target</div>
                      </div>
                    </div>

                    <div className="max-w-4xl mx-auto space-y-6">
                      <div className="flex justify-between text-lg">
                        <span className="text-green-700 font-medium">Stake Progress:</span>
                        <span className="font-bold text-green-800">
                          {totalStakeRetained.toFixed(2)} / {stakeTarget} DOT
                        </span>
                      </div>
                      <div className="w-full bg-green-200 rounded-full h-4">
                        <div
                          className="bg-gradient-to-r from-green-500 to-emerald-600 h-4 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(stakeProgress, 100)}%` }}
                        ></div>
                      </div>
                      <div className="bg-white/70 p-6 rounded-lg border border-green-200">
                        <p className="text-green-700 leading-relaxed text-center">
                          <strong>How does it work?</strong> A percentage of each sale is retained as a stake guarantee.
                          This fund ensures process transparency and replaces the need for a central authority like the
                          National Lottery. Funds are automatically released at the end of each raffle.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Additional Info Section */}
            <section className="py-16 bg-muted/30 -mx-4 px-4">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl font-bold text-foreground mb-6">Why blockchain?</h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                  Blockchain technology eliminates the need to trust central authorities. Every transaction, every
                  ticket, and every draw is recorded immutably and verifiably by anyone.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Zap className="w-4 h-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold mb-2">Total Transparency</h3>
                      <p className="text-muted-foreground text-sm">
                        All processes are public and verifiable in real time.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Shield className="w-4 h-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold mb-2">Guaranteed Security</h3>
                      <p className="text-muted-foreground text-sm">
                        Polkadot blockchain protects all transactions and data.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Raffles Section */}
            <section id="rifas-disponibles" className="py-16">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-foreground mb-4">Available Raffles</h2>
                  <p className="text-lg text-muted-foreground">Participate in transparent and decentralized raffles</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mockRaffles.slice(0, 3).map((raffle, index) => (
                    <Card
                      key={raffle.id}
                      className="hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 animate-slide-up"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{raffle.title}</CardTitle>
                          <Badge
                            variant={raffle.isActive ? "secondary" : "default"}
                            className={`${raffle.isActive ? "bg-green-100 text-green-800 animate-pulse-success" : "bg-accent/20"}`}
                          >
                            <Ticket className="w-3 h-3 mr-1" />
                            {raffle.isActive ? "Active" : "Closed"}
                          </Badge>
                        </div>
                        <CardDescription>
                          Organized by {raffle.organizer}
                          {!raffle.isActive && raffle.winner && (
                            <div className="flex items-center mt-1 text-green-600 animate-pulse-success">
                              <Trophy className="w-3 h-3 mr-1" />
                              Winner: {raffle.winner}
                            </div>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Price per ticket:</span>
                            <span className="font-semibold text-primary">{raffle.ticketPrice} DOT</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Tickets sold:</span>
                            <span className="font-semibold">
                              {raffle.ticketsIssued} / {raffle.maxTickets}
                            </span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-primary to-blue-600 h-3 rounded-full transition-all duration-1000 ease-out"
                              style={{ width: `${(raffle.ticketsIssued / raffle.maxTickets) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        <Button
                          onClick={() => buyTicket(raffle)}
                          className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-semibold py-2 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                          disabled={!isConnected || raffle.ticketsIssued >= raffle.maxTickets || !raffle.isActive}
                        >
                          {!isConnected
                            ? "Connect Wallet to Buy"
                            : !raffle.isActive
                              ? "Closed"
                              : raffle.ticketsIssued >= raffle.maxTickets
                                ? "Sold Out"
                                : "Buy Ticket"}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="text-center mt-8">
                  <Button
                    onClick={goToRafflesDashboard}
                    size="lg"
                    className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    📊 View Analytics Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </section>
          </main>
        </div>
      )}

      {showPurchaseModal && selectedRaffle && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Confirm Purchase</h3>

            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">{selectedRaffle.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ticket #{selectedRaffle.ticketsIssued + 1} of {selectedRaffle.maxTickets}
                </p>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h5 className="font-medium mb-2 text-gray-900 dark:text-white">Payment Breakdown</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Ticket Price:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedRaffle.ticketPrice} DOT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Platform Fee ({selectedRaffle.feePercent}%):
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {((selectedRaffle.ticketPrice * selectedRaffle.feePercent) / 100).toFixed(3)} DOT
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Stake Pool ({selectedRaffle.stakePercent}%):
                    </span>
                    <span className="text-green-600 dark:text-green-400">
                      {((selectedRaffle.ticketPrice * selectedRaffle.stakePercent) / 100).toFixed(3)} DOT
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">To Organizer:</span>
                    <span className="text-gray-900 dark:text-white">
                      {(
                        selectedRaffle.ticketPrice -
                        (selectedRaffle.ticketPrice * (selectedRaffle.feePercent + selectedRaffle.stakePercent)) / 100
                      ).toFixed(3)}{" "}
                      DOT
                    </span>
                  </div>
                </div>
              </div>

              {isProcessing && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100">
                        {purchaseStep === "processing" ? "Processing Transaction..." : "Confirming..."}
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {purchaseStep === "processing"
                          ? "Please wait while we process your payment"
                          : "Please confirm in your wallet"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowPurchaseModal(false)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmPurchase}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-blue-700 hover:to-cyan-600 disabled:opacity-50 font-medium"
              >
                {isProcessing ? "Processing..." : `Buy for ${selectedRaffle.ticketPrice} DOT`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
