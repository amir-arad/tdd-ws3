require('source-map-support').install();
var express = require('express');

var state = 'joining';

var listener = {
    sniperLost: () => {
        state = 'lost';
    },
    sniperBidding: () => {
        state = 'bidding';
    },
    sniperWinning: () => {

    }
};

var app = express();
app.get('/', function (req, res) {
    res.send(`<html><head></head><body>
<div id="status">${state}</div>
</body></html>`);
});
var server = app.listen(8888, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});

export default {
    listener
};