import type React from "react"
import "@/app/globals.css"
import { Outfit } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { WalletProvider } from "@/contexts/wallet-context"
import { AdminProvider } from "@/contexts/admin-context"
import { Toaster } from "@/components/ui/toaster"
import { ClientWrappers } from "@/components/client-wrappers"

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
})

export const metadata = {
  title: "HamsterSwap",
  description: "The cutest swap in the galaxy",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <WalletProvider>
            <AdminProvider>
              <ClientWrappers>
                {children}
                <Toaster />
              </ClientWrappers>
            </AdminProvider>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
