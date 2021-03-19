const mongoLib                      = require('./mongo');

exports.initialize                  = initialize;

let mongoProperties = 'mongodb://localhost:27017/small_cases'                     // Mongo connection string for database

async function initialize(apiReference) {
  db              = await mongoLib.initialize(null, mongoProperties);
}