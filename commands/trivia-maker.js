'use strict';

var fs = require('fs');
var triviaSubmittors = ['dtc', 'blitzamirin', 'nv'];
var triviaquestion = [];


exports.commands = {
  ts: function(arg, by, room, cmd) {
    arg = arg.split(',');
    // arg[0] = Question
    // arg[1+] = Answer
    if (!this.isExcepted && !triviaSubmittors.indexOf(by)) return false;
    if (arg.length < 2) return this.reply('Usage: ``.ts Question, Answer1, Answer2, ...`` (Can have multiple answers)');
    var question = {q: arg[0], a: triviaanswers}; //'{q: ' + question + ', a: ' + arg[i] + ', ' + arg[i] + '},';
    fs.appendFile('test.txt', question); // Temporary test file
  }
};
