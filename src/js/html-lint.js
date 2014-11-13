var CodeMirror = require('codemirror');

CodeMirror.registerHelper('lint', 'html', function(text) {

	var messages = [];

	var regex = /<script/;

	// find first instance of <script
	text.split('\n').forEach(function(text, line) {

		var match = text.match(regex);

		if (match) {
			messages.push({
				from: CodeMirror.Pos(line, match.index),
				to: CodeMirror.Pos(line, match.index + match[0].length),
				message: 'JavaScript',
				severity : 'error'
			});
		}
	});

	return messages;
});