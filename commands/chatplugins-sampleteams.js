function getDefaultTier (room) {
	if (Settings.settings.deftier && Settings.settings.deftier[room]) return Settings.settings.deftier[room];
	return "gen7ou";
}

function tierName (tier) {
	if (!tier) return "";
	if (Formats[tier]) return Formats[tier].name;
	return tier.toUpperCase();
}

Settings.addPermissions(['setsample']);

exports.commands = {
	
	delsampleteam: 'setsampleteam',
	setsample: 'setsampleteam',
	setsampleteam: function (arg, by, room, cmd) {
		if (!this.can('setsample')) return false;
		if (!Settings.settings.sampleteams) Settings.settings.sampleteams = {};
		if (this.cmd === "delsampleteam") {
			if (!arg) return this.reply(this.trad('usage') + ": " + this.cmdToken + this.cmd + " [tier]");
			arg = Tools.parseAliases(arg);
			if (!Settings.settings.sampleteams[arg]) return this.reply(this.trad('d1') + " \"" + arg + "\" " + this.trad('notfound'));
			delete Settings.settings.sampleteams[arg];
			Settings.save();
			this.sclog();
			this.reply(this.trad('d1') + " \"" + arg + " " + this.trad('d2'));
		} else {
			var args = arg.split(",");
			var tier, link;
			if (args.length < 2) return this.reply(this.trad('usage') + ": " + this.cmdToken + this.cmd + " [tier], [link]");
			tier = Tools.parseAliases(args.shift());
			var ruinsofalphTiers = {"gen1uu":1, "gen2lc":1, "gen3uu":1, "gen3lc":1, "gen4nu":1};
			if (!Formats[tier] && !Formats[tier + "suspecttest"] && !ruinsofalphTiers[toId(tier)]) return this.reply(this.trad('tier') + " \"" + tier + "\" " + this.trad('notfound'));
			link = args.pop().trim();
			Settings.settings.sampleteams[tier] = {
				link: link
			};
			Settings.save();
			this.sclog();
			this.parse(this.cmdToken + "sampleteam " + tier);
		}
	},

	sample: 'sampleteam',
	samples: 'sampleteam',
	sampleteams: 'sampleteam',
	sampleteam: function (arg, by, room, cmd) {
		var tier = getDefaultTier(this.room);
		if (arg) {
			tier = Tools.parseAliases(arg);
		}
		if (Settings.settings.sampleteams && Settings.settings.sampleteams[tier]) {
			//Sample team
			if ((room === "ruinsofalph" || room === "ubers") && this.isRanked('%'))
				this.restrictReply("/wall Sample Teams " + this.trad('in') + " **" + tierName(tier) + "**: " + Settings.settings.sampleteams[tier].link, "info");
			else this.restrictReply("Sample Teams " + this.trad('in') + " **" + tierName(tier) + "**: " + Settings.settings.sampleteams[tier].link, "info");
		} else if (Formats[tier] || Formats[tier + "suspecttest"]) {
			//No sample team
			this.restrictReply(this.trad('nosample') + " " + tierName(tier) + (this.isRanked('admin') ? (". " + this.trad('aux1') + " ``" + this.cmdToken + "setsampleteam`` " + this.trad('aux2')) : ""), "info");
		} else {
			this.restrictReply(this.trad('tiererr1') + " \"" + tier + "\" " + this.trad('tiererr2'), 'info');
		}
	}
};

/* globals Settings */
/* globals Formats */
/* globals Tools */