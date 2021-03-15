
const apiReferenceModule                    = 'Controller';
var ObjectID                                = require('mongodb').ObjectID;

const _                                     = require('underscore');

const logging                               = require('./../logging/logging');
const mongo                                 = require('./../database/mongo');
const responses                             = require('./../utilities/responses');
const constants                             = require('./../utilities/constants');

exports.portfolio                           = portfolio;
exports.trades                              = trades;
exports.postTrade                           = postTrade;
exports.deleteTrade                         = deleteTrade;
exports.returns                             = returns;
exports.updateTrade                         = updateTrade;

async function portfolio(req, res) {
    let apiReference = {
        module: apiReferenceModule,
        api: "portfolio"
    }
    
    logging.log(apiReference, { QUERY: req.query });
    try {
        let limit = Number(req.query.limit);
        let skip = Number(req.query.skip) || 0;

        let fetchObj = { is_deleted: 0 }

        if (req.query.security_code) {
            fetchObj["_id"] = new ObjectID(req.query.security_code);
        }
        let portfolioResult = await mongo.find(apiReference, constants.mongoCollections.PORTFOLIOS, fetchObj, limit, skip, {is_deleted : 0});

        return responses.actionCompleteResponse(res, portfolioResult);
    } catch (error) {
        return responses.sendCatchError(res, error);
    }
}

async function trades(req, res) {
    let apiReference = {
        module: apiReferenceModule,
        api: "trades"
    }
    logging.log(apiReference, { QUERY: req.query });

    try {
        let limit = Number(req.query.limit);
        let skip = Number(req.query.skip) || 0;


        let cursor = db.collection(constants.mongoCollections.TRADE_HISTORY).aggregate([
            {
                "$project": {
                    "security_code": { "$toObjectId": "$security_code" },
                    "trade_type": 1,
                    "new_average_price": 1,
                    "new_quantity": 1,
                    "old_quantity": 1,
                    "old_average": 1,
                    "datetime": 1
                }
            },
            {
                $lookup: {
                    from: constants.mongoCollections.PORTFOLIOS,
                    localField: "security_code",    // field in the constants.mongoCollections.TRADE_HISTORY collection
                    foreignField: "_id",                // field in the constants.mongoCollections.PORTFOLIOS collection
                    as: "security"
                }
            }, {
                "$unwind": { "path": "$security", "preserveNullAndEmptyArrays": true }
            }, {
                "$project": {
                    "security_code": 1,
                    "trade_type": 1,
                    "new_average_price": 1,
                    "new_quantity": 1,
                    "old_quantity": 1,
                    "old_average": 1,
                    "datetime": 1,
                    "security_name": "$security.security_name"
                }
            },
            {
                 "$sort" : { "datetime" : 1 } 
            },
            {
                "$skip": skip
            },
            {
                "$limit": limit
            }
        ]);
        if (cursor) {
            cursor.toArray((error, mongoOut) => {
                logging.log(apiReference, {
                    EVENT: "AGGREGATE QUERY into mongo",
                    error: error,
                    MONGO_RESULT: mongoOut
                });
                if (error) {
                    return responses.sendCustomResponse(res, error.message || constants.responseMessageCode.SHOW_ERROR_MESSAGE, constants.responseFlags.SHOW_ERROR_MESSAGE, {}, apiReference);
                }

                return responses.actionCompleteResponse(res, mongoOut, null, apiReference);
            });
        } else {
            return responses.sendCatchError(res, error);
        }
    } catch (error) {
        return responses.sendCatchError(res, error);
    }
}

