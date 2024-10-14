'use client'

export const dynamic = "force-dynamic"

import { BotegaLogo } from "@/components/BotegaLogo"
import { Box, Button, Link, List, ListItem, ListItemText, Paper, Stack, Typography } from "@mui/material"
import Image from "next/image"

import React from "react"
export default function Home() {
  return (
    <>
      <Box margin={'4rem auto 0'}>
        
        <Stack gap={4} marginTop={'7rem'} mx={'auto'} maxWidth={'37.5rem'} height={'25rem'} justifyContent={'center'} alignItems={'flex-start'}>

            <Typography variant="body1" style={{fontSize: '1.5rem', fontWeight: '400'}}>
                The DCA Agent App has migrated to 
                <Box sx={{display: 'inline-flex', marginLeft: '0.75rem'}}>
                  <Link href="https://botega.arweave.net"
                    sx={
                      [
                        (theme) => ({margin: 'auto', transform: 'translateY(5.5px)', borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'white' : 'black'}`, transition: 'all 0.2s ease-in-out'}),
                        {'&:hover' : { borderBottom: '1px solid #0EBD2B' } }
                      ]
                    }>
                      <BotegaLogo />
                  </Link>
                </Box>
            </Typography>

          <Typography variant="body1" style={{marginTop: '2rem', fontSize: '1.25rem'}}>
            For more information, check out our related resources
          </Typography>

          <List style={{padding: '0'}}>
            <ListItem style={{padding: '0'}}>
              <ListItemText
                primary={
                  <Typography variant="body1" fontSize={'1.25rem'}>
                    📝 <Link target="_blank" href="https://www.autonomous.finance/research/dca-agent">Research Article</Link>
                  </Typography>
                }
                secondary={
                  <Typography fontSize={'1rem'}>
                    The Autonomous Finance research article on DCA Agents
                  </Typography>
                }
              />
            </ListItem>

            <ListItem style={{padding: '0', marginTop: '2rem'}}>
              <ListItemText
                  primary={
                    <Typography variant="body1" fontSize={'1.25rem'}>
                      <span style={{color: 'gray'}}>&lt;/&gt;</span> <Link target="_blank" href="https://github.com/Autonomous-Finance/dca-agent">DCA Agent repository</Link>
                    </Typography>
                  }
                  secondary={
                    <Typography fontSize={'1rem'}>
                      The repository on the Autonomous Finance Github
                    </Typography>
                  }
                />
            </ListItem>
          </List>
              
        </Stack>
      </Box>
    </>
  )
}
