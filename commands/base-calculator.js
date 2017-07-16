Settings.addPermissions(['calc']);

exports.commands = {
    
calc: function(arg, by, room, cmd) {
        if (!this.can('calc')) return false;
        if (!arg || !toId(arg)) return false;
        var parts = arg.replace(/, /g, ',').split(',');
        if (parts.length < 2) return this.pmReply('Use .calc [attacker details], [defender details], [extras - weather, etc]. To denote a berry that weakens a SE attack, simply put ``berry`` as one of the defender\'s details. For a gem just put ``gem`` for attacker.');
        var attackerDetails = parts[0].split(' ');
        var defenderDetails = parts[1].split(' ');
        let extras;
        if (parts.length === 3)
            extras = parts[2].split(' ');

        function checkPoke(text) {
            text = toId(text);
            if (POKEDEX[text]) {
                return true;
            }
            return false;
        }

        function checkMove(text) {
            text = toId(text);
            if (MOVEDEX[text]) {
                return true;
            }
            return false;
        }
        var attacker = {};
        var defender = {};
        attacker.bonus = [];
        defender.bonus = [];
        attacker.multiplier = 1;
        defender.multiplier = 1;
        var basePowerMultiplier = 1;
        var finalMultiplier = 1;
        for (let i = 0; i < attackerDetails.length; i++) {
            let detail = attackerDetails[i];
            if (checkMove(detail)) {
                attacker.move = toId(detail);
                continue;
            }
            if (checkPoke(detail)) {
                attacker.id = toId(detail);
                continue;
            }
            if (detail.charAt(0) === '+' || detail.charAt(0) === '-') {
                let level = parseInt(detail);
                if (!level || isNaN(level)) continue;
                attacker.boosts = level;
                continue;
            }
            if (['gem'].indexOf(toId(detail)) > -1) {
                basePowerMultiplier *= 1.3;
                continue;
            }
            if (['lo', 'lifeorb'].indexOf(toId(detail)) > -1) {
                finalMultiplier *= 1.3;
                continue;
            }
            if (toId(detail) === 'technician') {
                attacker.technician = true;
            }
            if (['band', 'specs', 'choiceband', 'choicespecs', 'guts'].indexOf(toId(detail)) > -1) {
                attacker.multiplier *= 1.5;
                continue;
            }
            if (['hugepower', 'purepower'].indexOf(toId(detail)) > -1) {
                attacker.multiplier *= 2;
                continue;
            }
            if (['plate'].indexOf(toId(detail)) > -1) {
                basePowerMultiplier *= 1.2;
                continue;
            }
            if (toId(detail) === 'expertbelt') {
                attacker.expertBelt = true;
                continue;
            }
            if (toId(detail) === 'sheerforce') {
                attacker.ability = 'sheerforce';
                continue;
            }
            if (['toughclaws'].indexOf(toId(detail)) > -1) {
                attacker.toughclaws = true;
                continue;
            }
            if (['strongjaw'].indexOf(toId(detail)) > -1) {
                attacker.strongjaw = true;
                continue;
            }
            if (['megalauncher', 'launcher'].indexOf(toId(detail)) > -1) {
                attacker.megalauncher = true;
                continue;
            }
            if (toId(detail) === 'adaptability') {
                attacker.ability = 'adaptability';
                continue;
            }
            if (['refrigerate', 'aerilate', 'aerialate', 'pixilate'].indexOf(toId(detail)) > -1) {
                if (toId(detail) === 'aerialate') detail = 'aerilate';
                attacker.specialability = toId(detail);
                continue;
            }
            if (toId(detail) === 'reckless') {
                attacker.reckless = true;
                continue;
            }
            if (/[0-9]/i.test(detail) && toId(detail.charAt(0)) === 'l') {
                let level = detail.replace(/[^0-9]/g, '');
                if (!level) continue;
                attacker.level = level;
                continue;
            }
            if ((toId(detail).indexOf('evs') || (!isNaN(parseInt(details)))) && toId(detail).indexOf('iv') === -1) {
                if (['+', '-'].indexOf(detail.charAt(detail.length - 1)) > -1) {
                    attacker.nature = detail.charAt(detail.length - 1);
                }
                detail = detail.replace(/[^0-9]/g, '');
                if (!detail) continue;
                attacker.evs = detail;
            }
            if (toId(detail).indexOf('ivs') > -1) {
                detail = detail.replace(/[^0-9]/g, '');
                if (!detail) continue;
                attacker.ivs = detail;
            }
        }

        if (!attacker.id || !attacker.move) return this.reply('You have not included the attacking Pokemon/Move yet!');
        for (let i = 0; i < defenderDetails.length; i++) {
            let detail = defenderDetails[i];
            if (checkPoke(detail)) {
                defender.id = toId(detail);
                continue;
            }
            if (detail.charAt(0) === '+' || detail.charAt(0) === '-') {
                let level = parseInt(detail);
                if (!level || isNaN(level)) continue;
                defender.boosts = level;
                continue;
            }
            if (/[0-9]/i.test(detail) && toId(detail.charAt(0)) === 'l') {
                let level = detail.replace(/[^0-9]/g, '');
                if (!level) continue;
                defender.level = level;
                continue;
            }
            if (toId(detail) === 'eviolite') {
                defender.multiplier *= 1.5;
            }
            if (toId(detail) === 'multiscale') {
                finalMultiplier *= 0.5;
            }
            if (toId(detail) === 'furcoat') {
                if ((MOVEDEX[attacker.move] && MOVEDEX[attacker.move].category === 'Physical') || ['psyshock', 'psystrike', 'secretsword'].indexOf(attacker.move) > -1) {
                    defender.multiplier *= 2;
                }
            }
            if (['assaultvest', 'av'].indexOf(toId(detail)) > -1) {
                if ((MOVEDEX[attacker.move] && MOVEDEX[attacker.move].category === 'Special') && ['psyshock', 'psystrike', 'secretsword'].indexOf(attacker.move) === -1) {
                    defender.multiplier *= 1.5;
                }
            }
            if (['dryskin', 'stormdrain', 'waterabsorb'].indexOf(toId(detail)) > -1 && MOVEDEX[attacker.move].type === 'Water') {
                finalMultiplier = 0;
            }
            if (['flashfire'].indexOf(toId(detail)) > -1 && MOVEDEX[attacker.move].type === 'Fire') {
                finalMultiplier = 0;
            }
            if (['levitate', 'airballoon'].indexOf(toId(detail)) > -1 && MOVEDEX[attacker.move].type === 'Ground') {
                finalMultiplier = 0;
            }
            if (['sapsipper'].indexOf(toId(detail)) > -1 && MOVEDEX[attacker.move].type === 'Grass') {
                finalMultiplier = 0;
            }
            if (['lightningrod', 'voltabsorb'].indexOf(toId(detail)) > -1 && MOVEDEX[attacker.move].type === 'Electric') {
                finalMultiplier = 0;
            }
            if (toId(detail) === 'wonderguard') {
                defender.wonderguard = true;
            }
            //heatproof
            if (['heatproof'].indexOf(toId(detail)) > -1 && MOVEDEX[attacker.move].type === 'Fire') {
                basePowerMultiplier *= 0.5;
            }
            //berry
            if (toId(detail) === 'berry') {
                finalMultiplier *= 0.5;
            }
            if (toId(detail).slice(toId(detail).length - 2) === 'hp') {
                detail = detail.replace(/[^0-9]/, '');
                if (!detail) continue;
                defender.hpev = detail;
                continue;
            }
            if ((toId(detail).indexOf('evs') || (!isNaN(parseInt(details)))) && toId(detail).indexOf('iv') === -1 && toId(detail).indexOf('hp') === -1) {
                if (['+', '-'].indexOf(detail.charAt(detail.length - 1)) > -1) {
                    defender.nature = detail.charAt(detail.length - 1);
                }
                detail = detail.replace(/[^0-9]/g, '');
                if (!detail) continue;
                defender.evs = detail;
            }
            if (toId(detail).indexOf('ivs') > -1) {
                detail = detail.replace(/[^0-9]/g, '');
                if (!detail) continue;
                defender.ivs = detail;
            }
        }
        if (!defender.id) return this.reply('You have not included the defending Pokemon/Move yet!');
        if (defender.wonderguard && effectiveFactor(attacker.move, defender.id) < 2) {
            finalMultiplier = 0;
        }
        //finish gathering stuff

        var modifier = 1;
        if (extras) {
            extras = Tools.arrayToId(extras);
            if (extras.indexOf('lc') > -1) {
                attacker.level = 5;
                defender.level = 5;
            }
            if (extras.indexOf('vgc') > -1) {
                attacker.level = 50;
                defender.level = 50;
            }
        }


        function isStab(move, user) {
            var Pokedex = isolate(POKEDEX);
            var Movedex = isolate(MOVEDEX);
            var types = Pokedex[user].types;
            return types.indexOf(Movedex[move].type) > -1;
        }

        function effectiveFactor(move, target) {
            var Pokedex = isolate(POKEDEX);
            var Movedex = isolate(MOVEDEX);
            var TypeChart = isolate(TYPECHART);
            var attackType = Movedex[move].type;
            var types = Pokedex[target].types;
            if (types.length === 2) {
                return TypeChart[types[0]].damageTaken[attackType] * TypeChart[types[1]].damageTaken[attackType];
            }
            return TypeChart[types[0]].damageTaken[attackType];
        }
        var effectiveness = effectiveFactor(attacker.move, defender.id);
        var stabMove = isStab(attacker.move, attacker.id);
        if (attacker.specialability && MOVEDEX[attacker.move].type === 'Normal') {
            switch (attacker.specialability) {
                case 'aerilate':
                    effectiveness = effectiveFactor('bravebird', defender.id);
                    stabMove = isStab('bravebird', attacker.id);
                    break;
                case 'pixilate':
                    effectiveness = effectiveFactor('moonblast', defender.id);
                    stabMove = isStab('moonblast', attacker.id);
                    break;
                case 'refrigerate':
                    effectiveness = effectiveFactor('blizzard', defender.id);
                    stabMove = isStab('blizzard', attacker.id);
                    break;
            }
            basePowerMultiplier *= 1.3;
        }
        //sheerforce
        if (MOVEDEX[attacker.move].secondary && attacker.ability === 'sheerforce') {
            basePowerMultiplier *= 1.3;
        }
        if (attacker.toughclaws && MOVEDEX[attacker.move].flags && MOVEDEX[attacker.move].flags.contact) {
            basePowerMultiplier *= 1.3;
        }
        if (attacker.strongjaw && MOVEDEX[attacker.move].flags && MOVEDEX[attacker.move].flags.bite) {
            basePowerMultiplier *= 1.5;
        }
        if (attacker.megalauncher && MOVEDEX[attacker.move].flags && MOVEDEX[attacker.move].flags.pulse) {
            basePowerMultiplier *= 1.5;
        }
        if (attacker.expertBelt && effectiveness > 2) {
            finalMultiplier *= 1.2;
        }
        if (attacker.reckless && (MOVEDEX[attacker.move].recoil || MOVEDEX[attacker.move].hasCustomRecoil)) {
            basePowerMultiplier *= 1.2;
        }
        if (attacker.technician && MOVEDEX[attacker.move].basePower <= 60) {
            basePowerMultiplier *= 1.5;
        }
        //calculate attacking and defending stat
        var tarLevel = defender.level || 100;
        var hpEvs = defender.hpev || 0;
        hpEvs = parseInt(hpEvs);
        var hp = ~~((POKEDEX[defender.id].baseStats.hp * 2 + (hpEvs / 4) + 31) * (tarLevel / 100) + parseInt(tarLevel) + 10);

        function calculateStat(mon, stat, boost) {
            var baseStat = POKEDEX[mon.id].baseStats[stat];
            var BSmodifier = 1;
            if (boost && boost === '+') {
                BSmodifier = 1.1;
            }
            if (boost && boost === '-') {
                BSmodifier = 0.9;
            }
            let ivs = 31;
            if (mon.ivs) {
                ivs = parseInt(mon.ivs);
            }
            let evs = 0;
            if (mon.evs) {
                evs = parseInt(mon.evs) / 4;
            }
            level = mon.level || 100;
            stat = (2 * baseStat) + ivs + evs;
            var levelRatio = level / 100;
            return ~~((~~(stat * levelRatio) + 5) * BSmodifier);
        }
        let defStat = 'spd';
        if ((MOVEDEX[attacker.move] && MOVEDEX[attacker.move].category === 'Physical') || ['psyshock', 'psystrike', 'secretsword'].indexOf(attacker.move) > -1) {
            defStat = 'def';
        }

        function convertStat(stat) {
            if (stat === "Special") return 'spa';
            return 'atk';
        }

        function getBoostValue(level) {
            if (!level) return 1;
            let negative = false;
            if (level < 0) {
                negative = true;
                level *= -1;
            }
            level += 2;
            if (negative) {
                return 2 / level;
            }
            return level / 2;
        }

        var atkBoost = getBoostValue(attacker.boosts) * attacker.multiplier;
        var boostmod = getBoostValue(defender.boosts);
        if (extras && (extras.indexOf('criticalhit') > -1 || extras.indexOf('crit') > -1)) {
            if (boostmod > 1) boostmod = 1;
        }
        var defBoost = boostmod * defender.multiplier;
        var def = pokeRound(calculateStat(defender, defStat, defender.nature) * defBoost);
        var atk = pokeRound(calculateStat(attacker, convertStat(MOVEDEX[attacker.move].category), attacker.nature) * atkBoost);
        var atkLevel = attacker.level || 100;
        var moveBP = pokeRound(MOVEDEX[attacker.move].basePower * basePowerMultiplier);

        function pokeRound(num) {
            return (num % 1 > 0.5) ? Math.ceil(num) : Math.floor(num);
        }

        var baseDamage = ~~(((((2 * atkLevel) / 5 + 2) * moveBP * atk) / def) / 50 + 2);
        if (extras) {
            var floor = false;
            if (extras.indexOf('criticalhit') > -1 || extras.indexOf('crit') > -1) {
                baseDamage = ~~(baseDamage * 1.5);
            }
            if ((extras.indexOf('criticalhit') > -1 || extras.indexOf('crit') > -1) && extras.indexOf('sniper') > -1) {
                finalMultiplier *= 1.5;
            }
            if (extras.indexOf('vgc') > -1 || extras.indexOf('doubles') > -1) {
                if (toId(MOVEDEX[attacker.move].target.slice(0, 3)) === 'all') baseDamage = ~~(baseDamage * 0.75);
            }
            if (MOVEDEX[attacker.move].type === 'Fire' && extras.indexOf('rain') > -1) {
                baseDamage = ~~(baseDamage * 0.5);
            }
            if (MOVEDEX[attacker.move].type === 'Water' && extras.indexOf('rain') > -1) {
                baseDamage = ~~(baseDamage * 1.5);
            }
            if (MOVEDEX[attacker.move].type === 'Fire' && extras.indexOf('sun') > -1) {
                baseDamage = ~~(baseDamage * 1.5);
            }
            if (MOVEDEX[attacker.move].type === 'Water' && extras.indexOf('sun') > -1) {
                baseDamage = ~~(baseDamage * 0.5);
            }
        }
        var damageRolls = [];
        for (let i = 0.85; i <= 1; i += 0.01) {
            damageRolls.push(~~(baseDamage * i));
        }

        if (stabMove) {
            let STABmodifier = 1.5;
            if (attacker.ability === 'adaptability') {
                STABmodifier = 2;
            }
            for (let i = 0; i < damageRolls.length; i++) {
                damageRolls[i] = pokeRound(damageRolls[i] * STABmodifier);
            }
        }
        for (let i = 0; i < damageRolls.length; i++) {
            damageRolls[i] = ~~(damageRolls[i] * effectiveness);
        }
        if (MOVEDEX[attacker.move].category === 'Status') finalMultiplier = 0;
        for (let i = 0; i < damageRolls.length; i++) {
            damageRolls[i] = pokeRound(damageRolls[i] * finalMultiplier);
        }
        var minRoll = damageRolls[0];
        var maxRoll = damageRolls[15];
        var minPercent = Math.round((minRoll / hp) * 10000) / 100;
        var maxPercent = Math.round((maxRoll / hp) * 10000) / 100;


        var text = '``Damage: ' + minPercent + '% - ' + maxPercent + '%`` ';

        text += '__(Rolls [' + minRoll + '-' + maxRoll + '/' + hp + 'HP]: ' + damageRolls.join(', ') + ')__';
        this.reply(text);
    },

	stringdecode: function (arg, by, room, cmd) {
		return this.pmReply( arg.split("").map( x => x.charCodeAt(0) ).join(" ") );
		// todo: restrictReply, this.splitReply
	},

	stringencode: function (arg, by, room, cmd) {
		if (!this.isExcepted) return false;  // too risky for reg-users, they could make it send something like "robert\n/logout"
		arg = arg.match( /\D|\d+/g );  // split string into groups of numbers / letters
		return this.reply( arg.map( x => String.fromCharCode(x) ).map( (x,i) => (x !== "\u0000") ? x : arg[i] ).join("") );
//		return this.reply( arg.split(' ').map( (c,i,ar) => arg.charCodeAt(i) ).join(', ') );
	},

    hp: "hiddenpower",
	hiddenpower: function(arg, by, room, cmd) {
		var hpivsets = {
			dark:     ['111111'],
			dragon:   ['011111', '101111', '110111'],
			ice:      ['010111', '100111', '111110'],
			psychic:  ['011110', '101110', '110110'],
			electric: ['010110', '100110', '111011'],
			grass:    ['011011', '101011', '110011'],
			water:    ['100011', '111010'],
			fire:     ['101010', '110010'],
			steel:    ['100010', '111101'],
			ghost:    ['101101', '110101'],
			bug:      ['100101', '111100', '101100'],
			rock:     ['001100', '110100', '100100'],
			ground:   ['000100', '111001', '101001'],
			poison:   ['001001', '110001', '100001'],
			flying:   ['000001', '111000', '101000'],
			fighting: ['001000', '110000', '100000']
		};
		arg = arg.split(',').map(toId);
		if (hpivsets[arg[0]]) return this.restrictReply(JSON.stringify(hpivsets[arg[0]]), 'simplecoms');
		else if (arg.length === 6 && arg.every( x => Number(x) == x )) {
			arg = arg.map( x => String(x % 2) ).join('');
			for (var hpname in hpivsets) {
				if (hpivsets[hpname].indexOf(arg) >= 0)
					return this.restrictReply('Hidden Power ' + hpname[0].toUpperCase() + hpname.substr(1), 'simplecoms');
			}
			return this.restrictReply(arg, 'simplecoms');
		}
	},
	bulk: function (arg, by, room, cmd) {
		let parseSingleInput = function parseSingleInput(input) {
			let [, item] = /^(eviolite |av |assault ?vest )/i.exec(input) || [, ""];
			let [, ...baseStats] = /^(?:eviolite|av|assault ?vest)? *(\d*)\/(\d*)\/(\d*)/i.exec(input) || [];
			let target = baseStats.join("/");
			if (!baseStats.length) {
				let [, pokemon] = /^(?:eviolite|av|assault ?vest)? *(((?!evs:)[\w- ])*)/i.exec(input);
				if (!pokemon)
					return `"<br>${input}" - base stats or pokemon not found.<br>`;
				pokemon = POKEDEX[toId(pokemon)];
				if (!pokemon)
					return `"<br>${target}" - base stats not found, and no such dex entry exists.<br>`;
				baseStats[0] = pokemon.baseStats.hp;
				baseStats[1] = pokemon.baseStats.def;
				baseStats[2] = pokemon.baseStats.spd;
				target = pokemon.species;
			}
			let [, ...ivs] = /ivs: *?(\d*)\/(\d*)\/(\d*)/.exec(input) || [null, 31, 31, 31];
			let [, ...evs] = /evs: *?(\d*)\/(\d*)([\+-]?)\/(\d*)([\+-]?)/.exec(input) || [null, "252", "252", "+", "252", "+"];
			let nature = { "": 1.0, "-": 0.9, "+": 1.1 };
			let hp = 2 * baseStats[0] + 110 + ivs[0] + Math.floor(evs[0] / 4);
			let def = 2 * baseStats[1] + 5 + ivs[1] + Math.floor(evs[1] / 4);
			let spd = 2 * baseStats[2] + 5 + ivs[2] + Math.floor(evs[3] / 4);
			def = Math.floor(nature[evs[2]] * def);
			spd = Math.floor(nature[evs[4]] * spd);
			if (toId(item) === "eviolite")
				def = Math.floor(1.5 * def);
			if (toId(item) === "eviolite" || toId(item) === "assaultvest" || toId(item) === "av")
				spd = Math.floor(1.5 * spd);
			return `<b>${item}${target} bulk</b> (evs: ${evs[0]}/${evs[1]}${evs[2]}/${evs[3]}${evs[4]})` + Tools.makeHtmlTable([
				["physical:", (hp*def).toLocaleString(), `[${hp} hp, ${def} def]`],
				["special:", (hp*spd).toLocaleString(), `[${hp} hp, ${spd} spdef]`]
			], ["", " style='text-align: right'", ""]);
		};
		this.htmlReply(arg.split(/ *, */g).map(parseSingleInput).join("") + "(bulk is hp times defense)");
	},
	basecalc: function(arg, by, room, cmd) {
		let [, Base, Modifier, Level] = /(\d*) *(\D?)[^,]*,?\D*(\d*)/.exec(arg);
		if (!Level || Level < 1)
			Level = 100;

		let roundMultiply = function(mul, x, div = 1) {
			return Math.floor(mul * x / div);
		};

		let undoRoundMultiply = function(mul, y, div = 1) {
			let lower = div * y / mul;
			let upper = div * (Number(y)+1) / mul;
			// find all integers between lower and upper
			let result = [];
			for (let i = Math.ceil(lower); i <= Math.floor(upper); i++)
				result.push(i);
			return result;
		};

		let baseToRaw = function baseToRaw(base, modifier) {
			let result = 2*base;                                           // base
			switch (modifier) {
				case "": 
				case "+": result += 31 + 63; break;                        // ivs + evs
				case "u": result += 31;                                    // ivs
			}
			if (Level != 100)
				result = roundMultiply(100, result, Level);                // level
			result += 5;                                                   // +5
			switch (modifier) {
				case "+": result = roundMultiply(1.1, result); break;      // nature
				case "-": result = roundMultiply(0.9, result);
			}
			return result;
		};

		let rawToBase = function rawToBase(raw, modifier) {
			let result = [raw];
			switch (modifier) {
				case "+": result = undoRoundMultiply(1.1, raw); break;     // nature
				case "-": result = undoRoundMultiply(0.9, raw);
			}
			result = result.map( x => x - 5 );                             // -5
			if (Level != 100)
				result.map( x => undoRoundMultiply(100, x, Level) );       // level
			switch (modifier) {
				case "": 
				case "+": result = result.map( x => x - 31 - 63 ); break;  // ivs + evs
				case "u": result = result.map( x => x - 31 );              // ivs
			}
			return result.map( x => x / 2 );                               // base
		};

		let Raw = Base;
		if (Modifier !== "r")
			Raw = baseToRaw(Raw, Modifier);

		return this.htmlReply(`<details><summary>${Raw} stat can be reached in the following ways</summary>` + Tools.makeHtmlTable([
			[rawToBase(Raw, "+").join(" or "), "base 252+ev"],
			[rawToBase(Raw, "" ).join(" or "), "base 252ev"],
			[rawToBase(Raw, "u").join(" or "), "base 0ev"],
			[rawToBase(Raw, "-").join(" or "), "base 0-iv"]
		], [" style='text-align: right'", ""]) + `</details>`);
	}
};