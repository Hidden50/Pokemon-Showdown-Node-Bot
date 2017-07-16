let roomstatshelp = Tools.makeHtmlDetails("<b>Usage help</b>",
`<pre style='overflow-y:auto'>Roomstats Feature by Orda-Y. PM me in case of questions.

Usage:
.roomstats  total number of lines/characters for all users
.userstats  number of lines/characters by day, for a given user
.messages   messages of a given user

Arguments (separated by ";"):
- ROOMS:    A comma separated list of rooms that you have access to.
              Put "all", to search all of them.
- USERS:    A comma separated list of users and / or ranks.
              Put "any", to match on messages from any user
- PHRASES:  A comma separated list of search phrases.
              Matches only such messages that contain at least one of them.
              Put "all" to match on all of their messages.

Examples: .roomstats all
          .roomstats all; any; all; 2016-12-01
          .roomstats overused; %, @, Orda-Y, Ordalt; "/log "; 2016-12-01; 30
`.replace(/\r?\n/g, "<br>"));

// - TIMESPAN: Leave blank for default timespan
//               Put a date to search backwards from that date. (Formatted YYYY-MM-DD)
//               Put a date followed by a comma and a number of days to search that many
//               days backwards from that date.

// todo: add parameter 0: top200 || lines || messages || timezones?
// todo: make .timespans command

let outputResults = function outputResults(context, cmd, processed, title, filedates, ROOMS, USERS, PHRASES, TIMESPAN) {
	if (cmd === "roomstats") {
		processed = Object.keys(processed)
			.sort( (a,b) => processed[b].characters - processed[a].characters )
			.map( (user, index) => [ `${index+1}.`, processed[user].rank + Tools.colorName(processed[user].name, true), Math.floor(processed[user].lines / filedates.length), Math.floor(processed[user].characters / filedates.length) ] );
		let footline = "";
		if (processed.length > 200) {
			footline = `(${processed.length} different userids in total.)`;
			processed.length = 200;
		}
		processed.unshift(["", "<b>Username</b>", "&nbsp;&nbsp;<b>Lines/day</b>", "&nbsp;&nbsp;<b>Characters/day</b>"]);
		processed = Tools.makeHtmlTable(processed, ["style='text-align:right'", "", "style='text-align:right'", "style='text-align:right'"]);
		processed = `<center style='max-height:210px; overflow-y:auto; margin-bottom:5px'>${processed}</center>${footline}`;
	}
	if (cmd === "userstats") {
		processed = Object.keys(processed)
			.map( filename => `${filename}: <b>${processed[filename].lines}</b> Lines, <b>${processed[filename].characters}</b> Characters` )
			.join('<br>');
		processed = `<div style='max-height:210px; overflow-y:auto'>${processed}</div>`;
	}
	if (cmd === "timezones") {
//		let output = [];
//		for (let userid in processed) {
//			if ( userid === "Sum" && Object.keys(processed).length === 2 )
//				continue;
//			let max = 0;
//			for (let t in processed[userid])
//				if (processed[userid][t] > max) max = processed[userid][t];
//			output.push(userid);
//			for (let t in processed[userid]) {
//				let bars = Math.floor(20 * processed[userid][t] / max);
//				output.push( (t < 10 ? " " : "") + t + ": " + "|".repeat(bars) + " ".repeat(21-bars) + processed[userid][t] );
//			}
//		}
//		processed = `<pre style='max-height:210px; overflow-y:auto'>${output.join('<br>')}</pre>` + Tools.formatSourceAsHtml( JSON.stringify(processed, null, 2) );
		processed = `<div style='max-height:210px; overflow-y:auto'>${JSON.stringify(processed)}</div>`;
	}
	if (cmd === "messages") {
		processed = Object.keys(processed.messages).map(
			(filedate, index) => {
				let messageCount = processed.messages[filedate].length;
				if (messageCount) {
					let leftWidth = 0;
					for (let i in processed.messages[filedate]) {
						if (processed.messages[filedate][i][0].length > leftWidth)
							leftWidth = processed.messages[filedate][i][0].length;
					}
					let fillWidth = str => "<span style='font-family:courier'>" + str + "&nbsp;".repeat(leftWidth - str.length) + "</span>";
					let open = index ? "" : "open='open'";
					return `<details ${open}style='margin:5px'><summary><b>${filedate}</b> (${messageCount} messages)</summary>` +
						processed.messages[filedate].reverse().map(
							roomAndMessage => fillWidth(roomAndMessage[0]) + " " + roomAndMessage[1]
						).join("<br>") + `</details>`;
				}
				return '';
			}
		).join('');
		processed = `<div style='max-height:210px; overflow-y:auto'>${processed}</div>`;
	}
	processed = Tools.makeHtmlDetails(title, processed);
	return context.htmlReply(processed);
};

