# Bro, What’s the Number? (FiveM Resource)

A Wordle-inspired number guessing minigame for FiveM, with a modern NUI and configurable rules.

## Features
- FiveM-ready resource (client-side, NUI)
- Configurable code length, attempts, timer, and more
- Export to open the minigame from other scripts, with custom rules
- Clean, responsive UI

## Installation
1. Place this folder in your server's `resources` directory (e.g. `resources/[local]/bro-whats-the-number`)
2. Add `ensure bro-whats-the-number` to your `server.cfg`

## Usage

### Export
```lua
exports['bro-whats-the-number']:OpenNumberGame(rulesTable, function(result)
    -- result.result: 'passed' or 'failed'
    -- result.code: the secret code
    -- result.attempts: table of guesses
end)
```
- `rulesTable` (optional):
  - `codeLength`: number (default: from config.lua)
  - `attempts`: number (default: from config.lua)
  - `timer`: number (seconds, default: from config.lua)
  - `allowLeadingZeros`: boolean (default: from config.lua)

### Example
```lua
exports['bro-whats-the-number']:OpenNumberGame({ codeLength = 4, attempts = 5, timer = 60 }, function(result)
    print(json.encode(result))
end)
```

## Config
Edit `config.lua` to set default rules for all games.

## Credits
- Original game by you!
- FiveM NUI adaptation by Cascade

## NUI Controls
- Type digits to guess
- ESC to close/cancel

---
Enjoy!
