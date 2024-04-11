import React from 'react'
import { Tooltip, Zoom } from '@mui/material'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

function HelpIcon(props: {text: string}) {
  return (
    <Tooltip title={props.text} placement="right" arrow TransitionComponent={Zoom}>
      <HelpOutlineIcon sx={{fontSize: '1rem', marginLeft: '0.5rem'}} color='info'/>
    </Tooltip>
  )
}

export default HelpIcon