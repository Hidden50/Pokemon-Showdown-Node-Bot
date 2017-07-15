/*
* Tools file
*/

try {
	require('sugar');
} catch (e) {
	console.log(e.stack);
}

/* String utils */

global.toId = exports.toId = function (text) {
	if (typeof text !== 'string') return text;
	return text.toLowerCase().replace(/[^a-z0-9]/g, '');
};

global.toRoomid = exports.toRoomid = function (roomid) {
	return roomid.replace(/[^a-zA-Z0-9-]+/g, '').toLowerCase();
};

global.trim = exports.trim = str => str.trim();
global.splitArgs = exports.splitArgs = str => str.split(',').map(trim);

exports.toName = function (text) {
	if (!text) return '';
	return text.trim();
};

exports.addLeftZero = function (num, nz) {
	let str = num.toString();
	let missing = nz - str.length;
	if (missing < 0) missing = 0;
	return "0".repeat(missing) + num;
};

exports.escapeHTML = function (str) {
	if (!str) return '';
	return ('' + str).escapeHTML();
};

//
// line breaks -> <br>, wraps with <details> and <pre>, adds line numbers
//
exports.formatSourceAsHtml = function(str) {
	let code = exports.escapeHTML(str).split(/\r?\n/g);
	let openOrClosed = (code.length > 30) ? "" : " open='open'";
	let lineNumbers = code.map( (x,i) => i+1 ).join("<br>");
	code = code.join("<br>").replace(/\t/g, "  ");
	lineNumbers = `<span style='float:left; margin:0 1em 0 0; padding-right:3px; border-right:1px double; text-align:right'>${lineNumbers}</span>`;
	return `<details${openOrClosed}><summary>code</summary><div style='width:100%; max-height:210px; overflow:auto; white-space:nowrap'><pre>${lineNumbers}${code}</pre></div></details>`;
};

exports.makeHtmlProgressbar = function(scale, color, segment, deg, segmentColor, ranges) {
	let backgroundCSS = `background-color: ${color}`;
	if (segment) {
		let background = (browser) => `background:${browser}repeating-linear-gradient(${deg}deg, ${color} ${ranges[0]}px, ${color} ${ranges[1]}px, ${segmentColor} ${ranges[2]}px, ${segmentColor} ${ranges[3]}px)`;
		backgroundCSS = `${background("-webkit-")}; ${background("-moz-")}; ${background("-o-")}; ${background("")}`;
	}
	return `style='float:left; ${backgroundCSS}; border-radius:3px; width:${Math.floor(100 * scale)}%'`;
};

exports.makeHtmlDetails = (summary, details, expanded) => `<details${expanded ? " open='open'" : ""}><summary>${summary}</summary>${details}</details>`;

exports.makeHtmlTimestamp = function(room, date, plaininput) {
	let datestring = plaininput ? date : exports.getDateString(date);
	let yearMonth = datestring.substring(0, 7);
	let yearMonthDate = datestring.substring(0, 10);
	let hoursMinutes = datestring.substring(11, 16);
	let hoursMinutesSeconds = datestring.substring(11);
	return `<a style="text-decoration:none" href="http://logs2.psim.us:8080/${room}/${yearMonth}/${yearMonthDate}.html#${hoursMinutes}"><small style="color:#888888; font-size:8pt; font-weight:normal">[${hoursMinutesSeconds}]</small></a>`;
}

//
// 2d array -> <table>
//
exports.makeHtmlTable = function(rows, colParams = []) {
	let cellMap = (cell, i) => `<td ${colParams[i] || ""}>${cell}</td>`;
	let rowMap = row => `<tr>${row.map(cellMap).join("")}</tr>`;
	return `<table>${rows.map(rowMap).join("")}</table>`;
};

//
// recursively, (array or object) -> <ul>
//
let makeHtmlList = exports.makeHtmlList = function(target, title) {
	if (title) return `<details><summary>${title}</summary>${makeHtmlList(target)}</details>`;
	let inner;
	if (Array.isArray(target))
		inner = "<ul>" + target.map( x => `<li>${makeHtmlList(x)}</li>` ).join("") + "</ul>";
	else if (typeof target === "object") {
		inner = "<ul style='list-style-type:none; padding-left:0px'>" +
			Object.keys(target).map( x => `<li>${makeHtmlList(target[x],x)}</li>` ).join("") +
			"</ul>";
	} else return target;
	return inner;  // `<ul style='padding-left:25px'>${inner}</ul>`;
};

exports.generateRandomNick = function (numChars) {
	let chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let str = '';
	for (let i = 0, l = chars.length; i < numChars; i++) {
		str += chars.charAt(~~(Math.random() * l));
	}
	return str;
};

exports.levenshtein = function (s, t, l) { // s = string 1, t = string 2, l = limit
	// Original levenshtein distance function by James Westgate, turned out to be the fastest
	let d = []; // 2d matrix
	// Step 1
	let n = s.length;
	let m = t.length;
	if (n === 0) return m;
	if (m === 0) return n;
	if (l && Math.abs(m - n) > l) return Math.abs(m - n);
	// Create an array of arrays in javascript (a descending loop is quicker)
	for (let i = n; i >= 0; i--) d[i] = [];
	// Step 2
	for (let i = n; i >= 0; i--) d[i][0] = i;
	for (let j = m; j >= 0; j--) d[0][j] = j;
	// Step 3
	for (let i = 1; i <= n; i++) {
		let s_i = s.charAt(i - 1);
		// Step 4
		for (let j = 1; j <= m; j++) {
			// Check the jagged ld total so far
			if (i === j && d[i][j] > 4) return n;
			let t_j = t.charAt(j - 1);
			let cost = (s_i === t_j) ? 0 : 1; // Step 5
			// Calculate the minimum
			let mi = d[i - 1][j] + 1;
			let b = d[i][j - 1] + 1;
			let c = d[i - 1][j - 1] + cost;
			if (b < mi) mi = b;
			if (c < mi) mi = c;
			d[i][j] = mi; // Step 6
		}
	}
	// Step 7
	return d[n][m];
};

/* JSON manipulation */

