/*
* Tournaments points system
*/

const toursDataFile = AppOptions.data + 'leaderboards.json';

var toursFFM = exports.toursFFM = new Settings.FlatFileManager(toursDataFile);

var ladder = exports.ladder = {};

try {
	ladder = exports.ladder = toursFFM.readObj();
} catch (e) {
	errlog(e.stack);
	error("Could not import tours data: " + sys.inspect(e));
}

var save = exports.save = function () {
	toursFFM.writeObj(ladder);
};

var isConfigured = exports.isConfigured = function (room) {
	if ((!Config.leaderboards || !Config.leaderboards[room]) && (!Settings.settings.leaderboards || !Settings.settings.leaderboards[room])) return false;
	return true;
};

var filterTier = exports.filterTier = function (tier, filter) {
	tier = toId(tier || "");
	for (i in filter) {
		if (tier === i) return true;
	}
	return false;
	/*if (typeof filter === "string") {
		return (tier === toId(filter));
	} else if (filter.length !== 0 && typeof filter === "object") {
		if (filter instanceof Array) {
			if (filter.indexOf(tier) >= 0) return true;
			return false;
		} else if (filter instanceof RegExp) {
			return filter.test(tier);
		} else {
			if (tier in filter) return true;
			return false;
		}
	} else {
		return true;
	}*/
};

var getConfig = exports.getConfig = function (room) {
	var res = {
		tierFilter: {},
		onlyOfficial: false,
		winnerPoints: 3,
		finalistPoints: 2,
		semiFinalistPoints: 1,
		battlePoints: 1
	};
	if (Config.leaderboards && Config.leaderboards[room]) {
		res.winnerPoints = parseInt(Config.leaderboards[room].winnerPoints) || 0;
		res.finalistPoints = parseInt(Config.leaderboards[room].finalistPoints) || 0;
		res.semiFinalistPoints = parseInt(Config.leaderboards[room].semiFinalistPoints) || 0;
		res.battlePoints = parseInt(Config.leaderboards[room].battlePoints) || 0;
		res.tierFilter = Config.leaderboards[room].tierFilter;
		res.onlyOfficial = Config.leaderboards[room].onlyOfficial || false;
		res.tierFilter = Config.leaderboards[room].tierFilter || {};
	} else if (Settings.settings.leaderboards && Settings.settings.leaderboards[room]) {
		res.winnerPoints = parseInt(Settings.settings.leaderboards[room].winnerPoints) || 0;
		res.finalistPoints = parseInt(Settings.settings.leaderboards[room].finalistPoints) || 0;
		res.semiFinalistPoints = parseInt(Settings.settings.leaderboards[room].semiFinalistPoints) || 0;
		res.battlePoints = parseInt(Settings.settings.leaderboards[room].battlePoints) || 0;
		res.onlyOfficial = Settings.settings.leaderboards[room].onlyOfficial || false;
		res.tierFilter = Settings.settings.leaderboards[room].tierFilter || {};
	}
	return res;
};

var runRoomConfig = exports.runRoomConfig = function () {
	var res = {
		tierFilter: {},
		onlyOfficial: false,
		winnerPoints: 3,
		finalistPoints: 2,
		semiFinalistPoints: 1,
		battlePoints: 1
	};
	for (var i in Settings.settings.leaderboards) {
		for (var x in res) {
			if (!Settings.settings.leaderboards[i][x] && Settings.settings.leaderboards[i][x] !== 0) Settings.settings.leaderboards[i][x] = res[x];
		}
	}
	Settings.save();
	return true;
};

var runUserConfig = exports.runUserConfig = function () {
	for (var i in ladder) {
		for (var x in ladder[i]) {
			for (var n = 1; n <= 6 ; n++) {
				if (!ladder[i][x][n]) ladder[i][x][n] = 0;
			}
		}
	}
	save();
	return true;
};

