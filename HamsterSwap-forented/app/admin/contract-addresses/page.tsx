"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Clipboard, Check, ArrowLeft } from "lucide-react"
import { getNetworkAddresses } from "@/utils/contract-addresses"
import Navbar from "@/components/navbar"
import Link from "next/link"

export default function ContractAddressesPage() {
  const [addresses, setAddresses] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    const loadAddresses = async () => {
      try {
        setLoading(true)
        const networkAddresses = await getNetworkAddresses()
        setAddresses(networkAddresses)
      } catch (error) {
        console.error("Failed to load contract addresses:", error)
      } finally {
        setLoading(false)
      }
    }

    loadAddresses()
  }, [])

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F9F5EA] via-[#EACC91]/20 to-[#F9F5EA]">
        <Navbar />
        <div className="container mx-auto px-4 py-8 pt-32">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EACC91]"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F9F5EA] via-[#EACC91]/20 to-[#F9F5EA]">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-32">
        <div className="mb-6">
          <Button variant="outline" asChild className="mb-4 border-[#EACC91] text-[#523805] hover:bg-[#EACC91]/20">
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回管理面板
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-[#523805]">合约地址</h1>
          <p className="text-[#987A3F]">查看和复制当前网络的合约地址</p>
        </div>

        <Card className="border border-[#EACC91]">
          <CardHeader className="bg-gradient-to-r from-[#F9F5EA] to-transparent">
            <CardTitle className="text-[#523805]">合约地址</CardTitle>
            <CardDescription>当前网络的智能合约地址列表</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[#523805]">合约</TableHead>
                  <TableHead className="text-[#523805]">地址</TableHead>
                  <TableHead className="text-[#523805] w-24">复制</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(addresses).map(([key, address]) => (
                  <TableRow key={key}>
                    <TableCell className="font-medium text-[#523805]">{key}</TableCell>
                    <TableCell className="font-mono text-sm text-[#523805]/80">
                      {address.substring(0, 6)}...{address.substring(address.length - 4)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(address, key)}
                        className="h-8 w-8 p-0 hover:bg-[#EACC91]/20"
                      >
                        {copied === key ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Clipboard className="h-4 w-4 text-[#523805]/70" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