exports.pStringify = function pStringify(object, debth, indent = "") {
	if (!debth) return JSON.stringify(object);
	let inner = Object.keys(object).map( key => `${indent}\t"${key}": ` + pStringify(object[key], debth-1, `${indent}\t`) ).join(',\r\n');
	if (inner) inner = `\r\n${inner}\r\n${indent}`;
	return `{${inner}}`;
};

//exports.pStringify = function pStringify(object, debth, indent = "") {
//	if (!debth || typeof object !== "object") return JSON.stringify(object);
//	let inner = Object.keys(object).map( key => pStringify(object[key], debth-1, `${indent}\t`) );
//	if (!inner) return Array.isArray(object) ? "[]" : "{}";
//	if (Array.isArray(object))
//		return `[\r\n${inner}\r\n${indent}]`;
//	inner = inner.map( x => `${indent}\t"${key}": ${x}` ).join(',\r\n');
//	return `{\r\n${inner}\r\n${indent}}`;
//}



/* Console reporting */

global.ok = function (str) {
	if (AppOptions.debugmode) {
		if (AppOptions.debugmode > 3) return;
	} else if (Config.debug && Config.debug.ok === false) return;
	console.log('ok'.green + '\t' + str);
};

global.info = function (str) {
	if (AppOptions.debugmode) {
		if (AppOptions.debugmode > 3) return;
	} else if (Config.debug && Config.debug.info === false) return;
	console.log('info'.cyan + '\t' + str);
};

global.error = function (str) {
	if (AppOptions.debugmode) {
		if (AppOptions.debugmode > 3) return;
	} else if (Config.debug && Config.debug.error === false) return;
	console.log('error'.red + '\t' + str);
};

global.errlog = function (str) {
	if (AppOptions.debugmode) {
		if (AppOptions.debugmode > 3) return;
	} else if (Config.debug && Config.debug.errlog === false) return;
	console.log(str);
};

global.debug = function (str) {
	if (AppOptions.debugmode) {
		if (AppOptions.debugmode > 1) return;
	} else if (Config.debug && Config.debug.debug === false) return;
	console.log('debug'.blue + '\t' + str);
};

global.cmdr = function (str) {
	if (AppOptions.debugmode) {
		if (AppOptions.debugmode > 1) return;
	} else if (Config.debug && Config.debug.cmdr === false) return;
	console.log('cmdr'.magenta + '\t' + str);
};

global.recv = function (str) {
	if (AppOptions.debugmode) {
		if (AppOptions.debugmode > 1) return;
	} else if (Config.debug && Config.debug.recv === false) return;
	console.log('recv'.grey + '\t' + str);
};

global.sent = function (str) {
	if (AppOptions.debugmode) {
		if (AppOptions.debugmode > 1) return;
	} else if (Config.debug && Config.debug.sent === false) return;
	console.log('sent'.grey + '\t' + str);
};

global.monitor = function (str, type, flag) {
	switch (type) {
		case 'room':
			if (AppOptions.debugmode) {
				if (AppOptions.debugmode > 3) return;
			} else if (Config.debug && Config.debug.room === false) return;
			switch (flag) {
				case 'join':
					console.log('room'.green + '\t' + str);
					break;
				case 'leave':
					console.log('room'.yellow + '\t' + str);
					break;
				case 'error':
					console.log('room'.red + '\t' + str);
					break;
				default:
					console.log('room'.blue + '\t' + str);
			}
			break;
		case 'battle':
			if (AppOptions.debugmode) {
				if (AppOptions.debugmode > 2) return;
			} else if (Config.debug && Config.debug.battle === false) return;
			switch (flag) {
				case 'join':
					console.log('battle'.green + '\t' + str);
					break;
				case 'leave':
					console.log('battle'.yellow + '\t' + str);
					break;
				case 'error':
					console.log('battle'.red + '\t' + str);
					break;
				default:
					console.log('battle'.blue + '\t' + str);
			}
			break;
		case 'status':
			if (AppOptions.debugmode) {
				if (AppOptions.debugmode > 2) return;
			} else if (Config.debug && Config.debug.status === false) return;
			console.log('status'.blue + '\t' + str);
			break;
		default:
			if (AppOptions.debugmode) {
				if (AppOptions.debugmode > 2) return;
			} else if (Config.debug && Config.debug.monitor === false) return;
			console.log('monitor'.cyan + '\t' + str);
	}
};

/* Process arguments */

exports.paseArguments = function (arr) {
	let opts = {};
	let arg = '';
	for (let i = 0; i < arr.length; i++) {
		arg = arr[i].toLowerCase().trim();
		if (arg.charAt(0) === '-') {
			switch (arg) {
				case '-h':
				case '-help':
					opts.help = true;
					break;
				case '-production':
				case '-p':
					opts.debugmode = 3;
					break;
				case '-monitor':
				case '-m':
					opts.debugmode = 2;
					break;
				case '-debug':
				case '-d':
					opts.debugmode = 1;
					break;
				case '-test':
				case '-t':
					opts.testmode = true;
					break;
				case '-c':
				case '-config':
					if (!arr[i + 1]) opts.help = true;
					opts.config = arr[i + 1];
					i++;
					break;
				case '-dt':
				case '-data':
					if (!arr[i + 1]) opts.help = true;
					opts.data = arr[i + 1];
					i++;
					break;
				default:
					console.log('unknown parametter: ' + arg);
					opts.help = true;
			}
		}
	}
	return opts;
};

/* Commands and Permissions */

exports.stripCommands = function (text) {
	return ((text.trim().charAt(0) === '/') ? '/' : ((text.trim().charAt(0) === '!') ? ' ' : '')) + text.trim();
};

exports.getTargetRoom = function (arg) {
	if (!arg) return null;
	if (arg.indexOf("[") !== 0) return null;
	if (arg.indexOf("]") < 0) return null;
	let target = toRoomid(arg.substr(arg.indexOf("[") + 1, arg.indexOf("]") - arg.indexOf("[") - 1));
	let newArg = arg.substr(arg.indexOf("]") + 1);
	return {arg: newArg, room: target};
};

