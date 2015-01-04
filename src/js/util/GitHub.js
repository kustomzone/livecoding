var util   = require('./util.js');
var PubSub = require('pubsub-js');
var GitHubAPI = require('github-api');

var GitHub =  {

	topics: function() {
		return {
			Token: 'GitHub_Token'
		};
	},

	// github login via oauth client id
	
	// _CLIENT_ID: window.LIVECODING_PROD ? 'ebb6390f3c54ed8002f1' : '7f06406d4740f8839007',
	
	_CLIENT_ID: window.LIVECODING_PROD ? '35bf20402bc5966a37ea' : '35bf20402bc5966a37ea',

	login: function() {
		open('https://github.com/login/oauth/authorize?client_id=' + this._CLIENT_ID + '&scope=gist', 'popup', 'width=1015,height=500');
	},

	convertGistToLivecodingData: function(gist) {

		var files = gist.files;
		var html = files['water.html'] ? files['water.html'].content : '';
		var javascript = files['water.js'] ? files['water.js'].content : '';
		var css = files['water.css'] ? files['water.css'].content : '';

		var options = JSON.parse(files['options.json'].content);

		return {
			html: html,
			javascript: javascript,
			css: css,
			mode: options.mode
		};

	},

	convertLivecodingDataToGist: function(data) {

		var options = {
			mode: data.mode
		};

		var files = {
			files: {
				'options.json': {
					content: JSON.stringify(options, null, 4)
				}
			},
			public: true
		};

		// Use `water` terminology to support old livecoding.io gists.
		// Also, only add files if content exists.
		if (data.html) { files.files['water.html'] = { content:data.html }; }
		if (data.javascript) { files.files['water.js'] = { content:data.javascript }; }
		if (data.css) { files.files['water.css'] = { content:data.css }; }

		return files;
	},

	getUser: function(token) {

		return new Promise(function(resolve, reject) {

			var github = new GitHubAPI({
				token: token,
				auth: 'oauth'
			});

			var user = github.getUser();

			user.show(null, function(error, user) {
				if (error) {
					reject(error);
				} else {
					resolve(user);
				}
			});
		});

	},

	readGist: function(token, id) {

		return new Promise(function(resolve, reject) {

			if (token) {

				var github = new GitHubAPI({
					token: token,
					auth: 'oauth'
				});

				var gist = github.getGist(id);

				gist.read(function(error, gist) {
					if (error) {
						reject(error);
					} else {
						resolve(gist);
					}
				});

			} else {

				util.getJSON('https://api.github.com/gists/' + id)
					.then(function(gist) {
						resolve(gist);
					}).catch(function(error) {
						reject(error);
					});
			}

		});

	},

	updateGist: function(token, data, id) {

		return new Promise(function(resolve, reject) {

			var github = new GitHubAPI({
				token: token,
				auth: 'oauth'
			});

			var files = GitHub.convertLivecodingDataToGist(data);

			var gist = github.getGist(id);

			gist.update(files, function(error, gist) {
				if (error) {
					reject(error);
				} else {
					resolve(gist);
				}
			});

		});

	},

	forkGist: function(token, id) {

		return new Promise(function(resolve, reject) {

			var github = new GitHubAPI({
				token: token,
				auth: 'oauth'
			});

			var gist = github.getGist(id);

			gist.fork(function(error, gist) {
				if (error) {
					reject(error);
				} else {
					resolve(gist);
				}
			});

		});

	},

	createGist: function(token, data) {

		return new Promise(function(resolve, reject) {

			var github = new GitHubAPI({
				token: token,
				auth: 'oauth'
			});

			var files = GitHub.convertLivecodingDataToGist(data);

			github.getGist().create(files, function(error, gist) {
				if (error) {
					reject(error);
				} else {
					resolve(gist);
				}
			});

		});
	}

};

module.exports = GitHub;

// HerokuApp.com

window.handleToken = function(code) {

	var gatekeeperApp = window.LIVECODING_PROD ? 'dev-edit' : 'dev-make';

	var url = 'http://' + gatekeeperApp + '.herokuapp.com/authenticate/' + code;

	util.getJSON(url)
		.then(function(response) {
			PubSub.publish(GitHub.topics().Token, response);
		}).catch(function(error) {
			console.log('Error', error);
		});
};

