'use strict';

var express = require('express');
var sourcemaps = require("gulp-sourcemaps");
var app = express();
var AuctionMessageTranslator = require('./AuctionMessageTranslator');
var AuctionSniper = require('./AuctionSniper');
var server;
var state = 'joining';
var redis = require('then-redis');
var Auction = require('./Auction');
var itemToSnipe = process.argv[2];
var SNIPER_ID = 'sniper';

function main() {
	var publisher = redis.createClient();
	publisher.publish(itemToSnipe, JSON.stringify({ bidder: SNIPER_ID, type: 'join' }));
	var subscriber = redis.createClient();
	subscriber.subscribe(itemToSnipe);

	var auction = new Auction(itemToSnipe);

	var sniper = new AuctionSniper(auction, {
		sniperLost: function sniperLost() {
			state = 'lost';
		},
		sniperBidding: function sniperBidding() {
			state = 'bidding';
		}
	});
	var translator = new AuctionMessageTranslator(sniper);
	subscriber.on('message', translator.processMessage);
	auction.join();

	app.get('/', function (req, res) {
		res.send('<html><head></head><body>\n\t\t<div id="status">' + state + '</div>\n\t\t</body></html>');
	});
	server = app.listen(8888, function () {
		var host = server.address().address;
		var port = server.address().port;

		console.log('Example app listening at http://%s:%s', host, port);
	});
}

main();
//# sourceMappingURL=main.js.map