var parseTourTree = exports.parseTourTree = function (tree) {
	var auxobj = {};
	var team = tree.team;
	var state = tree.state;
	var children = tree.children;
	if (!children) children = [];
	if (!auxobj[team]) auxobj[team] = 0;
	if (state && state === "finished") {
		auxobj[team] += 1;
	}
	var aux;
	for (var i = 0; i < children.length; i++) {
		aux = parseTourTree(children[i]);
		for (var j in aux) {
			if (!auxobj[j]) auxobj[j] = 0;
			auxobj[j] += aux[j];
		}
	}
	return auxobj;
};

var parseTourTable = exports.parseTourTable = function (table) {
	var auxobj = {};
	for (var i = 0; i < table.bracketData.scores.length; i++) {
		auxobj[table.bracketData.tableHeaders.cols[i]] = table.bracketData.scores[i];
	}
	return auxobj;
};

var parseTournamentResults = exports.parseTournamentResults = function (data) {
	var generator = toId(data.generator || "");
	if (generator === "singleelimination") {
		var res = {};
		var parsedTree = parseTourTree(data.bracketData.rootNode);
		res.players = Object.keys(parsedTree);
		res.general = {};
		for (var i in parsedTree) res.general[toId(i)] = parsedTree[i];
		//winners
		res.winner = [];
		res.winner.push(toId(data.results[0][0]));
		res.finalist = [];
		res.semiFinalists = [];
		var aux, aux2;
		if (data.bracketData.rootNode.children) {
			for (var f = 0; f < data.bracketData.rootNode.children.length; f++) {
				aux = toId(data.bracketData.rootNode.children[f].team || "");
				if (aux && aux !== res.winner[0]) {
					res.finalist.push(aux);
				}
				if (data.bracketData.rootNode.children[f].children) {
					for (var j = 0; j < data.bracketData.rootNode.children[f].children.length; j++) {
						aux2 = toId(data.bracketData.rootNode.children[f].children[j].team || "");
						if (aux2 && aux2 !== res.winner[0] && aux2 !== res.finalist[0] && res.semiFinalists.indexOf(aux2) < 0) {
							res.semiFinalists.push(aux2);
						}
					}
				}
			}
		}
		return res;
	} else if (generator === 'roundrobin') {
		var res = {};
		var parsedTable = parseTourTable(data);
		res.players = Object.keys(parsedTable);
		res.general = {};
		for (var i in parsedTable) res.general[toId(i)] = parsedTable[i];
		//winners
		var highest = 0;
		for (var n in parsedTable) {
			if (parsedTable[n] > highest) highest = parsedTable[n];
		}
		var winners = [];
		for (var f in parsedTable) {
			if (parsedTable[f] === highest) {
			winners.push(toId(f));
			delete parsedTable[f];
			}
		}
		highest = 0;
		for (var s in parsedTable) {
			if (parsedTable[s] > highest) highest = parsedTable[s];
		}
		var finalists = [];
		for (var g in parsedTable) {
			if (parsedTable[g] === highest) {
			finalists.push(toId(g));
			delete parsedTable[g];
			}
		}
		highest = 0;
		for (var h in parsedTable) {
			if (parsedTable[h] > highest) highest = parsedTable[h];
		}
		var semis = [];
		for (var j in parsedTable) {
			if (parsedTable[j] === highest) {
			semis.push(toId(j));
			delete parsedTable[j];
			}
		}
		res.winner = winners;
		res.finalist = finalists;
		res.semiFinalists = semis;
		return res;
	} else {
		debug("Incompatible generator: " + data.generator);
		return null; //Not compatible generator
	}
};