exports.getUserIdent = function (user, room) {
	room = toRoomid(room);
	if (!Bot.rooms[room] || !Bot.rooms[room].users)
		return false;
	return Bot.rooms[room].users[toId(user)];
};

exports.equalOrHigherRank = function (userIdentity, rank) {
	if (typeof rank === "string" && rank.length > 1) rank = Tools.getGroup(rank);
	if (rank === ' ') return true;
	if (!Config.ranks) Config.ranks = [];
	if (typeof userIdentity !== "string")
		userIdentity = "";
	let userId = toId(userIdentity);
	let userRank = '';
	if (userId in Config.exceptions) {
		userRank = Config.exceptions[userId];
	} else {
		userRank = userIdentity.charAt(0);
	}
	if (userRank === true) return true;
	if (rank === true) return false;
	if (Config.ranks.indexOf(userRank) === -1) return false;
	if (Config.ranks.indexOf(userRank) >= Config.ranks.indexOf(rank)) return true;
	return false;
};

exports.botIsRanked = function (room, rank) {
	return exports.equalOrHigherRank( exports.getUserIdent(Config.nick, room), rank );
};

exports.getGroup = function (perm) {
	if (!perm) return true;
	let globalPermissions = {'voice': '+', 'driver': '%', 'moderator': '@', 'roomowner': '#', 'admin': '~'};
	if (Config.globalPermissions) {
		for (let i in Config.globalPermissions) globalPermissions[i] = Config.globalPermissions[i];
	}
	return globalPermissions[perm] || true;
};

/* Time and Dates */

exports.getDateString = function (date) {
	if (date === undefined)
		date = new Date();
	else date = new Date(date);
	return (exports.addLeftZero(date.getFullYear(), 4) + '-' + exports.addLeftZero(date.getMonth() + 1, 2) + '-' + exports.addLeftZero(date.getDate(), 2) + ' ' + exports.addLeftZero(date.getHours(), 2) + ':' + exports.addLeftZero(date.getMinutes(), 2) + ':' + exports.addLeftZero(date.getSeconds(), 2));
};

exports.getTimeString = function (date) {
	if (date === undefined)
		date = new Date();
	else date = new Date(date);
	return (exports.addLeftZero(date.getHours(), 2) + ':' + exports.addLeftZero(date.getMinutes(), 2) + ':' + exports.addLeftZero(date.getSeconds(), 2));
};

exports.getTimeAgo = function (time, lang) {
	time = Date.now() - time;
	time = Math.round(time / 1000); // rounds to nearest second
	let seconds = time % 60;
	let times = [];
	let trans = function (data) {
		if (!lang) lang = Config.language || 'english';
		return Tools.translateGlobal('time', data, lang);
	};
	if (seconds) times.push(String(seconds) + ' ' + (seconds === 1 ? trans('second') : trans('seconds')));
	let minutes, hours, days;
	if (time >= 60) {
		time = (time - seconds) / 60; // converts to minutes
		minutes = time % 60;
		if (minutes) times = [String(minutes) + ' ' + (minutes === 1 ? trans('minute') : trans('minutes'))].concat(times);
		if (time >= 60) {
			time = (time - minutes) / 60; // converts to hours
			hours = time % 24;
			if (hours) times = [String(hours) + ' ' + (hours === 1 ? trans('hour') : trans('hours'))].concat(times);
			if (time >= 24) {
				days = (time - hours) / 24; // you can probably guess this one
				if (days) times = [String(days) + ' ' + (days === 1 ? trans('day') : trans('days'))].concat(times);
			}
		}
	}
	if (!times.length) times.push('0 ' + trans('seconds'));
	return times.join(', ');
};

/* File system utils */

exports.watchFile = function () {
	try {
		return fs.watchFile.apply(fs, arguments);
	} catch (e) {
		error('Your version of node does not support `fs.watchFile`');
		return false;
	}
};

exports.uncacheTree = function (root) {
	let uncache = [require.resolve(root)];
	do {
		let newuncache = [];
		for (let i = 0; i < uncache.length; ++i) {
			if (require.cache[uncache[i]]) {
				newuncache.push.apply(newuncache,
					require.cache[uncache[i]].children.map(function (module) {
						return module.filename;
					})
				);
				delete require.cache[uncache[i]];
			}
		}
		uncache = newuncache;
	} while (uncache.length > 0);
};

/* Http utils */

exports.httpGet = function (url, callback) {
	if (typeof callback !== "function") return;
	let http = require("http");
	http.get(url, function (res) {
		let data = '';
		res.on('data', function (part) {
			data += part;
		});
		res.on('end', function () {
			callback(data);
		});
		res.on('error', function (e) {
			callback(null, e);
		});
	}).on('error', function (e) {
		callback(null, e);
	});
};

exports.uploadToHastebin = function (toUpload, callback) {
	var reqOpts = {
		hostname: "hastebin.com",
		method: "POST",
		path: '/documents'
	};
	var req = require('https').request(reqOpts, function (res) {
		res.on('data', function (chunk) {
			try {
				var linkStr = "hastebin.com/" + JSON.parse(chunk.toString())['key'];
				if (typeof callback === "function") callback(true, linkStr);
			} catch (e) {
				if (typeof callback === "function") callback(false, e);
			}
		});
	});
	req.on('error', function (e) {
		if (typeof callback === "function") callback(false, e);
	});
	req.write(toUpload);
	req.end();
};

exports.loadHastebin = function(url, onLoad, onError) {
	require('https').get('http://hastebin.com/raw/' + url.split('/').pop(),
		function (res) {
			let data = '';
			
			res.on('data', function (part) {
				data += part;
			});
			
			res.on('end', function (end) {
				if (data === '{"message":"Document not found."}')
					return onError("Document not found.");
				return onLoad(data);
			});
			
			res.on('error', onError);
		}
	).on('error', onError);
};

/* Languages */

