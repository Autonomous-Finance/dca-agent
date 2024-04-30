---@class Type
local Type = {
  -- custom name for the defined type
  ---@type string|nil
  name = nil,
  -- list of assertions to perform on any given value
  ---@type { message: string, validate: fun(val: any): boolean }[]
  conditions = nil
}

-- Execute an assertion for a given value
---@param val any Value to assert for
---@param message string? Optional message to throw
---@param no_error boolean? Optionally disable error throwing (will return boolean)
function Type:assert(val, message, no_error)
  for _, condition in ipairs(self.conditions) do
    if not condition.validate(val) then
      if no_error then return false end
      self:error(message or condition.message)
    end
  end

  if no_error then return true end
end

-- Add a custom condition/assertion to assert for
---@param message string Error message for the assertion
---@param assertion fun(val: any): boolean Custom assertion function that is asserted with the provided value
function Type:custom(message, assertion)
  -- condition to add
  local condition = {
    message = message,
    validate = assertion
  }

  -- new instance if there are no conditions yet
  if self.conditions == nil then
    local instance = {
      conditions = {}
    }

    table.insert(instance.conditions, condition)
    setmetatable(instance, self)
    self.__index = self

    return instance
  end

  table.insert(self.conditions, condition)
  return self
end

-- Add an assertion for built in types
---@param t "nil"|"number"|"string"|"boolean"|"table"|"function"|"thread"|"userdata" Type to assert for
---@param message string? Optional assertion error message
function Type:type(t, message)
  return self:custom(
    message or ("Not of type (" .. t .. ")"),
    function (val) return type(val) == t end
  )
end

-- Type must be userdata
---@param message string? Optional assertion error message
function Type:userdata(message)
  return self:type("userdata", message)
end

-- Type must be thread
---@param message string? Optional assertion error message
function Type:thread(message)
  return self:type("thread", message)
end

-- Type must be table
---@param message string? Optional assertion error message
function Type:table(message)
  return self:type("table", message)
end

-- Table's keys must be of type t
---@param t Type Type to assert the keys for
---@param message string? Optional assertion error message
function Type:keys(t, message)
  return self:custom(
    message or "Invalid table keys",
    function (val)
      if type(val) ~= "table" then
        return false
      end

      for key, _ in pairs(val) do
        -- check if the assertion throws any errors
        local success = pcall(function () return t:assert(key) end)

        if not success then return false end
      end

      return true
    end
  )
end

-- Type must be array
---@param message string? Optional assertion error message
function Type:array(message)
  return self:table():keys(Type:number(), message)
end

-- Table's values must be of type t
---@param t Type Type to assert the values for
---@param message string? Optional assertion error message
function Type:values(t, message)
  return self:custom(
    message or "Invalid table values",
    function (val)
      if type(val) ~= "table" then return false end

      for _, v in pairs(val) do
        -- check if the assertion throws any errors
        local success = pcall(function () return t:assert(v) end)

        if not success then return false end
      end

      return true
    end
  )
end

-- Type must be boolean
---@param message string? Optional assertion error message
function Type:boolean(message)
  return self:type("boolean", message)
end

-- Type must be function
---@param message string? Optional assertion error message
function Type:_function(message)
  return self:type("function", message)
end

-- Type must be nil
---@param message string? Optional assertion error message
function Type:_nil(message)
  return self:type("nil", message)
end

-- Value must be the same
---@param val any The value the assertion must be made with
---@param message string? Optional assertion error message
function Type:is(val, message)
  return self:custom(
    message or "Value did not match expected value (Type:is(expected))",
    function (v) return v == val end
  )
end

-- Type must be string
---@param message string? Optional assertion error message
function Type:string(message)
  return self:type("string", message)
end

-- String type must match pattern
---@param pattern string Pattern to match
---@param message string? Optional assertion error message
function Type:match(pattern, message)
  return self:custom(
    message or ("String did not match pattern \"" .. pattern .. "\""),
    function (val) return string.match(val, pattern) ~= nil end
  )
end

