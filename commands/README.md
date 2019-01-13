Bot Commands
====================

Bot commands are in files of this path. If you want to add more commands just add more files with the specifications mentioned in main README. Commands included in this repository are explained below.

Basic Commands
------------

Basic features and some information about the bot.

 - `about` - Basic bot info, with the link to this repo.
 - `git` - Link to this repo
 - `version` - Bot version
 - `help` - Get a link to this guide
 - `time` - Current time for Bot
 - `uptime` - Time since the last bot restart
 - `seen [user]` - Latest data from an user
 - `alts [user]` - List of known alts of an user (Alts detected from namechanges), usable by % and higher
 - `say [text]` - Force to say something

Dynamic Commands
------------

Dynamic commads are commands saved in a JSON, used for commands that are continuously changing, like forum links or usage stats. Commands for using, creating, modifying and deleting dynamic commands are the following:

 - `dyn [cmd]` - To call a dynamic command
 - `wall [cmd]` - To call a dynamic command (with announce / wall)
 - `temp [text]` - Set temp var, to create a command
 - `setcmd [cmd]` - Create or modify a command, with `temp` data previosly set
 - `setalias [alias], [cmd]` - Set an alias of an existent dynamic command
 - `delcmd [cmd]` - Delete a command
 - `dyncmdlist` - Get the list of dynamic commands

**NOTE:** You can use a dynamic just with `.command` (command character + command name) if there is not another static command with the same name. So you can use this to create only-text commands with ease.

Chat Plugins
------------

Misc commands for multiple features:

 - `pick [option1], [option2], [...]` - Choose between multiple options
 - `randomanswer` - Get a random answer
 - `joke` - Get a random joke from the local database
 - `quote` - Get a random quote from the local database
 - `regdate (username)` - Get the register date of a Pokemon Showdown account
 - `regtime (username)` - Get the age of a Pokemon Showdown account, useful for check if an account is autoconfirmed

Commands for getting pokemon info:

 - `translate [move/item/ability/nature], (source lang), (target lang)` - Command for translating pokemon stuff
 - `poke` or `randompokemon` - Get a random pokemon
 - `gen [poke]` - Get pokemon, item, etc generation
 - `viablemoves [poke]` - Get viable moves from a Pokemon
 - `heavyslam [poke], [poke]` - Get heavyslam base power
 - `priority [poke]` - Get priority moves
 - `boosting [poke]` - Get boosting moves
 - `recovery [poke]` - Get recovery moves
 - `hazards [poke]` - Get hazards moves

Smogon-related commands:

 - `usagelink` - Get a link to Smogon official usage stats
 - `usage [pokemon], (tier)` - Get usage stats of a pokemon
 - `usagedata [pokemon], [moves / items / abilities / spreads / teammates], (tier)` - Get usage data (common moves, items, spreads, etc) of a pokemon
 - `suspect (tier)` - Get information about a suspect test
 - `setsuspect [tier], [pokemon being suspected, ...], [link to Smogon]` - Set suspect information
 - `deftier [tier]` - Set default tier for `usage` and `suspect` commands

Commands for managing the local database of jokes and quotes:

 - `addquote [id], [text]` - Add a new quote
 - `delquote [id]` - Delete an existing quote
 - `listquotes` - Upload quotes to hastebin
 - `addjoke [id], [text]` - Add a new joke
 - `deljoke [id]` - Delete an existing joke
 - `listjokes` - Upload jokes to hastebin

Administrative Commands
------------

Commands for controlling the bot and command permissions for chat rooms.

 - `custom [text]` - Send something to current room
 - `custom [room] [text]` - Send something to a chat room. Brackets are obligatory if you specify the room. Example of usage: `custom [lobby] Some text here`
 - `pm [user], [text]` - Send a private message
 - `join [room1], [room2], [...]` - Join chat rooms
 - `leave [room1], [room2], [...]` - Leave chat rooms
 - `joinrooms [official/public/all]` - Join all rooms
 - `lang [lang]` - Set the language of the room
 - `settings [cmd], [rank]` - Configure command permissions
 - `battlesettings [permission], [rank]` - Change permissions for battle rooms

Developing Commands
------------

Commands for developing (only for excepted users)

 - `eval` or `js` - Execute arbitrary JavaScript
 - `send` - Send anything to the server
 - `reload [commands/config/features/laguages]` - Hotpatch source files
 - `updategit` - Fast forward from git repo
 - `clearcache` - Clear the cache, for example for reloading the usage data

