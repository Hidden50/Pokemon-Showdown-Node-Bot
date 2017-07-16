/*
	Development Commands
*/

var forever = require('forever');

exports.commands = {
	"silentjs": "js",
	"sjs": "js",
	"eval": 'js',
	js: function (arg, by, room, cmd) {
		if (!this.isExcepted) return false;
		this.sclog();
		try {
			let result = eval(arg.trim());
			let output = JSON.stringify(result, null, 2);
			if (cmd === "sjs" || cmd === "silentjs")
				return;
			if (output)
				return this.htmlReply(Tools.formatSourceAsHtml(output));
			if (result === undefined)
				return this.htmlReply(Tools.formatSourceAsHtml("undefined"));
			if (result.toString)
				return this.htmlReply(Tools.formatSourceAsHtml(result.toString()));
			return this.htmlReply(Tools.formatSourceAsHtml("No stringify method for this data exists in base-dev.js. Please add one."));
		} catch (e) {
			this.say(room, e.name + ": " + e.message);
		}
	},

	makegroupchat: function (arg, by, room, cmd) {
		if (!this.isRanked('&')) return false;
		if (!arg) arg = Tools.generateRandomNick(5);
		Bot.say("oustaff", `/makegroupchat ${arg}`);
		return this.reply(`<<groupchat-${toId(this.botName)}-${arg}>>`);
	},

	rejoin: function(arg, by, room, cmd) {
		if (!this.isExcepted) return false;
		let missingRooms = Config.rooms.filter( x => !Bot.rooms[x] );
		if (missingRooms.length)
			Bot.joinRooms(missingRooms);
		return this.pmInfobox( JSON.stringify(missingRooms) );
	},

	send: function (arg, by, room, cmd) {
		if (!this.isExcepted) return false;
		this.sclog();
		this.send(arg);
	},

	unignore: 'ignore',
	ignore: function (arg, by, room, cmd) {
		if (!this.isExcepted || !arg) return false;
		if (cmd.substr(0, 2) === 'un') {
			if (CommandParser.resourceMonitor.isLocked(arg)) {
				CommandParser.resourceMonitor.unlock(arg);
				this.sclog();
				this.reply('User ' + arg + ' is no longer ignored');
			} else {
				this.reply('User ' + arg + ' is not ignored');
			}
		} else {
			if (!CommandParser.resourceMonitor.isLocked(arg)) {
				CommandParser.resourceMonitor.lock(arg);
				this.sclog();
				this.reply('User ' + arg + ' has been ignored by CommandParser');
			} else {
				this.reply('User ' + arg + ' is already ignored');
			}
		}
	},

	sleep: function (arg, by, room) {
		if (!this.isExcepted) return false;
		var roomObj = this.getRoom(toRoomid(arg) || room);
		if (!roomObj) {
			if (!arg) return this.pmReply("Usage: " + this.cmdToken + this.cmd + " [room]");
			return this.pmReply("Room \"" + arg + "\" not found");
		}
		if (Settings.sleepRoom(roomObj.id)) {
			this.sclog();
			this.pmReply("Status for room <<" + roomObj.id + ">> is now ``Sleeping``");
		} else {
			this.pmReply("The <<" + roomObj.id + ">> room status was already ``Sleeping``");
		}
	},

	wake: 'unsleep',
	unsleep: function (arg, by, room) {
		if (!this.isExcepted) return false;
		var roomObj = this.getRoom(toRoomid(arg) || room);
		if (!roomObj) {
			if (!arg) return this.pmReply("Usage: " + this.cmdToken + this.cmd + " [room]");
			return this.pmReply("Room \"" + arg + "\" not found");
		}
		if (Settings.unsleepRoom(roomObj.id)) {
			this.sclog();
			this.pmReply("Status for room <<" + roomObj.id + ">> is now ``Ready``");
		} else {
			this.pmReply("The <<" + roomObj.id + ">> room status was already ``Ready``");
		}
	},

	roomstatus: 'status',
	status: function (arg, by, room) {
		if (!this.isExcepted) return false;
		if (this.cmd === "roomstatus") {
			if (room.charAt(0) !== ',') arg = arg || room;
			else if (!arg) return this.pmReply("Usage: " + this.cmdToken + this.cmd + " [room]");
		}
		if (!arg) {
			var rooms = "", roomArr = [];
			var buf = "", cmds = [];
			buf += "**Bot status** |" + (Settings.lockdown ? " **Lockdown** |" : "") + " Username: ``" + Bot.status.nickName + "`` | Rooms: ";
			for (var i in Bot.rooms) {
				var botIdent = Bot.rooms[i].users[toId(Bot.status.nickName)] || " ";
				roomArr.push("<<" + i + ">> (" + Bot.rooms[i].type.charAt(0).toLowerCase() + (Settings.isSleeping(i) ? "s" : "r") + (botIdent.charAt(0) !== " " ? botIdent.charAt(0) : "u") + (Config.privateRooms[i] ? "h" : "p") + ")");
			}
			if (roomArr.length) {
				for (var i = 0; i < roomArr.length; i++) {
					if (buf.length + roomArr[i].length + (i < roomArr.length - 1 ? 2 : 0) > 300) {
						cmds.push(buf);
						buf = "";
					}
					buf += roomArr[i];
					if (i < roomArr.length - 1) buf += ", ";
				}
			} else {
				buf += "(none)";
			}
			cmds.push(buf);
			return this.pmReply(cmds);
		}
		var tarRoom = toRoomid(arg);
		var roomObj = this.getRoom(tarRoom);
		if (!roomObj) return this.pmReply("Room \"" + tarRoom + "\" not found");
		var sleep = Settings.isSleeping(tarRoom) ? "Sleeping" : "Ready";
		var botIdent = Bot.rooms[roomObj.id].users[toId(Bot.status.nickName)] || " ";
		this.pmReply("**" + roomObj.title + "** <<" + roomObj.id + ">> | Type: ``" + roomObj.type + "``" + (Config.privateRooms[roomObj.id] ? " (Hidden)" : "") + " | Users: ``" + roomObj.users.length + "`` | Bot group: ``" + (botIdent.charAt(0) !== " " ? botIdent.charAt(0) : "(regular user)") + "`` | Status: ``" + sleep + "``");
	},

	uncacheall: 'clearcache',
	clearcache: function () {
		if (!this.isExcepted) return false;
		Settings.unCacheUrl(true);
		this.reply("Http-Cache successfully cleared");
	},

	hotpatch: 'reload',
	reload: function (arg, by, room, cmd) {
		if (!this.isExcepted) return false;
		var args = arg.split(",");
		var opt = toId(args[0]);
		switch (opt) {
			case '':
			case 'commands':
				this.sclog();
				var res = CommandParser.loadCommands(true) || [];
				if (!res.length) {
					return this.reply('Commands reloaded');
				}
				return this.reply('Some command files crashed: ' + res.join(", "));
			case 'features':
				this.sclog();
				var errs = reloadFeatures() || [];
				if (!errs.length) {
					return this.reply('Features reloaded');
				}
				return this.reply('Some features crashed: ' + errs.join(", "));
			case 'feature':
				this.sclog();
				if (!args[1]) return this.reply("You must specify a feature");
				args[1] = args[1].trim();
				var e = Tools.reloadFeature(args[1]);
				if (e) {
					if (e === -1) {
						return this.reply("Error: Feature " + args[1] + " not found");
					} else {
						errlog(e.stack);
						return this.reply("Error: Feature " + args[1] + " crashed");
					}
				} else {
					return this.reply("Feature: " + args[1] + " reloaded");
				}
				break;
			case 'commandparser':
			case 'parser':
				this.sclog();
				try {
					Tools.uncacheTree('./command-parser.js');
					global.CommandParser = require('./../command-parser.js');
					this.reply('command-parser.js reloaded');
					info('command-parser.js reloaded');
					CommandParser.loadCommands(true);
				} catch (e) {
					errlog(e.stack);
					this.reply('Error: command-parser.js has errors');
				}
				break;
			case 'tools':
				this.sclog();
				try {
					Tools.uncacheTree('./tools.js');
					global.Tools = require('./../tools.js');
					this.reply('tools.js reloaded');
					info('tools.js reloaded');
					Tools.loadTranslations(true);
				} catch (e) {
					errlog(e.stack);
					this.reply('Error: tools.js has errors');
				}
				break;
			case 'data':
				this.sclog();
				Tools.uncacheTree('./data-downloader.js');
				global.DataDownloader = require('./../data-downloader.js');
				DataDownloader.download();
				this.reply('Data files reloaded');
				break;
			case 'config':
				this.sclog();
				try {
					Tools.uncacheTree(AppOptions.config);
					global.Config = require('./../' + AppOptions.config);
					Tools.checkConfig();
					Settings.applyConfig();
					CommandParser.reloadTokens();
					this.reply(AppOptions.config + ' reloaded');
					info(AppOptions.config + ' reloaded');
				} catch (e) {
					error('could not reload ' + AppOptions.config);
					errlog(e.stack);
					this.reply("Error: " + 'could not reload ' + AppOptions.config);
				}
				break;
			case 'lang':
			case 'languages':
				this.sclog();
				var _errs = Tools.loadTranslations(true) || [];
				if (!_errs.length) return this.reply('Languages reloaded');
				this.reply('Some languages crashed: ' + _errs.join(", "));
				break;
			default:
				 this.reply('Valid arguments are: commands, feature, features, parser, tools, data, config, languages');
		}
	},

	updatebranch: 'updategit',
	updategit: function (arg, by, room, cmd) {
		if (!this.isExcepted) return false;

		if (global.updateGitLock) {
			return this.reply("There is currently another update in progress");
		}

		global.updateGitLock = true;
		this.sclog();

		var self = this;
		var exec = require('child_process').exec;
		exec('git diff-index --quiet HEAD --', function (error) {
			var cmd = 'git pull --rebase';
			if (error) {
				if (error.code === 1) {
					// The working directory or index have local changes.
					cmd = 'git stash && ' + cmd + ' && git stash pop';
				} else {
					// The most likely case here is that the user does not have
					// `git` on the PATH (which would be error.code === 127).
					self.reply("Error:" + error);
					global.updateServerLock = false;
					return;
				}
			}
			var entry = "Running `" + cmd + "`";
			self.reply(entry);
			exec(cmd, function (error, stdout, stderr) {
				("" + stdout + stderr).split("\n").forEach(function (s) {
					self.reply(s);
				});
				global.updateGitLock = false;
			});
		});
	},

	endlockdown: 'lockdown',
	lockdown: function (arg, by, room, cmd) {
		if (!this.isExcepted) return false;
		this.sclog();
		if (cmd === 'endlockdown') {
			if (!Settings.lockdown) return this.reply("Not in lockdown mode");
			Settings.lockdown = false;
			this.reply("The lockdown was canceled");
		} else {
			if (Settings.lockdown) return this.reply("Already in lockdown mode");
			Settings.lockdown = true;
			this.reply("Bot is now in lockdown mode");
		}
	},

	forcekill: 'kill',
	kill: function (arg, by, room, cmd) {
		if ( !this.isExcepted && ( room !== "oustaff" || !this.isRanked("#", "oustaff") ) ) return false;
		console.log('Forced Exit. By: ' + by);
		try {
			forever.stop('index.js');
			console.log('Killed by: ' + by);
		} catch (e) {
			this.reply('Forever module not found.');
		}
	},
	restart: function (arg, by, room, cmd) {
		this.sclog();
		if (!this.isExcepted && room !== "oustaff") return false;
		try {
			forever.restart('index.js');
			console.log('Restarted by: ' + by);
		} catch (e) {
			this.reply('Forever module not found.');
		}
	}
};
