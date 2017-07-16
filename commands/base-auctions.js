'use strict';
////////////////////////////////////////////////////////////////////////////////
//                                                                            //
// Requested by Ana1ytic, this is an spl auction implementation               //
//                                                                            //
////////////////////////////////////////////////////////////////////////////////
//                                                                            //
//  Documentation                                                             //
//    .makeauction NAME, STARTMONEY                                           //
//      if used in a room and user is RO, the auction will bind to the room.  //
//    .auction bind/unbind                                                    //
//    .auction delete                                                         //
//    .auction addmanagers                                                    //
//    .auction allownom TEAMNAME                                              //
//    .auction stopnom                                                        //
//    .auction nom PLAYER                                                     //
//    .auction bid AMOUNT                                                     //
//    .auction teaminfo TEAMNAME                                              //
//                                                                            //
////////////////////////////////////////////////////////////////////////////////

const minPlayers = 9;
const minBid = 3000;
const bidTime = [7, 5];

if (!global.auctions) global.auctions = require('./../data/auctions.json');
if (!global.auction_timer) global.auction_timer = {};
if (!global.auction_backup) global.auction_backup = {};

var auctionsfile_busy = false;
var auctionsfile_needUpdate = false;

function saveAuctions() {
	if (auctionsfile_busy) {
		auctionsfile_needUpdate = true;  // file is busy, save afterwards
	} else {
		auctionsfile_needUpdate = false;
		auctionsfile_busy = true;
		// saving now..
		fs.writeFile('./data/auctions.json', JSON.stringify(auctions, null, 4),
			function (err) {
				global.auctions = auctions;
				auctionsfile_busy = false;
				// after save.. if it's been modified we need to save again.
				if (err) return console.log(err);
				if (auctionsfile_needUpdate)
					saveAuctions();
			}
		);
	}
}

function ExtractKeyword(argString, Keywords) {
	// argString must be an object, so that it can be modified like a var parameter
	var pos;
	var target = argString.toLowerCase() + ' ';
	for (var k in Keywords) {
		pos = target.indexOf(Keywords[k].toLowerCase() + ' ');
		if (pos >= 0) {
			if (argString.substring(0, pos).trim())
				continue; // there's letters before the keyword. But it's only a match if it's the first word.
			var temp = argString.substring(pos + Keywords[k].length).trim();
			argString.valueOf = argString.toSource = argString.toString = function() {
				return temp;
			};
			return Keywords[k];
		}
	}
	return '';
}

// maximum credits a team may spend on their next buy
let allowance = (team) => team.credits + minBid * Math.min(0, team.players.length - minPlayers + 1);

let manual = [
	"Green bars represent the amount of credits a team has left",
	"The red portion is reserved for future purchases (${minBid} credits for each vacant team slot)",
	"The number below the red portion shows how many credits are reserved. The one next to it, how many can be spent on the next bid.",
	Tools.makeHtmlList(
		Tools.makeHtmlTable([
			[".makeauction spl, 140000",              "Create an auction named spl with 140000 credits for each team.<br>If used by a room owner, this automatically binds the auction to the room"],
			[".auction spl bind",                     "Binds spl to the room it is used in"],
			[".auction report",                       "Shows the bot's internal state / auction data"],
			[".auction addmanagers test: isa",        "Adds user isa as a manager to team \"test\""]
		], ["style='vertical-align:top'", ""])
	, "Auction Owner Commands"),
	Tools.makeHtmlList(
		Tools.makeHtmlTable([
			[".nom PLAYERNAME",                       "nominates the player for auction.<br>only works if it\'s your turn."],
			[".4 OR .4000 OR .bid 4 OR .bid 4000",    "bids 4k on the player."],
			[".4.5 OR .4500 OR .bid 4.5 OR .bid 4.5", "bids 4.5k on the player."],
			[".auction info",                         "shows an overview of the auction"],
			[".auction info managers",                "like the previous, but shows managers instead of players"]
		], ["style='vertical-align:top'", ""])
	, "Team Manager Commands")
];
manual = Tools.makeHtmlList(manual, "SPL Bot Manual (work in progress)");
//Team Raiders
//.auction addplayers http://hastebin.com/xyzazyetcetc - adds players to the player list from a hastebin shaped like the Google Sheets
//
//.auction run - starts the auction
//.auction reset - resets team money and players bought, doesn't reset 
//
//managers
//.auction hardreset - resets the same as the above command + managers
//
//.stopnom - stops the current nomination. 
//.auction allownom TEAMNAME - sets TEAMNAME up to nominate.

