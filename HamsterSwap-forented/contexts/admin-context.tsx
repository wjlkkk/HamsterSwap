"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useWallet } from "@/contexts/wallet-context"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

// List of admin addresses (in a real app, this would come from a contract or secure backend)
const ADMIN_ADDRESSES = [
  "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266", // Hardhat default first account
  "0x70997970c51812dc3a010c7d01b50e0d17dc79c8", // Hardhat default second account
]

type AdminContextType = {
  isAdmin: boolean
  isLoading: boolean
  checkAdminStatus: () => Promise<boolean>
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: ReactNode }) {
  const { walletState } = useWallet()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  // Check if the connected wallet is an admin
  const checkAdminStatus = async (): Promise<boolean> => {
    if (!walletState.connected || !walletState.address) {
      setIsAdmin(false)
      return false
    }

    // Check if the address is in the admin list (case-insensitive)
    const isAdminAddress = ADMIN_ADDRESSES.some((addr) => addr.toLowerCase() === walletState.address?.toLowerCase())

    setIsAdmin(isAdminAddress)
    return isAdminAddress
  }

  // Check admin status when wallet state changes
  useEffect(() => {
    const checkStatus = async () => {
      setIsLoading(true)
      await checkAdminStatus()
      setIsLoading(false)
    }

    checkStatus()
  }, [walletState.connected, walletState.address])

  return (
    <AdminContext.Provider
      value={{
        isAdmin,
        isLoading,
        checkAdminStatus,
      }}
    >
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider")
  }
  return context
}

// HOC to protect admin routes
export function withAdminProtection<P extends object>(Component: React.ComponentType<P>) {
  return function ProtectedComponent(props: P) {
    const { isAdmin, isLoading } = useAdmin()
    const { walletState } = useWallet()
    const router = useRouter()
    const { toast } = useToast()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
      setMounted(true)
    }, [])

    useEffect(() => {
      if (mounted && !isLoading) {
        if (!walletState.connected) {
          toast({
            title: "Authentication required",
            description: "Please connect your wallet to access the admin area",
            variant: "destructive",
          })
          router.push("/")
        } else if (!isAdmin) {
          toast({
            title: "Access denied",
            description: "Your wallet does not have admin privileges",
            variant: "destructive",
          })
          router.push("/")
        }
      }
    }, [isAdmin, isLoading, walletState.connected, mounted, router, toast])

    if (!mounted || isLoading || !walletState.connected || !isAdmin) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#F9F5EA] via-[#EACC91]/20 to-[#F9F5EA]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#987A3F]"></div>
        </div>
      )
    }

    return <Component {...props} />
  }
}
