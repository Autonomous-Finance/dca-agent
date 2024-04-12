import { Button } from '@mui/material'
import React from 'react'
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';

function WipeDebug(props: {wipe: () => void}) {
  return (
    <Button onClick={props.wipe} variant="outlined" size="large"
      sx={{position: 'fixed', bottom: 0, right: 0, margin: 2, opacity: 0.6}}>
      <CleaningServicesIcon sx={{marginRight: 1}}/> WIPE
    </Button>
  )
}

export default WipeDebug