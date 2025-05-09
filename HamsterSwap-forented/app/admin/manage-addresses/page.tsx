"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getNetworkAddresses } from "@/utils/contract-addresses"
import { useToast } from "@/hooks/use-toast"
import { Clipboard, Check, Download, RefreshCw } from "lucide-react"
import Navbar from "@/components/navbar"

export default function ManageAddressesPage() {
  const { toast } = useToast()
  const [addresses, setAddresses] = useState<Record<string, Record<string, string>>>({})
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const [activeNetwork, setActiveNetwork] = useState("31337")
  const [editedAddresses, setEditedAddresses] = useState<Record<string, string>>({})
  const [jsonOutput, setJsonOutput] = useState("")

  // 网络名称映射
  const networkNames: Record<string, string> = {
    "31337": "Hardhat Local",
    "1": "Ethereum Mainnet",
    "11155111": "Sepolia Testnet",
    "5": "Goerli Testnet",
    "137": "Polygon Mainnet",
    "80001": "Mumbai Testnet",
    "56": "BSC Mainnet",
    "97": "BSC Testnet",
  }

  // 合约名称列表
  const contractNames = ["Cake", "Take", "Farm", "Airdrop", "IDO"]

  useEffect(() => {
    loadAddresses()
  }, [])

  const loadAddresses = async () => {
    try {
      setLoading(true)
      // 获取当前网络的地址
      const networkAddresses = await getNetworkAddresses()

      // 创建一个包含所有网络的对象
      const allAddresses: Record<string, Record<string, string>> = {
        "31337": networkAddresses,
      }

      setAddresses(allAddresses)
      setEditedAddresses({ ...networkAddresses })

      // 生成JSON输出
      updateJsonOutput(allAddresses)
    } catch (error) {
      console.error("Failed to load contract addresses:", error)
      toast({
        title: "加载失败",
        description: "无法加载合约地址，请检查网络连接",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateJsonOutput = (addressData: Record<string, Record<string, string>>) => {
    setJsonOutput(JSON.stringify(addressData, null, 2))
  }

  const handleAddressChange = (contract: string, value: string) => {
    const updated = { ...editedAddresses, [contract]: value }
    setEditedAddresses(updated)

    // 更新JSON输出
    const updatedAddresses = { ...addresses, [activeNetwork]: updated }
    updateJsonOutput(updatedAddresses)
  }

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const copyJsonToClipboard = () => {
    navigator.clipboard.writeText(jsonOutput)
    toast({
      title: "已复制",
      description: "JSON 数据已复制到剪贴板",
    })
  }

  const downloadJson = () => {
    const blob = new Blob([jsonOutput], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "contract-address.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const addNetwork = () => {
    // 创建一个新网络ID的输入对话框
    const networkId = prompt("请输入网络ID (例如: 11155111 表示 Sepolia 测试网)")
    if (!networkId) return

    // 检查是否已存在
    if (addresses[networkId]) {
      toast({
        title: "网络已存在",
        description: `ID 为 ${networkId} 的网络配置已存在`,
        variant: "destructive",
      })
      return
    }

    // 创建新网络的空地址对象
    const newNetworkAddresses: Record<string, string> = {}
    contractNames.forEach((name) => {
      newNetworkAddresses[name] = ""
    })

    // 更新状态
    const updatedAddresses = { ...addresses, [networkId]: newNetworkAddresses }
    setAddresses(updatedAddresses)
    setActiveNetwork(networkId)
    setEditedAddresses(newNetworkAddresses)
    updateJsonOutput(updatedAddresses)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F9F5EA] via-[#EACC91]/20 to-[#F9F5EA]">
        <Navbar />
        <div className="container mx-auto px-4 py-8 pt-32">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#987A3F]"></div>
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
          <h1 className="text-3xl font-bold text-[#523805]">合约地址管理</h1>
          <p className="text-[#987A3F]">管理不同网络的合约地址，生成配置文件</p>
        </div>

        <Card className="border border-[#EACC91] mb-6">
          <CardHeader className="bg-gradient-to-r from-[#F9F5EA] to-transparent">
            <CardTitle className="text-[#523805] flex justify-between items-center">
              <span>合约地址配置</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={loadAddresses} className="border-[#EACC91] text-[#523805]">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  刷新
                </Button>
                <Button variant="outline" size="sm" onClick={addNetwork} className="border-[#EACC91] text-[#523805]">
                  添加网络
                </Button>
              </div>
            </CardTitle>
            <CardDescription>管理不同网络的合约地址，生成 contract-address.json 文件</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={activeNetwork} onValueChange={setActiveNetwork}>
              <TabsList className="mb-4 bg-[#F9F5EA]">
                {Object.keys(addresses).map((networkId) => (
                  <TabsTrigger
                    key={networkId}
                    value={networkId}
                    className="data-[state=active]:bg-white data-[state=active]:text-[#523805]"
                  >
                    {networkNames[networkId] || `网络 ${networkId}`}
                  </TabsTrigger>
                ))}
              </TabsList>

              {Object.keys(addresses).map((networkId) => (
                <TabsContent key={networkId} value={networkId}>
                  <div className="grid gap-4">
                    {contractNames.map((contract) => (
                      <div key={contract} className="flex items-center gap-4">
                        <Label className="w-24 text-[#523805]">{contract}</Label>
                        <Input
                          value={editedAddresses[contract] || ""}
                          onChange={(e) => handleAddressChange(contract, e.target.value)}
                          className="font-mono text-sm flex-1 border-[#EACC91] focus-visible:ring-[#987A3F]"
                          placeholder={`输入 ${contract} 合约地址...`}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(editedAddresses[contract] || "", `${networkId}-${contract}`)}
                          className="h-8 w-8 p-0 hover:bg-[#EACC91]/20"
                          disabled={!editedAddresses[contract]}
                        >
                          {copied === `${networkId}-${contract}` ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Clipboard className="h-4 w-4 text-[#523805]/70" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        <Card className="border border-[#EACC91]">
          <CardHeader className="bg-gradient-to-r from-[#F9F5EA] to-transparent">
            <CardTitle className="text-[#523805]">JSON 输出</CardTitle>
            <CardDescription>将此 JSON 保存为 public/HamsterSwap-contracts/contract-address.json 文件</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-[#F9F5EA] p-4 rounded-md mb-4 overflow-auto max-h-80">
              <pre className="text-sm font-mono text-[#523805]/80 whitespace-pre-wrap">{jsonOutput}</pre>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={copyJsonToClipboard}
                className="border-[#EACC91] text-[#523805] hover:bg-[#EACC91]/20"
              >
                <Clipboard className="h-4 w-4 mr-2" />
                复制 JSON
              </Button>
              <Button
                variant="outline"
                onClick={downloadJson}
                className="border-[#EACC91] text-[#523805] hover:bg-[#EACC91]/20"
              >
                <Download className="h-4 w-4 mr-2" />
                下载 JSON 文件
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
