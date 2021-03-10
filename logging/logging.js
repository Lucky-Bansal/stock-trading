var moment = require('moment');

exports.log = log;
exports.logError = logError;
exports.consolelog = consolelog;

function consolelog(eventFired, error, result) {
        console.log(eventFired, error, result);
};


function log(apiReference, log) {
    if(apiReference && apiReference.module && apiReference.api){

    try {
        log = JSON.stringify(log);
    }
    catch (exception) {
    }
    console.log("-->" + moment(new Date()).format('YYYY-MM-DD hh:mm:ss.SSS') + " :----: " +
        apiReference.module + " :=: " + apiReference.api + " :=: " + log);

    }
}

function logError(apiReference, log) {

    if(apiReference && apiReference.module && apiReference.api){

        try {
            log = JSON.stringify(log);
        }
        catch (exception) {
        }
        console.error("-->" + moment(new Date()).format('YYYY-MM-DD hh:mm:ss.SSS') + " :----: " +
        apiReference.module + " :=: " + apiReference.api + " :=: " + log);
    }

}