let getTitle = function getTitle(cmd, filedates, ROOMS, USERS, PHRASES, TIMESPAN) {
	let firstFileDate = filedates[0];
	let lastFileDate = filedates[filedates.length - 1];
	if (cmd === "roomstats")
		return `Top 200 most active users from <b>${firstFileDate}</b> to <b>${lastFileDate}</b>`;
	if (cmd === "userstats")
		return `Line count for ${USERS.map( u => Tools.colorName(u) ).join(', ')} from <b>${firstFileDate}</b> to <b>${lastFileDate}</b>`;
	if (cmd === "timezones")
		return `Message distribution for ${USERS.map( u => Tools.colorName(u) ).join(', ')} from <b>${firstFileDate}</b> to <b>${lastFileDate}</b>`;
	if (cmd === "messages")
		return `Last 200 logged messages from ${USERS.map( u => Tools.colorName(u) ).join(', ')} from <b>${firstFileDate}</b> to <b>${lastFileDate}</b>`;
};

let runLogSearch = function runLogSearch (context, cmd, ROOMS, USERS, PHRASES, TIMESPAN) {
	'use strict';
	let dirs = ROOMS.map( room => `./logs/${room}/` );
	let paths = {};
	for (let d = dirs.length - 1; d >= 0; d--) {
		let filenames = fs.readdirSync(dirs[d]);
		for (let f in filenames) {
			let filedate = filenames[f].substr(0,10);
			if (!paths[filedate]) paths[filedate] = [];
			paths[filedate].push(dirs[d] + filenames[f]);
		}
	}
	let filedates = Object.keys(paths).sort();
	if (cmd === "roomstats") {
		let minDate = new Date(`${"2017-05-01"} 00:00:00`).getTime();
		let maxDate = new Date(`${Tools.getDateString().substr(0, 10)} 00:00:00`).getTime();
		filedates = filedates.filter( filedate => {
			let date = new Date(`${filedate} 00:00:00`).getTime();
			return date >= minDate && date <= maxDate;
		});
	}
	let title = getTitle(cmd, filedates, ROOMS, USERS, PHRASES, TIMESPAN);
	
	let childOutput = [];
	let StringDecoder = require('string_decoder').StringDecoder;
	let decoder = new StringDecoder('utf8');
	
	require('child_process').execFile('node', ['logsearch.js', JSON.stringify([cmd, paths, filedates, USERS, PHRASES])], {maxBuffer: 1024 * 10000}, (error, stdout, stderr) => {
		if (error && stderr) console.log(`Logsearch Error: ${error}`);
	}).stdout.on('data', data => {
		let message = decoder.write(data);
		childOutput.push(message);
	}).on('close', exitcode => {
		childOutput = childOutput.join('');
		outputResults(context, cmd, JSON.parse(childOutput), title, filedates, ROOMS, USERS, PHRASES, TIMESPAN);
	});
};

Settings.addPermissions(['roomstats']);

exports.commands = {
	messages:  "roomstats",
	userstats: "roomstats",
	timezones: "roomstats",
	roomstats: function (arg, by, room, cmd) {
		'use strict';
		let [ROOMS, USERS, PHRASES, TIMESPAN, ...overflow] = arg.split(';').map(splitArgs);
		ROOMS = ROOMS.map(toRoomid);
		if (ROOMS[0] === "") return this.htmlReply(roomstatshelp);
		if (overflow.length) return this.htmlReply('Too many arguments.<br><br>' + roomstatshelp);
		
		let bypassAuthcheck = this.isRanked('&') || ( this.roomType === "pm" && this.isRanked(Config.chatLogger.roomstatsPermissions.global) );
		if ( ["public", "all"].includes(ROOMS[0]) && ROOMS.length === 1) {
			let target = ROOMS[0];
			ROOMS = Config.chatLogger.rooms;
			if (!bypassAuthcheck)
				ROOMS = ROOMS.filter( ROOM => this.isRanked(Config.chatLogger.roomstatsPermissions[ROOM] || '#', ROOM) );
			if (target === "public")
				ROOMS = ROOMS.filter( ROOM => !Config.privateRooms[ROOM] );
		} else {
			for (let r in ROOMS) {
				if (!bypassAuthcheck) {
					let rankRequirement = Config.chatLogger.roomstatsPermissions[ROOMS[r]] || '#';
					if (!this.isRanked(rankRequirement, ROOMS[r])) {
						return this.restrictReply(`You either need a higher staff position in ${ROOMS[r]}, or the bot can't see you on the userlist in that room.`, "roomstats");
					}
				}
				if (!Config.chatLogger.rooms.includes(ROOMS[r]))
					return this.restrictReply(`${ROOMS[r]} is not being logged. If you're a room owner, contact Orda-Y to change this.`, "roomstats");
			}
		}
		
		if (!USERS || USERS[0] === "any" || USERS[0] === "")
			USERS = [];
		if (!PHRASES || PHRASES[0] === "all" || PHRASES[0] === "")
			PHRASES = [];
		if (!TIMESPAN)
			TIMESPAN = [];
		if (!TIMESPAN[0])
			TIMESPAN[0] = Tools.getDateString().substr(0, 10);
		if (!TIMESPAN[1])
			TIMESPAN[1] = "2017-05-01";
		// todo: error handling for wrong dates
		
//		return this.htmlReply("roomstats have been disabled by Orda-Y, will be back in a few hours.");
		this.sclog();
		runLogSearch(this, cmd, ROOMS, USERS, PHRASES, TIMESPAN);
	}
};