let loadLang = exports.loadLang = function (lang, reloading) {
	let tradObj = {}, cmdsTra = {}, tempObj = {};
	fs.readdirSync('./languages/' + lang).forEach(function (file) {
		if (file.substr(-3) !== '.js') return;
		if (reloading) Tools.uncacheTree('./languages/' + lang + '/' + file);
		tempObj = require('./languages/' + lang + '/' + file).translations;
		for (let t in tempObj) {
			if (t === "commands") Object.merge(cmdsTra, tempObj[t]);
			else tradObj[t] = tempObj[t];
		}
	});
	tradObj.commands = cmdsTra;
	return tradObj;
};

let translations = exports.translations = {};
let loadTranslations = exports.loadTranslations = function (reloading) {
	let errs = [];
	fs.readdirSync('./languages').forEach(function (lang) {
		if (fs.lstatSync('./languages/' + lang).isDirectory()) {
			try {
				translations[lang] = loadLang(lang, reloading);
			} catch (e) {
				errlog(e.stack);
				error("Could not import language: ./languages/" + lang + "/ | " + sys.inspect(e));
				errs.push(lang);
			}
		}
	});
	if (reloading) info('Languages reloaded' + (errs.length ? ('. Errors: ' + errs.join(', ')) : '') + '. Languages: ' + Object.keys(translations).join(', '));
	else ok('Loaded languages' + (errs.length ? ('. Errors: ' + errs.join(', ')) : '') + '. Languages: ' + Object.keys(translations).join(', '));
	return errs;
};

exports.translateCmd = function (cmd, data, lang) {
	if (translations[lang] && translations[lang].commands && translations[lang].commands[cmd]) {
		return translations[lang].commands[cmd][data];
	} else {
		lang = 'english';
		if (!translations[lang]) {
			return '__(language ' + lang + 'not found)__';
		} else if (!translations[lang].commands) {
			return '__(' + lang + '/commands not found)__';
		} else if (!translations[lang].commands[cmd]) {
			return '__(' + lang + '/commands/' + cmd + ' not found)__';
		} else {
			return translations[lang].commands[cmd][data];
		}
	}
};

exports.translateGlobal = function (glob, data, lang) {
	if (translations[lang] && translations[lang][glob] && typeof translations[lang][glob][data] !== "undefined") {
		return translations[lang][glob][data];
	} else {
		lang = 'english';
		if (!translations[lang] || !translations[lang][glob] || typeof translations[lang][glob][data] === "undefined") {
			return '__(not found)__';
		} else {
			return translations[lang][glob][data];
		}
	}
};

exports.tryTranslate = function (type, name, lang) {
	if (!lang) return name;
	let id = toId(name);
	if (translations[lang] && translations[lang][type] && translations[lang][type][id]) {
		return translations[lang][type][id];
	}
	return name;
};

/* Battle formats and data */

exports.parseAliases = function (format) {
	if (!format) return '';
	format = toId(format);
	let aliases = Config.formatAliases || {};
	if (Formats[format]) return format;
	if (aliases[format]) format = toId(aliases[format]);
	if (Formats[format]) return format;
	try {
		let psAliases = DataDownloader.getAliases();
		if (psAliases[format]) format = toId(psAliases[format]);
	} catch (e) {}
	return format;
};

let BattleStatIDs = exports.BattleStatIDs = {
	HP: 'hp',
	hp: 'hp',
	Atk: 'atk',
	atk: 'atk',
	Def: 'def',
	def: 'def',
	SpA: 'spa',
	SAtk: 'spa',
	SpAtk: 'spa',
	spa: 'spa',
	SpD: 'spd',
	SDef: 'spd',
	SpDef: 'spd',
	spd: 'spd',
	Spe: 'spe',
	Spd: 'spe',
	spe: 'spe'
};

let BattleStatNames = exports.BattleStatNames = {
	hp: 'HP',
	atk: 'Atk',
	def: 'Def',
	spa: 'SpA',
	spd: 'SpD',
	spe: 'Spe'
};

let BattleTypeChart = exports.BattleTypeChart = require('./data/typechart.js');

/* Teams - Pokemon Showdown format */

let teamToJSON = exports.teamToJSON = function (text) {
	text = text.split("\n");
	let team = [];
	let curSet = null;
	for (let i = 0; i < text.length; i++) {
		let line = text[i].trim();
		if (line === '' || line === '---') {
			curSet = null;
		} else if (!curSet) {
			curSet = {name: '', species: '', gender: '', item: '', ability: '', nature: ''};
			team.push(curSet);
			let atIndex = line.lastIndexOf(' @ ');
			if (atIndex !== -1) {
				curSet.item = line.substr(atIndex + 3);
				if (toId(curSet.item) === 'noitem') curSet.item = '';
				line = line.substr(0, atIndex);
			}
			if (line.substr(line.length - 4) === ' (M)') {
				curSet.gender = 'M';
				line = line.substr(0, line.length - 4);
			}
			if (line.substr(line.length - 4) === ' (F)') {
				curSet.gender = 'F';
				line = line.substr(0, line.length - 4);
			}
			let parenIndex = line.lastIndexOf(' (');
			if (line.substr(line.length - 1) === ')' && parenIndex !== -1) {
				line = line.substr(0, line.length - 1);
				curSet.species = line.substr(parenIndex + 2);
				line = line.substr(0, parenIndex);
				curSet.name = line;
			} else {
				curSet.species = line;
				curSet.name = curSet.species;
			}
		} else if (line.substr(0, 7) === 'Trait: ') {
			line = line.substr(7);
			curSet.ability = line;
		} else if (line.substr(0, 9) === 'Ability: ') {
			line = line.substr(9);
			curSet.ability = line;
		} else if (line === 'Shiny: Yes') {
			curSet.shiny = true;
		} else if (line.substr(0, 7) === 'Level: ') {
			line = line.substr(7);
			curSet.level = parseInt(line);
		} else if (line.substr(0, 11) === 'Happiness: ') {
			line = line.substr(11);
			curSet.happiness = parseInt(line);
		} else if (line.substr(0, 9) === 'Ability: ') {
			line = line.substr(9);
			curSet.ability = line;
		} else if (line.substr(0, 5) === 'EVs: ') {
			line = line.substr(5);
			let evLines = line.split('/');
			curSet.evs = {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0};
			for (let j = 0; j < evLines.length; j++) {
				let evLine = evLines[j].trim();
				let spaceIndex = evLine.indexOf(' ');
				if (spaceIndex === -1) continue;
				let statid = BattleStatIDs[evLine.substr(spaceIndex + 1)];
				let statval = parseInt(evLine.substr(0, spaceIndex));
				if (!statid) continue;
				curSet.evs[statid] = statval;
			}
		} else if (line.substr(0, 5) === 'IVs: ') {
			line = line.substr(5);
			let ivLines = line.split(' / ');
			curSet.ivs = {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31};
			for (let j = 0; j < ivLines.length; j++) {
				let ivLine = ivLines[j];
				let spaceIndex = ivLine.indexOf(' ');
				if (spaceIndex === -1) continue;
				let statid = BattleStatIDs[ivLine.substr(spaceIndex + 1)];
				let statval = parseInt(ivLine.substr(0, spaceIndex));
				if (!statid) continue;
				curSet.ivs[statid] = statval;
			}
		} else if (line.match(/^[A-Za-z]+ (N|n)ature/)) {
			let natureIndex = line.indexOf(' Nature');
			if (natureIndex === -1) natureIndex = line.indexOf(' nature');
			if (natureIndex === -1) continue;
			line = line.substr(0, natureIndex);
			curSet.nature = line;
		} else if (line.substr(0, 1) === '-' || line.substr(0, 1) === '~') {
			line = line.substr(1);
			if (line.substr(0, 1) === ' ') line = line.substr(1);
			if (!curSet.moves) curSet.moves = [];
			if (line.substr(0, 14) === 'Hidden Power [') {
				let hptype = line.substr(14, line.length - 15);
				line = 'Hidden Power ' + hptype;
				if (!curSet.ivs) {
					curSet.ivs = {};
					for (let stat in BattleTypeChart[hptype].HPivs) {
						curSet.ivs[stat] = BattleTypeChart[hptype].HPivs[stat];
					}
				}
			}
			if (line === 'Frustration') {
				curSet.happiness = 0;
			}
			curSet.moves.push(line);
		}
	}
	return team;
};

