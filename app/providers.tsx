"use client"

import type React from "react"

import { SessionProvider } from "next-auth/react"
import { ThirdwebProvider } from "@thirdweb-dev/react"
import { Polygon } from "@thirdweb-dev/chains"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <SessionProvider>
      <ThirdwebProvider activeChain={Polygon} clientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ThirdwebProvider>
    </SessionProvider>
  )
}
