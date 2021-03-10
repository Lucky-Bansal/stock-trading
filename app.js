const express                   = require('express');
app                             = express();
var bodyParser                             = require('body-parser');

const validator                 = require('./validator/validator');
const controller                = require('./controller/controller');
const startupService            = require('./startupService');

app.set('port', process.env.PORT || 3000);
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(bodyParser.json({limit: '50mb'}));

app.get('/portfolio',       validator.portfolio,        controller.portfolio);

app.get('/trades',          validator.trades,           controller.trades);

app.post('/trade',          validator.postTrade,        controller.postTrade);

app.delete('/trade',        validator.deleteTrade,      controller.deleteTrade);

app.put('/trade',           validator.updateTrade,      controller.updateTrade);

app.get('/returns',         validator.returns,          controller.returns);

startupService.initialize();