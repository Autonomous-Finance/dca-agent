local mod = {}

-- This function allows the wrapped pattern function
-- to continue the execution after the handler
---@param fn fun(msg: Message)
---@return PatternFunction
function mod.continue(fn)
  return function(msg)
    local patternResult = fn(msg)

    if not patternResult or patternResult == 0 or patternResult == "skip" then
      return patternResult
    end
    return 1
  end
end

-- The "hasMatchingTag" utility function, but it supports
-- multiple values for the tag
---@param name string Tag name
---@param values string[] Tag values
---@return PatternFunction
function mod.hasMatchingTagOf(name, values)
  return function(msg)
    for _, value in ipairs(values) do
      local patternResult = Handlers.utils.hasMatchingTag(name, value)(msg)

      if patternResult ~= 0 then
        return patternResult
      end
    end

    return 0
  end
end

-- Handlers wrapped with this function will not throw Lua errors.
-- Instead, if the handler throws an error, the wrapper will
-- catch that and set the global SwapError to the error message.
---@param handler HandlerFunction
---@return HandlerFunction
function mod.catchWrapperSwap(handler)
  -- return the wrapped handler
  return function(msg, env)
    -- execute the provided handler
    local status, result = pcall(handler, msg, env)

    -- validate the execution result
    if not status then
      local err = string.gsub(result, "[%w_]*%.lua:%d: ", "")

      -- set the global RefundError variable
      -- this needs to be reset in the refund later
      SwapError = err

      return nil
    end

    return result
  end
end

-- Handlers wrapped with this function will not throw Lua errors.
-- Instead, if the handler throws an error, the wrapper will
-- catch that and set the global SwapError to the error message.
---@param handler HandlerFunction
---@return HandlerFunction
function mod.catchWrapperSwapBack(handler)
  -- return the wrapped handler
  return function(msg, env)
    -- execute the provided handler
    local status, result = pcall(handler, msg, env)

    -- validate the execution result
    if not status then
      local err = string.gsub(result, "[%w_]*%.lua:%d: ", "")

      -- set the global RefundError variable
      -- this needs to be reset in the refund later
      SwapBackError = err

      return nil
    end

    return result
  end
end

-- Handlers wrapped with this function will not throw Lua errors.
-- Instead, if the handler throws an error, the wrapper will
-- catch that and set the global SwapError to the error message.
---@param handler HandlerFunction
---@return HandlerFunction
function mod.catchWrapperLiquidate(handler)
  -- return the wrapped handler
  return function(msg, env)
    -- execute the provided handler
    local status, result = pcall(handler, msg, env)

    -- validate the execution result
    if not status then
      local err = string.gsub(result, "[%w_]*%.lua:%d: ", "")

      -- set the global RefundError variable
      -- this needs to be reset in the refund later
      LiquidateError = err

      return nil
    end

    return result
  end
end

return mod