let makeAuctionOverview = (auction, arg) => {
	let teamPlayers = "";
	let table = Object.keys(auction.teams).map((t, i) => {
		let team = auction.teams[t];
		let creditsCell = `<div ${Tools.makeHtmlProgressbar( team.credits / auction.startmoney, "#8a8" )}>`;
		let reserved = (team.credits - allowance(team)) / team.credits;
		if (reserved > 0)
			creditsCell += `<div ${Tools.makeHtmlProgressbar(reserved, "rgba(0,0,0,0)", true, 45, "#e60000", [0,4,4,5])}>`;
		creditsCell += `<div style='width: 105px'>${team.credits.toLocaleString().replace(/,/g, " ")}</div>`;
		creditsCell += "</div>";
		if (reserved > 0)
			creditsCell += "</div>";
		if (t === auction.bidder)
			creditsCell += `<div ${Tools.makeHtmlProgressbar(auction.bid / auction.startmoney, "yellow")}></div>`;
		
		creditsCell += `<br><span style='font-size:80%'><table style="width: 100%; border-spacing: 0"><tr><td style="text-align: left">${(team.credits - allowance(team)).toLocaleString().replace(/,/g, " ")}</td><td style="text-align: right">${allowance(team).toLocaleString().replace(/,/g, " ")}</td></tr></table></span>`;
		
		let managers = team.managers.slice(0, 2).map( m => Tools.colorName(m, true) ).join(", ");
		let extraBidders = team.managers.slice(2).map( s => Tools.escapeHTML(s) ).join(", ");
		if (extraBidders) extraBidders = `<span title='${extraBidders}'>(+${team.managers.slice(2).length})</span>`;
		let playerNames = team.players.map( p => Tools.colorName(auction.players[p].name) ).join(", ");
		let playerCount = team.players.length ? `<span style='float:right'>${team.players.length}</span>` : "";
		let playerToolTip = team.players.map( u => Tools.escapeHTML(auction.players[u].name) ).join(", ");
		playerNames = `<div style='height:32px; min-height:32px; overflow:hidden; resize:vertical; position:relative'><span style='font-size:90%'>${playerCount}${playerNames}</span></div>`;
//		playerNames = `<span style='font-size:90%; position:relative'>${playerCount}<marquee direction='up' scrolldelay='1000' height='32px'>${playerNames}</marquee></span>`;
		
		let queue = auction.nomqueue.filter( q => !auction.teams[q].suspended && auction.teams[q].credits >= minBid );
		let nomQueueIndex = queue.lastIndexOf(t);
		let nomQueueIndex2 = queue.lastIndexOf(t, nomQueueIndex - 1);
		nomQueueIndex = nomQueueIndex === -1 ? "-" : queue.length - nomQueueIndex;
		nomQueueIndex2 = nomQueueIndex2 === -1 ? "-" : queue.length - nomQueueIndex2;
		if (nomQueueIndex >= auction.nomorder.length / 2)
			[nomQueueIndex, nomQueueIndex2] = [nomQueueIndex2, nomQueueIndex];
		
		let rowBGColor = i % 2 === 0 ? "241,244,246,1" : "209,211,212,1";
		if (t === auction.allownom) {
			rowBGColor = "232,232,154,1";
			[nomQueueIndex, nomQueueIndex2] = [0, Math.min(nomQueueIndex, nomQueueIndex2)];
		}
		return `<tr style='background-color:rgba(${rowBGColor}); color:black'><td align='right'>${nomQueueIndex}</td><td align='right'>${nomQueueIndex2}</td><td style='white-space:nowrap'>${team.name}<br><span style='font-size:90%'>${managers} ${extraBidders}</span></td><td style='text-align:right'>${creditsCell}</td><td align='center' title='${playerToolTip}'><div style='min-height:32px; overflow:hidden'>${playerNames}</div></td></tr>`;
	}).join("");
	table = "<table style='border:1px solid #6688aa; border-radius:10px'><tr><th colspan='2' style='border-bottom:1px solid #94b8b8; padding:5px'>Nom<br>Order</th><th style='border-bottom:1px solid #94b8b8; padding:5px'>Team</th><th style='border-bottom:1px solid #94b8b8; padding:5px; width:95px'>Credits</th><th style='border-bottom:1px solid #94b8b8; padding:5px'>Players</th></tr>" + table + "</table>";
	let playerpool = Object.keys(auction.players).filter( p => !auction.players[p].team ).map( p => Tools.colorName(auction.players[p].name) );
	playerpool = `<details><summary>Players remaining in the pool (${playerpool.length})</summary><span style='font-size:90%'>${playerpool.join(", ")}</span></details>`;
	return `<div style="overflow-x:auto"><center>${table}</center><br>${playerpool}${manual}</div>`;
}

