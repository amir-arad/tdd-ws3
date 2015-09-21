require('source-map-support').install();
var express = require('express');

var statuses = {
    JOINING: 'joining',
    BIDDING: 'bidding',
    WINNING: 'winning',
    LOST: 'lost',
    WON: 'won'
};

var state = statuses.JOINING;

var listener = {
    sniperLost: () => {
        state = statuses.LOST;
    },
    sniperBidding: () => {
        state = statuses.BIDDING;
    },
    sniperWinning: () => {
    //    state = statuses.WINNING;
    }
};

function start() {
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
}

export default {
	start, listener, statuses
};