var getPoints = exports.getPoints = function (room, user) {
	var userid = toId(user);
	var roomConfig = getConfig(room);
	var pWin = roomConfig.winnerPoints;
	var pFinal = roomConfig.finalistPoints;
	var pSemiFinal = roomConfig.semiFinalistPoints;
	var pBattle = roomConfig.battlePoints;
	var res = {
		name: user,
		room: room,
		wins: 0,
		finals: 0,
		semis: 0,
		battles: 0,
		tours: 0,
		points: 0,
		extra: 0
	};
	if (!ladder[room] || !ladder[room][userid]) return res;
	res.name = ladder[room][userid][0];
	res.wins = ladder[room][userid][1];
	res.finals = ladder[room][userid][2];
	res.semis = ladder[room][userid][3];
	res.battles = ladder[room][userid][4];
	res.tours = ladder[room][userid][5];
	res.extra = ladder[room][userid][6];
	res.points = (pWin * res.wins) + (res.finals * pFinal) + (res.semis * pSemiFinal) + (res.battles * pBattle) + res.extra;
	return res;
};

var getTop = exports.getTop = function (room, usePercent) {
	if (!isConfigured(room)) return null;
	var roomConfig = getConfig(room);
	var pWin = roomConfig.winnerPoints;
	var pFinal = roomConfig.finalistPoints;
	var pSemiFinal = roomConfig.semiFinalistPoints;
	var pBattle = roomConfig.battlePoints;
	if (!ladder[room]) return [];
	var top = [];
	var points = 0;
	var toursWeight = x => x / ( x / (x + 1));
	for (var u in ladder[room]) {
		points = (pWin * ladder[room][u][1]) + (pFinal * ladder[room][u][2]) + (pSemiFinal * ladder[room][u][3]) + (pBattle * ladder[room][u][4]) + ladder[room][u][6];
		top.push(ladder[room][u].concat([points]));
	}
	return top.sort(function (a, b) {
		if (usePercent) {
			var diff = (1 - Math.pow(2, -(b[7] * Math.log((b[4] / toursWeight(b[5])) + 2) / (64 + (toursWeight(b[5]) * Math.pow(1.2, (b[4] / toursWeight(b[5])))))))) - (1 - Math.pow(2, -(a[7] * Math.log((a[4] / toursWeight(a[5])) + 2) / (64 + (toursWeight(a[5]) * Math.pow(1.2, (a[4] / toursWeight(a[5])))))))) /*(1 - Math.pow(2, -a[6]/64)) * a[4] / a[5]*/;
			if (Math.abs(diff) > Number.EPSILON)
				return diff;
		}
		if (a[7] !== b[7]) return b[7] - a[7]; //Points
		if (a[1] !== b[1]) return b[1] - a[1]; //Wins
		if (a[2] !== b[2]) return b[2] - a[2]; //Finals
		if (a[3] !== b[3]) return b[3] - a[3]; //Semis
		if (a[4] !== b[4]) return b[4] - a[4]; //Battles
		if (a[5] !== b[5]) return b[5] - a[5]; //Tours played
		return 0;
	});
};

var getTable = exports.getTable = function (room, n) {
	if (!isConfigured(room)) return null;
	var top = getTop(room);
	if (!top) return null;
	var table = "Room: " + room + "\n\n";
	table += " N\u00BA | Name | Ranking | W | F | SF | Tours Played | Battles won\n";
	table += "----|------|---------|---|---|----|-------------|-------------\n";
	for (var i = 0; i < n && i < top.length; i++) {
		table += (i + 1) + " | " + top[i][0] + " | " + top[i][7] + " | " + top[i][1] + " | " + top[i][2] + " | " + top[i][3] + " | " + top[i][5] + " | " + top[i][4];
		table += "\n";
	}
	return table;
};

