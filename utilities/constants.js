

//FOR FLAGS
exports.responseFlags = {
    PARAMETER_MISSING                  : 400,
    ACTION_NOT_ALLOWED                 : 403,
    ACTION_COMPLETE                    : 200,
    SHOW_ERROR_MESSAGE                 : 501,
    NO_DATA_FOUND                      : 404,
  };

  exports.mongoCollections = {
    PORTFOLIOS : 'tb_portfolios',
    TRADE_HISTORY : 'tb_trade_history'
  }

  exports.responseMessageCode = {
    ACTION_COMPLETE                                           : 'ACTION_COMPLETE',
    SHOW_ERROR_MESSAGE                                        : 'SHOW_ERROR_MESSAGE',
    NOT_ENOUGH_STOCKS                                         : 'NOT_ENOUGH_STOCKS',
    NO_DATA_FOUND                                             : 'NO_DATA_FOUND',
    TRANSACTION_NOT_FOUND                                     : 'TRANSACTION_NOT_FOUND',
    PORTFOLIO_NOT_FOUND                                       : 'PORTFOLIO_NOT_FOUND'
  };

exports.ERROR_MESSAGE = "Some error occured. Please try again later";

exports.STOCK_PRICE = 100;                          // Mentioned in assignment

exports.TRADE_TYPE = {
  BUY : 1,
  SELL : 2
}