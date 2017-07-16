/*
	Tournaments Manager Feature
*/

exports.id = 'tours';
exports.desc = 'A tool to ease tournaments creation';

var tournaments = exports.tournaments = {};
var tourData = exports.tourData = {};

var Leaderboards = exports.Leaderboards = require('./leaderboards.js');

var Tournament = exports.Tournament = (function () {
	function Tournament (room, details) {
		this.format = details.format || 'randombattle';
		this.type = details.type || 'elimination';
		this.users = 0;
		this.participants = {};
		this.maxUsers = details.maxUsers || null;
		this.signups = false;
		this.started = false;
		this.startTimer = null;
		this.room = room || 'lobby';
		this.timeToStart = details.timeToStart || 30 * 1000;
		this.autodq = details.autodq || false;
		this.autodqSet = false;
		this.scoutProtect = details.scoutProtect || false;
		this.bans = [];
		this.observe = false;
		this.alert = false;
	}

	Tournament.prototype.createTour = function () {
		Bot.say(this.room, '/tournament create ' + this.format + ', ' + this.type);
	};
	Tournament.prototype.startTimeout = function () {
		if (!this.timeToStart) return;
		this.signups = true;
		if (this.scoutProtect) Bot.say(this.room, '/tournament setscouting disallow');
		this.startTimer = setTimeout(function () {
			this.startTour();
			this.started = true;
			this.startTimer = null;
		}.bind(this), this.timeToStart);
	};
	Tournament.prototype.startTour = function () {
		Bot.say(this.room, '/tournament start');
	};
	Tournament.prototype.checkUsers = function () {
		// the server already does this, so I commented this out.. -orday
		// if (!this.maxUsers) return;
		// if (this.maxUsers <= this.users) this.startTour();
	};
	Tournament.prototype.setAutodq = function () {
		if (!this.autodq) return;
		Bot.say(this.room, '/tournament autodq ' + this.autodq);
	};
	Tournament.prototype.endTour = function () {
		Bot.say(this.room, '/tournament end');
	};

	return Tournament;
})();

var newTour = exports.newTour = function (room, details, created) {
	tournaments[room] = new Tournament(room, details);
	if (!created) tournaments[room].createTour();
};

var banlistToHtml = exports.banlistToHtml = function (banlist) {
	if (!banlist) return;
	var banned = [];
	var unbanned = [];
	var addedRules = [];
	var removedRules = [];
	for (i of banlist) {
		if (i.substring(0, 5) === 'rule|') {
			let rule = i.substring(5);
			if (i.substring(0, 1) === '!') removedRules.push(rule.substring(1));
			if (i.substring(0, 1) !== '!') addedRules.push(rule);
		} else {
			if (Tools.toId(i) in POKEDEX) i = i.toLowerCase();
			if (i === 'ho-oh' || i === '!ho-oh' || i === 'kommo-o' || i === '!kommo-o' || i === 'hakamo-o' || i === '!hakamo-o' || i === 'jangmo-o' || i === '!jangmo-o') i = i.replace('-', '');
			if (i === 'type: null') i = i.replace(': ', '');
			if (i === 'charizard-mega-x' || i === 'charizard-mega-y' || i === 'nidoran-f' || i === 'nidoran-m' || i === 'mewtwo-mega-x' || i === 'mewtwo-mega-y') i = i.slice(0, i.length - 2) + i.slice(i.length - 1, i.length);
			if (i.indexOf("&apos;") !== -1) i = i.replace("&apos;", "");
			if (i.indexOf(".") !== -1) i = i.replace(".", "");
			if (Tools.toId(i) in POKEDEX && i.indexOf(" ") !== -1) i = i.replace(" ", "");
			if (i.indexOf(" ") !== -1) i = i.replace(" ", "<br/>");
			if (i.substring(0, 1) === '!') unbanned.push(i.substring(1));
			if (i.substring(0, 1) !== '!') banned.push(i);
		}
	}
	var html = `<div style="max-height: 300px; overflow-y: auto">`;
	if (unbanned.length > 0) {
		html += `<center class="broadcast-blue"><i>Unbanned</i><br/>`;
		for (i of unbanned) {
			if (Tools.toId(i) in POKEDEX) {
				html += `<img alt="${i}" title="${i}" src="http://play.pokemonshowdown.com/sprites/xyani/${i}.gif" height="50" width="40"/>`;
			} else {
				html += `<span style="margin-left: 4px; margin-right: 4px; display: inline-block; font-size: 11px; white-space: nowrap"><b>${i}</b></span>`;
			}
		}
		html += `</center>`;
	}
	if (banned.length > 0) {
		html += `<center class="broadcast-red"><i>Banned</i><br/>`;
		for (i of banned) {
			if (Tools.toId(i) in POKEDEX) {
				html += `<img alt="${i}" title="${i}" src="http://play.pokemonshowdown.com/sprites/xyani/${i}.gif" height="50" width="40"/>`;
			} else {
				html += `<span style="margin-left: 4px; margin-right: 4px; display: inline-block; font-size: 11px; white-space: nowrap"><b>${i}</b></span>`;
			}
		}
		html += `</center>`;
	}
	if (addedRules.length > 0) {
		html += `<center class="broadcast-blue"><i>Added Rules</i><br/>`;
		for (i of addedRules) {
			html += `<span style="margin-left: 4px; margin-right: 4px; display: inline-block; font-size: 11px; white-space: nowrap"><b>${i}</b></span>`;
		}
		html += `</center>`;
	}
	if (removedRules.length > 0) {
		html += `<center class="broadcast-red"><i>Removed Rules</i><br/>`;
		for (i of removedRules) {
			html += `<span style="margin-left: 4px; margin-right: 4px; display: inline-block; font-size: 11px; white-space: nowrap"><b>${i}</b></span>`;
		}
		html += `</center>`;
	}
	html += `</div>`;
	return html;
};

