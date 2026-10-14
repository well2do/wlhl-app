-- Refresh a renamed merchant's cached label without changing tokens or expiry.
-- Invoke only after confirming that the merchant database contains the new name.
local merchantId = tonumber(ARGV[1])
local oldName = ARGV[2]
local newName = ARGV[3]
if not merchantId or not oldName or not newName or newName == '' then
  return redis.error_reply('Expected merchant ID, previous label, and new label')
end
local cursor = '0'
local updated = 0
repeat
  local scan = redis.call('SCAN', cursor, 'MATCH', 'FUINT_ADMIN_USER*', 'COUNT', 100)
  cursor = scan[1]
  for _, key in ipairs(scan[2]) do
    local raw = redis.call('GET', key)
    if raw then
      local ok, account = pcall(cjson.decode, raw)
      if ok and type(account) == 'table' and tonumber(account.merchantId) == merchantId and account.merchantName == oldName then
        -- Change only this JSON string, preserving every other byte of the session.
        local previous = '"merchantName":' .. cjson.encode(oldName)
        local replacement = '"merchantName":' .. cjson.encode(newName)
        local first, last = string.find(raw, previous, 1, true)
        if first then
          local revised = string.sub(raw, 1, first - 1) .. replacement .. string.sub(raw, last + 1)
          redis.call('SET', key, revised, 'XX', 'KEEPTTL')
          updated = updated + 1
        end
      end
    end
  end
until cursor == '0'
return updated
