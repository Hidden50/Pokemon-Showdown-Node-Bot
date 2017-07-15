global.bottours_enabled = false;

var tourrooms = [
	"groupchat-scrappie-tour1",
	"groupchat-scrappie-tour2",
	"groupchat-scrappie-tour3",
	"groupchat-scrappie-tour4"
];

setTimeout(initBottours, 36000);

const bottour_desc = global.bottour_desc = '<div style="background-color:lightblue; color:black; border-width:3px; border-color: #4CAF50; border-style:solid; padding:25px; border-radius:25px">Hi, this is an experimental feature.<br><b>Scrappie will create tournaments for you</b> whenever you want. Click the join button above - the tour will start once the playercap is reached.<br><br>Things to PM the bot:<br><b><code>.signup FORMAT</code></b> - Sends you to a signups room for this format. (OU, UU or Ubers)<br></div>';  // Object.keys(bottours).map( x => bottours[x].name ).join(', ')

var bottours = global.bottours = {
	"ou": {
		name: "OU",
		officialname: "gen7ou",
		slots: 4,
		playercap: 8,
		authrooms: [
			"overused",
			"tournaments"
		],
		creationBroadcast: [
			"overused"
		],
		icon: "http://hidden50.github.io/brmt/Serebii__Images/645-s.png"
	},
	"uu": {
		name: "UU",
		officialname: "uu",
		slots: 1,
		playercap: 4,
		authrooms: [
			"underused",
			"tournaments"
		],
		creationBroadcast: [],
		icon: "http://hidden50.github.io/brmt/Serebii__Images/245.png"
	},
	"ubers": {
		name: "Gen7 Ubers",
		officialname: "gen7ubers",
		slots: 1,
		playercap: 4,
		authrooms: [
			"ubers",
			"tournaments"
		],
		creationBroadcast: [
			"ubers"
		],
		icon: "http://hidden50.github.io/brmt/Serebii__Images/383-p.png"
	},
	"ag": {
		name: "Gen7 AG",
		officialname: "gen7anythinggoes",
		slots: 1,
		playercap: 4,
		authrooms: [
			"anythinggoes"
		],
		creationBroadcast: [
//			"anythinggoes"
		],
		icon: "http://hidden50.github.io/brmt/Serebii__Images/384-m.png"
	}
};
var bottours_initialstate = JSON.parse( JSON.stringify(bottours) );
var authrooms = Object.keys(bottours).map( x => bottours[x].authrooms ).reduce( (sum, next) => sum.concat(next) ).filter( (x, i, ar) => ar.indexOf(x) === i );

var bottour_stats = global.bottour_stats = {
	updating: true,
	roomCapHits: 0,
	"ou": {
		slotCapHits: 0,
		requests: 0
	},
	"uu": {
		slotCapHits: 0,
		requests: 0
	},
	"ubers": {
		slotCapHits: 0,
		requests: 0
	}
};

function initBottours() {
	if (global.bottour_listeners_running) {
		bottour_stats.updating = false;
		return;
	}
	global.bottour_listeners_running = true;
	Bot.on('userleave', function (room, by) {
		if (tourrooms.indexOf(room) < 0)
			return;
		var x = Features['tours'].tourData[room];
		if (  x && x.bracketData && x.bracketData.users && x.bracketData.users.map(toId).indexOf(toId(by)) >= 0  ) {
			Bot.say(room, '/roomban ' + by + ', player left room, kicking from tournament signups');
			Bot.say(room, '/roomunban ' + by);
		}
	});
	Bot.on('userjoin', function (room, by) {
		if (tourrooms.indexOf(room) < 0)
			return;
		for (var r in authrooms) {
			if (    Bot.rooms[authrooms[r]]
			     && Bot.rooms[authrooms[r]].users[toId(by)]
			     && Tools.equalOrHigherRank(Bot.rooms[authrooms[r]].users[toId(by)][0], '%')
			     && !Tools.equalOrHigherRank(Bot.rooms[room].users[toId(by)][0], '@')    )
			{
				Bot.say(room, '/roommod ' + by);
				return;
			}
		}
	});
/*	setInterval(function() {
		for (var r in tourrooms) {
			if (!Bot.rooms[tourrooms[r]])
				continue;
			if (getTourState(room) === TOUR_SIGNUPS)
				
		}
	}, 3 * 60 * 1000);*/
	bottour_stats.updating = false;
}

function makeTourRoom(roomname) {
	Bot.say('overused', '/makegroupchat ' + roomname.replace('groupchat-scrappie-', ''));
	setTimeout(function() {
		Bot.say(roomname, '/modchat %');
		Bot.say(roomname, '/roomintro ' + bottour_desc);
		setTimeout(function() {
			Bot.say(roomname, '/roommod Orda-Y');    // for the initial phase, I moderate the tours
		}, 1500);
	}, 1500);
	return roomname;
}

