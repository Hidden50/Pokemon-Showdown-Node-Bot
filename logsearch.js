let fs = require('fs');
let Tools = require('./tools.js');

let parseLogfiles = function parseLogfiles(cmd, processed, filedate, filepaths, USERS, PHRASES) {
	'use strict';
	if (cmd === "userstats") processed[filedate] = { lines:0, characters:0 };
	if (cmd === "timezones" && !processed.Sum) processed.Sum = Array(24*60).fill(0);
	if (cmd === "messages") {
		if (!processed.messages) processed.messages = {};
		if (!processed.messagecount) processed.messagecount = 0;
		processed.messages[filedate] = [];
	}
	
	let logLineRegex = /\[?(\d\d\:\d\d\:\d\d)\]? ?\|(c)\:?\|(?:(\d+)\|)?([^|]*)\|(.*)/i;  // extracts timestamp, message type, date, sender and message
	let filepathRegex = /^\.\/logs\/(\w*)\/[\d-]*\.log/;                                  // extracts the room name
	
	let USERIDS = [], USERRANKS = [];
	for (let u in USERS) {                                                                                   // separate USERS into USERIDS and USERRANKS
		let userid = toId(USERS[u]);
		if (userid) USERIDS.push(userid);
		else USERRANKS.push(USERS[u]);
	}
	
	let userRegex;
	if (!USERS.length)                                                                                       // if USERS is blank
		userRegex = ['^.*$'];  // matches any string
	else {                                                                                                   // else
		userRegex = USERRANKS.map( rank => '^' + (["+", "*"].includes(rank) ? "\\" : "") + rank );           //   ..require a matching username
		userRegex.push( ...USERIDS.map( id => '^\\W' + id.split('').join('[^a-z0-9]*') + '[^a-z0-9]*$' ) );  //   ..or a matching rank
	}
	userRegex = new RegExp(userRegex.join('|') || '.^', 'i');  // /.^/ doesn't match any string
	
	let phraseRegex;
	if (!PHRASES.length)                                                                                     // if PHRASES is blank
		phraseRegex = ['^.*$'];  // matches any string
	else {                                                                                                   // else
		phraseRegex = PHRASES.map(                                                                           //   ..require a matching phrase
			phrase => phrase.replace(/\\/g, '\\\\\\\\').replace(/["'`]/g, '\'\\$&\'').replace(/[\{\}\[\]\(\)\$\^\.\?\+\-\*]/g, '[$&]')
		);
	}
	phraseRegex = new RegExp(phraseRegex.join('|') || '.^', 'i');  // /.^/ doesn't match any string
	
	let punishmentRegex = [];
	if (cmd === "messages")
		USERIDS.forEach( id => punishmentRegex.push('^\\/log ' + id.split('').join('[^a-z0-9]*')) );
	punishmentRegex = new RegExp(punishmentRegex.join('|') || '.^', 'i');  // .^ doesn't match any string
	
	for (let p in filepaths) {
		let log = fs.readFileSync(filepaths[p]).toString().split(/\r?\n/);
		let [, fileroomname] = filepaths[p].match(filepathRegex);
		for (let l = log.length; l--; ) {
			let [, time, type, date, by, message] = logLineRegex.exec(log[l]) || [];
			if (  !phraseRegex.test(message) || ( !userRegex.test(by) && !punishmentRegex.test(message) )  )
				continue;
			if (type !== "c")
				continue;
			
			let username = by.substr(1);
			let rank = by[0];
			let userid = toId(by);
			
			if (cmd === "roomstats") {
				if (!processed[userid]) processed[userid] = { "rank": rank, "name": username, "lines": 0, "characters": 0 };
				processed[userid].lines++;
				processed[userid].characters += message.length;
			}
			if (cmd === "userstats") {
				processed[filedate].lines++;
				processed[filedate].characters += message.length;
			}
			if (cmd === "timezones") {
				if (date) time = Tools.getTimeString(1000 * date);
				let hours = Number( time.substr(0, 2) );
				let minutes = Number( time.substr(3, 2) );
				let key = 60 * hours + minutes;
				if ( USERIDS.includes(userid) || USERRANKS.includes(rank) ) {
					if (!processed[userid]) processed[userid] = Array(24*60).fill(0);
					processed[userid][key]++;
				}
				if (!processed.Sum[key]) processed.Sum[key] = 0;
				processed.Sum[key]++;
			}
			if (cmd === "messages") {
				if (message.startsWith('/log '))
					message = `<span style='color:red'>${Tools.escapeHTML(message.substr(5))}</span>`;
				else message = `${rank}${Tools.colorName(username, true)}: ${Tools.escapeHTML(message)}`;
				message = message.replace(/click here/ig, "click  here");
				let timestamp;
				if (date) {
					date *= 1000;  // date is in seconds since 1970.. not milliseconds
					timestamp = Tools.makeHtmlTimestamp(fileroomname, date);
				} else {
					// PSmain logs dont have $date. Instead, $time contains hh:mm:ss and $filepath ends with YYYY_MM_DD
					date = `${filedate} ${time}`;
					timestamp = Tools.makeHtmlTimestamp(fileroomname, date, true);
					date = new Date(date).getTime();
				}
				processed.messages[filedate].push([ [`(${fileroomname})`, `${timestamp} ${message}`], date ]);
			}
		}
	}
	if (cmd === "messages") {
		processed.messages[filedate] = processed.messages[filedate].sort( (A,B) => B[1]-A[1] ).map( msg => msg[0] );
		if (processed.messagecount + processed.messages[filedate].length > 200) {
			processed.messages[filedate].length = 200 - processed.messagecount;
			processed.messages[filedate].push(
				["", `(message cap reached, ${processed.messages[filedate].length - 200 + processed.messagecount} earlier messages in this day have been capped off)`]
			);
			return true;
		}
		processed.messagecount += processed.messages[filedate].length;
	}
};

let logSearch = function logSearch (cmd, paths, filedates, USERS, PHRASES) {
	'use strict';
	let processed = {};
	for (let fd = filedates.length - 1; fd >= 0; fd--) {
		if (parseLogfiles( cmd, processed, filedates[fd], paths[filedates[fd]], USERS, PHRASES ))
			break;
	}
	let processedString = JSON.stringify(processed);
	process.stdout.write(processedString);
//	let cutString = [];
//	let pastLength = processedString.length;
//	let loops = Math.ceil(pastLength/1000);
//	for (let i = 0; i < loops; i++) {
//		let processedSub = processedString.substring(0, 1000);
//		cutString.push(processedSub);
//		processedString = processedString.substring(1000);
//	}
//	for (let each of cutString) {
//		process.stdout.write( each );
//	}
};

let [path, file, args] = process.argv;
logSearch( ...JSON.parse(args) );