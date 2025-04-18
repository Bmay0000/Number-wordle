-- FiveM client for Bro, What’s the Number?
local Config = require 'config'

local isGameOpen = false

-- Export to open the minigame with custom rules
exports('OpenNumberGame', function(rules, cb)
    if isGameOpen then return end
    isGameOpen = true
    local defaults = Config.Defaults
    local settings = {
        codeLength = rules and rules.codeLength or defaults.codeLength,
        attempts = rules and rules.attempts or defaults.attempts,
        timer = rules and rules.timer or defaults.timer,
        allowLeadingZeros = rules and rules.allowLeadingZeros ~= nil and rules.allowLeadingZeros or defaults.allowLeadingZeros,
        allowedDigits = rules and rules.allowedDigits or defaults.allowedDigits,
        theme = rules and rules.theme or defaults.theme,
        winSound = rules and rules.winSound or defaults.winSound,
        failSound = rules and rules.failSound or defaults.failSound
    }
    SetNuiFocus(true, true)
    SendNUIMessage({ action = 'open', settings = settings })
    RegisterNUICallback('numberGameResult', function(data, cb2)
        SetNuiFocus(false, false)
        isGameOpen = false
        if cb then cb(data) end
        cb2('ok')
    end)
    RegisterNUICallback('closeNumberGame', function(_, cb2)
        SetNuiFocus(false, false)
        isGameOpen = false
        if cb then
            cb({ result = 'failed', reason = 'closed' })
        end
        cb2('ok')
    end)
end)
