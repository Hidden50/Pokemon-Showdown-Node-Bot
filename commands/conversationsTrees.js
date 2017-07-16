global.discussions = require('./../data/roomdiscussions.json');
/* Search through the object tree for comments */

exports.updateTree = function updateTree(tree, room, target) {
	var newPath = reorderPath(tree, false);
	tree.replies = newPath;
	discussions[room][target] = tree;
	fs.writeFile('./data/roomdiscussions.json', JSON.stringify(discussions, null, 4), e => {
		if (e) return console.log(e);
	});
}

function reorderPath(index, child, parentPath) {
	if (!parentPath) parentPath = [];
	var iReplies = index.replies;
	var lastIndex = iReplies.length;
	if (lastIndex === 0) return [];
	for (var i = 0; i < lastIndex; i++) {
		var reply = i;
		var iPath = iReplies[reply].path.split('/');
		if (child) {
			if (iPath.length > parentPath.length) iPath.splice(iPath.length - (parentPath.length - iPath.length), (iPath.length - parentPath.length));
			while (iPath.length <= parentPath.length) {
				iPath.push(0);
			}
			for (let x in parentPath) {
				iPath[x] = parentPath[x];
			}
		}
		iPath[iPath.length - 1] = reply;
		iReplies[reply].path = iPath.join('/');
		if (iReplies[reply].replies.length > 0) {
			let childPath = reorderPath(iReplies[reply], true, iPath);
			iReplies[reply].replies = childPath;
		}
	}
	return iReplies;
}

exports.cutBranch = function cutBranch(tree, target, depth) {
	var child = tree.replies[target[depth]];
	if (depth < (target.length - 1)) {
		var newChild = cutBranch(child, target, depth + 1);
		tree.replies[target[depth]].replies = newChild[0];
		var removed = newChild[1];
	} else if (depth === (target.length - 1)) {
		var removed = tree.replies.splice(target[depth], 1);
	}
	return [tree.replies, removed];
}

exports.addBranch = function addBranch(tree, target, obj, depth) {
	if (target.length === 1) {
		tree.replies.push(obj[0]);
		return tree.replies;
	}
	var child = tree.replies[target[depth]];
	if (depth < (target.length - 1)) {
		var newChild = addBranch(child, target, obj, depth + 1);
		child.replies = newChild;
	} else if (depth === (target.length - 1)) {
		child.replies.push(obj[0]);
	}
	return tree.replies;
}