async function postTrade(req, res) {

    let apiReference = {
        module: apiReferenceModule,
        api: "trades"
    }
    logging.log(apiReference, { QUERY: req.body });

    try {
        let security_code = req.body.security_code;
        let trade_type = req.body.trade_type;
        let quantity = req.body.quantity;

        let portfolioResult = await mongo.find(apiReference, constants.mongoCollections.PORTFOLIOS, { "_id": new ObjectID(security_code.toString().trim()), is_deleted: 0 }, 1, 0);
        if (_.isEmpty(portfolioResult)) {
            return responses.sendCustomResponse(res, constants.responseMessageCode.NO_DATA_FOUND, constants.responseFlags.NO_DATA_FOUND, portfolioResult, apiReference);
        }

        let stock_current_price = portfolioResult[0].average_price;
        let stock_current_quantity = portfolioResult[0].current_quantity;

        let stock_price = constants.STOCK_PRICE;
        let new_average = ((stock_current_price * stock_current_quantity) + (quantity * stock_price)) / (stock_current_quantity + quantity);

        if (trade_type == constants.TRADE_TYPE.SELL) {
            if (stock_current_quantity < quantity) {
                return responses.sendCustomResponse(res, constants.responseMessageCode.NOT_ENOUGH_STOCKS, constants.responseFlags.SHOW_ERROR_MESSAGE, {}, apiReference)
            }
            new_average = stock_current_price;
        }
        new_average = Number(new_average.toFixed(2));
        let insertObj = {
            security_code,
            trade_type,
            quantity,
            new_average_price: new_average,
            new_quantity: Number(stock_current_quantity + quantity),
            old_quantity: stock_current_quantity,
            old_average: stock_current_price,
            is_deleted: 0,
            datetime: new Date().toISOString(),
            trade_price: stock_price
        };
        if (trade_type == constants.TRADE_TYPE.SELL) {
            insertObj.new_quantity = Number(stock_current_quantity - quantity);
        }
        await mongo.insert(apiReference, constants.mongoCollections.TRADE_HISTORY, insertObj);

        await mongo.update(apiReference, constants.mongoCollections.PORTFOLIOS, { "_id": new ObjectID(security_code.toString().trim()) },
            { average_price: new_average, current_quantity: insertObj.new_quantity }, true);

        return responses.actionCompleteResponse(res);
    } catch (error) {
        return responses.sendCatchError(res, error);
    }
}

async function deleteTrade(req, res) {
    let apiReference = {
        module: apiReferenceModule,
        api: "deleteTrade"
    }
    logging.log(apiReference, { QUERY: req.body });

    try {

        let security_code = req.body.security_code;
        let transaction_code = req.body.transaction_code;

        let shares_worth_change = 0;
        let shares_change = 0

        security_code = new ObjectID(security_code.toString().trim());
        let portfolioResult = await mongo.find(apiReference, constants.mongoCollections.PORTFOLIOS, { "_id": security_code, is_deleted: 0 }, 1, 0);

        if (_.isEmpty(portfolioResult)) {
            return responses.sendCustomResponse(res, constants.responseMessageCode.PORTFOLIO_NOT_FOUND, constants.responseFlags.NO_DATA_FOUND, portfolioResult, apiReference);
        }

        let transaction = await mongo.findAndModify(apiReference, constants.mongoCollections.TRADE_HISTORY, {
            condition: { "_id": new ObjectID(transaction_code.toString().trim()) },
            sort: [],
            update: { $set: { is_deleted: 1 } },
            extras: { new: false, remove: false }
        });

        if (_.isEmpty(transaction)) {
            return responses.sendCustomResponse(res, constants.responseMessageCode.TRANSACTION_NOT_FOUND, constants.responseFlags.NO_DATA_FOUND, transaction, apiReference);
        }

        if(transaction.value.trade_type == constants.TRADE_TYPE.BUY){

            shares_worth_change = transaction.value.trade_price * transaction.value.quantity;
            
            if(portfolioResult[0].current_quantity < transaction.value.quantity){
                return responses.sendCustomResponse(res, constants.responseMessageCode.NOT_ENOUGH_STOCKS, constants.responseFlags.SHOW_ERROR_MESSAGE, transaction, apiReference);
            }
            shares_change = portfolioResult[0].current_quantity - transaction.value.quantity;
        } else {
            shares_change = portfolioResult[0].current_quantity + transaction.value.quantity;
        }

        if(portfolioResult[0].average_price * portfolioResult[0].current_quantity  < shares_worth_change){
            return responses.sendCustomResponse(res, constants.responseMessageCode.NOT_ENOUGH_STOCKS, constants.responseFlags.SHOW_ERROR_MESSAGE, transaction, apiReference);
        }

        let new_average = (portfolioResult[0].average_price * portfolioResult[0].current_quantity  - shares_worth_change) / shares_change;
        await mongo.update(apiReference, constants.mongoCollections.PORTFOLIOS, { "_id": security_code },
            { average_price: new_average , current_quantity: shares_change }, true);

        return responses.actionCompleteResponse(res);

    } catch (error) {
        return responses.sendCatchError(res, error);
    }
}

