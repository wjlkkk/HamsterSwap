"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ChevronDown, Settings, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { useWallet } from "@/contexts/wallet-context"
import Navbar from "@/components/navbar"

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { setIsWalletModalOpen } = useWallet()
  const [mounted, setMounted] = useState(false)

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F9F5EA] via-[#EACC91]/20 to-[#F9F5EA] font-sans">
      {/* Navigation Bar */}
      <Navbar />

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-32 pb-20">
        <div className="grid gap-12 md:grid-cols-2 items-center">
          <motion.div
            className="flex flex-col justify-center space-y-8"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#523805] to-[#987A3F] leading-tight">
              The cutest swap in the galaxy.
            </h1>
            <p className="text-xl text-[#523805]/80 leading-relaxed">
              Trade, earn, and win crypto on the most popular decentralized platform in the galaxy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => setIsWalletModalOpen(true)}
                  className="rounded-full bg-gradient-to-r from-[#EACC91] to-[#987A3F] hover:from-[#987A3F] hover:to-[#523805] text-[#523805] hover:text-white font-medium shadow-lg hover:shadow-xl px-8 py-6 text-lg w-full sm:w-auto"
                >
                  <span className="flex items-center gap-2">
                    <span>🐹</span> Connect Wallet
                  </span>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  className="rounded-full border-2 border-[#987A3F] text-[#523805] hover:bg-[#EACC91]/20 px-8 py-6 text-lg font-medium w-full sm:w-auto"
                >
                  Trade Now
                </Button>
              </motion.div>
            </div>
          </motion.div>
          <motion.div
            className="flex items-center justify-center"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex flex-col gap-4 bg-white rounded-3xl shadow-xl border border-[#EACC91] p-6 w-full max-w-md mx-auto">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold text-[#523805]">Swap</h2>
                <div className="p-2 rounded-full bg-[#EACC91]/30">
                  <Settings className="h-5 w-5 text-[#523805]" />
                </div>
              </div>

              {/* From Token 输入 */}
              <div className="bg-[#F9F5EA] rounded-2xl p-4 mb-2">
                <div className="flex justify-between mb-2">
                  <span className="text-[#523805]/70">From</span>
                  <span className="text-sm text-[#523805]/70">Balance: 1.56 ETH</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value="1"
                    readOnly
                    className="bg-transparent text-2xl font-medium text-[#523805] focus:outline-none w-full"
                    placeholder="0.0"
                  />
                  <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 border border-[#EACC91]">
                    <div className="relative h-6 w-6">
                      <Image src="/eth-logo.svg" alt="Ethereum" width={24} height={24} className="rounded-full" />
                    </div>
                    <span className="font-medium text-[#523805]">ETH</span>
                    <ChevronDown className="h-4 w-4 text-[#523805]/50" />
                  </div>
                </div>
                <div className="flex justify-end mt-2">
                  <span className="text-sm text-[#523805]/70">~$3,500.00</span>
                </div>
              </div>

              {/* 交换按钮 */}
              <div className="flex justify-center -my-3 relative z-10">
                <motion.button
                  type="button"
                  className="bg-white rounded-full p-2 border border-[#EACC91] shadow-md"
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <ArrowDown className="h-5 w-5 text-[#523805]" />
                </motion.button>
              </div>

              {/* To Token 输入 */}
              <div className="bg-[#F9F5EA] rounded-2xl p-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-[#523805]/70">To</span>
                  <span className="text-sm text-[#523805]/70">Balance: 150.25 CAKE</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value="1400"
                    readOnly
                    className="bg-transparent text-2xl font-medium text-[#523805] focus:outline-none w-full"
                    placeholder="0.0"
                  />
                  <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 border border-[#EACC91]">
                    <div className="relative h-6 w-6">
                      <Image src="/cake-logo.svg" alt="CAKE" width={24} height={24} className="rounded-full" />
                    </div>
                    <span className="font-medium text-[#523805]">CAKE</span>
                    <ChevronDown className="h-4 w-4 text-[#523805]/50" />
                  </div>
                </div>
                <div className="flex justify-end mt-2">
                  <span className="text-sm text-[#523805]/70">~$3,500.00</span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => mounted && setIsWalletModalOpen(true)}
                className="w-full bg-gradient-to-r from-[#EACC91] to-[#987A3F] hover:from-[#987A3F] hover:to-[#523805] text-[#523805] hover:text-white font-medium py-4 rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                <span className="flex items-center justify-center gap-2">
                  <span>🐹</span> Swap
                </span>
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Stats Section */}
        <motion.div
          className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {[
            { label: "Total Value Locked", value: "$9.6B" },
            { label: "Users", value: "2.4M+" },
            { label: "Trades", value: "97.4M+" },
            { label: "Tokens", value: "3,400+" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-[#EACC91]"
              whileHover={{
                y: -5,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <h3 className="text-[#523805]/60 text-sm font-medium mb-2">{stat.label}</h3>
              <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#523805] to-[#987A3F]">
                {stat.value}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* Footer Logo */}
      <motion.div
        className="fixed bottom-6 right-6"
        whileHover={{ rotate: 15, scale: 1.2 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <div className="relative h-12 w-12 drop-shadow-lg">
          <Image src="/hamster-logo.svg" alt="Logo" width={48} height={48} className="rounded-full" />
        </div>
      </motion.div>
    </div>
  )
}
