#!/bin/bash

cd ao

/opt/homebrew/bin/amalg.lua -s process.lua -o build/output-agent.lua permissions.permissions agent.status agent.life-cycle agent.ownership agent.swaps agent.withdrawals agent.deposits agent.balances agent.progress agent.liquidation utils.patterns utils.response

# prepend resets to the output file
cat agent/resets.lua | cat - build/output-agent.lua > temp && mv temp build/output-agent.lua

cd ..

lua_source=$(<ao/build/output-agent.lua)

echo "export const AGENT_SOURCE = \`$lua_source\`" > src/lua/agent-source.ts

echo "Success. Check out ao/build/output-agent.lua and src/lua/agent-source.ts"