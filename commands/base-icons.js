////////////////////////////////////////////////////////////////////////////////
//                                                                            //
// Users can set their icon in the userlist with these commands.              //
//                                                                            //
////////////////////////////////////////////////////////////////////////////////
//                                                                            //
// Documentation for .icon                                                    //
// .icon                   display short description.                         //
// .icon        [url]      request a userlist icon.                           //
// .icon css    [css]      request a userlist icon.                           //
// .icon cancel            cancel an icon request you have made.              //
// .icon delete            delete your userlist icon.                         //
//                                                                            //
// {admin commands}                                                           //
// .icon requests          hastebin with current requests as css.             //
// .icon output            hastebin with requests merged in. This will delete //
//                         any requests it finds implemented.                 //
//                                                                            //
// {TODO}                                                                     //
// .icon cancel [user], [message]     reject a request with [message].        //
// .icon delete [user], [message]     delete a user's icon with [message].    //
// .icon ignore [user]                hide requests by this user.             //
//                                                                            //
////////////////////////////////////////////////////////////////////////////////

Settings.addPermissions(['icons']);

var httpRequest = require('request');
var sizeOfImage = require('request-image-size');
var fs = require('fs');

var pokedex = require('./../data/pokedex.js').BattlePokedex;

global.iconRequests = require('./../data/iconRequests.json');
var requestsfile_busy = false;
var requestsfile_needUpdate = false;

function saveRequests() {
	if (requestsfile_busy) {
		requestsfile_needUpdate = true;  // file is busy, re-save on callback
	} else {
		requestsfile_needUpdate = false;
		requestsfile_busy = true;
		// saving now..
		fs.writeFile('./data/iconRequests.json', JSON.stringify(iconRequests, null, 1),
			function (err) {
				requestsfile_busy = false;
				// after save..
				if (err) return console.log(err);
				if (requestsfile_needUpdate)
					saveRequests();
			}
		);
	}
}

var updatecheckIntervalTimer = null;
var updateChecksNeeded = 0;

function repeatUpdatecheck(times) {
	if (!updatecheckIntervalTimer) {
		updateChecksNeeded = times;
		updatecheckIntervalTimer = setInterval(repeatUpdatecheck, 60000);
		return;
	}
	if (--updateChecksNeeded <= 0) {
		clearInterval(updatecheckIntervalTimer);
		updatecheckIntervalTimer = null;
		return console.log('updatecheck timer was killed because the count reached zero.');
	}
	console.log('fetching latest userstyle css..');
	httpRequest.get('https://userstyles.org/styles/119345/userlist-icons.css',
		function(error, response, body) {
			if (error || response.statusCode !== 200) return console.log('An error occured while fetching the css file.');
			body = body.split('/* userlist icons */');
			if (body.length !== 3) {
				return console.log('Error: The userlist stylish should contain the comment ``/* userlist icons */`` ' + 'exactly twice.');
			}
			var iconStylishPreamble = body[0] + '/* userlist icons */\n';
			var icons = splitCSS(body[1]);
			var iconStylishAddendum = '\n/* userlist icons */' + body[2];
			
			// remove fulfilled requests, keep unfulfilled ones
			var oneUnfulfilled = false;
			var oneFulfilled = false;
			var result = [];
			for (var username in iconRequests) {
				if ((iconRequests[username] === 'delete' && !icons[username])
					|| (icons[username]
						&& iconRequests[username].trim() === getInnerCSS(icons[username]).trim()))
				{
					delete iconRequests[username];
					result.push('fulfilled request (' + username + ').');
					oneFulfilled = true;
				} else {
					result.push('unfulfilled request (' + username + ').'); 
					oneUnfulfilled = true;
				}
			}
			if (oneFulfilled) {
				for (var line in result) console.log(result[line]);
				saveRequests();
			}
			if (!oneUnfulfilled) {
				clearInterval(updatecheckIntervalTimer);
				updatecheckIntervalTimer = null;
				return console.log('updatecheck timer was killed because all requests have been fulfilled.');
			}
		}
	);
}

