require('source-map-support').install();
var sourcemaps = require("gulp-sourcemaps");
var AuctionMessageTranslator = require('./AuctionMessageTranslator');
var AuctionSniper = require('./AuctionSniper');
var redis = require('then-redis');
var Auction = require('./Auction');
var display = require('./sniperStateDisplayer');
var itemToSnipe = process.argv[2];
var SNIPER_ID = 'sniper';

function main(){
	var publisher = redis.createClient();
	publisher.publish(itemToSnipe, JSON.stringify({bidder: SNIPER_ID, type: 'join'}));
	var subscriber = redis.createClient();
	subscriber.subscribe(itemToSnipe);

	var auction = new Auction(itemToSnipe);

	var sniper = new AuctionSniper(auction, display.listener);
	var translator = new AuctionMessageTranslator(sniper);
	subscriber.on('message', translator.processMessage);
	auction.join();
}

main();