var getHtmlTable = exports.getHtmlTable = function (room, n, usePercent, maxHeight, results) {
	if (!isConfigured(room)) return null;
	var top = getTop(room, usePercent);
	if (!top) return null;
	var htmlTable = "<div style='max-height: " + maxHeight + "px; overflow-y: auto'><table style='border: 1px solid #6688aa; border-radius: 10px'><tr><th style='border-bottom: 1px solid #94b8b8; padding: 5px'>#</th><th style='border-bottom: 1px solid #94b8b8; padding: 5px'>Name</th><th style='border-bottom: 1px solid #94b8b8; padding: 5px'>Score</th>";
	if (Settings.settings.leaderboards[room].battlePoints !== 0) htmlTable += "<th style='border-bottom: 1px solid #94b8b8; padding: 5px'>Battles Won</th>";
	htmlTable += "<th style='border-bottom: 1px solid #94b8b8; padding: 5px'>Tours Played</th>";
	if (Settings.settings.leaderboards[room].winnerpoints !== 0) htmlTable += "<th style='border-bottom: 1px solid #94b8b8; padding: 5px'>1st Place</th>";
	if (Settings.settings.leaderboards[room].finalistPoints !== 0) htmlTable += "<th style='border-bottom: 1px solid #94b8b8; padding: 5px'>2nd Place</th>";
	if (Settings.settings.leaderboards[room].semiFinalistPoints !== 0) htmlTable += "<th style='border-bottom: 1px solid #94b8b8; padding: 5px'>4th Place</th>";
	htmlTable += "</tr>";
	var toursWeight = x => x / ( x / (x + 1));
	for (var i = 0; i < n && i < top.length; i++) {
		var regressive  = (256 - 256 * Math.pow(2, -(top[i][7] * Math.log((top[i][4] / toursWeight(top[i][5])) + 2) / (64 + (toursWeight(top[i][5]) * Math.pow(1.2, (top[i][4] / toursWeight(top[i][5])))))))).toFixed(1);
		var style = "style='background-color: rgba(242, 247, 250, 0.7); color: black'";
		if (i % 2 !== 0) style = "style='background-color: rgba(203, 203, 203, 0.7); color: black'";
		if (results && results.players.indexOf(top[i][0]) !== -1) {
			style = "style='background-color: rgba(255, 200, 80, 0.7); color: black'";
		}
		htmlTable += "<tr " + style + "><td>" + (i + 1) + "</td><td>" + top[i][0] + "</td><td align='right'>" + (!usePercent ? top[i][7] : regressive) + "</td>";
		htmlTable += "<td align='right'>" + (!usePercent ? top[i][4] : (top[i][4] / top[i][5]).toFixed(2) + "<font size=1> / tour</font>") + "</td>";
		htmlTable += "<td align='right'>" + top[i][5] + "</td>";
		if (Settings.settings.leaderboards[room].winnerpoints !== 0) htmlTable += "<td align='right'>" + (!usePercent ? top[i][1] : (100 * top[i][1] / top[i][5]).toFixed(0) + "%") + "</td>";
		if (Settings.settings.leaderboards[room].finalistPoints !== 0) htmlTable += "<td align='right'>" + (!usePercent ? top[i][2] : (100 * top[i][2] / top[i][5]).toFixed(0) + "%") + "</td>";
		if (Settings.settings.leaderboards[room].semiFinalistPoints !== 0) htmlTable += "<td align='right'>" + (!usePercent ? top[i][3] : (100 * top[i][3] / top[i][5]).toFixed(0) + "%") + "</td>";
		htmlTable += "</tr>"
	}
	htmlTable += "</table></div>";
	return htmlTable
};

var addUser = exports.addUser = function (room, user, type, auxData) {
	if (!ladder[room]) ladder[room] = {};
	var userid = toId(user);
	if (!ladder[room][userid]) ladder[room][userid] = [user, 0, 0, 0, 0, 0, 0];
	switch (type) {
		case 'A':
			ladder[room][userid][0] = user; //update user name
			ladder[room][userid][5]++;
			break;
		case 'W':
			ladder[room][userid][1]++;
			break;
		case 'F':
			ladder[room][userid][2]++;
			break;
		case 'S':
			ladder[room][userid][3]++;
			break;
		case 'B':
			var val = parseInt(auxData);
			if (!val) return;
			ladder[room][userid][4] += val;
			break;
	}
};

var addPoints = exports.addPoints = function (room, user, pointvalue) {
	if (!isConfigured(room)) return null;
	if (!ladder[room] || !ladder[room][user]) return null;
	if (!ladder[room][user][6]) ladder[room][user][6] = 0;
	ladder[room][user][6] += pointvalue;
	save()
	return true;
};

