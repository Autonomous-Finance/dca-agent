import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { Box, CircularProgress, InputAdornment, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useAccountBalance } from '@/app/hooks/useAccountBalance';
import { useIdentifiedAgent } from '@/app/hooks/useCheckAgent';


export default function TopUpDialog(props: {
  loading: boolean, btnWidth: number, tokenSymbol: string, tokenBalance: string, topUp: (id: string) => void
}) {
  const {loading, btnWidth, tokenSymbol, tokenBalance, topUp} = props;
  const [open, setOpen] = React.useState(false);
  const [amount, setAmount] = React.useState("");
  const [error, setError] = React.useState("");

  const {balance: tokenBalanceUser } = useAccountBalance();
  
  const agent = useIdentifiedAgent()
  if (!agent) return <></>
  const {status} = agent;

  const isRetired = status.retired

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = (amount?: string) => {
    if (amount) topUp(amount);
    setOpen(false);
    setAmount("");
    setError("");
  };

  const FORM_WIDTH = '22.5rem';

  return (
    <React.Fragment>
      <Button
        sx={{ height: 40, width: btnWidth }}
        disabled={loading || isRetired}
        startIcon={loading ? <CircularProgress size={14} /> : undefined}
        variant="contained"
        onClick={handleClickOpen}
      >
        Top Up <AddIcon sx={{marginLeft: '0.25rem'}}/>
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
        <DialogTitle>Top Up Base Token</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <Stack gap={1}>
              <Typography color="text.primary">
                To deposit base token for the DCA process, please enter an amount below.
              </Typography>
              <Typography color="text.primary">
                <Typography component='span' 
                  color="var(--mui-palette-success-main)" 
                  fontWeight={'bold'}
                >
                  Your agent will own this deposit </Typography> and use it to regularly buy target token.
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
          <Typography variant="body1" color="text.primary" width={FORM_WIDTH}
            display={'flex'} justifyContent={'space-between'}>
            Your Available Balance: {" "}
            <Typography component='span'>
              <Typography component='span' fontWeight={'bold'} color="text.primary">{tokenBalanceUser}</Typography>
              <Typography component='span' variant="body1" color="text.secondary">{" "}{tokenSymbol}</Typography>
            </Typography>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleClose()}>Cancel</Button>
          <Button type="submit">Deposit</Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}