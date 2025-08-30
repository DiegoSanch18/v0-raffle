"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Ticket, TrendingUp, Users, Award, Crown, Medal, Gift, DollarSign, Clock, Hash, Trophy } from "lucide-react"

const generateRaffleData = () => {
  return Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    ventas: Math.floor(Math.random() * 15) + 5,
    ingresos: Math.floor(Math.random() * 3000) + 1000,
  }))
}

const raffleNumbers = Array.from({ length: 1000 }, (_, i) => ({
  number: String(i + 1).padStart(4, "0"),
  sold: Math.random() > 0.3,
  buyer: Math.random() > 0.3 ? `Usuario ${Math.floor(Math.random() * 200) + 1}` : null,
}))

const topBuyers = [
  {
    id: 1,
    name: "Usuario Anónimo #1",
    tickets: 15,
    amount: 15000,
    avatar: "/female-developer.png",
    specialty: "Wallet: 0x7A9f...3B2c",
  },
  {
    id: 2,
    name: "Usuario Anónimo #2",
    tickets: 12,
    amount: 12000,
    avatar: "/male-programmer.png",
    specialty: "Wallet: 0x4E8d...9F1a",
  },
  {
    id: 3,
    name: "Usuario Anónimo #3",
    tickets: 10,
    amount: 10000,
    avatar: "/latina-developer.png",
    specialty: "Wallet: 0x2C5b...7D4e",
  },
  {
    id: 4,
    name: "Usuario Anónimo #4",
    tickets: 8,
    amount: 8000,
    avatar: "/asian-developer.png",
    specialty: "Wallet: 0x9A1f...6E8c",
  },
  {
    id: 5,
    name: "Usuario Anónimo #5",
    tickets: 7,
    amount: 7000,
    avatar: "/developer-working.png",
    specialty: "Wallet: 0x3F7a...2B9d",
  },
]

const prizes = [
  { name: "1er Premio - Notebook Gamer", value: 800000, color: "hsl(var(--chart-1))" },
  { name: "2do Premio - Smartphone", value: 300000, color: "hsl(var(--chart-2))" },
  { name: "3er Premio - Tablet", value: 150000, color: "hsl(var(--chart-3))" },
  { name: "4to Premio - Auriculares", value: 50000, color: "hsl(var(--chart-4))" },
  { name: "5to Premio - Voucher", value: 25000, color: "hsl(var(--primary))" },
]

export default function AVEITRaffleDashboard() {
  const [raffleData, setRaffleData] = useState(generateRaffleData())
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setRaffleData(generateRaffleData())
      setCurrentTime(new Date())
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const soldTickets = raffleNumbers.filter((ticket) => ticket.sold).length
  const availableTickets = 1000 - soldTickets
  const totalRevenue = soldTickets * 1000
  const uniqueBuyers = new Set(raffleNumbers.filter((t) => t.buyer).map((t) => t.buyer)).size

  const stats = [
    {
      title: "Números Vendidos",
      value: soldTickets.toString(),
      change: `${Math.round((soldTickets / 1000) * 100)}%`,
      icon: Ticket,
      color: "text-chart-1",
    },
    {
      title: "Números Disponibles",
      value: availableTickets.toString(),
      change: `${Math.round((availableTickets / 1000) * 100)}%`,
      icon: Hash,
      color: "text-chart-2",
    },
    {
      title: "Usuarios Anónimos",
      value: uniqueBuyers.toString(),
      change: "+12%",
      icon: Users,
      color: "text-chart-3",
    },
    {
      title: "Recaudación Total",
      value: `$${(totalRevenue / 1000).toFixed(0)}K`,
      change: "+25%",
      icon: DollarSign,
      color: "text-chart-4",
    },
  ]

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-balance">Dashboard Rifa AVEIT UTN FRC</h1>
            <p className="text-muted-foreground text-lg mt-2">
              Gran Rifa Anual 2024 • Actualizado: {currentTime.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="default" className="text-lg px-4 py-2 bg-primary hover:bg-primary/90">
              <Gift className="w-5 h-5 mr-2" />
              Rifa Activa
            </Badge>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Clock className="w-5 h-5 mr-2" />
              15 días restantes
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="relative overflow-hidden border-l-4 border-l-primary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-balance">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-chart-2 font-medium">{stat.change}</span> del total
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-chart-1" />
              Ventas en Tiempo Real
            </CardTitle>
            <CardDescription>Números vendidos e ingresos durante las últimas 24 horas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={raffleData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="ventas"
                  stroke="hsl(var(--chart-1))"
                  fill="hsl(var(--chart-1))"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-secondary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-chart-2" />
              Premios de la Rifa
            </CardTitle>
            <CardDescription>Valor total de premios: $1.325.000</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={prizes}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {prizes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => [`$${(value as number).toLocaleString()}`, "Valor"]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {prizes.map((prize, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: prize.color }} />
                    <span className="text-sm font-medium">{prize.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">${prize.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-t-4 border-t-chart-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Trophy className="w-6 h-6 text-chart-2" />
            Top Usuarios Anónimos
          </CardTitle>
          <CardDescription>Los 5 usuarios anónimos con más números adquiridos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topBuyers.map((buyer, index) => (
              <div
                key={buyer.id}
                className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                  index === 0
                    ? "bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20"
                    : "bg-muted/50 hover:bg-muted"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    {index === 0 && <Crown className="w-6 h-6 text-chart-3" />}
                    {index === 1 && <Medal className="w-6 h-6 text-chart-1" />}
                    {index === 2 && <Award className="w-6 h-6 text-chart-2" />}
                    {index > 2 && (
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                    )}
                  </div>
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={buyer.avatar || "/placeholder.svg"} alt={buyer.name} />
                    <AvatarFallback>
                      {buyer.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{buyer.name}</h3>
                    <p className="text-muted-foreground">{buyer.specialty}</p>
                    <p className="text-xs text-muted-foreground">${buyer.amount.toLocaleString()} invertidos</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{buyer.tickets}</div>
                  <div className="text-sm text-chart-2 font-medium">números</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card className="border-l-4 border-l-chart-1">
          <CardHeader>
            <CardTitle className="text-lg">Progreso de Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={(soldTickets / 1000) * 100} className="h-3" />
            <p className="text-sm text-muted-foreground mt-2">{soldTickets} de 1000 números vendidos</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-chart-2">
          <CardHeader>
            <CardTitle className="text-lg">Meta de Recaudación</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={(totalRevenue / 1000000) * 100} className="h-3" />
            <p className="text-sm text-muted-foreground mt-2">
              ${(totalRevenue / 1000).toFixed(0)}K de $1000K objetivo
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-chart-3">
          <CardHeader>
            <CardTitle className="text-lg">Tiempo Restante</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={75} className="h-3" />
            <p className="text-sm text-muted-foreground mt-2">15 días de 60 días totales</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8 border-t-4 border-t-chart-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-chart-4" />
            Últimos Números Vendidos
          </CardTitle>
          <CardDescription>Los 20 números más recientemente adquiridos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 md:grid-cols-10 gap-2">
            {raffleNumbers
              .filter((ticket) => ticket.sold)
              .slice(-20)
              .map((ticket, index) => (
                <Badge key={index} variant="secondary" className="justify-center py-2">
                  {ticket.number}
                </Badge>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
