Settings.addPermissions(['battlespot']);

exports.commands = {
    pgl: function(arg, by, room, cmd) {
        if (room !== "battlespot") return false;
        this.restrictReply('http://3ds.pokemon-gl.com/', 'battlespot');
    },
    stats: function(arg, by, room, cmd) {
        if (room !== "battlespot") return false;
        this.restrictReply('http://battlespotstats.com/', 'battlespot');
    },
    viab: function(arg, by, room, cmd) {
        if (room !== "battlespot") return false;
        this.restrictReply('http://www.smogon.com/forums/threads/singles-viability-rankings.3554616/', 'battlespot');
    },
    teamhelp: function(arg, by, room, cmd) {
        if (room !== "battlespot") return false;
        this.restrictReply('http://www.smogon.com/forums/threads/battle-spot-teambuilding-discussion-help-thread-read-post-453.3500348/', 'battlespot');
    },
    faq: function(arg, by, room, cmd) {
        if (room !== "battlespot") return false;
        this.restrictReply('http://www.smogon.com/forums/threads/battle-spot-simple-questions-and-answers.3514373/', 'battlespot');
    },
    intro: function(arg, by, room, cmd) {
        if (room !== "battlespot") return false;
        this.restrictReply('http://www.smogon.com/forums/threads/an-introduction-to-3v3-singles.3494393/', 'battlespot');
    },
    speed: function(arg, by, room, cmd) {
        if (room !== "battlespot") return false;
        this.restrictReply('http://www.smogon.com/forums/threads/battle-spot-speed-tiers.3530544/', 'battlespot');
    },
    stream: function(arg, by, room, cmd) {
        if (room !== "battlespot") return false;
        this.restrictReply('http://www.smogon.com/forums/threads/battle-spot-twitch-streams.3557409/', 'battlespot');
    },
    disc: function(arg, by, room, cmd) {
        if (room !== "battlespot") return false;
        this.restrictReply('http://www.smogon.com/forums/threads/3v3-singles-metagame-discussion-thread-the-pentagon-is-back.3527960/', 'battlespot');
    },
    bshelp: function(arg, by, room, cmd) {
        if (room !== "battlespot") return false;
        this.restrictReply('http://www.smogon.com/forums/threads/helpful-links-for-new-battle-spot-players.3529016/', 'battlespot');
    },
    hub: function(arg, by, room, cmd) {
        if (room !== "battlespot") return false;
        this.restrictReply('http://www.smogon.com/dex/xy/formats/battle_spot_singles/', 'battlespot');
    },
    samples: function(arg, by, room, cmd) {
        if (room !== "battlespot") return false;
        this.restrictReply('http://www.smogon.com/forums/threads/s11-bss-japanese-team-translations.3553696/', 'battlespot');
    },
    btc: function(arg, by, room, cmd) {
        if (room !== "battlespot") return false;
        this.restrictReply('http://www.smogon.com/forums/threads/singles-break-that-core-week-15-kanto-classic-special-snorlax-slowbro-nominations-post-348.3549897/', 'battlespot');
    },
    bscalc: function(arg, by, room, cmd) {
        if (room !== "battlespot") return false;
        this.restrictReply('http://cantsay.github.io/', 'battlespot');
    },
    bsbanlist: function(arg, by, room, cmd) {
        if (room !== "battlespot") return false;
        this.restrictReply('/announce Banlist: Mewtwo, Mew, Lugia, Ho-Oh, Celebi, Kyogre, Groudon, Rayquaza, Jirachi, Deoxys, Dialga, Palkia, Giratina, Phione, Manaphy, Darkrai, Shaymin, Arceus, Victini, Reshiram, Zekrom, Kyurem, Keldeo, Meloetta, Genesect, Xerneas, Yveltal, Zygarde, Diancie, Hoopa, Volcanion', 'battlespot');
    }
};