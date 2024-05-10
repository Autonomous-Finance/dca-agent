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
import { usePolledAgentStatusContext } from './PolledAgentStatusProvider';
import { displayableCurrency, submittableCurrency } from '@/utils/data-utils';
import { useDenomination } from '@/hooks/useDenomination';


export default function WithdrawDialog(props: {
  loading: boolean, 
  disabled?: boolean, 
  btnWidth: string, 
  tokenSymbol: string, 
  type: 'base' | 'quote',
  withdraw: (id: string) => void
}) {
  const {loading, disabled, btnWidth, withdraw, tokenSymbol, type} = props;
  
  const [open, setOpen] = React.useState(false);
  const [amount, setAmount] = React.useState("");
  const [error, setError] = React.useState("");
  
  const agent = usePolledAgentStatusContext();

  const baseDenomination = useDenomination(agent?.status?.baseToken)
  const denomination = type === 'base' ? baseDenomination : 3

  if (!agent) return <></>

  const status = agent.status

  if (!status) return <></>

  const tokenBalance = type === 'quote' ? status.quoteTokenBalance : status.baseTokenBalance;
  const hasZeroFunds = Number.parseInt(tokenBalance) === 0
  const isRetired = status.retired

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false)
    setAmount("")
    setError("")
  };

  const handleCloseWithAction = () => {
    try {
      const conv = submittableCurrency(amount, denomination)
      if (Number.parseInt(conv) < 10) {
        throw new Error()
      }
      withdraw(conv)
      handleClose()
    } catch (e) {
      setError('Invalid amount. Please enter a number >= 0.01')
    }
  }

  const FORM_WIDTH = '22.5rem';

  return (
    <React.Fragment>
      <Button
        sx={{ height: 40, width: btnWidth }}
        disabled={loading || hasZeroFunds || isRetired || disabled}
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
            event.preventDefault()
            handleCloseWithAction()
          },
        }}
      >
        <DialogTitle>Withdraw {type === 'base' ? 'Base' : 'Quote'} Token</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <Stack gap={1}>
              <Typography color="text.primary">
                To withdraw {type === 'base' ? 'base' : 'quote'} token, please enter an amount below.
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
              label="Withdraw Amount"
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
              <Typography component='span' fontWeight={'bold'} color="text.primary">{displayableCurrency(tokenBalance, denomination)}</Typography>
              <Typography component='span' variant="body1" color="text.secondary">{" "}{tokenSymbol}</Typography>
            </Typography>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleClose()}>Cancel</Button>
          <Button type="submit" disabled={!amount}>Withdraw</Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}