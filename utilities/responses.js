const logging                               = require('./../logging/logging');
const constants                             = require('./constants');


exports.actionCompleteResponse              = actionCompleteResponse;
exports.sendCustomResponse                  = sendCustomResponse;
exports.sendCatchError                      = sendCatchError;


function actionCompleteResponse(res, data, msg, apiReference) {
    let response = {
        message: msg || constants.responseMessageCode.ACTION_COMPLETE,
        status: constants.responseFlags.ACTION_COMPLETE,
        data: data || {}
    };
    if (apiReference) {
        logging.log(apiReference, { EVENT: "FINAL RESPONSE", RESPONSE: response });
    }
    res.status(response.status).send(JSON.stringify(response));
}


function sendCustomResponse(res, message, code, data, apiReference) {
    let response = {
        message: message,
        status: code,
        data: data || {},
    };
    if (apiReference) {
        logging.log(apiReference, { EVENT: "FINAL RESPONSE", RESPONSE: response });
    }
    res.status(code).send(JSON.stringify(response));
}

function sendCatchError(res, error) {
    logging.consolelog("ERROR in CATCH", error);
    return sendCustomResponse(res, error.message || constants.ERROR_MESSAGE, constants.responseFlags.SHOW_ERROR_MESSAGE);
}