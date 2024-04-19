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

export default function PauseDialog(props: {loading: boolean, disabled?: boolean, btnWidth: number, pause: () => void}) {
  const {loading, disabled, btnWidth, pause} = props
  const [open, setOpen] = React.useState(false);

  const agent = usePolledAgentStatusContext();

  if (!agent) return <></>

  const status = agent.status

  if (!status) return <></>

  const isPaused = status.paused

  const handleClickOpen = () => {
    setOpen(true)
  };

  const handleClose = () => {
    setOpen(false)
  };

  const handleCloseAndPause = () => {
    setOpen(false)
    pause()
  }

  return (
    <React.Fragment>
      <Button
        sx={{ height: 40, width: btnWidth }}
        disabled={loading || isPaused || disabled}
        startIcon={loading ? <CircularProgress size={14} /> : undefined}
        color="secondary"
        variant="contained"
        onClick={handleClickOpen}
      >
        Pause <DoneAllIcon sx={{marginLeft: '0.25rem'}}/>
      </Button>
      <Dialog
        open={open}
        onClose={() => handleClose()}
        PaperProps={{
          component: 'form',
          onSubmit: (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            // TODO validation
            handleCloseAndPause();
          },
        }}
      >
        <DialogTitle>Pause Agent</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <Stack gap={1}>
              <Typography color="text.primary">You are about to {`${isPaused ? 'resume' : 'pause'}`} the activity of your agent.</Typography>
              {!isPaused && <Typography color="text.primary">While paused it will no longer perform DCA swaps.</Typography>}
            </Stack>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleClose()}>Cancel</Button>
          <Button type="submit">{isPaused ? 'Resume' : 'Pause'}</Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}