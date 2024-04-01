*swuw* == "signed with user wallet"

1. user configures the bot with target token, slippage, swap amount
2. user confirms deployment
   1. create main bot process (*swuw*)
   2. upon deployment confirmation, load `process.lua` 
   3. upon eval confirmation, `"Initialize"` (*swuw*)
   4. upon initialization confirmation, spawn cron proxy processes
      1. spawn process A, load `trigger-price–update.lua`, `"Initialize"` (*swuw*)
      2. spawn process B, load `trigger-swap.lua`, `"Initialize"` (*swuw*)