const apiReference                                = { module : "startup", api : "startup" };


const Promise                                     = require('bluebird');
const http                                        = require('http');

const logging                                     = require('./../logging/logging');
const database                                    = require('./../database');

exports.initialize                                = initialize;

async function initialize() {
  await database.initialize();                              // Initializing databases
  await initializeServer(app.get('port'));                  // Initializing server on port set on app.js file
}

function initializeServer(port) {
  return new Promise((resolve, reject) => {
    logging.log(apiReference, "STARTING HTTP SERVER ");
    let server = http.createServer(app).listen(port, () => {
      logging.log(apiReference, "HTTP SERVER STARTED  " + port);
      return resolve(server);
    });
  });
}