import React, { useState } from 'react'
import { Box, Button, Link, Modal, Snackbar, Stack, TextField, Typography } from '@mui/material'
import CodeIcon from '@mui/icons-material/Code';
import GitHubIcon from '@mui/icons-material/GitHub';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { AGENT_SOURCE } from '@/lua/agent-source';

function AgentCodeModalButton() {
  const [open, setOpen] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(AGENT_SOURCE);
    setSnackOpen(true);
  }

  const style = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 672,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
  };

  return (
    <>
      <Button
          sx={{ height: 40, width: '100%', whiteSpace: 'nowrap'}}
          variant="outlined"
          color="info"
          endIcon={<CodeIcon/>}
          onClick={handleOpen}
        >
          Inspect Source
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Stack sx={style} gap={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
            <Typography id="modal-modal-title" variant="h5" component="h2">
              DCA Agent Source Code
            </Typography>
            <Stack direction={'row'} gap={0.5} alignItems={'center'} mb={1}
              sx={[
                (theme) => ({cursor: 'pointer', 
                  color: theme.palette.info.main, 
                  transition: 'all 0.3s ease-in-out'
                }),
                (theme) => ({
                  '&:hover': {
                    color: theme.palette.info.dark,
                  },
                })
              ]}>
              <Typography variant="body2">
                Copy
              </Typography>
              <ContentCopyIcon fontSize="small"
                onClick={handleCopy}
              />
            </Stack>
          </Stack>
          <TextField
            sx={{ width: 600 }}
            rows={24}
            multiline
            variant="outlined"
            value={AGENT_SOURCE}
            disabled
          />
          <Typography fontSize="large" 
            sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}
          >
              <GitHubIcon fontSize='medium'/>
              <Link href="https://github.com/Autonomous-Finance">
                Blueprint on Github
              </Link>
          </Typography>
          <Snackbar
            open={snackOpen}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            sx={(theme) => ({
              border: `1px solid ${theme.palette.info.main}`, 
            })}
            onClose={() => setSnackOpen(false)}
            autoHideDuration={2000}
            message="Copied to clipboard"
          />
        </Stack>
      </Modal>
    </>
  )
}

export default AgentCodeModalButton