"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { useWallet } from "@/contexts/wallet-context"
import Navbar from "@/components/navbar"

export default function Home() {
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

  // Staggered animation for text elements
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.4,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 1.2,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F5EA] via-[#EACC91] to-[#987A3F]/30 font-sans overflow-hidden">
      {/* Navigation Bar */}
      <Navbar />

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-24 pb-20 relative">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-20 right-10 w-72 h-72 bg-[#EACC91]/40 rounded-full blur-3xl"></div>
          <div className="absolute bottom-40 left-10 w-96 h-96 bg-[#987A3F]/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-[#F9F5EA]/50 rounded-full blur-3xl"></div>
        </div>

        {/* Hero Section with Big Character Poster Style */}
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center relative z-10">
          {/* Logo */}
          <motion.div
            className="mb-8"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image
              src="/hamster-logo.svg"
              alt="Hamster Logo"
              width={120}
              height={120}
              className="rounded-full border-4 border-[#987A3F] shadow-lg"
            />
          </motion.div>

          {/* Text content with staggered fade-in animations */}
          <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col items-center">
            {/* Main Title - Big Character Style */}
            <motion.h1
              variants={item}
              className="text-7xl md:text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#523805] to-[#987A3F] leading-tight mb-6 tracking-tight"
            >
              HamsterSwap
            </motion.h1>

            {/* Subtitle in Big Character Style */}
            <motion.h2 variants={item} className="text-4xl md:text-6xl font-bold text-[#523805] mb-4 tracking-tight">
              宇宙最可爱的交易所
            </motion.h2>

            <motion.p variants={item} className="text-2xl md:text-3xl text-[#523805]/80 max-w-3xl mx-auto mb-12">
              The Cutest Swap in the Galaxy
            </motion.p>

            {/* Call to Action Buttons */}
            <motion.div variants={item} className="flex flex-col sm:flex-row gap-6 justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => mounted && setIsWalletModalOpen(true)}
                  className="rounded-full bg-gradient-to-r from-[#EACC91] to-[#987A3F] hover:from-[#987A3F] hover:to-[#523805] text-[#523805] hover:text-white font-bold shadow-lg hover:shadow-xl px-10 py-8 text-xl"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-2xl">🐹</span> 连接钱包
                  </span>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/trade">
                  <Button
                    variant="outline"
                    className="rounded-full border-4 border-[#987A3F] text-[#523805] hover:bg-[#EACC91]/20 px-10 py-8 text-xl font-bold"
                  >
                    开始交易
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Decorative Hamsters */}
        <motion.div
          className="absolute bottom-10 right-10 md:right-20"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.5, delay: 1.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image
            src="/hamster-logo.svg"
            alt="Decorative Hamster"
            width={80}
            height={80}
            className="animate-bounce"
            style={{ animationDuration: "3s" }}
          />
        </motion.div>

        <motion.div
          className="absolute top-40 left-10 md:left-20 hidden md:block"
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.5, delay: 2, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image
            src="/hamster-logo.svg"
            alt="Decorative Hamster"
            width={60}
            height={60}
            className="animate-bounce"
            style={{ animationDuration: "4s" }}
          />
        </motion.div>
      </main>
    </div>
  )
}
