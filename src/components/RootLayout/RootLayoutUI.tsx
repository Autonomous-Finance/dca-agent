"use client"

import { Container } from "@mui/material"
import CssBaseline from "@mui/material/CssBaseline"
import { Experimental_CssVarsProvider as CssVarsProvider } from "@mui/material/styles"

import { ArweaveProvider } from "@/app/ArweaveProvider"

import { theme } from "./theme"
import Header from "../Header"
import { AccountBalanceProvider } from "@/app/hooks/useAccountBalance"
import { CheckBotProvider } from "@/app/hooks/useCheckBot"

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
            <CheckBotProvider>
              <Container maxWidth="xl">{children}</Container>
            </CheckBotProvider>
          </AccountBalanceProvider>
        </ArweaveProvider>
      </CssVarsProvider>
    </>
  )
}
