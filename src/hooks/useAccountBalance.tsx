import { readCredBalance } from "@/utils/ao-utils"
import { useActiveAddress } from "arweave-wallet-kit"
import React from "react"

export const POLL_INTERVAL_CRED_BALANCE = 6000

const useBalance = () => {
  const address = useActiveAddress()
  const [balance, setBalance] = React.useState(0)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!address) return
    let interval: string | number | NodeJS.Timeout | undefined;
    const syncBalance = async () => {
      setLoading(true)
      try {
        const bal = await readCredBalance(address)
        setBalance(bal)
      } catch (e) {
        console.error('Failed initial fetch balance ', e)
      }
      setLoading(false)
      interval = setInterval(() => {
        readCredBalance(address).then(setBalance)
      }, POLL_INTERVAL_CRED_BALANCE)
    }

    syncBalance()

    return () => clearInterval(interval)
  }, [address])

  return {balance, loading}
}

const AccountBalanceContext = React.createContext<{balance: number, loading: boolean}>({balance: 0, loading: false})

export const AccountBalanceProvider = ({children}: { children: React.ReactNode }) => {
  const accountBalance = useBalance()
  return (
    <AccountBalanceContext.Provider value={accountBalance}>
      {children}
    </AccountBalanceContext.Provider>
  )
}

export const useAccountBalance = () => React.useContext(AccountBalanceContext)