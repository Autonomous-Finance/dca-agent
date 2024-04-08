import { shortenId } from '@/utils/ao-utils'
import { Box, Link, Stack, Typography, useTheme } from '@mui/material'
import React from 'react'
import LinkIcon from '@mui/icons-material/Link';

export type LogEntry = string | {text: string, linkId: string}

function Log(props: {log: LogEntry[]}) {
  const theme = useTheme();
  const mode = theme.palette.mode;

  const { log } = props
  return (
    <>
      {log.length > 0 && (
        <Box p={2} height={'100%'} overflow={'auto'}
          border={`1px solid var(--mui-customColors-layout-softborder-${mode})`}
          sx={{backgroundColor: `var(--mui-customColors-log-background-${mode})`}}
          >
          <Stack gap={0.5} width={'100%'}>
            {log.map((entry: LogEntry) => (
              <>
                {typeof entry === 'string' && (
                  <Typography key={entry+Math.random()} variant="body1" fontFamily={'Courier New'}
                    sx={{overflowWrap: 'anywhere'}}>
                    &gt; {entry}
                  </Typography>
                )}
                {typeof entry === 'object' && (
                  <Typography variant="body1" fontFamily={'Courier New'}
                    sx={{overflowWrap: 'anywhere'}}>
                    &gt; {entry.text}:{" "}
                    <Link href={`https://www.ao.link/entity/${entry.linkId}`} target="_blank"
                      sx={(theme) => ({display: 'inline-flex', alignItems: 'center', gap: 1, color: theme.palette.info.main})}>
                      {shortenId(entry.linkId)}
                      <LinkIcon/>
                    </Link>
                  </Typography>
                )}
              </>
            ))}
          </Stack>
        </Box>
      )}
    </>
  )
}

export default Log