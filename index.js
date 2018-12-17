/*
 * Primary file for the API
 *
 */

// Dependencies
var http = require("http");
var https = require("https");
var url = require("url");
var StringDecoder = require("string_decoder").StringDecoder;
var config = require("./config");
var fs = require("fs");

// Instanstating the HTTP server
var httpServer = http.createServer(function(req, res) {
  unifiedServer(req, res);
});

// Start the server - I will have to listen on port 3000
httpServer.listen(config.httpport, function() {
  console.log("The HTTP server is listening on port " + config.httpport);
});

// Instantiate HTTPS server
var httpsServerOptions = {
  key: fs.readFileSync("./https/key.pem"),
  cert: fs.readFileSync("./https/cert.pem")
};

var httpsServer = https.createServer(httpsServerOptions, function(req, res) {
  unifiedServer(req, res);
});

// Start HTTPS server
httpsServer.listen(config.httpsport, function() {
  console.log("The HTTPS server is listening on port " + config.httpsport);
});

// All the server logic for both http and https server
var unifiedServer = function(req, res) {
  // Get the URL and parse it
  var parsedUrl = url.parse(req.url, true);

  // Get the path
  var path = parsedUrl.pathname;
  var trimmedPath = path.replace(/^\/+|\/+$/g, "");

  // Get the query string as an object
  var queryStringObject = parsedUrl.query;

  //Get the HTTP method
  var method = req.method.toLowerCase();

  // Get the headers as an Object
  var headers = req.headers;

  // Get the payload, if any
  var decoder = new StringDecoder("utf-8");
  var buffer = "";
  req.on("data", function(data) {
    buffer += decoder.write(data);
  });
  req.on("end", function() {
    buffer += decoder.end();

    // Choose the handler this request should go to. If one is not found, use the notFound handler
    var choosenHandler =
      typeof router[trimmedPath] !== "undefined"
        ? router[trimmedPath]
        : handlers.notFound;

    // Construct the data object to send to the handler
    var data = {
      trimmedPath: trimmedPath,
      queryStringObject: queryStringObject,
      method: method,
      headers: headers,
      payload: buffer
    };

    // Route the request to the handler specified in the router
    choosenHandler(data, function(statusCode, payload) {
      //Use the status code called back by the handler, or default to the handler
      statusCode = typeof statusCode == "number" ? statusCode : 200;

      //Use the payload called back by the handler, or default to the router
      payload = typeof payload == "object" ? payload : {};

      // Conver the payload to a string
      var payloadString = JSON.stringify(payload);

      // Return the response
      res.setHeader("Content-Type", "application/json");
      res.writeHead(statusCode);
      res.end(payloadString);

      // Log the request path
      console.log("Returning this response :", statusCode, payloadString);
    });
  });
};

// Define the handlers
var handlers = {};

// Ping handler
handlers.ping = function(data, callback) {
  callback(200);
};

// Hello World API
handlers.hello = function(data, callback) {
  callback(200, {
    welcome: "Welcome to the world of Pirple Blue Node JS Master Class"
  });
};

// NOTFound handler
handlers.notFound = function(data, callback) {
  callback(404);
};

// Define a request router
var router = {
  ping: handlers.ping,
  hello: handlers.hello
};
