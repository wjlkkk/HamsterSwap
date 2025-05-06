"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ArrowDown, Info, Repeat, Settings, Clock, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { motion } from "framer-motion"
import TokenSelector from "@/components/token-selector"
import Navbar from "@/components/navbar"

// 模拟的代币数据
const tokens = [
  { symbol: "ETH", name: "Ethereum", balance: "1.56", price: 3500, logo: "/eth-logo.svg" },
  { symbol: "USDT", name: "Tether USD", balance: "2500.00", price: 1, logo: "/usdt-logo.svg" },
  { symbol: "USDC", name: "USD Coin", balance: "1200.50", price: 1, logo: "/usdc-logo.svg" },
  { symbol: "DAI", name: "Dai Stablecoin", balance: "430.75", price: 1, logo: "/dai-logo.svg" },
  { symbol: "CAKE", name: "PancakeSwap Token", balance: "150.25", price: 2.5, logo: "/cake-logo.svg" },
  { symbol: "WBTC", name: "Wrapped Bitcoin", balance: "0.015", price: 62000, logo: "/wbtc-logo.svg" },
  { symbol: "LTC", name: "Litecoin", balance: "12.45", price: 85, logo: "/ltc-logo.svg" },
  { symbol: "UNI", name: "Uniswap", balance: "32.45", price: 8, logo: "/uni-logo.svg" },
  { symbol: "AAVE", name: "Aave", balance: "5.75", price: 90, logo: "/aave-logo.svg" },
  { symbol: "COMP", name: "Compound", balance: "3.20", price: 45, logo: "/comp-logo.svg" },
]

