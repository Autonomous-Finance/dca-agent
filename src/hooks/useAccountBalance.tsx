import { readCredBalance } from "@/utils/ao-utils"
import { useActiveAddress } from "arweave-wallet-kit"
import React from "react"

export const POLL_INTERVAL_CRED_BALANCE = 30000 // twice a minute

const useBalance = () => {
  const address = useActiveAddress()
  const [balance, setBalance] = React.useState(0)
  const [loading, setLoading] = React.useState(false)
  const [loadingTrigger, setLoadingTrigger] = React.useState(false)
  const [lastUpdate, setLastUpdate] = React.useState(new Date())

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
        readCredBalance(address).then((bal) => {
          setBalance(bal)
          setLastUpdate(new Date())
        })
      }, POLL_INTERVAL_CRED_BALANCE)
    }

    syncBalance()

    return () => clearInterval(interval)
  }, [address])

  const triggerUpdate = () => {
    if (address && !loading && balance !== 0) {
      setLoadingTrigger(true)
      readCredBalance(address).then((result) => {
        setBalance(result)
        setLoadingTrigger(false)
        setLastUpdate(new Date())
      })
    }
  }

  return {balance, loading, loadingTrigger, lastUpdate, triggerUpdate}
}

const AccountBalanceContext = React.createContext<{
  balance: number, 
  loading: boolean, 
  loadingTrigger: boolean, 
  lastUpdate: Date,
  triggerUpdate: () => void
}>({
  balance: 0, 
  loading: false,
  loadingTrigger: false,
  lastUpdate: new Date(),
  triggerUpdate: () => {}
})

export const AccountBalanceProvider = ({children}: { children: React.ReactNode }) => {
  const accountBalance = useBalance()
  return (
    <AccountBalanceContext.Provider value={accountBalance}>
      {children}
    </AccountBalanceContext.Provider>
  )
}

export const useAccountBalance = () => React.useContext(AccountBalanceContext)