exports.init = function () {
	for (var i in tournaments) {
		try {
			if (tournaments[i].startTimer) clearTimeout(tournaments[i].startTimer);
		} catch (e) {}
		delete tournaments[i];
	}
	for (var i in tourData)
		delete tourData[i];
};

exports.parse = function (room, message, isIntro, spl) {
	if (spl[0] !== 'tournament' && spl[0] !== 'raw') return;
	if (isIntro) return;
	if (spl[0] === 'raw' && (spl[1].substring(0, 46) === "<div class='infobox'>This tournament includes:" || spl[1].substring(3, 27) === "The tournament's banlist") && tournaments[room]) {
		if (spl[1].substring(0, 21) === "<div class='infobox'>") {
			let bannedPokemon = spl[1].substring(52, spl[1].length - 6);
			bannedPokemon = bannedPokemon.split('<br />');
			bannedPokemon = bannedPokemon.filter(str => str.startsWith("<b>Bans</b>") || str.startsWith("<b>Unbans</b>") || str.startsWith("<b>Added rules</b>") || str.startsWith("<b>Removed rules</b>")).map(str => {
				if (str.startsWith("<b>Bans</b>")) return str.substring(str.indexOf('-') + 2);
				if (str.startsWith("<b>Unbans</b>")) {
					let unban = str.substring(str.indexOf('-') + 2).split(', ');
					unban = unban.map(u => "!" + u);
					return unban.join(', ');
				}
				if (str.startsWith("<b>Added rules</b>")) {
					let rules = str.substring(str.indexOf('-') + 2).split(', ');
					rules = rules.map(u => "rule|" + u);
					return rules.join(', ');
				}
				if (str.startsWith("<b>Removed rules</b>")) {
					let removed = str.substring(str.indexOf('-') + 2).split(', ');
					removed = removed.map(u => "rule|!" + u);
					return removed.join(', ');
				}
			}).join(', ');
			tournaments[room].bans = bannedPokemon.split(', ') || [];
			if (Settings.settings['tournaments'] && Settings.settings['tournaments'][room] && Settings.settings['tournaments'][room]['pmalerts'] === 1) {
				tournaments[room].alert = true;
			}
			if (Leaderboards.isConfigured(room)) {
				if (tourData[room].isExcluded) return;
				tourData[room].isExcluded = true;
				Bot.say(room, 'This tournament will not increase the leaderboard values.');
			}
			if (tournaments[room].alert) {
				let timer = 0;
				for (var par in tournaments[room].participants) {
					if (tournaments[room].participants[par] === 0) {
						let pmAlert = function (par) {
							Bot.pm(par, `The tournament you have joined in __${room}__ has a custom banlist, make sure you have a valid team.`);
						}
						tournaments[room].participants[par] = 1;
						setTimeout(pmAlert, timer, par);
						timer += 500;
					}
				}
			}
		} else if (spl[1].substring(27, 40) === ' was cleared.') {
			if (tournaments[room].bans) tournaments[room].bans = [];
			if (tournaments[room].alert) tournaments[room].alert = false;
			if (Leaderboards.isConfigured(room)) {
				if (!tourData[room].isExcluded) return;
				tourData[room].isExcluded = false;
				Bot.say(room, 'This tournament will now increase the leaderboard values.');
			}
		}
		return;
	}
	if (spl[0] !== 'tournament') return;
	if (!tourData[room]) tourData[room] = {};
	switch (spl[1]) {
		case 'create':
			if (!tournaments[room]) {
				let type = (spl[3].substring(spl[3].length - 11) === 'Elimination' ? 'elimination' : 'roundrobin');
				let musers = (spl[4] === "0" ? null : parseInt(spl[4], 10));
				let details = {
					format: spl[2],
					type: type,
					maxUsers: musers,
					timeToStart: null,
					autodq: null,
					scout: 1
				};
				newTour(room, details, true);
				tournaments[room].signups = true;
				tournaments[room].observe = true;
				tournaments[room].timeToStart = null;
				break;
			}
			if (!tournaments[room].observe) tournaments[room].startTimeout();
			break;
		case 'join':
			if (!tournaments[room]) break;
			tournaments[room].users++;
			if (!(toId(spl[2]) in tournaments[room].participants) || tournaments[room].participants[toId(spl[2])] === -1)
				tournaments[room].participants[toId(spl[2])] = 0;
			if (tournaments[room].alert && tournaments[room].participants[toId(spl[2])] !== 1 && tournaments[room].participants[toId(spl[2])] !== 2) {
				Bot.pm(toId(spl[2]), `The tournament you have joined in __${room}__ has a custom banlist, make sure you have a valid team.`);
				tournaments[room].participants[toId(spl[2])] = 1;
			}
			tournaments[room].checkUsers();
			break;
		case 'leave':
			if (!tournaments[room]) break;
			tournaments[room].users--;
			if ((toId(spl[2]) in tournaments[room].participants) && tournaments[room].participants[toId(spl[2])] === 0) {
				tournaments[room].participants[toId(spl[2])] = -1;
			} else if ((toId(spl[2]) in tournaments[room].participants) && tournaments[room].participants[toId(spl[2])] === 1) {
				tournaments[room].participants[toId(spl[2])] = 2;
			}
			tournaments[room].checkUsers();
			break;
		case 'autodq':
			if (!tournaments[room]) break;
			if (spl[2] === 'on') {
				tournaments[room].autodq = (spl[3] / 60000);
				tournaments[room].autodqSet = true;
			} else if (spl[2] === 'off') {
				tournaments[room].autodq = null;
				tournaments[room].autodqSet = true;
			}
			break;
		case 'disqualify':
			if (!tournaments[room]) break;
			tournaments[room].users--;
			break;
		case 'start':
			if (!tournaments[room]) break;
			if (tournaments[room].bans.length > 0) Bot.say(room, '/addhtmlbox ' + banlistToHtml(tournaments[room].bans));
			if (tournaments[room].signups) {
				tournaments[room].signups = false;
				if (!tournaments[room].observe) {
					clearTimeout(tournaments[room].startTimer);
					if (!tournaments[room].autodqSet) tournaments[room].setAutodq();
				} else {
					tournaments[room].started = true;
				}
			}
			break;
		case 'update':
			try {
				var data = JSON.parse(spl[2]);
				for (var i in data)
					tourData[room][i] = data[i];
			} catch (e){}
			break;
		case 'updateEnd':
			if (!tournaments[room]) break;
			if (tournaments[room].started && !tourData[room].isStarted && !tournaments[room].observe) {
				tournaments[room].startTour();
			}
			break;
		case 'battlestart':
			if (!tournaments[room]) break;
			if (Settings.settings['tournaments'] && Settings.settings['tournaments'][room] && Settings.settings['tournaments'][room]['finals'] === 1) {
				if (Tools.botIsRanked(room, "*") && tournaments[room].users === 2)
					Bot.say(room, '/wall Watch the tournament finals! <<' + spl[4] + '>>');
			}
			break;
		case 'battleend':
			if (!tournaments[room]) break;
			if (tournaments[room].type === 'elimination') tournaments[room].users--;
			break;
		case 'end':
			try {
				var data = JSON.parse(spl[2]);
				for (var i in data)
					tourData[room][i] = data[i];
			} catch (e){}
			Leaderboards.onTournamentEnd(room, tourData[room]);
			delete tourData[room];
			if (tournaments[room] && tournaments[room].startTimer) clearTimeout(tournaments[room].startTimer);
			if (tournaments[room]) delete tournaments[room];
			break;
		case 'forceend':
			delete tourData[room];
			if (tournaments[room] && tournaments[room].startTimer) clearTimeout(tournaments[room].startTimer);
			if (tournaments[room]) delete tournaments[room];
			break;
	}
};

exports.destroy = function () {
	if (Features[exports.id]) delete Features[exports.id];
};
