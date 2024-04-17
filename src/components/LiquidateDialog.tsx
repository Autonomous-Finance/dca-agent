import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Stack, Typography } from '@mui/material'
import React from 'react'
import { usePolledAgentStatusContext } from './PolledAgentStatusProvider';
import { WaterDrop } from '@mui/icons-material';

function LiquidateDialog({loading, disabled, width, liquidate}: {loading: boolean, disabled?: boolean, width: number, liquidate: () => {}}) {
  const [open, setOpen] = React.useState(false);

  const agent = usePolledAgentStatusContext();

  if (!agent) return <></>

  const status = agent.status

  if (!status) return <></>

  const hasNoFunds = status.baseTokenBalance === '0'
  const isRetired = status.retired

  const handleClickOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const handleCloseWithAction = () => {
    liquidate()
    setOpen(false)
  }

  return (
    <React.Fragment>
      <Button
        sx={{ height: 40, width: width }}
        disabled={loading || hasNoFunds || isRetired || disabled}
        startIcon={loading ? <CircularProgress size={14} /> : undefined}
        variant="contained"
        onClick={handleClickOpen}
      >
        Liquidate <WaterDrop sx={{marginLeft: '0.25rem'}}/>
      </Button>
      <Dialog
        open={open}
        onClose={() => handleClose()}
        PaperProps={{
          component: 'form',
          onSubmit: (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            handleCloseWithAction();
          },
        }}
      >
        <DialogTitle>Liquidate Assets</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <Stack gap={1}>
              <Typography color="text.primary">
                You are about to liquidate.
              </Typography>
              <Typography color="text.primary">
                Base tokens will be swapped for quote tokens and all assets will be transferred to you.
              </Typography>
            </Stack>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleClose()}>Cancel</Button>
          <Button type="submit" disabled={disabled}>Liquidate</Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}

export default LiquidateDialog