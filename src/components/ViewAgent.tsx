"use client"

import ActiveAgentPanel from '@/components/ActiveAgentPanel'
import React from 'react'
import { PolledAgentStatusProvider } from './PolledAgentStatusProvider'
import Disclaimer from './Disclaimer'

function ViewAgent({agentId}: {agentId: string}) {
  return (
    <PolledAgentStatusProvider agentId={agentId}>
      <Disclaimer agentId={agentId}>
        <ActiveAgentPanel />
      </Disclaimer>
    </PolledAgentStatusProvider>
  )
}

export default ViewAgent