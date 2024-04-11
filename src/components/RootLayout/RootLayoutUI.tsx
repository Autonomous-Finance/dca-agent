"use client"

import { Container } from "@mui/material"
import CssBaseline from "@mui/material/CssBaseline"
import { Experimental_CssVarsProvider as CssVarsProvider } from "@mui/material/styles"

import { ArweaveProvider } from "@/app/ArweaveProvider"

import { theme } from "./theme"
import Header from "../Header"
import { AccountBalanceProvider } from "@/hooks/useAccountBalance"
import { LatestAgentProvider } from "@/hooks/useLatestRegisteredAgent"

export default function RootLayoutUI({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <CssVarsProvider theme={theme} defaultMode="light">
        <CssBaseline />
        <ArweaveProvider>
          <AccountBalanceProvider>
            <Header />
            <LatestAgentProvider>
              <Container maxWidth="xl">{children}</Container>
            </LatestAgentProvider>
          </AccountBalanceProvider>
        </ArweaveProvider>
      </CssVarsProvider>
    </>
  )
}
