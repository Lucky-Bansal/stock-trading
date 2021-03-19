/**
 * Created By Lucky Bansal
 */
const express                   = require('express');
app                             = express();
var bodyParser                             = require('body-parser');

const validator                 = require('./validator/validator');
const controller                = require('./controller/controller');
const startupService            = require('./startupService');

app.set('port', process.env.PORT || 3000);
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(bodyParser.json({limit: '50mb'}));

//Get portfolio details
app.get('/portfolio',       validator.portfolio,        controller.portfolio);

//Get trade history for a particular trade or all trades
app.get('/trades',          validator.trades,           controller.trades);

// Make a trade transaction
app.post('/trade',          validator.postTrade,        controller.postTrade);

// Delete a trade transaction
app.delete('/trade',        validator.deleteTrade,      controller.deleteTrade);

// Update a trade transaction
app.put('/trade',           validator.updateTrade,      controller.updateTrade);

//Get commulative return for a particular trade or overall trade
app.get('/returns',         validator.returns,          controller.returns);

startupService.initialize();