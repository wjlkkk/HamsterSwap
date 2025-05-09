"use client"

import { useState, useEffect } from "react"
import { ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import TokenSelector from "@/components/token-selector"
import { getDeployedTokens } from "@/contracts/token-contract"
import { useWallet } from "@/contexts/wallet-context"

interface Token {
  symbol: string
  name: string
  balance: string
  price: number
  logo: string
  address: string
}

export default function SwapPage() {
  const { isConnected, provider, address } = useWallet()
  const [tokens, setTokens] = useState<Token[]>([])
  const [fromToken, setFromToken] = useState<Token | null>(null)
  const [toToken, setToToken] = useState<Token | null>(null)
  const [fromAmount, setFromAmount] = useState<string>("")
  const [toAmount, setToAmount] = useState<string>("")
  const [loading, setLoading] = useState(true)

  // Load tokens from contract
  useEffect(() => {
    const loadTokens = async () => {
      try {
        setLoading(true)
        const deployedTokens = await getDeployedTokens()

        // Add mock prices and balances for demo
        const tokensWithPrices = deployedTokens.map((token) => ({
          ...token,
          price: token.symbol === "CAKE" ? 2.5 : 1.8,
          balance: token.symbol === "CAKE" ? "1000" : "500",
        }))

        setTokens(tokensWithPrices)
        setFromToken(tokensWithPrices[0])
        setToToken(tokensWithPrices[1])
      } catch (error) {
        console.error("Failed to load tokens:", error)
      } finally {
        setLoading(false)
      }
    }

    loadTokens()
  }, [])

  // Update to amount when from amount changes
  useEffect(() => {
    if (fromToken && toToken && fromAmount) {
      const convertedAmount = (Number.parseFloat(fromAmount) * fromToken.price) / toToken.price
      setToAmount(isNaN(convertedAmount) ? "" : convertedAmount.toFixed(6))
    } else {
      setToAmount("")
    }
  }, [fromAmount, fromToken, toToken])

  // Swap tokens
  const handleSwap = () => {
    if (!fromToken || !toToken || !fromAmount || !isConnected) return

    // Here you would implement the actual swap logic
    alert(`Swapping ${fromAmount} ${fromToken.symbol} for ${toAmount} ${toToken.symbol}`)
  }

  // Swap token positions
  const handleSwitchTokens = () => {
    if (!fromToken || !toToken) return

    const temp = fromToken
    setFromToken(toToken)
    setToToken(temp)

    // Reset amounts
    setFromAmount("")
    setToAmount("")
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EACC91] mx-auto"></div>
          <p className="mt-4 text-[#523805]">Loading tokens...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-md">
      <Card className="border border-[#EACC91] bg-white rounded-2xl shadow-md">
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold mb-6 text-[#523805]">Swap</h1>

          {/* From Token */}
          <div className="mb-4 bg-[#FFF9E9] p-4 rounded-xl border border-[#EACC91]">
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-[#523805]/70">From</label>
              {isConnected && fromToken && (
                <span className="text-sm text-[#523805]/70">
                  Balance: {fromToken.balance} {fromToken.symbol}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="0.0"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="w-full bg-transparent text-xl font-medium text-[#523805] outline-none"
              />
              {fromToken && (
                <TokenSelector
                  selectedToken={fromToken}
                  onSelectToken={setFromToken}
                  tokens={tokens.filter((t) => t.address !== toToken?.address)}
                />
              )}
            </div>
          </div>

          {/* Switch Button */}
          <div className="flex justify-center -my-2 relative z-10">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-10 w-10 bg-white border border-[#EACC91] hover:bg-[#EACC91]/20"
              onClick={handleSwitchTokens}
            >
              <ArrowDown className="h-5 w-5 text-[#523805]" />
            </Button>
          </div>

          {/* To Token */}
          <div className="mb-6 bg-[#FFF9E9] p-4 rounded-xl border border-[#EACC91]">
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-[#523805]/70">To</label>
              {isConnected && toToken && (
                <span className="text-sm text-[#523805]/70">
                  Balance: {toToken.balance} {toToken.symbol}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="0.0"
                value={toAmount}
                readOnly
                className="w-full bg-transparent text-xl font-medium text-[#523805] outline-none"
              />
              {toToken && (
                <TokenSelector
                  selectedToken={toToken}
                  onSelectToken={setToToken}
                  tokens={tokens.filter((t) => t.address !== fromToken?.address)}
                />
              )}
            </div>
          </div>

          {/* Swap Button */}
          <Button
            className="w-full bg-[#EACC91] hover:bg-[#D4B67C] text-[#523805] font-semibold py-6 rounded-xl"
            disabled={!isConnected || !fromAmount || !toAmount || !fromToken || !toToken}
            onClick={handleSwap}
          >
            {!isConnected ? "Connect Wallet" : !fromAmount || !toAmount ? "Enter an amount" : "Swap"}
          </Button>

          {/* Swap Rate */}
          {fromToken && toToken && fromAmount && toAmount && (
            <div className="mt-4 text-sm text-[#523805]/70 text-center">
              1 {fromToken.symbol} = {(fromToken.price / toToken.price).toFixed(6)} {toToken.symbol}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
