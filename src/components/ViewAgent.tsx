
import ActiveAgentPanel from '@/components/ActiveAgentPanel'
import React from 'react'
import { PolledAgentStatusProvider } from './PolledAgentStatusProvider'

function ViewAgent({agentId}: {agentId: string}) {
  return (
    <PolledAgentStatusProvider agentId={agentId}>
      <ActiveAgentPanel>
      </ActiveAgentPanel>
    </PolledAgentStatusProvider>
  )
}

export default ViewAgent