let packTeam = exports.packTeam = function (team) {
	let buf = '';
	if (!team) return '';
	for (let i = 0; i < team.length; i++) {
		let set = team[i];
		if (buf) buf += ']';
		// name
		buf += (set.name || set.species);
		// species
		let id = toId(set.species || set.name);
		buf += '|' + (toId(set.name || set.species) === id ? '' : id);
		// item
		buf += '|' + toId(set.item);
		// ability
		let template = set.species || set.name;
		try {
			template = DataDownloader.getPokedex()[toId(template)];
		} catch (e) {
			errlog(e.stack);
			template = null;
		}
		if (!template) return '';
		let abilities = template.abilities;
		id = toId(set.ability);
		if (abilities) {
			if (abilities['0'] && id === toId(abilities['0'])) {
				buf += '|';
			} else if (abilities['1'] && id === toId(abilities['1'])) {
				buf += '|1';
			} else if (abilities.H && id === toId(abilities.H)) {
				buf += '|H';
			} else {
				buf += '|' + id;
			}
		} else {
			buf += '|' + id;
		}
		// moves
		buf += '|' + set.moves.map(toId).join(',');
		// nature
		buf += '|' + set.nature;
		// evs
		let evs = '|';
		if (set.evs) {
			evs = '|' + (set.evs.hp || '') + ',' + (set.evs.atk || '') + ',' + (set.evs.def || '') + ',' + (set.evs.spa || '') + ',' + (set.evs.spd || '') + ',' + (set.evs.spe || '');
		}
		if (evs === '|,,,,,') {
			buf += '|';
		} else {
			buf += evs;
		}
		// gender
		if (set.gender && set.gender !== template.gender) {
			buf += '|' + set.gender;
		} else {
			buf += '|';
		}
		// ivs
		let ivs = '|';
		if (set.ivs) {
			ivs = '|' + (set.ivs.hp === 31 || set.ivs.hp === undefined ? '' : set.ivs.hp) + ',' + (set.ivs.atk === 31 || set.ivs.atk === undefined ? '' : set.ivs.atk) + ',' + (set.ivs.def === 31 || set.ivs.def === undefined ? '' : set.ivs.def) + ',' + (set.ivs.spa === 31 || set.ivs.spa === undefined ? '' : set.ivs.spa) + ',' + (set.ivs.spd === 31 || set.ivs.spd === undefined ? '' : set.ivs.spd) + ',' + (set.ivs.spe === 31 || set.ivs.spe === undefined ? '' : set.ivs.spe);
		}
		if (ivs === '|,,,,,') {
			buf += '|';
		} else {
			buf += ivs;
		}
		// shiny
		if (set.shiny) {
			buf += '|S';
		} else {
			buf += '|';
		}
		// level
		if (set.level && set.level !== 100) {
			buf += '|' + set.level;
		} else {
			buf += '|';
		}
		// happiness
		if (set.happiness !== undefined && set.happiness !== 255) {
			buf += '|' + set.happiness;
		} else {
			buf += '|';
		}
	}
	return buf;
};

