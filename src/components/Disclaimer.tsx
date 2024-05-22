import { Box, Button, Stack } from '@mui/material'
import React, { Fragment } from 'react'

const DISCLAIMER = (
  <>
    <h2 id="disclaimer">Disclaimer</h2>
    <h3 id="important-notice">Important Notice</h3>
    <p>
      This software, the Autonomous Investment Agent &#40;AIA&#41;, is provided
      as open-source under the MIT License. While the software has been
      developed with diligence and care, it is important to understand that its
      use comes with inherent risks. The technology behind this agent and the AO
      ecosystem is relatively new and may be subject to unknown vulnerabilities,
      rapid changes, and evolving standards.
    </p>
    <h2 id="use-at-your-own-risk">Use at Your Own Risk</h2>
    <ol>
      <li>
        <p>
          <strong>No Warranties</strong>: The AIA software is provided &quot;as
          is&quot;, without any warranties of any kind. This includes, but is
          not limited to, warranties of merchantability, fitness for a
          particular purpose, and non-infringement. By using this software, you
          acknowledge that you do so at your own risk.
        </p>
      </li>
      <li>
        <p>
          <strong>Financial Risk</strong>: The AIA employs an autonomous
          investment strategy. As with any investment, there are financial risks
          involved, including but not limited to market volatility, loss of
          investment, and unforeseen changes in the blockchain ecosystem. You
          are solely responsible for any financial decisions made using this
          software.
        </p>
      </li>
      <li>
        <p>
          <strong>Technological Risk</strong>: Blockchain technology, smart
          contracts, and decentralized finance &#40;DeFi&#41; protocols are
          complex and still developing. This software may have bugs, experience
          failures, or encounter security vulnerabilities that could result in
          unintended behavior, including financial losses.
        </p>
      </li>
      <li>
        <p>
          <strong>Regulatory Risk</strong>: The regulatory environment for
          blockchain technology and digital assets is uncertain and rapidly
          evolving. It is your responsibility to ensure compliance with any
          applicable laws and regulations in your jurisdiction.
        </p>
      </li>
      <li>
        <p>
          <strong>No Liability</strong>: In no event shall the authors,
          developers, or contributors of this software be liable for any claim,
          damages, or other liability, whether in an action of contract, tort,
          or otherwise, arising from, out of, or in connection with the software
          or the use or other dealings in the software.
        </p>
      </li>
    </ol>
    <h2 id="user-responsibility">User Responsibility</h2>
    <ul>
      <li>
        <strong>Due Diligence</strong>: Users are encouraged to conduct their
        own due diligence before engaging in any transactions or relying on the
        functionality of this software.
      </li>
      <li>
        <strong>Education</strong>: Ensure you have a solid understanding of
        blockchain technology, the AO ecosystem, and decentralized finance
        principles before using the AIA software.
      </li>
      <li>
        <strong>Security Practices</strong>: Follow best practices for security,
        such as safeguarding private keys, using secure devices, and regularly
        updating software.
      </li>
    </ul>
    <p>
      By using this software, you agree to this disclaimer and acknowledge that
      you understand and accept the risks involved.
    </p>
  </>
)

function Disclaimer({agentId, children}: {agentId: string, children: React.ReactNode}) {
  const key = `disclaimer-${agentId}`
  const [hasAcknowledged, setHasAcknowledged] = React.useState(localStorage.getItem(key) === 'true')

  const setTrue = () => {
    setHasAcknowledged(true)
    localStorage.setItem(key, 'true')
  }

  return (
    <>
      {hasAcknowledged && (
        <>
          {children}
        </>
      )}
      {!hasAcknowledged && (
        <Stack gap={4} width={600} margin={'2rem auto 6rem'}>
          {DISCLAIMER}
          <Button
            sx={{ height: 40, padding: '0.5rem 1rem' }}
            variant="contained"
            onClick={setTrue}
          >
            I understand and accept the risks
          </Button>
        </Stack>
      )}
    </>
  )
}

export default Disclaimer