function makeTournament(format, roomname) {
	bottour_stats.updating = true;
	setTimeout(function() {
//		Bot.say(roomname, '!htmlbox ' + bottour_desc);
		Bot.say(roomname, '/tour new ' + bottours[format].officialname + ', elimination, ' + bottours[format].playercap);
		setTimeout(function() {
			Bot.say(roomname, '/tour autodq 2');
			Bot.say(roomname, '/tour autostart on');
			bottour_stats.updating = false;
		}, 1500);
	}, 4500);
}

function TourbracketFindUser(user, rootNode) { // todo: return false if the user was in it, but has lost their match
	for (i in rootNode.children) {
		if ( (rootNode.children[i].team && toId(rootNode.children[i].team) === user) || TourbracketFindUser(user, rootNode.children[i]) )
			return true;
	}
	return false;
}

const TOUR_NO_ROOM = 0, TOUR_NO_TOUR = 1, TOUR_SIGNUPS = 2, TOUR_STARTED = 3;

function getTourState(room) {
	var tourData = Features['tours'].tourData[room];
	if (!Bot.rooms[room]) return TOUR_NO_ROOM;
	if (!tourData) return TOUR_NO_TOUR;
	if (!tourData.isStarted) return TOUR_SIGNUPS;
	return TOUR_STARTED;
}

function tryWall(room, msg) {
	if (!Bot.rooms[room]) return;
	if (  Tools.equalOrHigherRank(Bot.rooms[room].users[toId(Bot.status.nickName)][0], '%')  )
		Bot.say(room, '/wall ' + msg);
	else Bot.say(room, msg);
}

Settings.addPermissions(['signups']);

