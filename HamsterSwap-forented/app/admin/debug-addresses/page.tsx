"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Navbar from "@/components/navbar"
import DebugContractAddresses from "@/components/debug-contract-addresses"
import { getContractAddress } from "@/utils/contract-addresses"

export default function DebugAddressesPage() {
  const [contractAddresses, setContractAddresses] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAddresses() {
      setLoading(true)
      try {
        const contracts = ["Cake", "Take", "Farm", "Airdrop", "IDO"]
        const addresses: Record<string, string> = {}

        for (const contract of contracts) {
          addresses[contract] = await getContractAddress(contract)
        }

        setContractAddresses(addresses)
      } catch (error) {
        console.error("Error loading addresses:", error)
      } finally {
        setLoading(false)
      }
    }

    loadAddresses()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F9F5EA] via-[#EACC91]/20 to-[#F9F5EA]">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-32">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#523805]">合约地址调试</h1>
          <p className="text-[#987A3F]">检查合约地址加载情况</p>
        </div>

        <DebugContractAddresses />

        <Card className="border border-[#EACC91] mb-6">
          <CardHeader className="bg-gradient-to-r from-[#F9F5EA] to-transparent">
            <CardTitle className="text-[#523805]">通过 getContractAddress 获取的地址</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse">加载中...</div>
            ) : (
              <pre className="bg-[#F9F5EA] p-4 rounded-md overflow-auto">
                {JSON.stringify(contractAddresses, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        <Card className="border border-[#EACC91]">
          <CardHeader className="bg-gradient-to-r from-[#F9F5EA] to-transparent">
            <CardTitle className="text-[#523805]">解决方案</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium text-[#523805] mb-2">1. 检查文件路径</h3>
              <p>确保 contract-address.json 文件位于正确的位置：</p>
              <pre className="bg-[#F9F5EA] p-2 rounded text-sm mt-2">
                public/HamsterSwap-contracts/contract-address.json
              </pre>
            </div>

            <div>
              <h3 className="font-medium text-[#523805] mb-2">2. 检查文件内容</h3>
              <p>确保 JSON 文件格式正确，例如：</p>
              <pre className="bg-[#F9F5EA] p-2 rounded text-sm mt-2">
                {`{
  "31337": {
    "Cake": "0x5fbdb2315678afecb367f032d93f642f64180aa3",
    "Take": "0x8a791620dd6260079bf849dc5567adc3f2fdc318",
    "Farm": "0x7bc06c482DEAd17c0e297aFbC32f6e63d3846650",
    "Airdrop": "0x99bbA657f2BbC93c02D617f8bA121cB8Fc104Acf",
    "IDO": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
  }
}`}
              </pre>
            </div>

            <div>
              <h3 className="font-medium text-[#523805] mb-2">3. 手动创建文件</h3>
              <p>如果自动加载失败，可以手动创建文件：</p>
              <Button
                className="mt-2 bg-[#987A3F] hover:bg-[#523805] text-white"
                onClick={() => {
                  const jsonContent = JSON.stringify(
                    {
                      "31337": {
                        Cake: "0x5fbdb2315678afecb367f032d93f642f64180aa3",
                        Take: "0x8a791620dd6260079bf849dc5567adc3f2fdc318",
                        Farm: "0x7bc06c482DEAd17c0e297aFbC32f6e63d3846650",
                        Airdrop: "0x99bbA657f2BbC93c02D617f8bA121cB8Fc104Acf",
                        IDO: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
                      },
                    },
                    null,
                    2,
                  )

                  const blob = new Blob([jsonContent], { type: "application/json" })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement("a")
                  a.href = url
                  a.download = "contract-address.json"
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                  URL.revokeObjectURL(url)
                }}
              >
                下载默认配置文件
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