let fastUnpackTeam = exports.fastUnpackTeam = function (buf) {
	if (!buf) return [];

	let team = [];
	let i = 0, j = 0;

	while (true) {
		let set = {};
		team.push(set);

		// name
		j = buf.indexOf('|', i);
		set.name = buf.substring(i, j);
		i = j + 1;

		// species
		j = buf.indexOf('|', i);
		set.species = buf.substring(i, j) || set.name;
		i = j + 1;

		// item
		j = buf.indexOf('|', i);
		set.item = buf.substring(i, j);
		i = j + 1;

		// ability
		j = buf.indexOf('|', i);
		let ability = buf.substring(i, j);
		let template = Tools.getTemplate(set.species);
		set.ability = (template.abilities && ability in {'': 1, 0: 1, 1: 1, H: 1} ? template.abilities[ability || '0'] : ability);
		i = j + 1;

		// moves
		j = buf.indexOf('|', i);
		set.moves = buf.substring(i, j).split(',');
		i = j + 1;

		// nature
		j = buf.indexOf('|', i);
		set.nature = buf.substring(i, j);
		i = j + 1;

		// evs
		j = buf.indexOf('|', i);
		if (j !== i) {
			let evs = buf.substring(i, j).split(',');
			set.evs = {
				hp: Number(evs[0]) || 0,
				atk: Number(evs[1]) || 0,
				def: Number(evs[2]) || 0,
				spa: Number(evs[3]) || 0,
				spd: Number(evs[4]) || 0,
				spe: Number(evs[5]) || 0
			};
		}
		i = j + 1;

		// gender
		j = buf.indexOf('|', i);
		if (i !== j) set.gender = buf.substring(i, j);
		i = j + 1;

		// ivs
		j = buf.indexOf('|', i);
		if (j !== i) {
			let ivs = buf.substring(i, j).split(',');
			set.ivs = {
				hp: ivs[0] === '' ? 31 : Number(ivs[0]),
				atk: ivs[1] === '' ? 31 : Number(ivs[1]),
				def: ivs[2] === '' ? 31 : Number(ivs[2]),
				spa: ivs[3] === '' ? 31 : Number(ivs[3]),
				spd: ivs[4] === '' ? 31 : Number(ivs[4]),
				spe: ivs[5] === '' ? 31 : Number(ivs[5])
			};
		}
		i = j + 1;

		// shiny
		j = buf.indexOf('|', i);
		if (i !== j) set.shiny = true;
		i = j + 1;

		// level
		j = buf.indexOf('|', i);
		if (i !== j) set.level = parseInt(buf.substring(i, j), 10);
		i = j + 1;

		// happiness
		j = buf.indexOf(']', i);
		if (j < 0) {
			if (buf.substring(i)) {
				set.happiness = Number(buf.substring(i));
			}
			break;
		}
		if (i !== j) set.happiness = Number(buf.substring(i, j));
		i = j + 1;
	}
	return team;
};

let teamOverview = exports.teamOverview = function (buf) {
	let team = fastUnpackTeam(buf);
	if (!team) return '(empty)';
	let pokes = [];
	for (let i = 0; i < team.length; i++) {
		pokes.push(team[i].species);
	}
	if (!pokes.length) return '(empty)';
	return pokes.join(', ');
};

exports.getTemplate = function (name) {
	name = toId(name || '');
	try {
		return (DataDownloader.getPokedex()[name] || {});
	} catch (e) {}
	return {};
};

exports.getItem = function (name) {
	name = toId(name || '');
	try {
		return (DataDownloader.getItems()[name] || {});
	} catch (e) {}
	return {};
};

exports.getAbility = function (name) {
	name = toId(name || '');
	try {
		return (DataDownloader.getAbilities()[name] || {});
	} catch (e) {}
	return {};
};

exports.getMove = function (name) {
	name = toId(name || '');
	try {
		return (DataDownloader.getMovedex()[name] || {});
	} catch (e) {}
	return {};
};

exports.exportTeam = function (team) {
	if (!team) return "";
	if (typeof team === 'string') {
		if (team.indexOf('\n') >= 0) return team;
		team = Tools.fastUnpackTeam(team);
	}
	let text = '';
	for (let i = 0; i < team.length; i++) {
		let curSet = team[i];
		if (curSet.name !== curSet.species) {
			text += '' + curSet.name + ' (' + (Tools.getTemplate(curSet.species).name || curSet.species) + ')';
		} else {
			text += '' + (Tools.getTemplate(curSet.species).name || curSet.species);
		}
		if (curSet.gender === 'M') text += ' (M)';
		if (curSet.gender === 'F') text += ' (F)';
		if (curSet.item) {
			curSet.item = Tools.getItem(curSet.item).name || curSet.item;
			text += ' @ ' + curSet.item;
		}
		text += "\n";
		if (curSet.ability) {
			text += 'Ability: ' + curSet.ability + "\n";
		}
		if (curSet.level && curSet.level !== 100) {
			text += 'Level: ' + curSet.level + "\n";
		}
		if (curSet.shiny) {
			text += 'Shiny: Yes\n';
		}
		if (typeof curSet.happiness === 'number' && curSet.happiness !== 255) {
			text += 'Happiness: ' + curSet.happiness + "\n";
		}
		let first = true;
		if (curSet.evs) {
			for (let j in BattleStatNames) {
				if (!curSet.evs[j]) continue;
				if (first) {
					text += 'EVs: ';
					first = false;
				} else {
					text += ' / ';
				}
				text += '' + curSet.evs[j] + ' ' + BattleStatNames[j];
			}
		}
		if (!first) {
			text += "\n";
		}
		if (curSet.nature) {
			text += '' + curSet.nature + ' Nature' + "\n";
		}
		first = true;
		if (curSet.ivs) {
			let defaultIvs = true;
			let hpType = false;
			for (let j = 0; j < curSet.moves.length; j++) {
				let move = curSet.moves[j];
				if (move.substr(0, 13) === 'Hidden Power ' && move.substr(0, 14) !== 'Hidden Power [') {
					hpType = move.substr(13);
					if (!exports.BattleTypeChart[hpType].HPivs) {
						continue;
					}
					for (let stat in BattleStatNames) {
						if ((curSet.ivs[stat] === undefined ? 31 : curSet.ivs[stat]) !== (exports.BattleTypeChart[hpType].HPivs[stat] || 31)) {
							defaultIvs = false;
							break;
						}
					}
				}
			}
			if (defaultIvs && !hpType) {
				for (let stat in BattleStatNames) {
					if (curSet.ivs[stat] !== 31 && typeof curSet.ivs[stat] !== undefined) {
						defaultIvs = false;
						break;
					}
				}
			}
			if (!defaultIvs) {
				for (let stat in BattleStatNames) {
					if (typeof curSet.ivs[stat] === 'undefined' || isNaN(curSet.ivs[stat]) || curSet.ivs[stat] === 31) continue;
					if (first) {
						text += 'IVs: ';
						first = false;
					} else {
						text += ' / ';
					}
					text += '' + curSet.ivs[stat] + ' ' + BattleStatNames[stat];
				}
			}
		}
		if (!first) {
			text += "\n";
		}
		if (curSet.moves) {
			for (let j = 0; j < curSet.moves.length; j++) {
				let move = curSet.moves[j];
				if (move.substr(0, 13) === 'Hidden Power ') {
					move = move.substr(0, 13) + '[' + move.substr(13) + ']';
				}
				text += '- ' + (Tools.getMove(move).name || move) + "\n";
			}
		}
		text += "\n";
	}
	return text;
};

