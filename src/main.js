require('source-map-support').install();
var sourcemaps = require("gulp-sourcemaps");
import AuctionMessageTranslator from './AuctionMessageTranslator';
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

	display.start();
	var sniper = new AuctionSniper(auction, display.listener);
	var translator = new AuctionMessageTranslator(SNIPER_ID, sniper);
	subscriber.on('message', translator.processMessage);
	auction.join();
}

main();

