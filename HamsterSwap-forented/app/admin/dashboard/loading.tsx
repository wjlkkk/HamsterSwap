import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import Navbar from "@/components/navbar"

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F9F5EA] via-[#EACC91]/20 to-[#F9F5EA]">
      <Navbar />
      <div className="container mx-auto px-4 pt-32">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <Skeleton className="h-10 w-64 bg-[#EACC91]/40" />
              <Skeleton className="h-5 w-48 mt-2 bg-[#EACC91]/40" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24 bg-[#EACC91]/40" />
              <Skeleton className="h-10 w-32 bg-[#EACC91]/40" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-[#EACC91]">
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-32 bg-[#EACC91]/40" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-24 bg-[#EACC91]/40" />
                  <Skeleton className="h-4 w-32 mt-2 bg-[#EACC91]/40" />
                  <Skeleton className="h-2 w-full mt-3 bg-[#EACC91]/40" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-2">
              <Card className="border-[#EACC91]">
                <CardHeader>
                  <Skeleton className="h-6 w-40 bg-[#EACC91]/40" />
                  <Skeleton className="h-4 w-64 mt-1 bg-[#EACC91]/40" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full bg-[#EACC91]/40" />
                            <div>
                              <Skeleton className="h-5 w-32 bg-[#EACC91]/40" />
                              <Skeleton className="h-4 w-24 mt-1 bg-[#EACC91]/40" />
                            </div>
                          </div>
                          <Skeleton className="h-5 w-16 bg-[#EACC91]/40" />
                        </div>
                        <Skeleton className="h-2 w-full bg-[#EACC91]/40" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-[#EACC91]">
              <CardHeader>
                <Skeleton className="h-6 w-32 bg-[#EACC91]/40" />
                <Skeleton className="h-4 w-48 mt-1 bg-[#EACC91]/40" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full bg-[#EACC91]/40" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
