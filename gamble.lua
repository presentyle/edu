-- Define global state variables
state.var {
  Open = state.value()
}

-- Initialize the state variables
function constructor()
  -- a constructor is called only once at the contract deployment
  Open:set(true)
end

function roll(input)
  assert(Open:get(), "Contract is closed.")
  assert(bignum.number(system.getAmount()) == bignum.number(1), "amount is not 1 aer")
  assert(type(input) == 'table', "must be table table: " .. type(input))
  local txhash = system.getTxhash()
  local num = txhash:gsub("%D+", "")
  num = (num % 6) + 1
  assert(num < 7, "wrong num")

  local reward = 6;
  for i, v in next, input do
    reward = reward - 1;
  end

  for i, v in next, input do
      if v == num then
      -- 함수 호출자에 돈을 돌려주는 소스 --
        contract.send(system.getSender(), reward)
        contract.event("[당첨금 수령]", system.getSender());
        return "[축]당첨! 당첨번호: " .. num
      end
  end
  return "낙첨.. 당첨번호: " .. num
end

function destroy()
  -- Address 부분에 본인의 주소를 적어주세요.
  assert(system.getSender() == "AmMLGcMzRafSWKTXvbhUTBs98EDERsQFTvUY6RJfGfRDW9h8JLv6", "Not athorized.")
  Open:set(false);
  contract.send(system.getSender(), 0)
  contract.event("[중단]", system.getSender());
end

function reopen()
  -- Address 부분에 본인의 주소를 적어주세요.
  assert(system.getSender() == "AmMLGcMzRafSWKTXvbhUTBs98EDERsQFTvUY6RJfGfRDW9h8JLv6", "Not athorized.")
  Open:set(true);
  contract.event("[재개]", system.getSender());
end

function default()

end

-- register functions to expose
abi.register(roll, destroy, reopen)
abi.payable(roll, default)
