"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronDown, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface Token {
  symbol: string
  name: string
  balance: string
  price: number
  logo: string
}

interface TokenSelectorProps {
  selectedToken: Token
  onSelectToken: (token: Token) => void
  tokens: Token[]
}

export default function TokenSelector({ selectedToken, onSelectToken, tokens }: TokenSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredTokens = tokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 rounded-full border-[#EACC91] hover:bg-[#EACC91]/20 h-10"
        >
          <Image
            src={selectedToken.logo || "/placeholder.svg"}
            alt={selectedToken.symbol}
            width={24}
            height={24}
            className="rounded-full"
          />
          <span className="font-medium text-[#523805]">{selectedToken.symbol}</span>
          <ChevronDown className="h-4 w-4 text-[#523805]/70" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl border border-[#EACC91]">
        <DialogHeader>
          <DialogTitle className="text-[#523805]">Select a token</DialogTitle>
        </DialogHeader>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#523805]/50" />
          <Input
            placeholder="Search name or paste address"
            className="pl-10 border-[#EACC91] text-[#523805]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <h4 className="font-medium text-sm text-[#523805]/70 mb-2">Common tokens</h4>
          <div className="flex flex-wrap gap-2">
            {["ETH", "USDT", "USDC", "DAI", "CAKE"].map((symbol) => {
              const token = tokens.find((t) => t.symbol === symbol)
              if (!token) return null
              return (
                <Button
                  key={symbol}
                  variant="outline"
                  className="rounded-full flex items-center gap-1 border-[#EACC91] hover:bg-[#EACC91]/20 text-[#523805]"
                  onClick={() => {
                    onSelectToken(token)
                    setSearchQuery("")
                  }}
                >
                  <Image
                    src={token.logo || "/placeholder.svg"}
                    alt={token.symbol}
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                  <span>{token.symbol}</span>
                </Button>
              )
            })}
          </div>
        </div>

        <div className="max-h-60 overflow-y-auto">
          {filteredTokens.map((token) => (
            <button
              key={token.symbol}
              className="flex items-center justify-between w-full px-4 py-3 hover:bg-[#EACC91]/20 rounded-lg transition-colors"
              onClick={() => {
                onSelectToken(token)
                setSearchQuery("")
              }}
            >
              <div className="flex items-center gap-3">
                <Image
                  src={token.logo || "/placeholder.svg"}
                  alt={token.symbol}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <div className="text-left">
                  <div className="font-medium text-[#523805]">{token.symbol}</div>
                  <div className="text-sm text-[#523805]/70">{token.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-[#523805]">{token.balance}</div>
                <div className="text-sm text-[#523805]/70">
                  ~${(Number.parseFloat(token.balance) * token.price).toFixed(2)}
                </div>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
