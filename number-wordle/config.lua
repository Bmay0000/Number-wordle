-- Configurable rules for Bro, What’s the Number?
Config = {}

Config.Defaults = {
    codeLength = 9,         -- Number of digits in the code
    attempts = 5,           -- Number of guesses allowed
    timer = 200,            -- Time in seconds
    allowLeadingZeros = true, -- Allow numbers like 01234
    allowedDigits = "0123456789", -- Which digits can appear in the code (string)
    theme = "default",     -- UI theme (future use)
    winSound = "win.mp3",  -- Sound to play on win (must be in html/)
    failSound = "fail.mp3"  -- Sound to play on fail (must be in html/)
}

-- For future expansion: add more config options here as needed