exports.commands = {
	disablebottours: function(arg, by, room, cmd) {
		if (!global.bottours_enabled || !Bot.rooms['oustaff'].users[toId(by)])
			return;
		global.bottours_enabled = false;
		return Bot.say('oustaff', 'Bot Tours have been disabled by ' + by);
	},
	enablebottours: function(arg, by, room, cmd) {
		if (global.bottours_enabled || !Bot.rooms['oustaff'].users[toId(by)])
			return;
		global.bottours_enabled = true;
		return Bot.say('oustaff', 'Bot Tours have been enabled by ' + by);
	},
	addtempformat: function(arg, by, room, cmd) {
		arg = arg.split(',').map( x => x.trim() );
		if (!this.isRanked('~') && ["chopinalkaninoff"].indexOf(toId(by)) < 0)
			return this.pmReply('You don\'t have permission to do that.');
		if (!arg[0] || !arg[1] || !arg[2])
			return this.pmReply('Usage: ``.addtempformat NAME, SHORTNAME, OFFICIALNAME, PLAYERCAP``');
		if (!this.isRanked('~') && bottours_initialstate[toId(arg[0])])
			return this.pmReply('Please don\'t modify the built-in formats.');
		bottours[toId(arg[1])] = {
			name: arg[0],
			officialname: arg[2],
			slots: 1,
			playercap: arg[3] || 4,
			authrooms: [],
			creationBroadcast: []
		};
		return this.pmReply('Format "' + arg[0] + '" has been successfully modified.');
	},
	signups: "signup",
	signup: function(arg, by, room, cmd) {
		if (!bottours_enabled && !this.isExcepted)
			return this.pmReply('Automated bot tours are currently disabled.');
		
		// Usage Help
		if (this.roomType !== 'pm' && !this.can('signups')) {
			return this.pmReply('Tour signups are only available via pm. Usage: ``.signup FORMAT``. Currently valid tour formats are: '
			                    + Object.keys(bottours).map( x => bottours[x].name ).join(', ') + '.');
		}
		if (!arg) {
			return this.pmReply('Usage: ``.signup FORMAT``. Currently valid tour formats are: '
			                    + Object.keys(bottours).map( x => bottours[x].name ).join(', ') + '.');
		}
		
		var format = toId(arg);
		
		// Count users trying to .signup for a format
		if (!bottour_stats[format])
			bottour_stats[format] = {requests: 0};
		bottour_stats[format].requests++;
		
		// Is this format supported?
		if (!bottours[format]) {
			return this.pmReply('Format not supported. Currently valid tour formats are: '
			                    + Object.keys(bottours).map( x => bottours[x].name ).join(', ') + '.');
		}
		
		// In case of restarts, make sure we know about the state of all tour rooms
		if (bottour_stats.updating) {
			return setTimeout(function() {
				CommandParser.parse(room, by, '.signup ' + arg);
			}.bind(this), 1500);
		}
		
		// Don't allow users to sign up in multiple rooms
		for (var i in tourrooms) {
			if ( Features['tours'].tourData[tourrooms[i]]
			  && Features['tours'].tourData[tourrooms[i]].bracketData
			  && Features['tours'].tourData[tourrooms[i]].bracketData.rootNode
			  && TourbracketFindUser(toId(by), Features['tours'].tourData[tourrooms[i]].bracketData.rootNode) )
			{
				return this.pmReply('You are already in a tournament in <<' + tourrooms[i] + '>>.');
			}
		}
		
		// Find a tour that's currently in signups, or create one
		var possibleRooms = tourrooms.filter(                                                         // find rooms in signup phase
			x => (    Bot.rooms[x]
			       && Features['tours'].tourData[x]
			       && !Features['tours'].tourData[x].isStarted
			       && Features['tours'].tourData[x].format === bottours[format].officialname    )
		);
//		if (this.roomType !== 'pm') this.reply(JSON.stringify(possibleRooms));
		if (possibleRooms.length === 0) {                                                             // if none exist..
			possibleRooms = tourrooms.filter(                                                         // are all slots used up?
				x => (    Features['tours'].tourData[x]
				       && Features['tours'].tourData[x].format === bottours[format].officialname    )
			);
			if (possibleRooms.length >= bottours[format].slots) {                                     // if so..
				bottour_stats[format].slotCapHits++;                                                  // sorry, all slots are occupied :(
				return this.pmReply('Sorry, all tour slots for this format are currently occupied '
				                    + 'with running tournaments: '
				                    + possibleRooms.map( x => '<<' + x + '>>' ).join(', '));
			}                                                                                         // else..
			possibleRooms = tourrooms.filter( x => Bot.rooms[x] && !Features['tours'].tourData[x] );  // find rooms without a tour
//			if (this.roomType !== 'pm') this.reply(JSON.stringify(possibleRooms));
			if (possibleRooms.length === 0) {                                                         // if none exist..
				possibleRooms = tourrooms.filter( x => !Bot.rooms[x] );                               // find rooms that have expired
//				if (this.roomType !== 'pm') this.reply(JSON.stringify(possibleRooms));
				if (possibleRooms.length === 0) {                                                     // if none exist..
					bottour_stats.roomCapHits++;                                                      // sorry, all rooms are occupied :(
					tourrooms.filter(
						x => Features['tours'].tourData[x].format === bottours[format].officialname
					)
					return this.pmReply('Sorry, all tour rooms are currently occupied with running '
					                    + 'tournaments. Of those, the following are '
					                    + bottours[format].name + ' Tours: '
					                    + possibleRooms.map( x => '<<' + x + '>>' ).join(', '));
				}
				makeTourRoom(possibleRooms[0]);
			}
			makeTournament(format, possibleRooms[0]);
			bottours[format].creationBroadcast.forEach(
				r => {
					if (Tools.equalOrHigherRank(Bot.rooms[r].users[toId(Bot.status.nickName)][0], '*')) {
						Bot.say(r, '/addhtmlbox <div style="background-color: #559955; height: 35px; width: 100%"><center><button name="joinRoom" value="' + possibleRooms[0] + '" style="color: white; background: none; border: none; padding: 0px; font-size: 15px; vertical-align: middle"><img src=' + bottours[format].icon + ' width="32" height="32" style="vertical-align: middle"/>' + bottours[format].name + ' Tournament created, click to join!</button></center></div>');
					} else {
						tryWall( r, bottours[format].name + ' Tournament created: <<' + possibleRooms[0] + '>>.' );
					}
				}
			);
			if (this.roomType !== 'pm' && bottours[format].creationBroadcast.indexOf(room) < 0)
				if (Tools.equalOrHigherRank(Bot.rooms[room].users[toId(Bot.status.nickName)][0], '*')) {
					Bot.say(room, '/addhtmlbox <div style="background-color: #559955; height: 35px; width: 100%"><center><button name="joinRoom" value="' + possibleRooms[0] + '" style="color: white; background: none; border: none; padding: 0px; font-size: 15px; vertical-align: middle"><img src=' + bottours[format].icon + ' width="32" height="32" style="vertical-align: middle"/>' + bottours[format].name + ' Tournament created, click to join!</button></center></div>');
				} else {
					tryWall( room, bottours[format].name + ' Tournament created: <<' + possibleRooms[0] + '>>.' );
				}
			if ( this.roomType !== 'pm' || (Bot.rooms[possibleRooms[0]] && Bot.rooms[possibleRooms[0]].users[toId(by)]) )
				return;  // do not invite after tour creation if the user is already in it
		}
		
		if (this.roomType !== 'pm')
			if (Tools.equalOrHigherRank(Bot.rooms[room].users[toId(Bot.status.nickName)][0], '*')) {
				Bot.say(room, '/addhtmlbox <div style="background-color: #559955; height: 35px; width: 100%"><center><button name="joinRoom" value="' + possibleRooms[0] + '" style="color: white; background: none; border: none; padding: 0px; font-size: 15px; vertical-align: middle"><img src=' + bottours[format].icon + ' width="32" height="32" style="vertical-align: middle"/>' + bottours[format].name + ' Tournament created, click to join!</button></center></div>');
			} else {
				tryWall(room, bottours[format].name + ' Tour Signups: <<' + possibleRooms[0] + '>>');
			}
		else this.pmReply('/invite ' + possibleRooms[0]);
	}
};