var mergeUser = exports.mergeUser = function (room, main, alt) {
	if (!isConfigured(room)) return null;
	if (!ladder[room] || !ladder[room][main] || !ladder[room][alt]) return null;
	for (i = 1; i < ladder[room][main].length; i++) ladder[room][main][i] += ladder[room][alt][i];
	delete ladder[room][alt];
	save();
	return true;
};

var deleteUser = exports.deleteUser = function (room, user) {
	if (!isConfigured(room)) return null;
	if (!ladder[room] || !ladder[room][user]) return null;
	delete ladder[room][user];
	save();
	return true;
};

var writeResults = exports.writeResults = function (room, results) {
	if (!results) return;
	for (var i = 0; i < results.players.length; i++) addUser(room, results.players[i], 'A');
	if (results.winner.length > 0) {
		for (var i = 0; i < results.winner.length; i++) addUser(room, results.winner[i], 'W');
	} else {
		if (results.winner) addUser(room, results.winner, 'W');
	}
	if (results.finalist.length > 0) {
		for (var i = 0; i < results.finalist.length; i++) addUser(room, results.finalist[i], 'F');
	} else {
		if (results.finalist) addUser(room, results.finalist, 'F');
	}
	for (var i = 0; i < results.semiFinalists.length; i++) addUser(room, results.semiFinalists[i], 'S');
	for (var user in results.general) addUser(room, user, 'B', results.general[user]);
};

exports.onTournamentEnd = function (room, data) {
	var botTourRooms = ["groupchat-scrappie-tour1", "groupchat-scrappie-tour2", "groupchat-scrappie-tour3", "groupchat-scrappie-tour4"];
	var targetRoom = room;
	if (botTourRooms.indexOf(room) >= 0)
		room = botTourRooms[0];
	if (!isConfigured(room)) return;
	if (data.isExcluded) return;
	if ( toId(data.generator) === "roundrobin" )
		return;  // roundrobin tours mess up the rating system. may be okay in a room that does only round robin, but in general it is not --orday
	if (!data.isOfficialTour) {
		//debug(JSON.stringify(getConfig(room)));
		if (getConfig(room).onlyOfficial) {
			debug("Discarded tour because it is not official. Tier: " + data.format + " | Room: " + room);
			return;
		}
		var filter = getConfig(room).tierFilter;
		if (filterTier(data.format, filter)) {
			debug("Discarded tour because of tier filter. Tier: " + data.format + " | Room: " + room);
			return;
		}
	}
	var results = parseTournamentResults(data);
	//console.log(JSON.stringify(results));
	if (!results) return;
	debug("Updating leaderboard...");
	writeResults(room, results);
	save();
	debug("Leaderboard updated. " + Tools.getDateString());
	var showTable = getHtmlTable(room, 50, true, 222, results);
//	Bot.say(room, "/addhtmlbox <center>" + showTable + "</center>");
	if (Bot.rooms[targetRoom].users[toId(Config.nick)] && Bot.rooms[targetRoom].users[toId(Config.nick)][0] === '#')
		Bot.say(targetRoom, "!htmlbox <center>" + showTable + "</center>");
	else if (Bot.rooms[targetRoom].users[toId(Config.nick)] && Bot.rooms[targetRoom].users[toId(Config.nick)][0] === '*')
		Bot.say(targetRoom, "/addhtmlbox <center>" + showTable + "</center>");
};

var resetCodes = exports.resetCodes = {};

exports.getResetHashCode = function (room) {
	if (!ladder[room]) return null;
	for (var i in resetCodes) {
		if (resetCodes[i] === room) delete resetCodes[i];
	}
	var code = Tools.generateRandomNick(10);
	resetCodes[code] = room;
	return code;
};

exports.execResetHashCode = function (code) {
	if (resetCodes[code]) {
		var room = resetCodes[code];
		if (ladder[room]) {
			delete ladder[room];
			save();
		}
		delete resetCodes[code];
		return room;
	}
	return false;
};