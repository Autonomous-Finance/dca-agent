import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { CircularProgress, Stack, Typography } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';

export default function TransferOwnershipDialog(props: {loading: boolean, btnWidth: number, transferTo: (id: string) => void}) {
  const {loading, btnWidth, transferTo} = props;
  const [open, setOpen] = React.useState(false);
  const [account, setAccount] = React.useState("");

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = (id?: string) => {
    setOpen(false);
    if (id) transferTo(id);
    setAccount("");
  };

  return (
    <React.Fragment>
      <Button
        sx={{ height: 40, width: btnWidth }}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={14} /> : undefined}
        color="secondary"
        variant="contained"
        onClick={handleClickOpen}
      >
        Transfer <ArrowRightIcon/> <PersonIcon sx={{marginLeft: '-0.5rem'}}/>
      </Button>
      <Dialog
        open={open}
        onClose={() => handleClose()}
        PaperProps={{
          component: 'form',
          onSubmit: (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            // TODO validation
            handleClose(account);
          },
        }}
      >
        <DialogTitle>Transfer Bot Ownership</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <Stack gap={1}>
              <Typography color="text.primary">To transfer your bot, please enter a valid AO account ID below.</Typography>
              <Typography color="error">By submitting, you renounce control of your BOT and the ASSETS it manages.</Typography>
            </Stack>
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            required
            margin="dense"
            label="Account ID (AO Entity)"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            type="text"
            variant="standard"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleClose()}>Cancel</Button>
          <Button type="submit">Transfer</Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}