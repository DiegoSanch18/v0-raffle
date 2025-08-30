"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import {
  TrendingUp,
  Users,
  DollarSign,
  Gift,
  Trophy,
  Crown,
  Medal,
  Award,
  Hash,
  Clock,
  ArrowLeft,
  Ticket,
} from "lucide-react"

// Mock data para el dashboard
const stats = [
  {
    title: "Números Vendidos",
    value: "847",
    change: "84.7%",
    icon: Ticket,
    color: "text-chart-1",
  },
  {
    title: "Participantes",
    value: "312",
    change: "31.2%",
    icon: Users,
    color: "text-chart-2",
  },
  {
    title: "Recaudado",
    value: "$423.500",
    change: "42.4%",
    icon: DollarSign,
    color: "text-chart-3",
  },
  {
    title: "Premios",
    value: "$1.325.000",
    change: "100%",
    icon: Gift,
    color: "text-chart-4",
  },
]

const raffleData = [
  { time: "00:00", ventas: 12 },
  { time: "04:00", ventas: 8 },
  { time: "08:00", ventas: 25 },
  { time: "12:00", ventas: 45 },
  { time: "16:00", ventas: 38 },
  { time: "20:00", ventas: 52 },
  { time: "24:00", ventas: 67 },
]

const prizes = [
  { name: "1er Premio - Auto 0km", value: 800000, color: "hsl(var(--chart-1))" },
  { name: "2do Premio - Moto", value: 300000, color: "hsl(var(--chart-2))" },
  { name: "3er Premio - Electrodomésticos", value: 150000, color: "hsl(var(--chart-3))" },
  { name: "4to Premio - Viaje", value: 75000, color: "hsl(var(--chart-4))" },
]

const topBuyers = [
  {
    id: 1,
    name: "Usuario Anónimo #1",
    specialty: "Estudiante de Ingeniería",
    tickets: 47,
    amount: 23500,
    avatar: "/diverse-user-avatars.png",
  },
  {
    id: 2,
    name: "Usuario Anónimo #2",
    specialty: "Docente UTN",
    tickets: 35,
    amount: 17500,
    avatar: "/diverse-user-avatars.png",
  },
  {
    id: 3,
    name: "Usuario Anónimo #3",
    specialty: "Graduado",
    tickets: 28,
    amount: 14000,
    avatar: "/diverse-user-avatars.png",
  },
  {
    id: 4,
    name: "Usuario Anónimo #4",
    specialty: "Personal Administrativo",
    tickets: 22,
    amount: 11000,
    avatar: "/diverse-user-avatars.png",
  },
  {
    id: 5,
    name: "Usuario Anónimo #5",
    specialty: "Estudiante de Sistemas",
    tickets: 18,
    amount: 9000,
    avatar: "/diverse-user-avatars.png",
  },
]

const raffleNumbers = Array.from({ length: 1000 }, (_, i) => ({
  number: String(i + 1).padStart(4, "0"),
  sold: Math.random() > 0.15,
}))

const soldTickets = raffleNumbers.filter((ticket) => ticket.sold).length
const totalRevenue = soldTickets * 500

export default function RafflesDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 3000)

    return () => clearInterval(timer)
  }, [])

  const goToHome = () => {
    window.location.href = "/"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={goToHome} className="bg-transparent">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Inicio
              </Button>
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center">
                <Ticket className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-balance">Dashboard de Rifas</h1>
                <p className="text-xs text-muted-foreground">AVEIT UTN FRC</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
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

        <Card className="border-t-4 border-t-chart-3 mb-8">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

        <Card className="border-t-4 border-t-chart-4">
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
      </main>
    </div>
  )
}
