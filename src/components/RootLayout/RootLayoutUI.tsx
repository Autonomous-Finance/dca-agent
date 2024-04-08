"use client"

import { Container } from "@mui/material"
import CssBaseline from "@mui/material/CssBaseline"
import { Experimental_CssVarsProvider as CssVarsProvider } from "@mui/material/styles"

import { ArweaveProvider } from "@/app/ArweaveProvider"

import { theme } from "./theme"
import Header from "../Header"
import { AccountBalanceProvider } from "@/app/hooks/useAccountBalance"
import { CheckAgentProvider } from "@/app/hooks/useCheckAgent"

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
            <CheckAgentProvider>
              <Container maxWidth="xl">{children}</Container>
            </CheckAgentProvider>
          </AccountBalanceProvider>
        </ArweaveProvider>
      </CssVarsProvider>
    </>
  )
}
