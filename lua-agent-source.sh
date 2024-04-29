#!/bin/bash

cd ao

/opt/homebrew/bin/amalg.lua -s process.lua -o build/output-agent.lua permissions.permissions validations.validations agent.status agent.life-cycle agent.ownership agent.swaps agent.withdrawals agent.deposits agent.balances agent.progress agent.liquidation utils.patterns utils.response

cd ..

lua_source=$(<ao/build/output-agent.lua)

echo "export const AGENT_SOURCE = \`$lua_source\`" > src/lua/agent-source.ts

echo "Success. Check out ao/build/output-agent.lua and src/lua/agent-source.ts"