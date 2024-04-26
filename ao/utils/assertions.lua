local Type = require ".utils.type"
local bint = require ".bint" (512)

local mod = {}

-- Validates if the provided value can be parsed as a Bint
---@param val any Value to validate
---@return boolean
function mod.isBintRaw(val)
  local success, result = pcall(
    function()
      -- check if the value is convertible to a Bint
      if type(val) ~= "number" and type(val) ~= "string" and not bint.isbint(val) then
        return false
      end

      -- check if the val is an integer and not infinity, in case if the type is number
      if type(val) == "number" and (val ~= val or val % 1 ~= 0) then
        return false
      end

      return true
    end
  )

  return success and result
end

-- Verify if the provided value can be converted to a valid token quantity
---@param qty any Raw quantity to verify
---@return boolean
function mod.isTokenQuantity(qty)
  if type(qty) == "nil" then return false end
  if not mod.isBintRaw(qty) then return false end
  if type(qty) == "number" and qty < 0 then return false end
  if type(qty) == "string" and string.sub(qty, 1, 1) == "-" then
    return false
  end

  return true
end

mod.Address = Type
    :string("Invalid type for Arweave address (must be string)")
    :length(43, nil, "Invalid length for Arweave address")
    :match("[A-z0-9_-]+", "Invalid characters in Arweave address")

-- Verify if the provided value is an address
---@param addr any Address to verify
---@return boolean
function mod.isAddress(addr)
  return mod.Address:assert(addr, nil, true)
end

-- Verify if the provided value is a valid percentage for slippages
-- Allowed precision is 2 decimals (min is 0.01)
---@param percentage any Percentage to verify
---@return boolean
function mod.isSlippagePercentage(percentage)
  return type(percentage) == "number" and
      percentage > 0 and
      (percentage * 100) % 1 == 0 and
      percentage < 100
end

return mod