/* Other tools */

//From the pokemon showdown client

exports.hashColor = function (name) {
	var MD5 = function(f){function i(b,c){var d,e,f,g,h;f=b&2147483648;g=c&2147483648;d=b&1073741824;e=c&1073741824;h=(b&1073741823)+(c&1073741823);return d&e?h^2147483648^f^g:d|e?h&1073741824?h^3221225472^f^g:h^1073741824^f^g:h^f^g;}function j(b,c,d,e,f,g,h){b=i(b,i(i(c&d|~c&e,f),h));return i(b<<g|b>>>32-g,c);}function k(b,c,d,e,f,g,h){b=i(b,i(i(c&e|d&~e,f),h));return i(b<<g|b>>>32-g,c);}function l(b,c,e,d,f,g,h){b=i(b,i(i(c^e^d,f),h));return i(b<<g|b>>>32-g,c);}function m(b,c,e,d,f,g,h){b=i(b,i(i(e^(c|~d),
	f),h));return i(b<<g|b>>>32-g,c);}function n(b){var c="",e="",d;for(d=0;d<=3;d++)e=b>>>d*8&255,e="0"+e.toString(16),c+=e.substr(e.length-2,2);return c}var g=[],o,p,q,r,b,c,d,e,f=function(b){for(var b=b.replace(/\r\n/g,"\n"),c="",e=0;e<b.length;e++){var d=b.charCodeAt(e);d<128?c+=String.fromCharCode(d):(d>127&&d<2048?c+=String.fromCharCode(d>>6|192):(c+=String.fromCharCode(d>>12|224),c+=String.fromCharCode(d>>6&63|128)),c+=String.fromCharCode(d&63|128))}return c}(f),g=function(b){var c,d=b.length;c=
	d+8;for(var e=((c-c%64)/64+1)*16,f=Array(e-1),g=0,h=0;h<d;)c=(h-h%4)/4,g=h%4*8,f[c]|=b.charCodeAt(h)<<g,h++;f[(h-h%4)/4]|=128<<h%4*8;f[e-2]=d<<3;f[e-1]=d>>>29;return f}(f);b=1732584193;c=4023233417;d=2562383102;e=271733878;for(f=0;f<g.length;f+=16)o=b,p=c,q=d,r=e,b=j(b,c,d,e,g[f+0],7,3614090360),e=j(e,b,c,d,g[f+1],12,3905402710),d=j(d,e,b,c,g[f+2],17,606105819),c=j(c,d,e,b,g[f+3],22,3250441966),b=j(b,c,d,e,g[f+4],7,4118548399),e=j(e,b,c,d,g[f+5],12,1200080426),d=j(d,e,b,c,g[f+6],17,2821735955),c=
	j(c,d,e,b,g[f+7],22,4249261313),b=j(b,c,d,e,g[f+8],7,1770035416),e=j(e,b,c,d,g[f+9],12,2336552879),d=j(d,e,b,c,g[f+10],17,4294925233),c=j(c,d,e,b,g[f+11],22,2304563134),b=j(b,c,d,e,g[f+12],7,1804603682),e=j(e,b,c,d,g[f+13],12,4254626195),d=j(d,e,b,c,g[f+14],17,2792965006),c=j(c,d,e,b,g[f+15],22,1236535329),b=k(b,c,d,e,g[f+1],5,4129170786),e=k(e,b,c,d,g[f+6],9,3225465664),d=k(d,e,b,c,g[f+11],14,643717713),c=k(c,d,e,b,g[f+0],20,3921069994),b=k(b,c,d,e,g[f+5],5,3593408605),e=k(e,b,c,d,g[f+10],9,38016083),
	d=k(d,e,b,c,g[f+15],14,3634488961),c=k(c,d,e,b,g[f+4],20,3889429448),b=k(b,c,d,e,g[f+9],5,568446438),e=k(e,b,c,d,g[f+14],9,3275163606),d=k(d,e,b,c,g[f+3],14,4107603335),c=k(c,d,e,b,g[f+8],20,1163531501),b=k(b,c,d,e,g[f+13],5,2850285829),e=k(e,b,c,d,g[f+2],9,4243563512),d=k(d,e,b,c,g[f+7],14,1735328473),c=k(c,d,e,b,g[f+12],20,2368359562),b=l(b,c,d,e,g[f+5],4,4294588738),e=l(e,b,c,d,g[f+8],11,2272392833),d=l(d,e,b,c,g[f+11],16,1839030562),c=l(c,d,e,b,g[f+14],23,4259657740),b=l(b,c,d,e,g[f+1],4,2763975236),
	e=l(e,b,c,d,g[f+4],11,1272893353),d=l(d,e,b,c,g[f+7],16,4139469664),c=l(c,d,e,b,g[f+10],23,3200236656),b=l(b,c,d,e,g[f+13],4,681279174),e=l(e,b,c,d,g[f+0],11,3936430074),d=l(d,e,b,c,g[f+3],16,3572445317),c=l(c,d,e,b,g[f+6],23,76029189),b=l(b,c,d,e,g[f+9],4,3654602809),e=l(e,b,c,d,g[f+12],11,3873151461),d=l(d,e,b,c,g[f+15],16,530742520),c=l(c,d,e,b,g[f+2],23,3299628645),b=m(b,c,d,e,g[f+0],6,4096336452),e=m(e,b,c,d,g[f+7],10,1126891415),d=m(d,e,b,c,g[f+14],15,2878612391),c=m(c,d,e,b,g[f+5],21,4237533241),
	b=m(b,c,d,e,g[f+12],6,1700485571),e=m(e,b,c,d,g[f+3],10,2399980690),d=m(d,e,b,c,g[f+10],15,4293915773),c=m(c,d,e,b,g[f+1],21,2240044497),b=m(b,c,d,e,g[f+8],6,1873313359),e=m(e,b,c,d,g[f+15],10,4264355552),d=m(d,e,b,c,g[f+6],15,2734768916),c=m(c,d,e,b,g[f+13],21,1309151649),b=m(b,c,d,e,g[f+4],6,4149444226),e=m(e,b,c,d,g[f+11],10,3174756917),d=m(d,e,b,c,g[f+2],15,718787259),c=m(c,d,e,b,g[f+9],21,3951481745),b=i(b,o),c=i(c,p),d=i(d,q),e=i(e,r);return(n(b)+n(c)+n(d)+n(e)).toLowerCase()};

	var hash = MD5(toId(name));
	var H = parseInt(hash.substr(4, 4), 16) % 360; // 0 to 360
	var S = parseInt(hash.substr(0, 4), 16) % 50 + 40; // 40 to 89
	var L = Math.floor(parseInt(hash.substr(8, 4), 16) % 20 + 30); // 30 to 49

	var C = (100 - Math.abs(2 * L - 100)) * S / 100 / 100;
	var X = C * (1 - Math.abs((H / 60) % 2 - 1));
	var m = L / 100 - C / 2;

	var R1, G1, B1;
	switch (Math.floor(H / 60)) {
	case 1: R1 = X; G1 = C; B1 = 0; break;
	case 2: R1 = 0; G1 = C; B1 = X; break;
	case 3: R1 = 0; G1 = X; B1 = C; break;
	case 4: R1 = X; G1 = 0; B1 = C; break;
	case 5: R1 = C; G1 = 0; B1 = X; break;
	case 0: default: R1 = C; G1 = X; B1 = 0; break;
	}
	var lum = (R1 + m) * 0.2126 + (G1 + m) * 0.7152 + (B1 + m) * 0.0722; // 0.05 (dark blue) to 0.93 (yellow)

	var HLmod = (lum - 0.5) * -100; // -43 (yellow) to 45 (dark blue)
	if (HLmod > 12) HLmod -= 12;
	else if (HLmod < -10) HLmod = (HLmod + 10) * 2 / 3;
	else HLmod = 0;

	L += HLmod;

	var Smod = 10 - Math.abs(50 - L);
	if (HLmod > 15) Smod += (HLmod - 15) / 2;
	S -= Smod;

	var hslToRgb = function hslToRgb(h, s, l){
		var r, g, b;
		h = h / 360;
		l = l / 100;
		s = s / 100;
		if (s === 0) {
				r = g = b = l; // achromatic
		} else {
				var hue2rgb = function hue2rgb(p, q, t){
					if(t < 0) t += 1;
					if(t > 1) t -= 1;
				if(t < 1/6) return p + (q - p) * 6 * t;
				if(t < 1/2) return q;
				if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
				return p;
				}

			var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
			var p = 2 * l - q;
			r = hue2rgb(p, q, h + 1/3);
			g = hue2rgb(p, q, h);
			b = hue2rgb(p, q, h - 1/3);
		}

		return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
	};
	var rgb = hslToRgb(H, S, L);
	var color = "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")";
	//color = "color:hsl(" + H + "," + S + "%," + L + "%);";
	return color;
};

