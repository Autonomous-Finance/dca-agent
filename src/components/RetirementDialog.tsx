import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { CircularProgress, Stack, Typography } from '@mui/material';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { usePolledAgentStatusContext } from './PolledAgentStatusProvider';

export default function RetirementDialog(props: {loading: boolean, disabled?: boolean, btnWidth: string, retire: () => void}) {
  const {loading, disabled, btnWidth, retire} = props
  const [open, setOpen] = React.useState(false);

  const agent = usePolledAgentStatusContext();

  if (!agent) return <></>

  const status = agent.status

  if (!status) return <></>

  const hasFunds = status.quoteTokenBalance !== '0' || status.baseTokenBalance !== '0'
  const isRetired = status.retired

  const handleClickOpen = () => {
    setOpen(true)
  };

  const handleClose = () => {
    setOpen(false)
  };

  const handleCloseAndRetire = () => {
    setOpen(false)
    retire()
  }

  return (
    <React.Fragment>
      <Button
        sx={{ height: 40, width: btnWidth }}
        disabled={loading || isRetired || disabled}
        startIcon={loading ? <CircularProgress size={14} /> : undefined}
        color="secondary"
        variant="contained"
        onClick={handleClickOpen}
      >
        Retire <DoneAllIcon sx={{marginLeft: '0.25rem'}}/>
      </Button>
      <Dialog
        open={open}
        onClose={() => handleClose()}
        PaperProps={{
          component: 'form',
          onSubmit: (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            // TODO validation
            handleCloseAndRetire();
          },
        }}
      >
        <DialogTitle>Retire Agent</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <Stack gap={1}>
              <Typography color="text.primary">You are about to retire your agent.</Typography>
              <Typography color="text.primary">After retiring you will no longer be able to use it.</Typography>
              {hasFunds && (
                <>
                  <Typography color="error">Your agent has non-zero balances.</Typography>
                  <Typography color="error">Please LIQUIDATE in order to perform this action.</Typography>
                </>
              )}
            </Stack>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleClose()}>Cancel</Button>
          <Button type="submit" disabled={hasFunds}>Retire</Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}