global.importPlayers = (auction, context, data, singlecolumn = false) => {
	let newPlayers = {};
	data = data.split(/\r?\n/).map( x => x.split("\t") );
	for(let i = 1; i < data.length; i++){
		let p = toId(data[i][0]);
		let tiers = [];
		if (!singlecolumn) {
			for(let j = 1; j < data[i].length; j++){
				if(["y", "Y", "\u2713", "\u2714"].includes(data[i][j]))
					tiers.push(data[0][j]);
			}
		}
		newPlayers[p] = {
			"name": data[i][0],
			"description": "Tiers: " + (singlecolumn ? data[i][1] : tiers.join(", ")),
			"team": auction.players[p] && auction.players[p].team || false
		};
	}
	auction.players = newPlayers;
	context.reply("Player list imported from hastebin.");
};

Settings.addPermissions(['makeauction', 'auction']);

const aucCmds = ['delete', 'bind', 'unbind', 'addmanagers', 'addmanager', 'addteams', 'addteam', 'addcredits', 'trade', 'suspendteam', 'suspendteams', 'unsuspendteam', 'unsuspendteams', 'addplayer', 'addplayers', 'assignplayers', 'allownom', 'stopnom', 'undo', 'run', 'stop', 'reset', 'hardreset',
	'report', 'nom', 'nominate', 'bid', 'team', 'teaminfo', 'info', 'players'];

