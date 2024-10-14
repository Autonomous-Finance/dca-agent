import { useColorScheme } from "@mui/material"
import { ArweaveWalletKit } from "arweave-wallet-kit"
import React from "react"

export function ArweaveProvider({ children }: { children: React.ReactNode }) {
  const { mode = "dark" } = useColorScheme()

  return (
    <ArweaveWalletKit
      theme={{
        displayTheme: mode === "dark" ? "dark" : "light",
        radius: "none",
        accent:
          mode === "dark"
            ? {
                r: 60,
                g: 60,
                b: 60,
              }
            : {
                r: 40,
                g: 40,
                b: 40,
              },
      }}
      config={{
        appInfo: {
          name: "AF DCA Agent",
        },
        permissions: ["ACCESS_ADDRESS", "SIGN_TRANSACTION"],
        ensurePermissions: true,
      }}
    >
      {children}
    </ArweaveWalletKit>
  )
}