-- String type must be of defined length
---@param len number Required length
---@param match_type? "less"|"greater" String length should be "less" than or "greater" than the defined length. Leave empty for exact match.
---@param message string? Optional assertion error message
function Type:length(len, match_type, message)
  local match_msgs = {
    less = "String length is not less than " .. len,
    greater = "String length is not greater than " .. len,
    default = "String is not of length " .. len
  }

  return self:custom(
    message or (match_msgs[match_type] or match_msgs.default),
    function (val)
      local strlen = string.len(val)

      -- validate length
      if match_type == "less" then return strlen < len
      elseif match_type == "greater" then return strlen > len end

      return strlen == len
    end
  )
end

-- Type must be a number
---@param message string? Optional assertion error message
function Type:number(message)
  return self:type("number", message)
end

-- Number must be an integer (chain after "number()")
---@param message string? Optional assertion error message
function Type:integer(message)
  return self:custom(
    message or "Number is not an integer",
    function (val) return val % 1 == 0 end
  )
end

-- Number must be even (chain after "number()")
---@param message string? Optional assertion error message
function Type:even(message)
  return self:custom(
    message or "Number is not even",
    function (val) return val % 2 == 0 end
  )
end

-- Number must be odd (chain after "number()")
---@param message string? Optional assertion error message
function Type:odd(message)
  return self:custom(
    message or "Number is not odd",
    function (val) return val % 2 == 1 end
  )
end

-- Number must be less than the number "n" (chain after "number()")
---@param n number Number to compare with
---@param message string? Optional assertion error message
function Type:less_than(n, message)
  return self:custom(
    message or ("Number is not less than " .. n),
    function (val) return val < n end
  )
end

-- Number must be greater than the number "n" (chain after "number()")
---@param n number Number to compare with
---@param message string? Optional assertion error message
function Type:greater_than(n, message)
  return self:custom(
    message or ("Number is not greater than" .. n),
    function (val) return val > n end
  )
end

-- Make a type optional (allow them to be nil apart from the required type)
---@param t Type Type to assert for if the value is not nil
---@param message string? Optional assertion error message
function Type:optional(t, message)
  return self:custom(
    message or "Optional type did not match",
    function (val)
      if val == nil then return true end

      t:assert(val)
      return true
    end
  )
end

-- Table must be of object
---@param obj { [any]: Type }
---@param strict? boolean Only allow the defined keys from the object, throw error on other keys (false by default)
---@param message string? Optional assertion error message
function Type:object(obj, strict, message)
  if type(obj) ~= "table" then
    self:error("Invalid object structure provided for object assertion (has to be a table):\n" .. tostring(obj))
  end

  return self:custom(
    message or ("Not of defined object (" .. tostring(obj) .. ")"),
    function (val)
      if type(val) ~= "table" then return false end

      -- for each value, validate
      for key, assertion in pairs(obj) do
        if val[key] == nil then return false end

        -- check if the assertion throws any errors
        local success = pcall(function () return assertion:assert(val[key]) end)

        if not success then return false end
      end

      -- in strict mode, we do not allow any other keys
      if strict then
        for key, _ in pairs(val) do
          if obj[key] == nil then return false end
        end
      end

      return true
    end
  )
end

-- Type has to be either one of the defined assertions
---@param ... Type Type(s) to assert for
function Type:either(...)
  ---@type Type[]
  local assertions = {...}

  return self:custom(
    "Neither types matched defined in (Type:either(...))",
    function (val)
      for _, assertion in ipairs(assertions) do
        if pcall(function () return assertion:assert(val) end) then
          return true
        end
      end

      return false
    end
  )
end

-- Type cannot be the defined assertion (tip: for multiple negated assertions, use Type:either(...))
---@param t Type Type to NOT assert for
---@param message string? Optional assertion error message
function Type:is_not(t, message)
  return self:custom(
    message or "Value incorrectly matched with the assertion provided (Type:is_not())",
    function (val)
      local success = pcall(function () return t:assert(val) end)

      return not success
    end
  )
end

-- Set the name of the custom type
-- This will be used with error logs
---@param name string Name of the type definition
function Type:set_name(name)
  self.name = name
  return self
end

-- Throw an error
---@param message any Message to log
---@private
function Type:error(message)
  error("[Type " .. (self.name or tostring(self.__index)) .. "] " .. tostring(message))
end

return Type
