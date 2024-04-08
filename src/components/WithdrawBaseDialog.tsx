import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { Box, CircularProgress, InputAdornment, Stack, Typography } from '@mui/material';
import RemoveIcon from '@mui/icons-material/Remove';
import { useIdentifiedAgent } from '@/app/hooks/useCheckAgent';


export default function WithdrawBaseDialog(props: {
  loading: boolean, btnWidth: number, tokenSymbol: string, withdraw: (id: string) => void
}) {
  const {loading, btnWidth, withdraw, tokenSymbol} = props;
  
  const [open, setOpen] = React.useState(false);
  const [amount, setAmount] = React.useState("");
  const [error, setError] = React.useState("");
  
  const agent = useIdentifiedAgent()
  if (!agent) return <></>
  const {status} = agent;

  const hasNoFunds = status.baseTokenBalance === '0'
  const tokenBalance = status.baseTokenBalance;
  const isRetired = status.retired

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = (amount?: string) => {
    setOpen(false);
    if (amount) withdraw (amount);
    setAmount("");
  };

  const FORM_WIDTH = '22.5rem';

  return (
    <React.Fragment>
      <Button
        sx={{ height: 40, width: btnWidth }}
        disabled={loading || hasNoFunds || isRetired}
        startIcon={loading ? <CircularProgress size={14} /> : undefined}
        variant="contained"
        onClick={handleClickOpen}
      >
        Withdraw <RemoveIcon sx={{marginLeft: '0.25rem'}}/>
      </Button>
      <Dialog
        open={open}
        onClose={() => handleClose()}
        PaperProps={{
          component: 'form',
          onSubmit: (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            // TODO validation (string representing positive integer)
            // const parsed = parseFloat(amount)
            // if (isNaN(parsed) || parsed < 10_000) {
            //   setError("Amount must be a number greater than or equal to 10,000")
            //   return
            // }
            handleClose(amount);
          },
        }}
      >
        <DialogTitle>Withdraw Base Token</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <Stack gap={1}>
              <Typography color="text.primary">
                To withdraw base token, please enter an amount below.
              </Typography>
              <Typography color="text.primary">
                Your agent will be debited with this amount.
              </Typography>
            </Stack>
          </DialogContentText>
          <Box my={2} width={FORM_WIDTH}>
            <TextField
              fullWidth
              disabled={loading}
              size="small"
              required
              label="Deposit Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">{tokenSymbol}</InputAdornment>
                ),
              }}
              error={error !== ""}
              helperText={error}
            />
          </Box>
          <Typography variant="body1" color="text.primary" width={FORM_WIDTH}
            display={'flex'} justifyContent={'space-between'}>
            Agent Balance: {" "}
            <Typography component='span'>
              <Typography component='span' fontWeight={'bold'} color="text.primary">{tokenBalance}</Typography>
              <Typography component='span' variant="body1" color="text.secondary">{" "}{tokenSymbol}</Typography>
            </Typography>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleClose()}>Cancel</Button>
          <Button type="submit">Withdraw</Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}