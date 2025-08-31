"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { AveitDashboard } from "@/components/aveit-dashboard"

export default function RifasDashboard() {
  const goToAboutUs = () => {
    window.location.href = "/#about-us"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-blue-900">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-blue-200 dark:border-blue-800">
        <div className="container mx-auto px-4 py-4">
          <Button
            onClick={goToAboutUs}
            variant="outline"
            className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/50 bg-transparent"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to About Us
          </Button>
        </div>
      </div>

      {/* Dashboard Content */}
      <AveitDashboard />
    </div>
  )
}
