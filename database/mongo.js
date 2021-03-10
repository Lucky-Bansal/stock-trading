const Promise                                     = require('bluebird');
const MongoClient                                 = require('mongodb').MongoClient;

const logging                                     = require('./../logging/logging');


exports.initialize                                = initialize;
exports.find                                      = find;
exports.update                                    = update;
exports.insert                                    = insert;
exports.remove                                    = remove;
exports.insertMany                                = insertMany;
exports.findAndModify                             = findAndModify;

function initialize(apiReference, connectionString) {
    return new Promise((resolve, reject) => {
        console.log('######## Mongo connected ###########', connectionString);
        MongoClient.connect(connectionString, function (err, conn) {
            if (err) {
                logging.logError(apiReference, { EVENT: "MONGO_CONN_ERR", ERR: err });
                return reject(err);
            }
            logging.log(apiReference, "MONGO CONNECTED ");
            return resolve(conn);
        });
    });
}


function find(apiReference, collectionName, condition, limit, skip, projection = {}){
  return new Promise((resolve, reject) => {
    let cursor = db.collection(collectionName).find(condition, projection).skip(skip || 0).limit(limit || 50);
    if ( cursor ){
      cursor.toArray(function (err, result){
        logging.log(apiReference, {event : "mongoFind", collection : collectionName, condition : condition, result : result , error : err});
        cursor.close();
        if ( err ){
          return reject(err);
        }
        return resolve(result);
      });
    } else{
      logging.logError(apiReference, {EVENT : "find", ERR : "invalid mongo query", collectionName : collectionName, condition : condition});
      reject(new Error("invalid mongo query"));
    }
  })
}
  
function update(apiReference, collectionName, condition, newdata, upsert) {
  return new Promise((resolve, reject) => {
    db.collection(collectionName).update(condition, {$set: newdata}, {upsert: upsert}, function (mongoErr, mongoOut) {
      logging.log(apiReference, {
        EVENT         : "Upserting into mongo",
        collectionName: collectionName,
        CONDITION     : condition,
        NEW_DATA      : newdata,
        MONGO_RESULT  : mongoOut
      });
      if (mongoErr) {
        logging.logError(apiReference, {
          EVENT         : "Upserting into mongo",
          collectionName: collectionName,
          CONDITION     : condition,
          NEW_DATA      : newdata,
          MONGO_ERROR   : mongoErr
        });
        return reject(mongoErr);
      }

      return resolve(mongoOut);
    });
  });
}
  
function insert(apiReference, tableName, data) {
  return new Promise((resolve, reject) => {
    db.collection(tableName).insert(data, function (mongoErr, mongoOut) {
      logging.log(apiReference, {
        EVENT       : "insert",
        TABLE       : tableName,
        NEW_DATA    : data,
        MONGO_RESULT: mongoOut
      });
      if (mongoErr) {
        logging.logError(apiReference, {
          EVENT      : "Upserting into mongo",
          TABLE      : tableName,
          NEW_DATA   : data,
          MONGO_ERROR: mongoErr
        });
        return reject(mongoErr);
      }

      return resolve(mongoOut);
    });
  });
}

function remove(apiReference, collectionName, condition) {
  return new Promise((resolve, reject) => {
    db.collection(collectionName).remove(condition, function (mongoErr, mongoOut) {
      logging.log(apiReference, {
        EVENT         : "Remove from mongo",
        collectionName: collectionName,
        CONDITION     : condition,
        MONGO_RESULT  : mongoOut
      });
      if (mongoErr) {
        logging.logError(apiReference, {
          EVENT         : "Remove from mongo",
          collectionName: collectionName,
          CONDITION     : condition,
          MONGO_ERROR   : mongoErr
        });
        return reject(mongoErr);
      }
      return resolve(mongoOut);
    });
  });
}

function insertMany(apiReference, tableName, data) {
  return new Promise((resolve, reject) => {
    db.collection(tableName).insertMany(data, function (mongoErr, mongoOut) {
      logging.log(apiReference, {
        EVENT       : "insert",
        TABLE       : tableName,
        NEW_DATA    : data,
        MONGO_RESULT: mongoOut
      });
      if (mongoErr) {
        logging.logError(apiReference, {
          EVENT      : "Upserting into mongo",
          TABLE      : tableName,
          NEW_DATA   : data,
          MONGO_ERROR: mongoErr
        });
        return reject(mongoErr);
      }

      return resolve(mongoOut);
    });
  });
}

function findAndModify(apiReference, collectionName,opts) {
  return new Promise((resolve, reject) => {
    db.collection(collectionName).findAndModify( opts.condition, opts.sort, opts.update, opts.extras, function (mongoErr, mongoOut) {
      logging.log(apiReference, {
        EVENT       : "findAndModify",
        TABLE       : collectionName,
        OBJECT      : opts,
        MONGO_RESULT: mongoOut
      });
      if (mongoErr) {
        logging.logError(apiReference, {
          EVENT      : "findAndModify into mongo",
          TABLE      : collectionName,
          OBJECT     : opts,
          MONGO_ERROR: mongoErr
        });
        return reject(mongoErr);
      }
      return resolve(mongoOut);
    });
  });
}