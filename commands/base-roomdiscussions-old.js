global.discussions = require('./../data/roomdiscussions.json');
var treeFunctions = exports.treeFunctions = require('./conversationsTrees.js');
let voteCategories = {
	"like":    "#7ABB3A",  // "#7FFF00"
	"object":  "#F2F2F2",  // "#E47467"  // "#FA8072" // current color: same as comment. dislikes are disabled
	"abstain": "#C4BC64",  // "#808080"
	"comment": "#F2F2F2"   // "#D3D3D3"
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WRITELOCK: None
//////////////////////////////////////////////////////////// NEXT PLANNED /////////////////////////////////////////////////////////////////
// TODO:     add timestamps
// todo:     add timestamps. For each user, save last seen. mark and expand unread posts. PM them about it? .vd [date]?
// --------------------------------------------------------- maybe soon   --------------------------------------------------------------
// idea:     having a whole post for a like is a bit too much. Make it a likes / dislikes array with the usernames in it, instead?
// POLICY:   limit to one voting post per array, per user? Or do we want something like multiple dislikes on a problem user
// --------------------------------------------------------- maybe later  --------------------------------------------------------------
// TODO:     Tere: Can you move the tree functions to a separate module and require() it?
//           See: brmtTools.js, included as var brmtTools = exports.brmtTools = require('./brmtTools.js');
// TODO:     add "edit", "delete", "move", "swap"
// TODO:     make /help all
// TODO:     make .cd require a "shortname", as well as a title. Nobody wants to type "Dead hour situation" every time they use a command
// todo:     add .vd (all):         also lists closed discussions
// TODO:     htmlEditMessage?
// idea:     authentic username colors?
// idea:     disallow "comment" and "dislike" without text?
// idea:     replace "replies" indicators with images
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function getMessageInfo(Path, user, context) {
	if (typeof Path === "string")
		Path = Path.split('/');
	let replyGroups = {};                  // set of users and usergroups that can reply to this message
	let message = discussions[Path[0]];
	for (let t = 0; t < Path.length; t++) {
		if (t)
			message = message.replies[Path[t]];
		for (let rg in message.replyGroups)
			replyGroups[rg] = message.replyGroups[rg];
	}
	return {
		"replyGroups": replyGroups,
		"message": message
	};
}

function searchReplies(Path, preference) {
	let messageInfo = getMessageInfo(Path);
	let results = [];

	let recursion = function recursion(message) {
		if (preference(message) > 0)
			results.push(message);
		else message.replies.forEach(recursion);  // sometimes the children of a preferred message are all preferred. In that case, no need to iterate here
	}
	recursion(messageInfo.message);

	return {
		"name":     `${results.length} replies matching ${preference.toString()} in ${message}`,
		"canReply": messageInfo.canReply,
		"replies":  results.sort( (a,b) => preference(b) - preference(a) )
	};
}

function addMessage(room, by, Path, vote, details) {
	if (!voteCategories[vote]) return `Error: ${vote} is not a valid voting indicator. Possible choices: ${Object.keys(voteCategories).join()}`;
	let selected = discussions[room][Path[0]];
	for (let t = 1; t < Path.length; t++) {
		if (!selected.replies[Path[t]]) return "Error: invalid reply Path.";
		selected = selected.replies[Path[t]];
	}
	let message = {
		"by":       by,
		"when":     Date.now(),
		"vote":     vote,
		"details":  Tools.escapeHTML(details),
		"path":     `${Path.join('/')}/${selected.replies.length}`,
		"replies": []
	};
	selected.replies.push(message);
	if (discussions[room].staffintroDiscussions && !Tools.equalOrHigherRank(discussions[room][Path[0]].usergroup, '@'))
		Bot.say(room, `/staffintro ${discussionToHtml(discussions[room])}`);
	fs.writeFile('./data/roomdiscussions.json', JSON.stringify(discussions, null, 4), e => {
		if (e) return console.log(e);
	});
	let result = discussionToHtml(discussions[room][Path[0]], message.path);
	return `Message added: ${result}`;
}

global.discussionToHtml = function discussionToHtml(discussion, Path) {
	if(discussion.staffintroDiscussions !== undefined) {  // this is the head root of all discussions in this room. Display all of them.
		return Object.keys(discussion).map( x =>
			(x === "staffintroDiscussions" || Tools.equalOrHigherRank(discussion[x].usergroup, '@')) ? "" : discussionToHtml(discussion[x], Path)
		).join('');
	}
	let childContent = discussion.replies.filter( x => x.details ).map( x => discussionToHtml(x, Path) );
	if (discussion.name)
		return `<details><summary style="cursor:pointer"><b>${discussion.name}</b></summary>${childContent.join('')}</details>`;
	
	let previewBlocks = discussion.replies.map( x =>
		`<div style='width:1eM; height:1eM; margin:3px; display:inline-block; cursor:help; background-color:${voteCategories[x.vote]}; border:1px solid black; border-radius:10px' title='${Tools.escapeHTML(x.by)} ${x.path}&#10;${x.details}'>${x.details ? "<center><b>S</b></center>" : "&nbsp;"}</div>`
	).join('');
	let style = `style='color:black; background-color:${voteCategories[discussion.vote]}; border:2px solid navy; padding: 5px; margin:3px; margin-top:1px'`;
	let openOrClosed = false;//(!Path || Path.indexOf('/') === -1 || Path.startsWith(discussion.path) || discussion.path.startsWith(Path));
	openOrClosed = openOrClosed ? " open='open'" : "";
	let wrapper = (childContent.length) ? [`<details${openOrClosed}><summary style='cursor: pointer'>`, `</summary>`, `</details>`] : ["", "", ""];
	let floatRight = `<div>&nbsp;<code style='float:right'; margin:6px>${previewBlocks} ${discussion.path}</code></div>`;
	let replyCount = childContent.length ? `${childContent.length} repl${childContent.length > 1 ? "ies" : "y"}` : "";
	let summary = `<b>${Tools.escapeHTML(discussion.by)}:</b> ${discussion.details}${floatRight}`;
	return `<div ${style}>${summary}${wrapper[0]}${replyCount}${wrapper[1]}${childContent.join('')}${wrapper[2]}</div>`;
};

exports.commands = {
	cd:               "creatediscussion",
	vd:               "viewdiscussion",
	comment:          "addreply",
	like:             "addreply",
	abstain:          "addreply",
	addreply:         "viewdiscussion",
	creatediscussion: "viewdiscussion",
	viewdiscussion: function(arg, by, room, cmd, target, details) {
		let vote = "";
		if (voteCategories[cmd])
			vote = cmd;
		if (["cd", "vd", "comment", "like", "abstain"].indexOf(cmd) >= 0)
			cmd = exports.commands[cmd];
		if (this.roomType === "pm") {
			[room, target, ...details] = arg.split(',');
			room = toRoomid(room);
			by = Tools.getUserIdent(by, room);
		} else [target, ...details] = arg.split(',');
		target = (target || "").trim();
		details = (details.join(',') || "").trim();
		if (!room.endsWith("staff") || room.startsWith("groupchat") || !Tools.equalOrHigherRank(by, '%'))
			return;  // this command does not need to be known to the public
		if (cmd === "creatediscussion" && !Tools.equalOrHigherRank(by, '#')) return;
		if (cmd === "creatediscussion" && (!target))                         return this.reply(`Usage: \`\`.creatediscussion NAME, VOTE__, COMMENTS__\`\`.`);
		if (cmd === "addreply"         && (!target || !vote))                return this.reply(`Usage: \`\`.addreply PATH, VOTE__, COMMENTS__\`\`.`);
		if (cmd === "viewdiscussion"   && !target) {                         //return this.reply(`Usage: \`\`.viewdiscussion NAME\`\`.`);
			if (!discussions[room])
				return this.htmlReply("No discussions exist in this room.");
			return this.htmlReply(discussionToHtml(discussions[room]));
		}
		target = target.split('/');
		let name = target[0];
		let dId = target[0] = toId(target[0]);
		// attempting to create a new discussion?
		if (!discussions[room] || !discussions[room][dId]) {
			if (cmd !== "creatediscussion") return this.reply("Error: A discussion with that name does not exist.");
			if (!details) return this.reply("Error: New discussions require a reason or description.");
			if (!discussions[room]) discussions[room] = { "staffintroDiscussions": false };
			if (!discussions[room][dId]) {
				discussions[room][dId] = {
					"name": name,
					"usergroup": (Config.ranks.indexOf(target[0][0]) >= 0) ? target[0][0] : "%",
					"closed": false,
					"replies": []
				};
				return this.htmlReply(addMessage(room, by, target, vote, details));
			}
		}
		if (cmd === "creatediscussion") return this.reply("Error: A discussion with that name already exists.");
		let discussion = discussions[room][dId];
		if (!Tools.equalOrHigherRank(by, discussion.usergroup)) return this.reply("Error: A discussion with that name does not exist.");
		// reply to discussion?
		if (cmd === "addreply") return this.htmlReply(addMessage(room, by, target, vote, details));
		// show discussion
		return this.htmlReply(discussionToHtml(discussion));
	},
	
	discdebug: function(arg, by, room, cmd, target) {
		if (!this.isExcepted) return false;
		target = arg.split(',');
		targets = target[1].trim().split('/');
		room = target[0];
		var disc = discussions[room][targets[0]];
		tree = cutBranch(disc, targets, 1);
		updateTree(disc, room, targets[0]);
		//Bot.say(room, 'wooooo~~');
	},
	
	movecomment: "editcomments",
	deletecomment: "removecomment",
	removecomment: "editcomments",
	swapcomments: "editcomments",
	editcomment: "editcomments",
	editcomments: function(arg, by, room, cmd, target) {
		if (!this.isExcepted) return;
		let path = "";
		if (this.roomType === "pm") {
			[room, path, target] = arg.split(',');
			room = toRoomid(room);
			by = Tools.getUserIdent(by, room);
		} else [path, target] = arg.split(',');
		path = (path || "").trim().split('/');
		target = (target || "").trim().split('/');
		if (!room.endsWith("staff") || room.startsWith("groupchat") || !Tools.equalOrHigherRank(by, '%')) return;
		if (!path) return this.reply('Usage: ``.removecomment PATH``');
		if (!discussions[room][path[0]]) return this.reply("Error: Specified discussion does not exist.");
		let disc = JSON.parse(JSON.stringify(discussions[room][path[0]]));
		let [tree, comment] = treeFunctions.cutBranch(JSON.parse(JSON.stringify(disc)), path, 1);
		if (cmd === "removecomment" || cmd === "deletecomment") {
			disc.replies = tree;
			treeFunctions.updateTree(disc, room, path[0]);
			return this.reply("Message has been deleted.");
		}
		let targetDisc = JSON.parse(JSON.stringify(discussions[room][target[0]]));
		let [targetTree, targetComment] = treeFunctions.cutBranch(JSON.parse(JSON.stringify(targetDisc)), target, 1);
		if (cmd === "movecomment") {
			disc.replies = tree;
			if (path[0] === target[0]) targetDisc = JSON.parse(JSON.stringify(disc));
			targetTree = treeFunctions.addBranch(targetDisc, target, comment, 1);
			targetDisc.replies = targetTree;
			treeFunctions.updateTree(disc, room, path[0]);
			treeFunctions.updateTree(targetDisc, room, target[0]);
			return this.reply("Message has been moved.");
		}
		return;
	}
};