exports.commands = {
	makeauction: function(arg, by, room, cmd) {
		/* creates an auction with (by) as the only owner. If (by) is a room owner, the room the command is
		used in becomes linked to the auction and any events within it will be broadcast to the room. */
		arg = arg.split(',').map( s => s.trim() );
		by = toId(by);
		arg[0] = toId(arg[0]);
		if (!arg[0])
			return this.restrictReply('Usage: ``.makeauction NAME`` or ``.makeauction NAME, STARTMONEY``. If the command is used by a room owner inside a room, the auction will auto-bind to that room and broadcast to it.', 'makeauction');
		if (auctions[arg[0]])
			return this.restrictReply('An auction with this name already exists.', 'makeauction');
		var auction = auctions[arg[0]] = {
			name: arg[0],
			startmoney: Number(arg[1]) || 100000,
			owners: [by],
			rooms: [],            // rooms that events in this auction will broadcast to
			managers: {},         // users able to use management commands
			teams: {},            // teams that may bid in this auction
			running: false,
			allownom: false,      // the team currently allowed to nominate
			nomorder: [],      // array that specifies in which order teams get to nominate
			nomqueue: [],       // array with the next planned nominations (last to first)
			nommedplayer: false,  // id of the nominated player
			bid: false,           // current bid
			bidder: false,        // last team to bid
			players: {}           // list of players up for auctioning
		};
		this.restrictReply('Auction **' + arg[0] + '** has been created.', 'makeauction');
		if (this.can('makeauction')) {
			auction.rooms.push(room);
			var oldAuction = auctions.defaults[room];
			if (oldAuction) auctions[oldAuction].rooms.filter( s => s !== room );
			auctions.defaults[room] = arg[0];
			this.restrictReply(`**${auction.name}** has been bound to this room. The room will now be notified of any events in this auction. (Do \`\`.auction unbind\`\` to reverse this.)`, 'auction');
		}
		return saveAuctions();
	},
	auc: 'auction',
	auction: function(arg, by, room, cmd) {
		by = toId(by);
		arg = Object(arg); // required for ExtractKeyword() to modify this string

		// which auction is this referring to and which action should be performed?
		var auction = ExtractKeyword(arg, Object.keys(auctions));
		var keyword = ExtractKeyword(arg, aucCmds);
		if (!auction) {
			// no auction specified? Maybe there is a default for this room.
			if (auctions.defaults[room]) auction = auctions.defaults[room];
			else {
				keyword = '';  // no auction specified. Give usage help.
				this.restrictReply('No auction specified.', 'auction');
			}
		}
		auction = auctions[auction];
		arg = arg.toString();
		switch (keyword) {

/* Usage Help ****************************************************************/

			case '': {
				if (auction) {
					this.restrictReply('Usage: ``.auction COMMAND``.', 'auction');
				} else {
					this.restrictReply('Usage: ``.auction NAME COMMAND``. NAME can be ommitted if the room has a default auction. ' +
						'Room owners can use ``.auction NAME bind`` to set the default auction.', 'auction');
				}
				this.restrictReply('Command list: Room Owners - ``bind, unbind``. ' +
					'Auction Owners - ``unbind, delete, addmanagers, allownom TEAMNAME, stopnom``. ' +
					'Team Managers - ``nom PLAYER, bid AMOUNT``. Anyone - ``teaminfo TEAMNAME``', 'auction');
				return;
			}

/* Auction Owner Commands ****************************************************/

			case 'delete': {
				if (auction.owners.indexOf(by) < 0 && !this.isRanked('&'))
					return this.restrictReply('You do not have permission to do this.');
				for (var r in auction.rooms) {
					if (auctions.defaults[auction.rooms[r]])
						delete auctions.defaults[auction.rooms[r]];
				}
				var temp = auction.name;
				delete auctions[auction.name];
				this.aucBroadcast(auction, 'Auction **' + temp + '** has been deleted.');
				return saveAuctions();
			}
			case 'bind': {
				let rank;
				if (Settings.settings.makeauction && Settings.settings.makeauction[room])
					rank = Settings.settings.makeauction[room];
				else rank = "#";
				if (!this.can('makeauction'))
					return this.restrictReply('Rank ' + rank + ' required for binding auctions to this room.', 'auction');
				if (auction.rooms.indexOf(room) >= 0 && auctions.defaults[room] === auction.name)
					return this.restrictReply('This auction is already broadcasting to this room.', 'auction');
				auction.rooms.push(room);
				auctions.defaults[room] = auction.name;
				this.restrictReply('**' + auction.name + '** has been bound to this room. ' +
					'The room will now be notified of events in this auction.', 'auction');
				return saveAuctions();
			}
			case 'unbind': {
				let rank;
				if (Settings.settings.makeauction && Settings.settings.makeauction[room])
					rank = Settings.settings.makeauction[room];
				else rank = "#";
				if (!this.can('makeauction') && auction.owners.indexOf(by) < 0)
					return this.restrictReply('Rank ' + rank + ' required for unbinding auctions from this room.', 'auction');
				if (auction.rooms.indexOf(room) < 0 && auctions.defaults[room] !== auction.name)
					return this.restrictReply('That auction is not broadcasting to this room.', 'auction');
				auction.rooms.filter( r => r !== room );
				delete auctions.defaults[room];
				this.restrictReply('**' + auction.name + '** has been unbound from this room. ' +
					'The room will no longer be notified of events in this auction.', 'auction');
				return saveAuctions();
			}
			case 'addmanagers':
			case 'addmanager':
			case 'addteams':
			case 'addteam': {
				if (auction.owners.indexOf(by) < 0 && !this.isRanked('&'))
					return this.restrictReply('Only auction owners can modify teams.', 'auction');
				if (!arg.toString()) return this.restrictReply('Usage: ``.auction NAME addmanagers ' +
					'TEAMNAME:MANAGER,MANAGER2,..``. Accepts multiple teams at once, separated by ``;``.', 'auction');
				arg = arg.split(';').map( s => s.split(':').map( x => x.trim() ) );
				for (let t in arg) {
					let id = toId(arg[t][0]);
					if (!id) continue;
					if (!auction.teams[id]) {
						if (auction.teams[Object.keys(auction.teams)[id]])
							id = Object.keys(auction.teams)[id];
					}
					if (!auction.teams[id]) {
						if (keyword !== 'addteam' && keyword !== 'addteams')
							return this.restrictReply(`Team "${id}" does not exist. Use \`\`.auction addteam ${arg[t][0]}\`\` to create it.`, 'auction');
						auction.teams[id] = {
							name: arg[t][0],
							credits: auction.startmoney,
							managers: [],
							players: []
						};
					}
					if (arg[t][1]) {
						var newManagers = arg[t][1].split(',').map(toId);
						for (var m in newManagers) {
							if (auction.teams[id].managers.indexOf(newManagers[m]) < 0) {
								auction.teams[id].managers.push(newManagers[m]);
								auction.managers[newManagers[m]] = id;
							}
						}
					}
				}
				this.aucBroadcast(auction, 'Teams in auction **' + auction.name + '** are now: ' +
					Object.keys(auction.teams).map( t => auction.teams[t].name ).join(', ') + '. Type ``.auction team ' +
					'TEAMNAME`` for info on a team.', 'auction');
				return saveAuctions();
			}
			case 'addplayer':
			case 'addplayers': {
				if (auction.owners.indexOf(by) < 0 && !this.isRanked('&'))
					return this.restrictReply('Only auction owners can modify the player list.');
				if (!arg.toString()) return this.restrictReply('Usage: ``.auction addplayers ' +
					'PLAYERNAME:DESCRIPTION``. Accepts multiple players at once, separated by ``;``. Or ``.auction HASTEBINLINK`` with a c&p from google spreadsheets.');
				if (/hastebin\.com/.test(arg)) {
					let context = this;
					return Tools.loadHastebin(arg,
						function onLoad(data) {
							return importPlayers(auction, context, data);
						},
						function onError(error) {
							context.reply("An error occurred while fetching the requested hastebin.");
						}
					);
				}
				arg = arg.split(';').map( s => s.split(':') );
				for (var t in arg) {
					var playername = toId(arg[t][0]);
					if (!playername) continue;
					auction.players[playername] = {
						name: playername,
						description: arg[t][1] ? arg[t][1].trim() : "",
						team: false
					};
				}
				this.aucBroadcast(auction, 'Players in auction **' + auction.name + '** are now: ' +
					Object.keys(auction.players).join(', ') + '.');
				return saveAuctions();
			}
			case 'addcredits': {
				if (auction.owners.indexOf(by) < 0 && !this.isRanked('&'))
					return this.restrictReply('Only auction owners can add credits to teams.');
				let args = arg.split(',').map(toRoomid);
				let amount = parseInt(args[0], 10);
				if (!amount) return this.reply('Usage: ``.addcredits AMOUNT, TEAM, TEAM, TEAM, ...``.');
				for (let t = 1; t < args.length; t++) {
					if (!auction.teams[args[t]]) {
						if (auction.teams[Object.keys(auction.teams)[args[t]]])
							args[t] = Object.keys(auction.teams)[args[t]];
						else return this.reply(`Team ${args[t]} not found.`);
					}
				}
				for (let t = 1; t < args.length; t++)
					auction.teams[args[t]].credits += amount;
				this.reply(`${amount} credits added.`);
				return saveAuctions();
			}
			case 'trade': {
				if (auction.owners.indexOf(by) < 0 && !this.isRanked('&'))
					return this.restrictReply('Only auction owners can move players between teams.');
				if (!arg.toString()) return this.restrictReply('Usage: ``.auction trade ' +
					'TEAMNAME:PLAYER,CREDITS`` (PLAYER is moved to TEAMNAME in exchange for CREDITS). Accepts multiple trades at once, separated by ``;``.');
				arg = arg.split(';').map( s => s.split(':') );
				for (let t in arg) {
					let id = toId(arg[t][0]);
					if (!id) continue;
					if (!auction.teams[id])
						return this.reply(`Team "${arg[t][0]}" not found.`);
					if (!arg[t][1])
						return this.reply(`Invalid arguments.`);
					let tradeSet = arg[t][1].split(',').map(toId);
					if (tradeSet.length < 2)
						return this.reply(`Invalid arguments.`);
					if (!auction.players[tradeSet[0]])
						return this.reply(`Player "${tradeSet[0]}" not found.`);
					if (!auction.players[tradeSet[0]].team)
						return this.reply(`Player "${tradeSet[0]}" is currently not on a team.`);
					let originTeam = auction.players[tradeSet[0]].team;
					let amount = parseInt(tradeSet[1]);
					if (auction.teams[id].credits < amount)
						return this.reply(`Team "${id}" has insufficient credits.`);
					auction.teams[id].credits -= amount;
					auction.teams[originTeam].credits += amount;
					auction.teams[originTeam].players = auction.teams[originTeam].players.filter( x => x !== tradeSet[0] );
					auction.teams[id].players.push(tradeSet[0]);
					auction.players[tradeSet[0]].team = id;
					this.aucBroadcast(auction, `Player **${tradeSet[0]}** has been moved to team **${id}** from team **${originTeam}** in exchange for **${amount}** credits.`);
				}
				return saveAuctions();
			}
			case 'unsuspendteam':
			case 'suspendteam':
			case 'unsuspendteams':
			case 'suspendteams': {
				if (auction.owners.indexOf(by) < 0 && !this.isRanked('&'))
					return this.restrictReply('Only auction owners may suspend or unsuspend teams from the auction.');
				let suspend = (keyword === "suspendteam" || keyword === "suspendteams");
				let teams = arg.split(',').map(toId).filter( x => x );
				for (let t in teams) {
					let team = teams[t];
					if (!auction.teams[team]) {
						if (Object.keys(auction.teams)[team])
							team = teams[t] = Object.keys(auction.teams)[team];
						else return this.reply(`Team ${team} not found.`);
					}
					if ((suspend && auction.teams[team].suspended) || (!suspend && !auction.teams[team].suspended))
						return this.reply(`Team ${team} is ${suspend ? "already" : "not"} suspended.`);
				}
				if (!teams.length) {
					if (keyword === 'suspendteams' || keyword === 'unsuspendteams')
						teams = Object.keys(auction.teams);
					else return this.reply('Usage: ``.(un)suspendteam TEAM, TEAM, TEAM..``, or simply ``.(un)suspendteams`` to (un)suspend all teams.');
				}
				for (let team of teams) {
					if (suspend)
						auction.teams[team].suspended = true;
					else delete auction.teams[team].suspended;
				}
				this.reply(`Teams ${teams.join(', ')} have been ${suspend ? '' : 'un'}suspended.`);
				return saveAuctions();
			}
			case 'assignplayers': {
				if (auction.owners.indexOf(by) < 0 && !this.isRanked('&'))
					return this.restrictReply('Only auction owners can assign players to teams.');
				if (!arg.toString()) return this.restrictReply('Usage: ``.auction NAME assignplayers ' +
					'TEAMNAME:PLAYER,PLAYER2,..``. Accepts multiple teams and player lists at once, separated by ``;``.');
				arg = arg.split(';').map( s => s.split(':') );
				for (let t in arg) {
					let id = toId(arg[t][0]);
					if (!id) continue;
					if (!auction.teams[id])
						return this.reply(`Team "${arg[t][0]}" not found.`);
					if (arg[t][1]) {
						var newPlayers = arg[t][1].split(',').map(toId);
						for (let p of newPlayers) {
							if (auction.teams[id].players.indexOf(p) < 0) {
								auction.teams[id].players.push(p);
								if (auction.players[p].team)
									auction.teams[auction.players[p].team].players = auction.teams[auction.players[p].team].players.filter( x => x !== p );
								auction.players[p].team = id;
							}
						}
					}
				}
				this.aucBroadcast(auction, 'Teams in auction **' + auction.name + '** are now: ' +
					Object.keys(auction.teams).map( t => auction.teams[t].name ).join(', ') + '. Type ``.auction team ' +
					'TEAMNAME`` for info on a team.', 'auction');
				return saveAuctions();
			}
			case 'report': {
				if (auction.owners.indexOf(by) < 0 && !this.isRanked('&'))
					return this.restrictReply('You do not have permission to do this.');
				return this.hastebinReply('Auction object: ', JSON.stringify(auction, null, 4));
			}
			case 'run': {
				if (auction.owners.indexOf(by) < 0 && !this.isRanked('&'))
					return this.restrictReply('You do not have permission to do this.');
				if (auction.running)
					return this.restrictReply('The auction is already running.', 'auction');
				auction.nomorder = Object.keys(auction.teams).concat(Object.keys(auction.teams).reverse());
				auction.nomqueue = [].concat(auction.nomorder, auction.nomorder);
				auction.running = true;
				this.restrictReply('**' + auction.name + '** is now autoselecting who gets to nominate players.', 'auction');
				
				auction.allownom = auction.nomqueue.pop();
				while (auction.teams[auction.allownom].suspended || auction.teams[auction.allownom].credits < minBid) {
					if (auction.nomqueue.length === 0) {
						auction.running = false;
						this.aucBroadcast(auction, `Auction **${auction.name}** has ended because every team has less than ${minBid} Credits left.`);
						return saveAuctions();
					}
					auction.allownom = auction.nomqueue.pop();
				}
				if (Tools.botIsRanked(room, '*')) this.aucHtmlBroadcast(auction, makeAuctionOverview(auction));
				this.aucBroadcast(auction, 'It is now **' + auction.teams[auction.allownom].name + '**\'s turn to nominate a player for auction. Managers: ' + auction.teams[auction.allownom].managers.join(", "));
				return saveAuctions();
			}
			case 'allownom': {
				if (auction.owners.indexOf(by) < 0 && !this.isRanked('&'))
					return this.restrictReply('You do not have permission to do this.');
				arg = toId(arg);
				if (!auction.teams[arg]) return this.restrictReply('Usage: ``.auction allownom teamname``', 'auction');
				if (auction.nomorder.indexOf(arg) >= 0) {
					if (auction.nomqueue.length < 2 * auction.nomorder.length)
						auction.nomqueue = auction.nomorder.concat(auction.nomorder, auction.nomqueue);
					while (auction.nomqueue.pop() !== arg);  // pop elements until the team is found
				}
				auction.allownom = arg;
				this.aucBroadcast(auction, `It is now **${auction.teams[arg].name}**\'s turn to nominate a player for auction. Managers: ${auction.teams[arg].managers.join(", ")}`);
				return saveAuctions();
			}
			case 'stop': {
				if (auction.owners.indexOf(by) < 0 && !this.isRanked('&'))
					return this.restrictReply('You do not have permission to do this.');
				if (!auction.running)
					return this.restrictReply('The auction is already stopped.', 'auction');
				auction.running = false;
				saveAuctions();  // ".auction stop" also calls ".auction stopnom", so no return statement here
			}
			case 'stopnom': {
				if (auction.owners.indexOf(by) < 0 && !this.isRanked('&'))
					return this.restrictReply('You do not have permission to do this.');
				var theNom;
				if (auction.allownom) theNom = auction.allownom;
				else if (auction.nommedplayer) theNom = auction.nommedplayer;
				else return this.restrictReply('There is no nomination to be canceled.', 'auction');
				clearTimeout(auction_timer[toId(auction.name)]);
				auction.allownom = auction.nommedplayer = auction.bid = auction.bidder = false;
				this.aucBroadcast(auction, theNom + '\'s nomination has been cancelled.');
				return saveAuctions();
			}
			case 'undo': {
				if (auction.owners.indexOf(by) < 0 && !this.isRanked('&'))
					return this.restrictReply('Only auction owners may undo the last bid.', 'auction');
				if (!global.auction_backup[toId(auction.name)])
					return this.restrictReply(`No backup found for auction ${auction.name}`);
				auction = auctions[toId(auction.name)] = global.auction_backup[toId(auction.name)];
				if (Tools.botIsRanked(room, '*')) this.aucHtmlBroadcast(auction, makeAuctionOverview(auction));
				this.aucBroadcast(auction, `It is now **${auction.teams[auction.allownom].name}**'s turn to nominate a player for auction. Managers: ${auction.teams[auction.allownom].managers.join(", ")}`);
				return saveAuctions();
			}
			case 'hardreset':
			case 'reset': {
				if (auction.owners.indexOf(by) < 0 && !this.isRanked('&'))
					return this.restrictReply('You do not have permission to do this.');
				for (var p in auction.players)
					auction.players[p].team = false;
				for (var t in auction.teams) {
					auction.teams[t].credits = auction.startmoney;
					auction.teams[t].players = [];
					delete auction.teams[t].suspended;
				}
				delete global.auction_backup[toId(auction.name)];
				auction.running = auction.allownom = auction.nommedplayer = auction.bid = auction.bidder = false;
				auction.nomqueue = auction.nomorder = [];
				this.aucBroadcast(auction, 'Auction **' + auction.name + '** has been reset and will start from zero again. All teams have ``' + auction.startmoney + '`` credits, and all players are available for purchase.');
				if (keyword === "hardreset") {
					auction.managers = {};
					for (let t in auction.teams)
						auction.teams[t].managers = [];
					this.aucBroadcast(auction, 'The list of managers has been cleared.');
				}
				return saveAuctions();  // ".auction stop" also calls ".auction stopnom", so no return statement here
			}

/* Team Manager Commands *****************************************************/

			case 'nom':
			case 'nominate': {
				arg = toId(arg);
				if (!auction.players[arg])
					return this.restrictReply('Player not recognized. Usage: ``.auction nominate PLAYERNAME``.', 'auction');
				if (auction.players[arg].team)
					return this.restrictReply('That player is already on team ' + auction.players[arg].team + '.', 'auction');
				if (auction.managers[by] !== auction.allownom && auction.owners.indexOf(by) < 0 && !this.isRanked('&')) {
					if (!auction.managers[by])
						return this.restrictReply('Only team managers and auction owners may nominate players.', 'auction');
					return this.restrictReply('It is not your turn to nominate yet. (Auction owners may use ' + 
						'``.allownom TEAMNAME`` to give permission.)', 'auction');
				}
				if (auction.nommedplayer)
					return this.restrictReply('Already nominated ' + auction.nommedplayer, 'auction');
				global.auction_backup[toId(auction.name)] = JSON.parse(JSON.stringify(auction));
				auction.nommedplayer = arg;
				if (bidTime[0]) {
					this.aucBroadcast(auction, `${by} from **${auction.teams[auction.managers[by]].name}** has nominated **${auction.players[arg].name}** for auction. **${auction.players[arg].description.trim()}**`);
				}
				arg = minBid;
				// no return statement. nominate always calls bid, nomming a player bids the min bid on them.
			}
			case 'bid': {
				if (!auction.managers[by]) return this.restrictReply('Only team managers may bid on players.', 'auction');
				if (!auction.nommedplayer) return this.restrictReply('No player is up for auction.', 'auction');
				if (Number(arg) != arg)
					return this.restrictReply('Please enter the amount of credits you want to bid, in multiples of 500.', 'auction');
				if (arg % 500 !== 0)
					arg *= 1000;
				if (arg % 500 !== 0)
					return this.restrictReply('Please enter the amount of credits you want to bid, in multiples of 500.', 'auction');
				if (Number(arg) <= auction.bid)
					return this.restrictReply('You have to bid more credits than the previous offer.', 'auction');
				if (Number(arg) > auction.teams[auction.managers[by]].credits) {
					return this.restrictReply('Your team does not have enough funds. Remaining credits: ``' + auction.teams[auction.managers[by]].credits + '``.', 'auction');
				}
				if (auction.teams[auction.managers[by]].suspended) {
					return this.restrictReply('Your team is suspended and cannot bid.', 'auction');
				}
				if (arg > allowance(auction.teams[auction.managers[by]])) {
					return this.restrictReply('Your team does not have enough funds. Remaining credits: ``' +
						auction.teams[auction.managers[by]].credits + "``. " + `Remember you will need to buy at least ${minPlayers} players.`, 'auction');
				}
				auction.bidder = auction.managers[by];
				auction.bid = arg;
				if (bidTime[0])
					this.aucBroadcast(auction, `${by}[${auction.teams[auction.managers[by]].name}]: **${auction.bid}**.`);
				
				clearTimeout(auction_timer[toId(auction.name)]);
				auction_timer[toId(auction.name)] = setTimeout(() => {
					if (bidTime[1])
						this.aucBroadcast(auction, `__${bidTime[1]} seconds remaining!__`);
					auction_timer[toId(auction.name)] = setTimeout(() => {
						auction.teams[auction.bidder].credits -= arg;
						auction.teams[auction.bidder].players.push(auction.nommedplayer);
						auction.players[auction.nommedplayer].team = auction.bidder;
						this.aucBroadcast(auction, `**${auction.teams[auction.bidder].name}** has bought **${auction.players[auction.nommedplayer].name}** for ${auction.bid}!`);
						if (!auction.running) {
							auction.allownom = false;
							if (Tools.botIsRanked(room, '*')) this.aucHtmlBroadcast(auction, makeAuctionOverview(auction));
							return saveAuctions();
						}
						if (auction.nomqueue.length < 2 * auction.nomorder.length)
							auction.nomqueue = auction.nomorder.concat(auction.nomorder, auction.nomqueue);
						auction.allownom = auction.nomqueue.pop();
						while (auction.teams[auction.allownom].suspended || auction.teams[auction.allownom].credits < minBid) {
							if (auction.nomqueue.length === 0) {
								auction.allownom = false;
								if (Tools.botIsRanked(room, '*')) this.aucHtmlBroadcast(auction, makeAuctionOverview(auction));
								auction.nommedplayer = auction.bid = auction.bidder = auction.running = false;
								this.aucBroadcast(auction, `Auction **${auction.name}** has ended because every team has less than ${minBid} Credits left.`);
								return saveAuctions();
							}
							auction.allownom = auction.nomqueue.pop()
						}
						if (Tools.botIsRanked(room, '*')) this.aucHtmlBroadcast(auction, makeAuctionOverview(auction));
						auction.nommedplayer = auction.bid = auction.bidder = false;
						this.aucBroadcast(auction, `It is now **${auction.teams[auction.allownom].name}**'s turn to choose a player. Managers: ${auction.teams[auction.allownom].managers.join(", ")}`);
						return saveAuctions();
					}, 1000 * bidTime[1]);
				}, 1000 * bidTime[0]);
				
				return saveAuctions();
			}

/* Reg-User Commands *********************************************************/

			case 'teaminfo':
			case 'team': {
				let theTeam = auction.teams[toId(arg)];
				if (!theTeam) {
					if (auction.teams[Object.keys(auction.teams)[toId(arg)]]) theTeam = auction.teams[Object.keys(auction.teams)[toId(arg)]];
					else if (auction.managers[by] && !arg) theTeam = auction.teams[auction.managers[by]];
					else return this.restrictReply('No team goes by that name here.', 'auction');
				}
				this.restrictReply(`Team ${theTeam.name}: \`\`${theTeam.credits}\`\` credits. Managers: ${theTeam.managers.join(', ')}. \`\`${theTeam.players.length}\`\` Players: ${theTeam.players.join(', ')}`, 'auction');
				return;
			}
			case 'info': {
				if (this.roomType === 'chat') {
					return this.htmlReply(makeAuctionOverview(auction, arg));
					
				} else {
					let teams = auction.teams;
					let timer = 0;
					for (let team in teams) {
						let response = function (val, teams, team) {
							val.restrictReply(`Team ${teams[team].name}: \`\`${teams[team].credits}\`\` credits. Managers: ${teams[team].managers.slice(0, 2).join(', ')}. \`\`${teams[team].players.length}\`\` Players: ${teams[team].players.join(', ')}`, 'auction');
						}
						setTimeout(response, timer, this, teams, team);
						timer += 300;
					}
				}
				return;
			}
			case 'players': {
				var result = [];
				for (t in auction.teams)
					result.push(t + ' (' + auction.teams[t].credits + '): ' + auction.teams[t].players.join(', '));
				result.push('\r\nPlayers remaining in the pool' + (arg ? ' with a description containing ' + arg : '') + ':');
				for (p in auction.players) {
					if (!auction.players[p].team && (!arg || auction.players[p].description.toLowerCase().indexOf(arg.toLowerCase()) >= 0))
						result.push(auction.players[p].name + ': ' + auction.players[p].description);
				}
				return this.hastebinReply( `Players in ${auction.name}: `, result.join('\r\n') );
			}

		}
	}
};