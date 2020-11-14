-- Define global state variables
function do_gamble(input)
  -- assert(bignum.number(system.getAmount()) == bignum.number(1000000000000000000), "It's not a aergo " .. " amount :" .. system.getAmount())
  local txHash = system.getTxhash()

  if string.find(txHash:sub(-5, -1), input) ~= null then
    -- contract.send(system.getSender(), bignum.number(1000000000000000000))
    return "==== 당첨!"
  else
    -- contract.send(system.getSender(), bignum.number(900000000000000000))
    return "꽝"
  end
end

function test(input)
  assert(type(input) == 'table', "must be table table: " .. type(input))
  local txhash = system.getTxhash()
  local num = txhash:gsub("%D+", "")
  num = num % 7
  assert(num < 7, "wrong num")

  for i, v in next, input do
      if v == num then
        return "[축]당첨! 당첨번호: " .. num
      end
  end
  return "낙첨.. 당첨번호: " .. num
end

function default()

end

-- register functions to expose
abi.register(do_gamble, test)
abi.payable(do_gamble, default)
