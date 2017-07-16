Settings.addPermissions(['simplecoms', 'shorten', 'rmt']);

var uuTiers = ['Battle Factory', 'Challenge Cup 1v1', 'Gen 4 UU', 'Gen 5 UU', 'UU'];
var ouTiers = ['OR/AS OU', 'B/W OU', 'D/P/P OU', 'Challenge Cup 1v1'];
var ubersTiers = ['Ubers', 'Challenge Cup 1v1', 'B/W Ubers', 'D/P/P Ubers', 'ADV Ubers', 'Battle Factory'];
var battlespotTiers = ['Battle Spot Singles', 'Battle Spot Doubles', 'Battle Spot Triples', 'Random Battles', 'Kanto Classic'];

let htmlLists = {};

var gimbus = require('gimbus');

var tourInterval = {};
var tourRepeat = {};

if (!global.autotalkInterval) global.autotalkInterval = {};
if (!global.autotalkMsg) global.autotalkMsg = {};

exports.commands = {

	poll: 'tierpoll',
	tpoll: 'tierpoll',
	tierpoll: function(arg, by, room, cmd) {
		if (this.roomType !== 'chat' || !this.can('tournament')) return;
		if (room === "underused") {
			this.reply('/poll create Tournament Tier?,' + uuTiers);
			this.reply('/poll timer 2');
		}
		else if (room === "overused") {
			this.reply('/poll create Tournament Tier?,' + ouTiers);
			this.reply('/poll timer 2');
		}
		else if (room === "ubers") {
			this.reply('/poll create Tournament Tier?,' + ubersTiers);
			this.reply('/poll timer 2');
		}
		else if (room === "battlespot") {
			this.reply('/poll create Tournament Tier?,' + battlespotTiers);
			this.reply('/poll timer 2');
		}
	},
	etour: function(arg, by, room, cmd) {
		if (this.roomType !== 'chat' || !this.can('tournament')) return;
//        if (!this.isRanked('@')) {
//            return this.pmReply('Sorry, we had to restrict this command to @ and above because ' +
//                'otherwise it overrides the PS rank system. PM Orda-Y for details :[');
//        }
		arg = arg.split(',');
		if (room === "overused") {
			this.reply('/tour new ' + (arg[0] || 'gen7ou') + ', elimination, ' + (arg[1] || 64));
			this.reply('/tour autodq 2');
			this.reply('/tour forcetimer on');
			setTimeout(function() {
				this.reply('/wall Tournament rules: http://pastebin.com/Q2vi2CnK');
				this.reply('Good luck everyone :)');
				this.reply('/tour autostart on');
				if (arg[0] === 'ou')
					CommandParser.parse(room, by, '-tourjoin');
			}.bind(this), 1500);
			let details = {
				format: arg[0] || 'gen7ou',
				type: 'elimination',
				maxUsers: arg[1] || 64,
				timeToStart: null,
				autodq: 2,
				scout: 1
			};
			Features['tours'].newTour(room, details, true);
			Features['tours'].tournaments[room].timeToStart = null;
		}
		else {
			if (!arg[0]) return this.pmReply('Usage: ``.etour FORMAT``, for example ``.etour ou``');
			this.reply('/tour new ' + arg[0] + ', elimination' + (arg[1] ? ', ' + arg[1] : ''));
			if (room !== "ruinsofalph")
				this.reply('/tour autostart 2');
			this.reply('Good luck to all players');
			setTimeout(function() {
				if (room !== "ruinsofalph")
					this.reply('/tour autodq 2');
			}.bind(this), 2000);
			let details = {
				format: arg[0],
				type: 'elimination',
				maxUsers: arg[1] || null,
				timeToStart: null,
				autodq: 2,
				scout: 1
			};
			Features['tours'].newTour(room, details, true);
			Features['tours'].tournaments[room].timeToStart = null;
		}
	},
	shrtn: 'shorten',
	shorten: function(arg) {
		if (this.can('shorten')) return;
		var that = this;
		var url = arg;
		arg.trim();
		gimbus.shorten(url, function(short_url) {
			that.reply("Shortened URL is: " + short_url.remove(' '));
			gimbus.unshorten(short_url, function(url) {
				console.log(short_url.remove(' ') + " leads to " + url);
			});
		});
	},
	// formula for custom intervals: var * 60 * 1000

	autotour: function(arg, by, room, cmd) {
		if (this.roomType !== 'chat') return this.reply(this.trad('notchat'));
		if (!this.can('simplecoms')) return;
//        if (!this.isRanked('@')) {
//            return this.pmReply('Sorry, we had to restrict this command to @ and above because ' +
//                'otherwise it overrides the PS rank system. PM Orda-Y for details :[');
//        }
		arg = arg.split(',');
		var intervalTime = arg[0].replace(/[^0-9\.]/g, '') * 60 * 1000;
		if (!arg) return this.reply('Correct syntax: ``.autotour interval, tier``');

		if (arg[0] === 'off') {
			this.reply('Autotours disabled');
			clearInterval(tourInterval[room]);
			tourRepeat[room] = false;
			return;
		}

		// If time is incorrect or too short
		if (isNaN(intervalTime) || intervalTime < 5 * 60000) return this.reply('Please use a valid time interval, that is over 5 minutes.');
		
		if (tourRepeat[room] === true) return this.reply('Auto-tours are already enabled in this room.');
		this.reply('Tours [' + toId(arg[1]) + '] will auto-run every ' + intervalTime / 60000 + ' minutes.');

		// Initial run, only runs once
		this.reply('/tour new ' + toId(arg[1]) + ', elimination');
		this.reply('/tour autostart 2');
		this.reply('/tour autodq 2');
		tourRepeat[room] = true;

		if (Features.tours.tourData[room]) {
			return this.reply(this.trad('touralr'));
		}
		else {
			tourInterval[room] = setInterval(function() {
				if (Features.tours.tourData[room]) {
					return this.reply(this.trad('touralr'));
				}
				this.reply('/tour new ' + toId(arg[1]) + ', elimination');
				this.reply('/tour autostart 2');
				this.reply('/tour autodq 2');
			}.bind(this), intervalTime);
			this.sclog();
		}
	},

	autotalk: function(arg, by, room, cmd) {
		arg = arg.split(',');
		if (!this.can('simplecoms')) return;
		if (room.startsWith("groupchat-") && !this.isRanked("&"))
			return this.reply('Autotalk is disabled for groupchats, because bots should not be used to bypass their auto-expiration.');
		var intervalTime = arg[0].replace(/[^0-9\.]/g, '') * 60 * 1000;
		if (!arg) return this.reply('Correct syntax: ``.autotalk interval, message``');
		
		if (toId(arg[0]) === 'off') {
			if (autotalkInterval[room]) {
				clearInterval(autotalkInterval[room]);
				delete autotalkInterval[room];
				return this.reply('Autotalk disabled.');
			} else {
				return this.reply('Autotalk is already off');
			}
		}
		
		// If time is incorrect or too short
		if (isNaN(intervalTime) || intervalTime < 5 * 60000) return this.reply('Please use a valid time interval, that is over 5 minutes.');        
		if (!arg[1]) return this.reply('Please specify a message to be repeated.');
		
		if (autotalkInterval[room]) {
			return this.reply('Autotalk is already on.');
		} else {
			autotalkMsg[room] = arg[1];
			autotalkInterval[room] = setInterval(function() {
				this.reply(autotalkMsg[room]);
			}.bind(this), intervalTime);
			this.reply('Autotalk enabled, repeating message every ' + intervalTime/60000 + ' minutes.');
			return this.sclog();
		}
	},
	// old implementation
	/*autotalk: function(arg) {
		arg = arg.split(',');
		var that = this;
		if (!that.can('simplecoms')) return;
		if (arg[0] === "on") {
			if (!arg[1]) return that.reply("Usage: ``.autotalk on, message``");
			this.JackHiggins = setInterval(function() {
				that.reply(arg[1]);
			}, 2.1e+6);
			that.reply("Repeating message: " + arg[1] + " every 35 mins kiddo.");
		}
		else {
			if (arg[0] === "off") {
				clearInterval(this.JackHiggins);
				that.reply("Autotalk disabled.");
			}
		}
	},*/
	gen: function(arg, by, room, cmd) {
		if (!this.can('simplecoms')) return;
		var args = arg.split(',');
		var opt = toId(args[0]);
		if (room !== 'overused') return this.reply('This command is for OU only.');
		switch (opt) {
			case '':
				this.reply('Please input a gen number');
				break;
			case '1':
				this.reply('/wall this is a GEN 1 TOUR! if you don\'t have gen 1 teams, either don\'t enter, or get your teams from here: http://www.smogon.com/forums/threads/3549991/#post-6431045');
				break;
			case '2':
				this.reply('/wall this is a GEN 2 TOUR! if you don\'t have gen 2 teams, either don\'t enter, or get your teams from here: http://www.smogon.com/forums/threads/3549991/#post-6431086');
				break;
			case '3':
				this.reply('/wall this is a GEN 3 TOUR! if you don\'t have gen 3 teams, either don\'t enter, or get your teams from here: http://www.smogon.com/forums/threads/3549991/#post-6431087');
				break;
			case '4':
				this.reply('/wall this is a GEN 4 TOUR! if you don\'t have gen 4 teams, either don\'t enter, or get your teams from here: http://www.smogon.com/forums/threads/3549991/#post-6431088');
				break;
			case '5':
				this.reply('/wall this is a GEN 5 TOUR! if you don\'t have gen 5 teams, either don\'t enter, or get your teams from here: http://www.smogon.com/forums/threads/3549991/#post-6431094');
		}
	},
	check: function(arg, by, room, cmd) {
		if (!this.can('simplecoms')) return;
		if (room !== 'overused') return;
		this.reply('https://dl.dropboxusercontent.com/u/9207945/CompGen/Output/Compendiums_html/OU_Checks_by_Threat_Level.html#' + arg + '%20checks');
	},
	rule: 'rules',
	rules: function(arg, by, room, cmd) {
		if (!this.can('simplecoms')) return;
		if (room !== 'overused' && room !== 'oustaff') return;
		var ouRules = [
			"1) Please try to stick to OU discussion.",
			"2) Do not spam, flame, troll, or generally be a bad chat presence.",
			"3) Be respectful and accepting of everyone's views.",
			"4) Do not post random links (replays and battles included) that do not pertain to the OU tier.",
			"5) Please do not discuss staff decisions inside the room.",
			"6) Follow all of Pokemon Showdowns global rules in addition to these."
		];
		arg = arg.split(',').map( x => x.trim().toLowerCase() );
		for (var i in arg) {
			if (Number(arg[i]) != arg[i]) {
				for (var r in ouRules) {
					if (ouRules[r].toLowerCase().indexOf(arg[i]) >= 0)
						ouRules[r] = "<b>" + ouRules[r] + "</b>";
				}
				continue;
			}
			arg[i]--;
			if (ouRules[arg[i]])
				ouRules[arg[i]] = "<b>" + ouRules[arg[i]] + "</b>";
		}
		this.reply("/addhtmlbox <center><p style=\"background-color: white ; color: black ; width: 464px ; border: 2px solid black ; padding-left: 8px ; padding-top: 4px ; padding-bottom: 4px ; padding-right: 8px\" align=\"left\">" + ouRules.join("<br>") + "<br><small>For more check the <a href=\"http://hastebin.com/raw/oyigodatik.vhdl\" target=\"_blank\">Room Rules</a>, our <a href=\"http://pastebin.com/Q2vi2CnK\" target=\"_blank\">Tournament Rules</a> and the <a href=\"https://pokemonshowdown.com/rules\" target=\"_blank\">Global Rules</a>.</small></p></center>");
	},
	gen7: "htmllists",
	htmllists: function(arg, by, room, cmd) {
		if (cmd === "htmllists")
			return;  // todo: list html lists?
		if (!htmlLists[cmd])
			htmlLists[cmd] = require(`./../data/htmlLists/${cmd}.json`);
		let {title, list} = htmlLists[cmd];

		if (!arg.trim()) {
			return this.htmlReply(`<b>All ${title}:</b>${Tools.makeHtmlList(list)}Add arguments to search this list for specific info.<br>OU auth can use <code>.sethtmllist ${cmd}, HASTEBIN LINK</code> to modify this command.<br>Raw Data: <a href='${htmlLists[cmd].hastebinLink}'>${htmlLists[cmd].hastebinLink}</a>`);
		}

		let matches = [];
		let needles = arg.split(',').map( x => x.trim().replace(/%/g, "%%").replace(/([\^"&<>\|])/g, "^$1") ).join('|');
		needles = new RegExp(`(\\w*(${needles})\\w*)`, 'ig');
		
		let recursion = function recursion(listobject) {
			if (typeof listobject === "string") {
				if (needles.test(listobject))
					matches.push(listobject.replace(needles, "<i>$1</i>"));
				return;
			}
			for (let i in listobject) {
				if (needles.test(i))
					matches.push(Tools.makeHtmlList(listobject[i], i.replace(needles, "<i>$1</i>")));
				recursion(listobject[i]);
			}
		};
		recursion(list);
		
		list = Tools.makeHtmlList(list);
		matches = Tools.makeHtmlList(matches);
		buf = `<b>${title} containing ${arg}:</b>${matches}`;
		if (room !== 'overused') buf += `<b>All ${title}:</b>${list}`;
		return this.htmlReply(buf);
	},
	sethtmllist: function(arg, by, room, cmd) {
		if (!this.isRanked('%', 'oustaff'))
			return this.restrictReply("You need to be %overused or higher to do this.", "simplecoms");
		let [listId, url] = arg.split(',').map( x => x.trim() );
		let context = this;
		if (!listId)
			return this.reply("Usage: ``.sethtmllist CMD`` to see the current data, ``.sethtmllist CMD, HASTEBIN LINK`` to replace it.");
		if (!htmlLists[listId]) {
			if (exports.commands[listId] === "htmllists")
				htmlLists[listId] = require(`./../data/htmlLists/${listId}.json`);
			else {
				return this.reply(`List "${listId}" not found. Usage: \`\`.sethtmllist CMD\`\` to see the current data, \`\`.sethtmllist CMD, HASTEBIN LINK\`\` to replace it.`);
			}
		}
		if (!url) {
			if (htmlLists[listId].hastebinLink)
				return this.reply(`${htmlLists[listId].title} data: ${htmlLists[listId].hastebinLink}`);
			Tools.uploadToHastebin(JSON.stringify(htmlLists[listId], null, 4), function(success, hastebinLink) {
				if (!success)
					return context.restrictReply("An error occured while uploading to hastebin.com/", "simplecoms");
				htmlLists[listId].hastebinLink = hastebinLink;
				return context.restrictReply(`${htmlLists[listId].title} data: ${hastebinLink}`, "simplecoms");
			});
		}
		Tools.loadHastebin(url,
			function onLoad(data) {
				try {
					let parsed = JSON.parse(data);
					if (!parsed.title) return context.reply('Error: "title" attribute missing from JSON data.');
					if (!parsed.list) return context.reply('Error: "list" attribute missing from JSON data.');
					htmlLists[listId] = parsed;
					htmlLists[listId].hastebinLink = 'http://hastebin.com/' + url.split('/').pop().replace(".json", "");
				} catch (e) {
					console.log(e);
					return context.reply("Error: Invalid JSON data.");
				}
				fs.writeFile(`./data/htmlLists/${listId}.json`, data, e => {
					if (!e) return context.reply("JSON data successfully saved");
					console.log(e);
					context.reply("Error while saving JSON data to bot.");
				});
			},
			function onError(error) {
				context.reply("An error occurred while fetching the requested hastebin.");
			}
		);
	},
	bwteams: function(arg, by, room, cmd) {
		if (!this.can('simplecoms')) return;
		if (room !== 'ubers') return;
		this.reply('http://www.smogon.com/forums/threads/sample-teams-mega-thread-generations-3-4-5-and-6.3550998/');
		this.reply('http://www.smogon.com/forums/threads/bw-ubers-team-compendium.3557822/');
	},
	/*
	conversion: function (arg, by, room, cmd) {
		if (!this.can('simplecoms')) return;
		arg = arg.split(',');
		this.reply(fx(arg[0]).from(arg[1]).to(arg[2]));
	}*/
	pastebin: function(arg, by, room, cmd) {
		if (room !== 'ratemyteam') return false;
		this.htmlReply(
`<details><summary>How To Use Pastebin</summary>Head over to the teambuilder. Click on the team that you want rated.
Hit the Import/Export button and you should see an importable text version of your team.
Copy the text to <a href="https://pastebin.com/">pastebin.com</a> / <a href="https://hastebin.com/">hastebin.com</a>.
If you are using Pastebin, submit the paste by clicking the “Submit” button at the bottom of the page. If you are using Hastebin, submit the paste by clicking the save button (looks like a floppy disk) or clicking control + s on the keyboard.
Finally, paste the new Pastebin / Hastebin link into the main chat for raters to review.</details>`.replace(/\r?\n/g, '<br>')
		);
	},

	smubers: function(arg, by, room, cmd) {
		this.htmlReply(
`SM Uber Resources:
<a href="http://www.smogon.com/forums/threads/sm-ubers-viability-ranking-thread.3591388/">SM Uber Viability ratings</a>
<a href="http://www.smogon.com/forums/threads/sm-ubers-speed-tiers.3587820/">SM Uber Speed Tiers</a>
<a href="http://www.smogon.com/forums/threads/sample-teams-sm-submissions-open.3599816/">SM Uber Sample Teams</a>`.replace(/\r?\n/g, '<br>')
		);
	},

	namecolour: 'namecolor',
	namecolor: function(arg, by, room, cmd) {
		let name = Tools.escapeHTML(arg);
		let color = Tools.hashColor(name);
		this.htmlReply(`<strong style='color:${color}'>${name}</strong> | ${color}`);
	}
};