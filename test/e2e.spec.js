require('source-map-support').install();
var Promise = require('bluebird');
var assert = require('chai').assert;
import redis from 'then-redis';
// import theRealThing from '../src/main';

var childProcess = require('child_process');
const SNIPER_ID = 'sniper';
const REDIS_HOSTNAME = 'localhost';
const STATUS = 'STATUS';
const ITEM_ID = 'item-5347';

var webdriverio = require('webdriverio');
var options = { desiredCapabilities: { browserName: 'phantomjs' } };

var statuses = require('../src/sniperStateDisplayer').statuses;

var client;
class AuctionSniperDriver{
	constructor(){
		client = webdriverio.remote(options).init();
	}
	showsSniperStatus(statusText) {
		return client.url('http://localhost:8888')
		.then( () => client.getText('#status'))
		.then(text => {
			assert.equal(text, statusText, 'wrong status');
		});
	}
	stop(){
		client.end();
	}
}

class ApplicationRunner {
	startBiddingIn(itemId) {
		this.itemId = itemId;
		this.driver = new AuctionSniperDriver();
		// start main program with some arguments
		this.runningServer = childProcess.exec('node ./dist/src/main.js ' + itemId, (error,stdout) => {
			console.log(stdout);
			console.log(error);
		});
		return this.driver.showsSniperStatus(this.itemId, statuses.JOINING);
	}
	showsSniperHasLostAuction () {
		return this.driver.showsSniperStatus(this.itemId, statuses.LOST);
	}
	hasShownSniperIsBidding(lastPrice, lastBid) {
		return this.driver.showsSniperStatus(this.itemId, lastPrice, lastBid, statuses.BIDDING);
	}
	hasShownSniperIsWinning(winningBid) {
		return this.driver.showsSniperStatus(this.itemId, winningBid, statuses.WINNING);
	}
	showsSniperHasWonAuction(lastPrice) {
		return this.driver.showsSniperStatus(this.itemId, lastPrice, statuses.WON);
	}
	stop(){
		 this.runningServer.kill('SIGINT');
         this.driver.stop();
	}
}

class FakeAuctionServer {
	constructor(itemId) {
		this.itemId = itemId;
		this.publisher = redis.createClient();
		this.listener = redis.createClient();
		this.listener.on('message', (channel, msg) => {
				this.message = msg;
		})
	}
	hasReceivedJoinRequestFrom(bidder){
		var messageBody = JSON.parse(this.message);
		assert.equal(messageBody.type, 'join', 'bidder did not match');
        assert.equal(messageBody.bidder, bidder, 'bidder did not match');
		return new Promise((res) =>{
			res();
		});
	}
	hasReceivedBid(price, bidder) {
		var messageBody = JSON.parse(this.message);
		assert.equal(messageBody.type, 'bid', 'last message was not a bid');
		assert.equal(messageBody.price, price, 'price did not match');
		assert.equal(messageBody.bidder, bidder, 'bidder did not match');

	}

	reportPrice(price, increment, bidder){
		return this.publisher.publish(this.itemId, JSON.stringify({price, increment, bidder, event: "price"}));
	}
	announceClosed(){
		return this.publisher.publish(this.itemId, JSON.stringify({event: "closed"}));
	}
	startSellingItem() {
		return this.listener.subscribe(this.itemId);
	}
	stop(){
		this.listener.quit();
		this.publisher.quit();
	}
}

describe('E2E: auction sniper', () =>{
	var auction;
	var application;
	beforeEach('auction sniper e2e',() => {
		auction = new FakeAuctionServer(ITEM_ID);		
		application = new ApplicationRunner();
	});

	it('makes a higher bid but loses', () => {
		return auction.startSellingItem()
			.then(() => application.startBiddingIn(ITEM_ID))
			.then(() => auction.hasReceivedJoinRequestFrom(SNIPER_ID))

			.then(() => auction.reportPrice(1000, 98, 'other bidder'))
			.then(() => application.hasShownSniperIsBidding())
			.then(() => auction.hasReceivedBid(1098, SNIPER_ID))

			.then(() => auction.announceClosed())
			.then(() => application.showsSniperHasLostAuction());
	});

	it('wins an auction by bidding higher', () => {
		return auction.startSellingItem()
			.then(() => application.startBiddingIn(ITEM_ID))
			.then(() => auction.hasReceivedJoinRequestFrom(SNIPER_ID))

			.then(() => auction.reportPrice(1000, 98, 'other bidder'))
			.then(() => application.hasShownSniperIsBidding(1000, 1098))
			.then(() => auction.hasReceivedBid(1098, SNIPER_ID))

			.then(() => auction.reportPrice(1098, 97, SNIPER_ID))
			.then(() => application.hasShownSniperIsWinning(1098))

			.then(() => auction.announceClosed())
			.then(() => application.showsSniperHasWonAuction(1098));
	});

	it('joins an auction untill it closes', () => {
		return auction.startSellingItem()
			.then(() => application.startBiddingIn(ITEM_ID))
			.then(() => auction.hasReceivedJoinRequestFrom(SNIPER_ID))
			.then(() => auction.announceClosed())
			.then(() => application.showsSniperHasLostAuction());
	});	
	
	afterEach('something', () => {
		application.stop();
		auction.stop();
	});
});