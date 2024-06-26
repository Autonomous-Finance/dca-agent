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
import { useAccountBalance } from '@/hooks/useAccountBalance';
import { usePolledAgentStatusContext } from './PolledAgentStatusProvider';
import { displayableCurrency, submittableCurrency } from '@/utils/data-utils';


export default function TopUpDialog(props: {
  loading: boolean, disabled?: boolean, btnWidth: string, tokenSymbol: string, tokenBalance: string, topUp: (id: string) => void
}) {
  const {loading, disabled, btnWidth, tokenSymbol, tokenBalance, topUp} = props;
  const [open, setOpen] = React.useState(false);
  const [amount, setAmount] = React.useState("");
  const [error, setError] = React.useState("");

  const {balance: tokenBalanceUser } = useAccountBalance();
  
  const agent = usePolledAgentStatusContext();

  if (!agent) return <></>

  const status = agent.status

  if (!status) return <></>

  const isRetired = status.retired

  const handleClickOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setAmount("")
    setError("")
  };

  const handleCloseWithAction = () => {
    try {
      const conv = submittableCurrency(amount)
      if (Number.parseInt(conv) < 100) {
        throw new Error()
      }
      topUp(conv)
      handleClose()
    } catch (e) {
      setError('Invalid amount. Please enter a number >= 0.1')
    }
  }

  const FORM_WIDTH = '22.5rem';

  return (
    <React.Fragment>
      <Button
        sx={{ height: 40, width: btnWidth }}
        disabled={loading || isRetired || disabled}
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
            handleCloseWithAction();
          },
        }}
      >
        <DialogTitle>Top Up Quote Token</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <Stack gap={1}>
              <Typography color="text.primary">
                To deposit quote token for the DCA process, please enter an amount below.
              </Typography>
              <Typography color="text.primary">
                <Typography component='span' 
                  color="var(--mui-palette-success-main)" 
                  fontWeight={'bold'}
                >
                  Your agent will own this deposit </Typography> and use it to regularly buy base token.
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
              <Typography component='span' fontWeight={'bold'} color="text.primary">{displayableCurrency(tokenBalance)}</Typography>
              <Typography component='span' variant="body1" color="text.secondary">{" "}{tokenSymbol}</Typography>
            </Typography>
          </Typography>
          <Typography variant="body1" color="text.primary" width={FORM_WIDTH}
            display={'flex'} justifyContent={'space-between'}>
            Your Available Balance: {" "}
            <Typography component='span'>
              <Typography component='span' fontWeight={'bold'} color="text.primary">{displayableCurrency(tokenBalanceUser.toString())}</Typography>
              <Typography component='span' variant="body1" color="text.secondary">{" "}{tokenSymbol}</Typography>
            </Typography>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleClose()}>Cancel</Button>
          <Button type="submit" disabled={!amount}>Deposit</Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}