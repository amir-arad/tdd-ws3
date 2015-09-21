require('source-map-support').install();
var Promise = require('bluebird');
var assert = require('chai').assert;
import redis from 'then-redis';
// import theRealThing from '../src/main';

var childProcess = require('child_process');
const SNIPER_ID = 'sniper';
const REDIS_HOSTNAME = 'localhost';
const STATUS = 'STATUS';

var webdriverio = require('webdriverio');
var options = { desiredCapabilities: { browserName: 'phantomjs' } };

var statuses = {
	JOINING: 'joining',
	BIDDING: 'bidding',
	WINNING: 'winning',
	LOST: 'lost',
	WON: 'won'
};
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
			console.log('Assert Passed!!');
		});
	}
	stop(){
		client.end();
	}
}

class ApplicationRunner {
	startBiddingIn(auction) {
		this.driver = new AuctionSniperDriver();
		// start main program with some arguments
		this.runningServer = childProcess.exec('node ./dist/src/main.js ' + auction, (error,stdout) => {
			console.log(stdout);
			console.log(error);
		});
		return this.driver.showsSniperStatus(statuses.JOINING);
	}
	showsSniperHasLostAuction () {
		return this.driver.showsSniperStatus(statuses.LOST);
	}
	hasShownSniperIsBidding() {
		return this.driver.showsSniperStatus(statuses.BIDDING);
	}
	hasShownSniperIsWinning() {
		return this.driver.showsSniperStatus(statuses.WINNING);
	}
	showsSniperHasWonAuction() {
		return this.driver.showsSniperStatus(statuses.WON);
	}
	stop(){
		 this.runningServer.kill('SIGINT');
         this.driver.stop();
	}
}

class FakeAuctionServer {
	constructor(itemId) {
		this.count = 0;
		this.itemId = itemId;
		this.publisher = redis.createClient();
		this.listener = redis.createClient();
		this.listener.on('message', (channel, msg) => {
				//this.count += 1;
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
		auction = new FakeAuctionServer('item-5347');		
		application = new ApplicationRunner();
	});

	it('makes a higher bid but loses', () => {
		return auction.startSellingItem()
			.then(() => application.startBiddingIn('item-5347'))
			.then(() => auction.hasReceivedJoinRequestFrom(SNIPER_ID))

			.then(() => auction.reportPrice(1000, 98, 'other bidder'))
			.then(() => application.hasShownSniperIsBidding())
			.then(() => auction.hasReceivedBid(1098, SNIPER_ID))

			.then(() => auction.announceClosed())
			.then(() => application.showsSniperHasLostAuction());
	});

	it('makes a higher bid and wins', () => {
		return auction.startSellingItem()
			.then(() => application.startBiddingIn('item-5347'))
			.then(() => auction.hasReceivedJoinRequestFrom(SNIPER_ID))

			.then(() => auction.reportPrice(1000, 98, 'other bidder'))
			.then(() => application.hasShownSniperIsBidding())
			.then(() => auction.hasReceivedBid(1098, SNIPER_ID))

			.then(() => auction.reportPrice(1098, 97, SNIPER_ID))
			.then(() => application.hasShownSniperIsWinning())

			.then(() => auction.announceClosed())
			.then(() => application.showsSniperHasWonAuction());
	});

	it('joins an auction untill it closes', () => {
		return auction.startSellingItem()
			.then(() => application.startBiddingIn('item-5347'))
			.then(() => auction.hasReceivedJoinRequestFrom(SNIPER_ID))
			.then(() => auction.announceClosed())
			.then(() => application.showsSniperHasLostAuction());
	});	
	
	afterEach('something', () => {
		application.stop();
		auction.stop();
	});
});