function splitCSS(cssString) {
	cssString = cssString.replace(/\r\n/g, '\n');
	var userCSS = cssString.split('}').map(function(s) {
		return s + '}';  // split after '}', but keep the bracket
	});
	userCSS.pop(); // drop whatever is left behind the last entry
	var result = {};
	for (var k in userCSS) {
		var username = userCSS[k].match(/\[id\$\=\'\-userlist\-user\-([\s\S]*?)\'\]/);
		var innerCSS = userCSS[k].match(/\{([\s\S]*?)\}/);
		if (username && innerCSS && username[1] && innerCSS[1]) {
			username = username[1]; // username[0] = "[id$='-userlist-user-NAME']", username[1] = "NAME"
			innerCSS = innerCSS[1]; // innerCSS[0] = "{CSS}" (with brackets),       innerCSS[1] = "CSS"
			result[username] = userCSS[k].trim();
			result[username].innerCSS = innerCSS;
		}
		else console.log('Missing username or curly brackets in css file: ' + userCSS[k]);
	}
	return result;
}

function getInnerCSS(cssString) {
	var result = cssString.match(/\{([\s\S]*?)\}/);
	if (!result || !result[1]) return '';
	return result[1].trim();
}

function ExtractKeyword(argString, Keywords) {
	// argString must be an object, so that it can be modified like a var parameter
	var pos;
	for (var k in Keywords) {
		pos = (argString + ' ').indexOf(Keywords[k] + ' ');
		if (pos > -1) {
			if (argString.substring(0, pos).trim())
				continue; // there's letters before the keyword. But it's only a match if it's the first word.
			var temp = argString.substring(pos + Keywords[k].length);
			argString.valueOf = argString.toSource = argString.toString = function() {
				return temp;
			};
			return Keywords[k];
		}
	}
	return '';
}

exports.commands = {
	"usericon": 'icon',
	"userlisticon": 'icon',
	icon: function(arg, by, room, cmd) {
		by = toId(by);
		arg = Object(arg); // required for ExtractKeyword() to modify this string
		var keyword = ExtractKeyword(arg, ['help', 'cancel', 'delete', 'css', 'requests', 'output']);
		switch (keyword) {

			// Admin commands

			case 'requests':
				if (!this.isRanked('&')) return this.pmReply("You don't have permission to do this.");
				var result = [];
				for (var username in iconRequests)
					result.push("li[id$='-userlist-user-" + username + "'] {\n    " + iconRequests[username] + "\n}");
				if (result.length === 0) return this.reply('No icon requests have been made since the last fetch.');
				return this.hastebinReply("Icon requests since the last fetch: ", result.join('\n\n'));
			case 'output':
				if (!this.isRanked('&')) return this.pmReply("You don't have permission to do this.");
				console.log('\nfetching latest userstyle css..');
				httpRequest.get('https://userstyles.org/styles/119345/userlist-icons.css',
					function(error, response, body) {
						if (error || response.statusCode !== 200) return this.pmReply('An error occured while fetching the css file.');
						body = body.split('/* userlist icons */');
						if (body.length !== 3) {
							return this.pmReply('Error: The userlist stylish should contain the comment ``/* userlist icons */`` ' + 'exactly twice.');
						}
						var iconStylishPreamble = body[0] + '/* userlist icons */\n';
						var icons = splitCSS(body[1]);
						var iconStylishAddendum = '\n/* userlist icons */' + body[2];
						
						// remove fulfilled requests, keep unfulfilled ones
						for (var username in iconRequests) {
							if ((iconRequests[username] === 'delete' && !icons[username])
								|| (icons[username]
									&& iconRequests[username].trim() === getInnerCSS(icons[username]).trim()))
							{
								delete iconRequests[username];
								console.log('fulfilled request (' + username + ').');
							}
							else console.log('unfulfilled request (' + username + ').'); 
						}
						saveRequests();

						// apply requests
						for (var username in iconRequests) {
							if (iconRequests[username] === 'delete')
								delete icons[username];
							else {
								icons[username] = "li[id$='-userlist-user-"
								+ username + "'] {\n\t" + iconRequests[username] + "\n}";
							}
						}

						// create output
						var result = [];
						for (var username in icons)
							result.push(icons[username]);
						repeatUpdatecheck(32);
						return this.hastebinReply('Updated Usericons css: ', iconStylishPreamble + result.join('\n') + iconStylishAddendum);
					}.bind(this)
				);
				return;


			// user commands

			case 'cancel':
				if (!iconRequests[by]) this.pmReply('There is no icon request to be canceled.');
				else {
					delete iconRequests[by];
					saveRequests();
					this.pmReply('Your icon request has been canceled.');
				}
				break;

			case 'delete':
				iconRequests[by] = 'delete';
				break;

			default:
				// .icon
				// usage help
				if (keyword === 'help' || !arg.valueOf()) {
					this.pmReply('Usage: ``.icon [link]``. Sets your userlist-icon to the image ``[link]`` - **Do not leave the brackets in your request.**');
					this.pmReply('You need to install a stylish to see userlist-icons: https://userstyles.org/styles/119345/userlist-icons');
					break;
				}

				// test for invalid request
				// (MAYBE): in case we get spammed with requests, make it so a user needs to be autoconfirmed to make one.
				//
				// code to test it goes here..
				//
				if (pokedex[toId(arg)]) {
					var id = toId(arg);
					if (pokedex[id].tier === "CAP")
						return this.pmReply('This is a CAP-mon, we do not have an image host for them. Please give an url instead of a name.');
					id = pokedex[id].num.toString();
					while (id.length < 3) id = '0' + id;
					var pos = arg.indexOf('-');
					if (pos > -1) id += '-' + toId(arg.substring(pos + 1));
					if (toId(arg) === "hoopaunbound") {
						arg = 'http://www.serebii.net/pokedex-xy/icon/720-u.png';
					} else {
						arg = 'http://pldh.net/media/pokexycons/' + id + '.png';
					}
				}
				if (arg.indexOf("vignette") > -1) {
					return this.pmReply("Vignette is untrustworthy for userlist icons, either upload this image to imgur.com " +
						"or find a different version.");
				}
				if (arg.indexOf(".png") === -1 && arg.indexOf(".gif") === -1 && arg.indexOf(".jpg") === -1)
					return this.reply('You did not supply a valid image link. Supported formats are: png, gif, jpg.');
					
				if (keyword === 'css') {
					iconRequests[by] = arg.trim(); // plain css request
					saveRequests();
				} else {
					// image link request
					sizeOfImage(arg.valueOf(), function(err, dimensions, length) {
						if (err) return this.pmReply(err);
						var uiconScale = (dimensions.height <= 32) ? "" : " / " +
										 Math.floor(dimensions.width * 32 / dimensions.height) +
										 "px 32px";  // image height: 32px, width: proportional
						iconRequests[by] = "background: url(\"" + arg.replace(/"/g, "\\\"") + "\") 100% 70%" +
										   uiconScale + " no-repeat;";
						saveRequests();
						
						// give info on pending requests
						this.pmReply('Your usericon is awaiting moderation - ``' + iconRequests[by].split('\n').join(' ') + '``');
						this.pmReply('To change your request, redo the command. To cancel your request and leave the icon as it was, do ``.icon cancel``.');
					}.bind(this));
					return;
				}
		}

		// give info on pending requests
		if (iconRequests[by]) {
			if (iconRequests[by] === 'delete') this.pmReply('Your usericon is awaiting deletion.');
			else this.pmReply('Your usericon is awaiting moderation - ``' + iconRequests[by].split('\n').join(' ') + '``');
			this.pmReply('To change your request, use the ``.icon`` command. To cancel your request and leave the icon as it was, do ``.icon cancel``.');
		}
	},
	// Icon images
	// For people to get their pokemon sprites easily
	sprite: function(arg, by, room, cmd) {
		arg = arg.split(',');
		if (!arg[1] || !arg) return this.restrictReply('Use: ``.sprite [gen5/gen6/gif], pokemon``');
		var id = toId(arg[1]);
		if (!pokedex[id]) return this.restrictReply('Please enter a pokemon name.', 'icons');
		if (pokedex[id].tier === "CAP") return this.restrictReply('This is a CAP-mon, we cannot provide sprites for these.', 'icons');
		if (pokedex[id]) id = pokedex[id].num.toString();
		while (id.length < 3) id = '0' + id;
		var pos = arg[1].indexOf('-');
		if (pos > -1) id += '-' + toId(arg[1].substring(pos + 1));
		if (toId(arg[1]) === "hoopaunbound")
			return this.restrictReply('http://www.serebii.net/pokedex-xy/icon/720-u.png', 'icons');
		if (toId(arg[0]) === "gen6") {
			this.restrictReply('http://pldh.net/media/pokexycons/' + id + '.png', 'icons');
		}
		else {
			if (toId(arg[0]) === "gen5") {
				this.restrictReply('http://pldh.net/media/pokecons/' + id + '.png', 'icons');
			}
			else {
				if (toId(arg[0]) === "gif") {
					this.restrictReply('http://pldh.net/media/pokecons_action/' + id + '.gif', 'icons');
				}
			}
		}

	}
};

/* globals Tools */
/* globals Settings */
/* globals toId */