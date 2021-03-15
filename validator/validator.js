const apiReferenceModule        = 'validator';

const Joi                       = require('joi');

const responses                 = require('./../utilities/responses');
const constants                 = require('./../utilities/constants');

exports.portfolio               = portfolio;
exports.trades                  = trades;
exports.postTrade               = postTrade;
exports.deleteTrade             = deleteTrade;
exports.returns                 = returns;
exports.updateTrade             = updateTrade;

function portfolio(req, res, next) {
    let apiReference = {
        module : apiReferenceModule,
        api : "portfolio"
    }
    let schema = Joi.object().keys({
        limit           : Joi.number().integer().positive().max(30).required(),
        skip            : Joi.number().integer().min(0).required(),
        security_code   : Joi.string().optional()
    });

    let validFields = validateFields(req['query'], res, schema, apiReference);
    if (validFields) {
        next();
    }
}

function trades(req, res, next) {
    let apiReference = {
        module : apiReferenceModule,
        api : "trades"
    }
    let schema = Joi.object().keys({
        limit           : Joi.number().integer().positive().max(30).required(),
        skip            : Joi.number().integer().min(0).required(),
        security_code   : Joi.string().optional()
    });

    let validFields = validateFields(req['query'], res, schema, apiReference);
    if (validFields) {
        next();
    }
}

function postTrade(req, res, next) {
    let apiReference = {
        module : apiReferenceModule,
        api : "postTrade"
    }
    let schema = Joi.object().keys({
        quantity        : Joi.number().integer().min(1).positive().required(),
        security_code : Joi.string().required(),
        trade_type      : Joi.number().required().valid(Object.values(constants.TRADE_TYPE))
    });

    let validFields = validateFields(req['body'], res, schema, apiReference);
    if (validFields) {
        next();
    }

}

function deleteTrade(req, res, next) {
    let apiReference = {
        module : apiReferenceModule,
        api : "deleteTrade"
    }
    let schema = Joi.object().keys({
        quantity        : Joi.number().integer().min(1).positive().required(),
        security_code   : Joi.string().optional(),
        transaction_code: Joi.string().required()
    });

    let validFields = validateFields(req['body'], res, schema, apiReference);
    if (validFields) {
        next();
    }
}

function returns(req, res, next) {
    let apiReference = {
        module : apiReferenceModule,
        api : "deleteTrade"
    }
    let schema = Joi.object().keys({
        security_code   : Joi.string().optional(),
        skip            : Joi.number().min(0).integer().required(),
        limit           : Joi.number().positive().integer().max(30).required()
    });

    let validFields = validateFields(req['query'], res, schema, apiReference);
    if (validFields) {
        next();
    }
}

function updateTrade(req, res, next) {
    let apiReference = {
        module : apiReferenceModule,
        api : "updateTrade"
    }
    let schema = Joi.object().keys({
        security_code       : Joi.string().optional(),
        transaction_code    : Joi.string().required(),
        quantity            : Joi.number().min(1).integer().required(),
        trade_type          : Joi.number().required().valid(Object.values(constants.TRADE_TYPE))
    });

    let validFields = validateFields(req['body'], res, schema, apiReference);
    if (validFields) {
        next();
    }
}

function validateFields(req, res, schema, apiReference) {
    var validation = Joi.validate(req, schema);
    if (validation.error) {
        var errorReason =
                validation.error.details !== undefined
                    ? validation.error.details[0].message
                    : 'Parameter missing or parameter type is wrong';
        responses.sendCustomResponse(res, errorReason || constants.ERROR_MESSAGE, constants.responseFlags.PARAMETER_MISSING, {}, apiReference);
        return false;
    }
    return true;
}

