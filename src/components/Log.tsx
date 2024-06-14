import { shortenId } from '@/utils/ao-utils'
import { Box, Link, Stack, Typography, useTheme } from '@mui/material'
import React from 'react'
import LinkIcon from '@mui/icons-material/Link';

export type LogEntry = ( 
  {text: string, hasLink: true, linkId: string, isMessage: boolean} | 
  {text: string, hasLink: false} 
) & {isError?: boolean}

function Log(props: {log: LogEntry[]}) {
  const theme = useTheme();
  const mode = theme.palette.mode;

  const { log } = props
  const baseLink = (entry: LogEntry) => entry.hasLink && `https://www.ao.link/#/${entry.isMessage ? 'message' : 'entity'}`;
  const hasError = (entry: LogEntry) => entry.isError;

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
                {!entry.hasLink && (
                  <Typography key={entry.text+Math.random()} variant="body1" fontFamily={'Courier New'}
                    color={hasError(entry) ? 'error.main' : 'text.primary'}
                    sx={{overflowWrap: 'anywhere'}}>
                    &gt; {entry.text}
                  </Typography>
                )}
                {entry.hasLink && (
                  <Typography variant="body1" fontFamily={'Courier New'}
                    key={entry.text+Math.random()}
                    sx={{overflowWrap: 'anywhere'}}
                    color={hasError(entry) ? 'error.main' : 'text.primary'}
                    >
                    &gt; {entry.text}:{" "}
                    <Link href={`${baseLink(entry)}/${entry.linkId}`} target="_blank"
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