async function returns(req, res) {
    let apiReference = {
        module: apiReferenceModule,
        api: 'returns'
    };
    logging.log(apiReference, { QUERY: req.body });
    try {

        let security_code = req.query.security_code;
        let limit = Number(req.query.limit);
        let skip = Number(req.query.skip);

        let fetchObj = { is_deleted: 0 };

        if (security_code) {
            fetchObj["_id"] = new ObjectID(security_code.toString().trim());
        }

        let portfolioResult = await mongo.find(apiReference, constants.mongoCollections.PORTFOLIOS, fetchObj, limit, skip, {"_id" : 0, average_price : 1, current_quantity : 1 });

        let sum = 0;
        portfolioResult.forEach((portfolio) => {
            console.log((constants.STOCK_PRICE - portfolio.average_price) * portfolio.current_quantity)
            sum += Number((constants.STOCK_PRICE - portfolio.average_price) * portfolio.current_quantity);
        });
        return responses.actionCompleteResponse(res, {return : (sum >= 0) ? sum : 0}, null, apiReference);

    } catch (error) {
        return responses.sendCatchError(res, error);
    }
}

async function updateTrade(req, res) {
    let apiReference = {
        module: apiReferenceModule,
        api: 'updateTrade'
    };
    logging.log(apiReference, { QUERY: req.body });
    try {
        
        let transaction_code    = req.body.transaction_code;
        let trade_type          = req.body.trade_type;
        let quantity            = req.body.quantity;
        let security_code       = req.body.security_code;
        let stock_price         = constants.STOCK_PRICE;

        let amount_before_transaction;
        let quantity_before_transaction;

        let fetchObj = { is_deleted: 0 };

        fetchObj["_id"] = new ObjectID(transaction_code.toString().trim());

        let trade_history = await mongo.find(apiReference, constants.mongoCollections.TRADE_HISTORY, fetchObj, 1, 0);

        if(_.isEmpty(trade_history)){
            return responses.sendCustomResponse(res, constants.responseMessageCode.TRANSACTION_NOT_FOUND, constants.responseFlags.NO_DATA_FOUND, trade_history, apiReference);
        }

        if(!security_code) {
            security_code = trade_history[0].security_code;
        }

        let portfolioResult = await mongo.find(apiReference, constants.mongoCollections.PORTFOLIOS, { "_id" : new ObjectID(security_code.toString().trim()), "is_deleted" : 0 }, 1, 0);

        if(!portfolioResult.length){
            return responses.sendCustomResponse(res, constants.responseMessageCode.PORTFOLIO_NOT_FOUND, constants.responseFlags.NO_DATA_FOUND, trade_history, apiReference);
        }

        previous_trade_type = trade_history[0].trade_type;
        amount_before_transaction   = trade_history[0].old_average;
        quantity_before_transaction = trade_history[0].old_quantity;

        let setObj = { };

        if(trade_type == constants.TRADE_TYPE.BUY){
            setObj.new_average_price = ((amount_before_transaction * quantity_before_transaction) + (quantity * stock_price)) / (quantity_before_transaction + quantity);
            setObj.new_quantity= quantity_before_transaction + quantity;
        } else {
            setObj.new_average_price = amount_before_transaction;
            if(quantity_before_transaction < quantity){
                return responses.sendCustomResponse(res, constants.responseMessageCode.NOT_ENOUGH_STOCKS, constants.responseFlags.SHOW_ERROR_MESSAGE, {}, apiReference)
            }
            setObj.new_quantity= quantity_before_transaction - quantity ;
        }

        await mongo.update(apiReference, constants.mongoCollections.TRADE_HISTORY, {"_id" : new ObjectID(transaction_code.toString().trim())}, setObj, false);

    } catch (error) {
        return responses.sendCatchError(res, error);
    }
}