CommandParser developing commands

 - `ignore [user]` - Bot will ignore an user
 - `unignore [user]` - Stop ignoring an user
 - `sleep [room]` - Change the room status to `Sleeping`, to disable bot commands in a room
 - `wake [room]` - Change the room status to `Ready`, to re-enable bot  commands in a room
 - `status` or `roomstatus [room]` - Show the current status. Abbreviations: [c - chat, b - battle][r - ready, s - sleeping][Bot group][p - public, h - hidden]. Example: crup = chat, ready, user, private

Commands for terminating the process (for restarting the bot)

 - `lockdown` - Set lockdown mode, use `endlockdown` to revert it
 - `kill` - End the process after using lockdown
 - `forcekill` - Kill the process

Moderation
------------

**Mod Settings:** Use `mod (room - optional), [moderation], [on/off]` to enable or disable moderations.

**Moderation Exception:** Use `modex [rank/all]` to change moderation exception for a room.

**Autoban**
 - `ab [user1], [user2], [...]` - Add users to blacklist
 - `unab [user1], [user2], [...]` - Remove users from blacklist
 - `rab [regex]` - Regex ban
 - `unrab [regex]` - Remove a regex ban
 - `vab` - View blacklist

**Zero Tolerance**
 - `0tol [user]` - Checks if an user is in the zero tolerance list
 - `0tol add, [user1]:[level1], [user2]:[level2], [...]` - Add users to zero tolerance list
 - `0tol delete, [user1], [user2], [...]` - Removeusers from zero tolerance list
 - `vzt` - Upload zero tolerance list to hastebin

**Banwords and InapropiateWords:** Saying this words means automute. InapropiateWords requires that words are separated.
 - `banword [phrase]` - Add a banword
 - `unbanword [phrase]` - Remove a banword
 - `vbw` - View banword list
 - `inapword [phrase]` - Add an inappropriate word
 - `uninapword [phrase]` - Remove an inappropriate word
 - `viw` - View inapropiate words list

**Joinphrases:** Configure what phrase Bot says when certain user joins a room. This can be spammable, much caution!
 - `joinphrase [enable/disable]` - Enable or disable joinphrases for a room
 - `joinphrase set, [user], [phrase]` - Set a joinphrase
 - `joinphrase delete, [user]` - Remove a joinphrase
 - `vjf` - View joinphrases list

**Note:** Excepted users can use moderation commands in format `command [roomid]Arguments` to set moderation through PM or other room. Example: `ab [lobby]spammer1, spammer2`

Battle
------------

Commands for battle feature

**Developing**
 - `evalbattle` - Execute arbitrary JavaScript in a battle context
 - `reloadteams` - Hotpatch teams
 - `reloadbattle` - Hotpatch battle modules
 - `move` - Force a custom move

**Challeges**
 - `blockchallenges` - Block Challenges
 - `unblockchallenges` - Stop blocking challenges
 - `chall [user], [format]` - Send a challenge
 - `challme [format]` - Send a challenge to yourself

**Tournaments Joining**
 - `jointours [on/off]` - Enable or disable tour joining
 - `jointour` - Join a tournament
 - `leavetour` - Leave a tournament
 - `checktour` - Check the tournament (If the bot does not challenge or something)

**Ladder**
 - `searchbattle [format]` - Search a battle and returns the link
 - `ladderstart [format]` - Start laddering (checks every 10 seconds)
 - `ladderstop` - Stop laddering

**Teams**
 - `team add, [name], [format], [http://hastebin.com/raw/example]` - Add a team to Bot teams list
 - `team delete, [name]` - Remove a team from Bot teams list
 - `team get, [id]` - Get a team in exportable format
 - `team check, [id], (user)` - Challenge with a specific team
 - `teamslist` - Upload teams list to Hastebin to view it.

Tournaments
------------

Commands for Tournaments feature

 - `tour` - Start a tournament
 - `tour tier=example, timer=30, users=64, dq=1.5, type=elimination` - Start a tournament with custom and optional parameters
  - **tier**: Tournament format / tier
  - **timer**: Max time (in seconds) before starting the tournament
  - **users**: Max number of users (for singups)
  - **dq**: Minutes for autodq
  - **type**: elimination or roundrobin
  - **scout**: set `scout=off` for enabling scout protection
 - `tourhelp` - Help for `tour command`
 - `tourstart` - Force start a tornament
 - `tourend` - Force end a tornament

