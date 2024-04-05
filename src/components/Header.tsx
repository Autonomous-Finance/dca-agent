"use client"

import {
  AppBar,
  Container,
  IconButton,
  Stack,
  Button,
  Toolbar,
  useColorScheme,
  Typography,
} from "@mui/material"
import { Moon, Sun } from "@phosphor-icons/react"
import { ConnectButton } from "arweave-wallet-kit"
import Link from "next/link"

import { AccBalance } from "./AccBalance"
import { MonoFontFF } from "./RootLayout/fonts"
import { Logo } from "./Logo"
import React, { useEffect } from "react"
import { usePathname } from "next/navigation"

const Header = () => {
  const { mode = "dark", setMode } = useColorScheme()

  const pathname = usePathname();

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "background.default",
        border: 0,
        padding: 2,
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Stack
            direction="row"
            gap={2}
            justifyContent="space-between"
            alignItems="center"
            sx={{ width: "100%" }}
          >
            <Button
              component={Link}
              href="/"
              size="large"
              sx={{ marginLeft: -1 }}
            >
              <Stack direction="row" gap={2} alignItems="center">
                <Logo color="var(--mui-palette-text-primary)" mode={mode}/>
                <Typography variant="h6" color="var(--mui-palette-text-primary)" fontFamily={MonoFontFF}>
                  DCA Bot
                </Typography>
              </Stack>
            </Button>
            <Stack direction="row" gap={2} alignItems="center">
              {/* TODO highlight underline for active link */}

              <Button component={Link} href="/" size="large"
                sx={theme => ({
                  fontSize: '1.25rem', 
                  color: pathname === '/' ? '#030303': theme.palette.primary.main,
                  textTransform: pathname === '/' ? 'underline uppercase' : 'uppercase'
                })}>
                Dashboard
              </Button>
              <Button component={Link} href="/history" size="large"
                sx={theme => ({
                  fontSize: '1.25rem', 
                  color: pathname === '/history' ? '#030303': theme.palette.primary.main,
                  textTransform: pathname === '/history' ? 'underline uppercase' : 'uppercase'
                })}>
                History
              </Button>
            </Stack>
            <Stack direction="row" gap={2} alignItems="center">
              <IconButton
                size="medium"
                onClick={() => {
                  const nextMode = mode === "dark" ? "light" : "dark"
                  setMode(nextMode)
                }}
              >
                {mode === "dark" ? (
                  <Moon weight="bold" />
                ) : (
                  <Sun weight="bold" />
                )}
              </IconButton>
              <AccBalance />
              <ConnectButton />
            </Stack>
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  )
}

export default Header