exports.colorName = function (name, linkUsercard, tagname) {
	if (linkUsercard) linkUsercard =  ` class='username' data-name='${exports.escapeHTML(name)}'`;
	return `<${tagname || "span"}${linkUsercard || ""} style='color:${exports.hashColor(name)}; white-space:nowrap'>${exports.escapeHTML(name)}</${tagname || "span"}>`;
};

exports.checkConfig = function () {
	let issue = function (text) {
		console.log('issue'.yellow + '\t' + text);
	};
	if (Config.server && Config.server.substr(-8) === ".psim.us" && Config.server !== "sim.psim.us") {
		issue('WARNING: YOUR SERVER URL ' + Config.server.red + ' SEEMS A CLIENT URL, NOT A SERVER ONE. USE ' + 'node serverconfig.js'.cyan + ' TO GET THE CORRECT SERVER, PORT AND SERVERID VALUES\n');
	}
	if (typeof Config.rooms !== 'string' && (typeof Config.rooms !== 'object' || typeof Config.rooms.length !== 'number')) {
		issue('Config.rooms is not an array');
		Config.rooms = [];
	}
	if (typeof Config.privateRooms !== 'object') {
		issue('Config.privateRooms is not an object');
		Config.privateRooms = {};
	}
	if (typeof Config.initCmds !== 'object' || typeof Config.initCmds.length !== 'number') {
		issue('Config.initCmds is not an array');
		Config.initCmds = [];
	}
	if (typeof Config.exceptions !== 'object') {
		issue('Config.exceptions is not an object');
		Config.exceptions = {};
	}
	if (typeof Config.ranks !== 'object' || typeof Config.ranks.length !== 'number') {
		issue('Config.ranks is not an array');
		Config.ranks = [];
	}
	if (typeof Config.permissionExceptions !== 'object') {
		issue('Config.permissionExceptions is not an object');
		Config.permissionExceptions = {};
	}
	if (typeof Config.debug !== 'object') {
		issue('Config.debug is not an object');
		Config.debug = {};
	}
};

exports.reloadFeature = function (feature) {
	try {
		if (!fs.existsSync('./features/' + feature + '/index.js')) return -1;
		Tools.uncacheTree('./features/' + feature + '/index.js');
		let f = require('./features/' + feature + '/index.js');
		if (f.id) {
			if (Features[f.id] && typeof Features[f.id].destroy === "function") Features[f.id].destroy();
			Features[f.id] = f;
			if (typeof Features[f.id].init === "function") Features[f.id].init();
			info("Feature \"" + f.id + '\" reloaded');
		} else {
			return -1;
		}
		return false;
	} catch (e) {
		return e;
	}
};