Commands for leaderboards system

 - `rank (user)` - View users's ranking (points, wins, finals, semifinals, etc)
 - `top` - View the Top5 in the leaderboard
 - `official` - Make a tournament in progress official (to be counted, see config)
 - `unofficial` - Make a tournament in progress unofficial
 - `include` - Count the score of the current tour, if it wouldn't already. Not applicable if room uses officials instead.
 - `exclude` - Do not count the score of the current tour, if it would. Not applicable if room uses officials instead.
 - `board` - Shows the leaderboard htmltable
 - `leaderboards table, [room]` - Upload the leaderboard table to Hastebin
 - `leaderboards htmltable, [room], [size], [unprocessed]` - Shows a table of the leaderboard, formatted with HTML
 - `leaderboards addpoints [user], [points], [room]` - Add unprocessed points to a user
 - `leaderboards addtourdata [hastebin link]` - Add points to the leaderboard based on the tournament state in the hastebin, should always be the final update state of a tournament
 - `leaderboards removetourdata [hastebin link]` - Remove points from the leaderboard based on the tournament state in the hastebin, should always be the final update state of a tournament
 - `leaderboards merge [main], [alt], [room]` - Merge the score of two different names, values from alt are added to main
 - `leaderboards delete [user], [room]` - Remove a name from the leaderboard, the score for that name is deleted
 - `leaderboards filter [add/remove/view], [tier1], [tier2], [tier3]...` - Filtered tiers will never count for the leaderboard, even if all tours usually count
 - `leaderboards reset, [room]` - Reset leaderboards data
 - `leaderboards setconfig, [room], on, [Win points], [Finalist], [SemiFinalist], [Battle win points], [official/all]` - Activate and set leaderboards configuration
 - `leaderboards setconfig, [room], off` - Disable leaderboards system.
 - `leaderboards viewconfig, [room]` - View leaderboards configuration
 - `leaderboards on [room]` - Enable leaderboards with default settings, processed scores are balanced based on the default settings
 - `leaderboards off [room]` - Disable leaderboards
 - `leaderboards reset, [room]` - Reset leaderboards data

Games
------------

General commands for managing games:

 - `game [Game Name], arg1=value1, arg2=value2...` - Start a game
 - `endgame` - Force end a game
 - `reloadgames` - Alias of `reload feature, games`

**Hangman** and **Poke-Hangman**. Arguments: maxfails (max number of allowed fails, 0 or no specify this argument for infinite), lang (optional only for Poke-Hangman to change the language of the pokemon stuff). Commands:

 - `g [word/char]` - To guess words or characters
 - `view` - To view the game status
 - `end` - To force end the game

**Anagrams** and **Poke-Anagrams**. Arguments: games (max number of rounds), points (number of ponts for winning), time (time to answer in seconds), lang (optional only for Poke-Anagrams to change the language of the pokemon stuff). Commands:

 - `g [word]` - To guess the words
 - `view` - To view the game status
 - `end` - To force end the game

**Trivia**. Arguments: games (max number of rounds), points (number of ponts for winning), time (time to answer in seconds). Commands:

 - `ta [answer]` - To answer the questions
 - `view` - To view the game status
 - `end` - To force end the game

**BlackJack**. Arguments: time (time for each turn in seconds), maxplayers (max number of players) Commands:

 - `in` - To join the game. Use `out` to leave
 - `players` - To view the players list
 - `start` - To start the game
 - `hand` - To view your hand
 - `hit` - To get a new card to your hand
 - `stand` - To finish your turn
 - `end` - To force end the game

**Kunc**. Arguments: games (max number of rounds), points (number of ponts for winning), time (time to answer in seconds). Commands:

 - `g [pokemon]` - To guess the pokemon
 - `view` - To view the game status
 - `end` - To force end the game

**Rock, paper, scissors**. Single command game: `rps [rock/paper/scissors]`

**Ambush**. Arguments: roundtime (time per round). Commands:

 - `in` - To join the game. Use `out` to leave
 - `players` - To view the players list
 - `start` - To start the game
 - `fire [user]` - To kill other players
 - `end` - To force end the game

**Pass-The-Bomb**. Arguments: maxplayers (max number of players). Commands:

 - `in` - To join the game. Use `out` to leave
 - `players` - To view the players list
 - `start` - To start the game
 - `pass [user]` - To pass the bomb to another user
 - `end` - To force end the game

Youtube
------------

Commands for Youtube link recognition feature

 - `youtube [on/off]` - Enable / Disable YouTube link recognition

