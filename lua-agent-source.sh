#!/bin/bash

cd ao

/opt/homebrew/bin/amalg.lua -s test-process.lua -o build/output-agent.lua ownership.ownership validations.validations bot.bot utils.patterns

cd ..

lua_source=$(<ao/build/output-agent.lua)

echo "export const BOT_SOURCE = \`$lua_source\`" > src/lua/bot-source.ts

echo "Success. Check out ao/build/output-agent.lua and src/lua/bot-source.ts"