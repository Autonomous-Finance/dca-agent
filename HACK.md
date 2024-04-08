# LUA


## Ownership
- check via process owner, not message owner
- for ownership transfer or renounciation, keep in mind that ao.env.Process.Owner will not update

## Safe Initialization (+ ownership + config)

Send an initialization message and handle as if constructor in Solidity.

Handler Setup: Before process is initialized, only allow 
- 1 handler to publicly query init status and ownership
- 1 handler to initialize (only owner allowed)
- 1 handler to match & error as long as not initialized  ==> all subsequent handlers remain unavailable until initlization

## Respond to a message
Data contains the response (json.encoded)
Add Tag to response message accordingly: 
  e.g. `["Response-For"] : "GetStatus"` if the request message had `m.Tags.Action == "GetStatus"`

## My Latest Balance

If a process should keep track of its own "latest" balance of a token, this is best achieved via requesting balance after each "Credit-Notice" or "Debit-Notice".

An alternative would be to query the balance initially, then perform only + and - according to quantities in the Credig/Debit notice. This one seems unsafe though, since concurrency may cause a faulty initialization of the value.

# AO Connect

## Fail-Safe Install Handlers after Spawn

Need to loop until the 'Eval' messsage returns with 200 from gateway.








# CLARIFY

When using ao connect (user account), is there a way to listen to messages tagged in a certain way (like listening for events from JSON RPC provider on EVM chain).  e.g. listen for messages of AO-CRED credit-notices