export default function TradePage() {
  const [fromToken, setFromToken] = useState(tokens[0])
  const [toToken, setToToken] = useState(tokens[4]) // CAKE as default "to" token
  const [fromAmount, setFromAmount] = useState("1")
  const [toAmount, setToAmount] = useState("")
  const [slippage, setSlippage] = useState("0.5")
  const [recentTransactions, setRecentTransactions] = useState([
    { fromToken: "ETH", toToken: "CAKE", fromAmount: "0.5", toAmount: "875", time: "2 min ago" },
    { fromToken: "CAKE", toToken: "ETH", fromAmount: "10", toAmount: "0.007", time: "1 hour ago" },
  ])

  // 计算交换比率
  useEffect(() => {
    if (fromToken && toToken && fromAmount) {
      const fromValue = Number.parseFloat(fromAmount) * fromToken.price
      const toTokenAmount = fromValue / toToken.price
      setToAmount(toTokenAmount.toFixed(toToken.symbol === "ETH" || toToken.symbol === "WBTC" ? 6 : 2))
    }
  }, [fromToken, toToken, fromAmount])

  // 代币交换位置
  const handleSwapPositions = () => {
    const temp = fromToken
    setFromToken(toToken)
    setToToken(temp)
  }

  // 处理提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fromAmount || Number.parseFloat(fromAmount) <= 0) return

    // 模拟添加交易到历史记录
    const newTransaction = {
      fromToken: fromToken.symbol,
      toToken: toToken.symbol,
      fromAmount,
      toAmount,
      time: "Just now",
    }

    setRecentTransactions([newTransaction, ...recentTransactions])

    // 在实际应用中，这里会调用智能合约进行交换
    alert(`Swap ${fromAmount} ${fromToken.symbol} to ${toAmount} ${toToken.symbol} successful!`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F9F5EA] via-[#EACC91]/20 to-[#F9F5EA] font-sans pb-20">
      <Navbar />

      <main className="container mx-auto px-4 pt-32">
        <div className="max-w-lg mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {/* 交换卡片 */}
            <div className="bg-white rounded-3xl shadow-xl border border-[#EACC91] p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-[#523805]">Swap</h2>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg hover:bg-[#EACC91]/20 transition-colors">
                    <Clock className="h-5 w-5 text-[#523805]" />
                  </button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="p-2 rounded-lg hover:bg-[#EACC91]/20 transition-colors">
                        <Settings className="h-5 w-5 text-[#523805]" />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md rounded-2xl border border-[#EACC91]">
                      <DialogHeader>
                        <DialogTitle className="text-[#523805]">Transaction Settings</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="slippage" className="text-[#523805]">
                            Slippage Tolerance
                          </Label>
                          <div className="flex gap-2 items-center">
                            <Button
                              variant={slippage === "0.1" ? "default" : "outline"}
                              onClick={() => setSlippage("0.1")}
                              className={
                                slippage === "0.1"
                                  ? "bg-[#987A3F] hover:bg-[#523805] text-white"
                                  : "border-[#EACC91] text-[#523805]"
                              }
                            >
                              0.1%
                            </Button>
                            <Button
                              variant={slippage === "0.5" ? "default" : "outline"}
                              onClick={() => setSlippage("0.5")}
                              className={
                                slippage === "0.5"
                                  ? "bg-[#987A3F] hover:bg-[#523805] text-white"
                                  : "border-[#EACC91] text-[#523805]"
                              }
                            >
                              0.5%
                            </Button>
                            <Button
                              variant={slippage === "1.0" ? "default" : "outline"}
                              onClick={() => setSlippage("1.0")}
                              className={
                                slippage === "1.0"
                                  ? "bg-[#987A3F] hover:bg-[#523805] text-white"
                                  : "border-[#EACC91] text-[#523805]"
                              }
                            >
                              1.0%
                            </Button>
                            <div className="relative flex items-center">
                              <Input
                                id="slippage"
                                value={slippage}
                                onChange={(e) => setSlippage(e.target.value)}
                                className="pl-2 pr-8 w-24 border-[#EACC91] text-[#523805]"
                              />
                              <span className="absolute right-3 text-[#523805]/70">%</span>
                            </div>
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="deadline" className="text-[#523805]">
                            Transaction Deadline
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input id="deadline" defaultValue="30" className="w-24 border-[#EACC91] text-[#523805]" />
                            <span className="text-[#523805]/70">minutes</span>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                {/* From Token 输入 */}
                <div className="bg-[#F9F5EA] rounded-2xl p-4 mb-2">
                  <div className="flex justify-between mb-2">
                    <Label className="text-[#523805]/70">From</Label>
                    <span className="text-sm text-[#523805]/70">
                      Balance: {fromToken.balance} {fromToken.symbol}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={fromAmount}
                      onChange={(e) => setFromAmount(e.target.value)}
                      className="border-0 bg-transparent text-2xl font-medium focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-[#523805]"
                      placeholder="0.0"
                    />
                    <TokenSelector
                      selectedToken={fromToken}
                      onSelectToken={setFromToken}
                      tokens={tokens.filter((t) => t.symbol !== toToken.symbol)}
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-[#987A3F] hover:text-[#523805] hover:bg-[#EACC91]/30 px-2 py-1 h-auto"
                      onClick={() => setFromAmount(fromToken.balance)}
                    >
                      MAX
                    </Button>
                    <span className="text-sm text-[#523805]/70">
                      ~${(Number.parseFloat(fromAmount || "0") * fromToken.price).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* 交换按钮 */}
                <div className="flex justify-center -my-3 relative z-10">
                  <motion.button
                    type="button"
                    className="bg-white rounded-full p-2 border border-[#EACC91] shadow-md"
                    onClick={handleSwapPositions}
                    whileHover={{ rotate: 180 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ArrowDown className="h-5 w-5 text-[#523805]" />
                  </motion.button>
                </div>

                {/* To Token 输入 */}
                <div className="bg-[#F9F5EA] rounded-2xl p-4 mb-4">
                  <div className="flex justify-between mb-2">
                    <Label className="text-[#523805]/70">To</Label>
                    <span className="text-sm text-[#523805]/70">
                      Balance: {toToken.balance} {toToken.symbol}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={toAmount}
                      readOnly
                      className="border-0 bg-transparent text-2xl font-medium focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-[#523805]"
                      placeholder="0.0"
                    />
                    <TokenSelector
                      selectedToken={toToken}
                      onSelectToken={setToToken}
                      tokens={tokens.filter((t) => t.symbol !== fromToken.symbol)}
                    />
                  </div>
                  <div className="flex justify-end mt-2">
                    <span className="text-sm text-[#523805]/70">
                      ~${(Number.parseFloat(toAmount || "0") * toToken.price).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* 价格信息 */}
                <div className="bg-[#F9F5EA] rounded-xl p-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#523805]">Price</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-[#523805]">
                        1 {fromToken.symbol} ={" "}
                        {(fromToken.price / toToken.price).toFixed(
                          toToken.symbol === "ETH" || toToken.symbol === "WBTC" ? 6 : 2,
                        )}{" "}
                        {toToken.symbol}
                      </span>
                      <button type="button" className="text-[#523805]/70">
                        <Repeat className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 交易详情 */}
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1 text-[#523805]/70">
                      <span>Slippage Tolerance</span>
                      <Info className="h-3.5 w-3.5 text-[#523805]/50" />
                    </div>
                    <span className="font-medium text-[#523805]">{slippage}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1 text-[#523805]/70">
                      <span>Liquidity Provider Fee</span>
                      <Info className="h-3.5 w-3.5 text-[#523805]/50" />
                    </div>
                    <span className="font-medium text-[#523805]">0.25%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1 text-[#523805]/70">
                      <span>Route</span>
                      <Info className="h-3.5 w-3.5 text-[#523805]/50" />
                    </div>
                    <div className="flex items-center gap-1 text-[#523805]">
                      <span className="font-medium">{fromToken.symbol}</span>
                      <ArrowDown className="h-3.5 w-3.5" />
                      <span className="font-medium">{toToken.symbol}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1 text-[#523805]/70">
                      <span>Minimum received</span>
                      <Info className="h-3.5 w-3.5 text-[#523805]/50" />
                    </div>
                    <span className="font-medium text-[#523805]">
                      {(Number.parseFloat(toAmount || "0") * (1 - Number.parseFloat(slippage) / 100)).toFixed(
                        toToken.symbol === "ETH" || toToken.symbol === "WBTC" ? 6 : 2,
                      )}{" "}
                      {toToken.symbol}
                    </span>
                  </div>
                </div>

                {/* 交换按钮 */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#EACC91] to-[#987A3F] hover:from-[#987A3F] hover:to-[#523805] text-[#523805] hover:text-white font-medium py-6 rounded-xl shadow-md hover:shadow-lg transition-all"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span>🐹</span> Swap
                    </span>
                  </Button>
                </motion.div>
              </form>
            </div>

            {/* 最近交易 */}
            {recentTransactions.length > 0 && (
              <div className="bg-white rounded-3xl shadow-lg border border-[#EACC91] p-6">
                <h3 className="text-lg font-bold text-[#523805] mb-4">Recent Transactions</h3>
                <div className="space-y-4">
                  {recentTransactions.map((tx, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-[#F9F5EA] rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-[#EACC91]/50">
                          <Repeat className="h-4 w-4 text-[#523805]" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-[#523805]">
                            Swap {tx.fromAmount} {tx.fromToken} for {tx.toAmount} {tx.toToken}
                          </div>
                          <div className="text-xs text-[#523805]/70">{tx.time}</div>
                        </div>
                      </div>
                      <button className="text-[#987A3F] hover:text-[#523805]">
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  )
}