Auto-Invite
------------

Commands for auto-invite feature

  - `reloadroomauth [room]` - Reload roomauth if the autoinvite feature is not working well
  - `getroomauth [room]` - Upload roomauth to hastebin (dev command)

Group Chats
------------

Automated Promotion

 - `setautorank [on/off]` - Enable or disable automated promotion in a room
 - `autorank [rank/off]` - Set the autopromotion rank for all users when joining the room
 - `autorank [user], [rank/deauth]` - Set the autopromotion rank for a single user
 - `listautorank` - Upload the autopromotion list to Hastebin

Welcome private message. This can be spammable, much caution!

 - `wpm [enable / disable]` - Enable or disable this feature in a room. Only for excepted users.
 - `wpm view` - View the welcome private message set in a room
 - `setwpm [message]` - Set the welcome private message for a room
 - `delwpm` - Remove the welcome private message for a room

Developing commands for GroupChats feature

 - `ignoregroupchat [groupchat]` - temporarily ignore a groupchat (to leave a groupchat). Then you must edit the config to make it permanent
 - `unignoregroupchat [groupchat]` - unignore a groupchat

Auctions
------------

- `makeauction [name], [startmoney]` - Creates a new auction with chosen name, startmoney is optional. If used by a room owner it is automatically bound to the current room

Auction owner commands
If the auction is not bound the name of the auction will need to be included between `auction` and the command.

- `auction delete` - Delete auction
- `auction bind` - Bind auction to current room
- `auction unbind` - Unbind auction from current room
- `auction settype [auction/draft]` - Set the type of the auction, draft does not use money
- `auction minplayers [number]` - Set the minimum amount of players needed
- `auction maxplayers [number]` - Set the maximum amount of players, used in draft
- `auction minbid [number]` - Lowest allowed bid, also the default bid when a nomination is made
- `auction bidtimer [Full time], [Warning time]` - Set the amount of time allowed for each bid (when the timer reaches 0 last bid gets the nominated player)
- `auction bidtimer off` - Turn off the bidding timer, not recommended for an auction type
- `auction nomtimer [Full time], [Warning time]` - Set the amount of time allowed to make a nomination
- `auction nomtimer off` - Turn off the nomination timer
- `auction addowners [Owner1], [Owner2]...` - Adds additional owners to the auction
- `auction addteams [Team1]:[Manager1] ; [Team2]:[Manager2]...` - Adds teams to the auction
- `auction addmanagers [Team1]:[Manager1], [Manager2] ; [Team2]:[Manager3]...` - Adds managers to teams
- `auction addplayers [pastebin/hastebin link]` - Replaces the pool with the players from the pastebin, the format is either 1 name per row or according to the example (from spl) format here: https://pastebin.com/raw/jPTbJBva (the first row must not have a player)
- `auction addplayer [Name]` - Add a lone player to the pool
- `auction addcredits [Amount], [Team1], [Team2]...` - Add credits to each specified team
- `auction trade [Team]:[Player], [Credits]` - Moves player to the specified team in exchange for credits, the credits are added to the players original team
- `auction suspendteam [Team]` - Suspends the specified team, making them unable to continue in the auction
- `auction unsuspendteam [Team]` - Unsuspends the specified team, enabling them to participate in the auction
- `auction assingplayers [Team]:[Player1], [Player2]...` - Moves players from the player pool to a team
- `auction report` - Get a hastebin with the auction object
- `auction run` - Start or resume the auction
- `auction allownom [Team]` - Moves forward in the nomination order until it is the specified team's turn
- `auction stop` - Stop a running auction, can be resumed
- `auction stopnom` - Stop the current nomination
- `auction undo` - Undo the last purchase, returns the auction to the state right after the purchase before the most recent one
- `auction reset` - Reset the auction, all players are moved back to the player pool and all teams are given the starting credits
- `auction hardreset` - In addition to doing what reset does, it also removes all managers

Auction manager commands

- `pick [Name]` - Pick a player, can only be used in a draft
- `nom [Name]` - Nominate a player, can only be used in an auction
- `bid [Amount]` - Bids on the current nomination, bids need to be multiples of 500, if the bid is less than 500 it will attempt to multiply the amount by 1000. Can also be used with `.[amount]`
- `pricelist` - Get a pricelist of all players that have been bought

Usable by anyone

- `auction team [Name]` - Information about a team
- `auction info` - Information about all teams
- `auction players` - Get a hastebin with the players left in the pool
