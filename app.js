/*
 *File: app.js
 *Author: Saurabh Gattani
 *Last Modified: 25th September 2017
 *Revised on: 25th September 2017
 */
var express = require('express');
var app = express();
var bodyParser = require('body-parser')
var SwaggerParser = require('swagger-parser');
var YAML = require('yamljs');
var CircularJSON = require('circular-json');
var jsBeautify = require('js-beautify');
var swagger = require('swagger-express-middleware');
var path = require('path');
var port = 8000;

var Middleware = swagger.Middleware;
var middleware = new Middleware(app);
var fs = require('fs');
var util = require('util');
var http = require('http');


app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({
	extended: true
}));


app.post('/YAMLToJSONObject', function(req, res) {
	// parse YAML string
	var nativeObject = YAML.parse(req.body.yamlString);
	res.send({
		output: nativeObject
	});
});


middleware.init(path.join(__dirname, 'product-offerings-PPV_YAML.yaml'), function(err) {
	// Enable Express' case-sensitive and strict options
	// (so "/pets/Fido", "/pets/fido", and "/pets/fido/" are all different)
	app.enable('case sensitive routing');
	app.enable('strict routing');

	app.use(middleware.metadata());
	app.use(middleware.files({
		// Override the Express App's case-sensitive and strict-routing settings
		// for the Files middleware.
		caseSensitive: false,
		strict: false
	}, {
		// Serve the Swagger API from "/swagger/api" instead of "/api-docs"
		apiPath: '/swagger/api',

		// Disable serving the "swagger .yaml" file
		rawFilesPath: false
	}));

	app.use(middleware.parseRequest({
		// Configure the cookie parser to use secure cookies
		cookie: {
			secret: 'FOSSSecretKey'
		},

		// Don't allow JSON content over 1024kb (default is 1mb)
		json: {
			limit: '1024kb'
		}
	}));

	// These two middleware don't have any options (yet)
	app.use(
		middleware.CORS(),
		middleware.validateRequest()
	);

	// Add custom middleware
	app.post('/api*', function(req, res, next) {
		if (req.body.type === 'YAMLText') {
			var nativeObject = YAML.parse(req.body.yamlString);
			SwaggerParser.bundle(nativeObject).then(function(api) {
				res.send({
					output: api
				});
			});
		} else {
			SwaggerParser.bundle(req.body.filename).then(function(api) {
				res.send({
					output: api
				});
			});
		}

		

		app.use(req.body.endpoint, function(req, res, next) {
			console.log("API call to " + req.body.endpoint + " intercepted here", req.originalUrl);
			// this might be replaced with actual API call and it's reponse
			var json = '';
			switch(req.originalUrl.split('/')[1]) {
				case 'pay-per-view':
					json = 'user-payperview-offers.json';
					res.send({
						response: callAPI(json)
					});
					break;
					
				case 'account':
					json = 'account.json';
					res.send({
						response: callAPI(json)
					});
					break;
				
				default:
					res.send("Error/API doesn't exist");
					break;
			}
		});


	});
	
	app.get('/api*', function (req, res, next) {
		next();
	}, function (req, res, next) {
		//console.log('URL path', req.url, req.url.substr(req.url.lastIndexOf('/') + 1));
		var json = '';
		switch(req.url.substr(req.url.lastIndexOf('/') + 1)) {
			case 'pay-per-view':
				json = 'user-payperview-offers.json';
				res.send({
					response: callAPI(json)
				});
				break;
				
			case 'account':
				json = 'account.json';
				res.send({
					response: callAPI(json)
				});
				break;
				
			default:
				res.send("Error/API doesn't exist");
				break;
		}	
	});

	function callAPI(json) {
		var obj = JSON.parse(fs.readFileSync(json, 'utf8'));
		return obj;
	}


	// Add a custom error handler that returns errors as HTML
	app.use(function(err, req, res, next) {
		//res.status(err.status);
		//res.type('html');
		//res.send(util.format('<html><body><h1>%d Error!</h1><p>%s</p></body></html>', err.status, err.message));
		res.send({
			response: err.message
		});
	});

	app.listen(port, function() {
		console.log('The Swagger Interceptor is now running at http://localhost:'+port);
	});
});

