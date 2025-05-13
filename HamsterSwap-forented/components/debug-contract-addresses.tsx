"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getNetworkAddresses, getHardcodedAddresses } from "@/utils/contract-addresses"

export default function DebugContractAddresses() {
  const [addresses, setAddresses] = useState<Record<string, string>>({})
  const [hardcodedAddresses, setHardcodedAddresses] = useState<Record<string, Record<string, string>>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fetchResponse, setFetchResponse] = useState<any>(null)

  useEffect(() => {
    async function fetchAddresses() {
      try {
        setLoading(true)
        setError(null)

        // Try to fetch the contract-address.json file directly
        try {
          const response = await fetch("/HamsterSwap-contracts/contract-address.json")
          const responseData = {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
          }

          setFetchResponse(responseData)

          if (response.ok) {
            try {
              const jsonData = await response.json()
              console.log("Direct fetch JSON data:", jsonData)
            } catch (jsonError) {
              console.error("Error parsing JSON:", jsonError)
            }
          }
        } catch (fetchError) {
          console.error("Direct fetch error:", fetchError)
          setFetchResponse({ error: fetchError.message })
        }

        // Get addresses using our utility function
        const networkAddresses = await getNetworkAddresses()
        setAddresses(networkAddresses)

        // Get hardcoded addresses
        const hardcoded = getHardcodedAddresses()
        setHardcodedAddresses(hardcoded)
      } catch (err) {
        console.error("Error in debug component:", err)
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setLoading(false)
      }
    }

    fetchAddresses()
  }, [])

  if (loading) {
    return <div className="p-4">Loading contract addresses...</div>
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>
  }

  return (
    <Card className="border border-[#EACC91] mb-6">
      <CardHeader className="bg-gradient-to-r from-[#F9F5EA] to-transparent">
        <CardTitle className="text-[#523805]">合约地址调试信息</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-[#523805] mb-2">Fetch Response:</h3>
            <pre className="bg-[#F9F5EA] p-2 rounded text-sm overflow-auto">
              {JSON.stringify(fetchResponse, null, 2)}
            </pre>
          </div>

          <div>
            <h3 className="font-medium text-[#523805] mb-2">Loaded Addresses:</h3>
            <pre className="bg-[#F9F5EA] p-2 rounded text-sm overflow-auto">{JSON.stringify(addresses, null, 2)}</pre>
          </div>

          <div>
            <h3 className="font-medium text-[#523805] mb-2">Hardcoded Addresses:</h3>
            <pre className="bg-[#F9F5EA] p-2 rounded text-sm overflow-auto">
              {JSON.stringify(hardcodedAddresses, null, 2)}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
