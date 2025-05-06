"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Globe, Menu, Settings, X, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import WalletButton from "@/components/wallet-button"
import { useWallet } from "@/contexts/wallet-context"
import { useAdmin } from "@/contexts/admin-context"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { walletState } = useWallet()
  const { isAdmin } = useAdmin()

  // Component mounted state
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Get network name
  const getNetworkName = (chainId: number | null) => {
    if (!chainId) return "Not Connected"

    switch (chainId) {
      case 1:
        return "Ethereum Mainnet"
      case 5:
        return "Goerli Testnet"
      case 31337:
        return "Localhost"
      default:
        return `Chain ID: ${chainId}`
    }
  }

  // If not mounted yet, render a placeholder to avoid hydration mismatch
  if (!mounted) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-transparent">
        <div className="container mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-gray-200"></div>
              <div className="h-6 w-32 bg-gray-200 rounded"></div>
            </div>
            <div className="hidden md:flex items-center gap-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-4 w-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
            <div className="h-8 w-24 bg-gray-200 rounded-full"></div>
            <div className="h-8 w-32 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/90 backdrop-blur-md shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between p-4">
        {/* Logo and Main Navigation */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <motion.div
              className="relative h-10 w-10"
              whileHover={{ rotate: 15 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Image src="/hamster-logo.svg" alt="Hamster Logo" width={40} height={40} className="rounded-full" />
            </motion.div>
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#523805] to-[#987A3F] text-xl tracking-tight">
              HamsterSwap
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {[
              { name: "Trade", href: "/trade" },
              { name: "Farm", href: "/farm" },
              { name: "IDO", href: "/ido" },
              { name: "AirDrop", href: "/airdrop" },
              ...(isAdmin ? [{ name: "Admin", href: "/admin" }] : []),
            ].map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="relative font-medium text-[#523805] hover:text-[#987A3F] transition-colors group"
              >
                {item.name === "Admin" ? (
                  <span className="flex items-center gap-1">
                    <Shield className="h-4 w-4" /> {item.name}
                  </span>
                ) : (
                  item.name
                )}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#987A3F] transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Right Side - Account & Settings */}
        <div className="flex items-center gap-3">
          <motion.div whileHover={{ rotate: 15 }}>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-[#523805] hover:text-[#987A3F] hover:bg-[#EACC91]/30"
            >
              <Globe className="h-5 w-5" />
            </Button>
          </motion.div>

          <motion.div whileHover={{ rotate: 15 }}>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-[#523805] hover:text-[#987A3F] hover:bg-[#EACC91]/30"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </motion.div>

          <Button
            variant="outline"
            className="gap-2 rounded-full border-[#EACC91] hover:border-[#987A3F] hover:bg-[#EACC91]/20"
          >
            <div className="relative h-5 w-5 flex items-center justify-center">
              {walletState.chainId === 31337 ? (
                <span className="text-xs font-bold text-[#523805]">L</span>
              ) : (
                <Image src="/eth-logo.svg" alt="Ethereum" width={20} height={20} className="rounded-full" />
              )}
            </div>
            <span className="font-medium text-[#523805]">{getNetworkName(walletState.chainId)}</span>
          </Button>

          <WalletButton />

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-full"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <motion.div
          className="md:hidden bg-white border-t"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="container mx-auto py-4 px-6 space-y-4">
            {[
              { name: "Trade", href: "/trade" },
              { name: "Farm", href: "/farm" },
              { name: "IDO", href: "/ido" },
              { name: "AirDrop", href: "/airdrop" },
              ...(isAdmin ? [{ name: "Admin", href: "/admin" }] : []),
            ].map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block py-2 font-medium text-[#523805] hover:text-[#987A3F]"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name === "Admin" ? (
                  <span className="flex items-center gap-1">
                    <Shield className="h-4 w-4" /> {item.name}
                  </span>
                ) : (
                  item.name
                )}
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </header>
  )
}
