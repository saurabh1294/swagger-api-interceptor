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



/*app.post('/intercept', function(req, res) 
{
	if (req.body.type === 'YAMLText') {
		nativeObject = YAML.parse(req.body.yamlString);
		//res.send({output:nativeObject});
		SwaggerParser.bundle(nativeObject).then(function(api) {
			//console.log("Intercepting Swagger to JSON bundle", api);
			res.send({output:api});
		});
	} else {
		SwaggerParser.bundle(req.body.filename).then(function(api) {
			//console.log("Intercepting Swagger to JSON bundle", api);
			res.send({output:api});
		});
	}
});




app.post('/parse', function(req, res) 
{
	if (req.body.type === 'YAMLText') {
		nativeObject = YAML.parse(req.body.yamlString);
		//res.send({output:nativeObject});
		SwaggerParser.parse(nativeObject).then(function(api) {
			//console.log("Intercepting Swagger to JSON bundle", api);
			res.send({output:api});
		});
	} else {
		SwaggerParser.parse(req.body.filename).then(function(data) {
			//console.log("Parsed swagger : ", data);
			res.send({output:data});
		});
	}
});

app.post('/dereference', function(req, res) 
{
	if (req.body.type === 'YAMLText') {
		nativeObject = YAML.parse(req.body.yamlString);
		//res.send({output:nativeObject});
		SwaggerParser.dereference(nativeObject).then(function(api) {
			//console.log("Intercepting Swagger to JSON bundle", api);
			res.send({output:api});
		});
	} else {
		SwaggerParser.dereference(req.body.filename).then(function(data) {
		//console.log("Dereferenced swagger : ", data);
		res.send({output:data});
		});
	}
});

app.post('/resolve', function(req, res) 
{
	if (req.body.type === 'YAMLText') {
		nativeObject = YAML.parse(req.body.yamlString);
		//res.send({output:nativeObject});
		SwaggerParser.resolve(nativeObject).then(function(data) {
			var serialized = CircularJSON.stringify(data);
			//console.log("Resolved swagger : ", data, serialized);
			res.send(jsBeautify.js_beautify(serialized));
		});
	} else {
		SwaggerParser.resolve(req.body.filename).then(function(data) {
			var serialized = CircularJSON.stringify(data);
			//console.log("Resolved swagger : ", data, serialized);
			res.send(jsBeautify.js_beautify(serialized));
		});
	}
});

app.post('/YAMLToJSONObject', function(req, res) 
{
	// parse YAML string
	//console.log("YAML = ", req.body.yamlString, typeof req.body.yamlString);
	nativeObject = YAML.parse(req.body.yamlString);
	res.send({output:nativeObject});
});

app.get('/', function(req, res) 
{
    res.sendfile("./index.html");
});

console.log("Listening at "+port)
app.listen(port);*/


app.post('/YAMLToJSONObject', function(req, res) {
	// parse YAML string
	//console.log("YAML = ", req.body.yamlString, typeof req.body.yamlString);
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

		// Disable serving the "PetStore.yaml" file
		rawFilesPath: false
	}));

	app.use(middleware.parseRequest({
		// Configure the cookie parser to use secure cookies
		cookie: {
			secret: 'MySuperSecureSecretKey'
		},

		// Don't allow JSON content over 100kb (default is 1mb)
		json: {
			limit: '100kb'
		}
	}));

	// These two middleware don't have any options (yet)
	app.use(
		middleware.CORS(),
		middleware.validateRequest()
	);

	// Add custom middleware
	app.post('/intercept', function(req, res, next) {


		if (req.body.type === 'YAMLText') {
			var nativeObject = YAML.parse(req.body.yamlString);
			//res.send({output:nativeObject});
			SwaggerParser.bundle(nativeObject).then(function(api) {
				//console.log("Intercepting Swagger to JSON bundle", api);
				res.send({
					output: api
				});
			});
		} else {
			SwaggerParser.bundle(req.body.filename).then(function(api) {
				//console.log("Intercepting Swagger to JSON bundle", api);
				res.send({
					output: api
				});
			});
		}
		//callAPI(req.body.endpoint);


		app.use(req.body.endpoint, function(req, res, next) {
			console.log("API call to " + req.body.endpoint + " intercepted here");
			// this might be replaced with actual API call and it's reponse
			var obj = JSON.parse(fs.readFileSync('user-payperview-offers.json', 'utf8'));
			console.log("returning response from endpoint : ", req.body.endpoint);
			res.send({
				response: obj
			});
		});


	});



	// Add a custom error handler that returns errors as HTML
	app.use(function(err, req, res, next) {
		//res.status(err.status);
		//res.type('html');
		//res.send(util.format('<html><body><h1>%d Error!</h1><p>%s</p></body></html>', err.status, err.message));
		res.send({
			response: err.message
		});
	});

	app.listen(8000, function() {
		console.log('The Swagger Interceptor is now running at http://localhost:8000');
	});
});
