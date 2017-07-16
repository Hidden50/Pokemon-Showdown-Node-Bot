Settings.addPermissions(['dictionary']);
const request = require('request');

exports.commands = {

    def: 'define',
    define: function(target, room, user) {
        if (!this.can('dictionary')) return false;
        if (!target) return this.sendReply('Usage: .define <word>');
        if (target > 50) return this.sendReply('.define <word> - word can not be longer than 50 characters.');

        var options = {
            url: 'http://api.wordnik.com:80/v4/word.json/' + target + '/definitions?limit=3&sourceDictionaries=all' +
                '&useCanonical=false&includeTags=false&api_key=a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5',
        };

        var self = this;

        function callback(error, response, body) {
            if (!error && response.statusCode == 200) {
                var page = JSON.parse(body);
                var output = '**' + target + '**: ';
                if (!page[0]) {
                    return self.sendReply('No results for **"' + target + '"**.');
                }
                else {
                    var count = 1;
                    for (var u in page) {
                        if (count > 1) break;
                        output += page[u]['text'];
                        count++;
                    }
                    return self.sendReply(output);
                }
            }
        }
        request(options, callback);
    },
    
    ud: 'urbandefine',
    udef: 'urbandefine',
    urbandefine: function(target, room, user) {
        if (!this.can('dictionary')) return false;
        return this.sendReply('The command has been temporarily disabled. Sorry.');
        var self = this;
        if (!target) {
            target = '';
            var random = true;
        }
        else {
            random = false;
        }
        if (target.toString().length > 50) return this.sendReply('.ud - <phrase> can not be longer than 50 characters.');

        if (!random) {
            var options = {
                url: 'http://www.urbandictionary.com/iphone/search/define',
                term: target,
                headers: {
                    'Referer': 'http://m.urbandictionary.com'
                },
                qs: {
                    'term': target
                }
            };
        }
        else {
            options = {
                url: 'http://www.urbandictionary.com/iphone/search/random',
                headers: {
                    'Referer': 'http://m.urbandictionary.com'
                },
            };
        }

        self = this;

        function callback(error, response, body) {
            if (!error && response.statusCode == 200) {
                var page = JSON.parse(body);
                var definitions = page['list'];
                if (page['result_type'] == 'no_results') {
                    return self.sendReply('No results for **"' + target + '"**.');
                }
                else {
                    if (!definitions[0]['word'] || !definitions[0]['definition']) {
                        return self.sendReply('No results for **"' + target + '"**.');
                    }
                    var output = '**' + definitions[0]['word'] + ':** ' + definitions[0]['definition'];
                    if (output.length > 500) output = output.substr(0, 500) + ' ...';
                    if (output.length > 300) return self.sendReply(self.splitReply(output));
                    return self.sendReply(output);
                }
            }
        }
        request(options, callback);
    }
};