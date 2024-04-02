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

const Header = () => {
  const { mode = "dark", setMode } = useColorScheme()

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
                {/* <Logo color="var(--mui-palette-text-primary)" /> */}
                <Typography variant="h6" fontFamily={MonoFontFF}>
                  AF DCA Bot
                </Typography>
              </Stack>
            </Button>
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
