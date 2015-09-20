require('source-map-support').install();
var assert = require('chai').assert;
var sinon = require('sinon');
var AuctionSniper = require('../src/AuctionSniper');
var SNIPER_ID = 'sniper';


describe('auction sniper', () => {
	let mockListener;
	let mockAuction;
	let sniper;
	beforeEach('init mock listener', ()=>{
		mockAuction = {
			bid : sinon.spy()
		};
		mockListener = {
			sniperLost : sinon.spy(),
			sniperBidding : sinon.spy()
		};
		sniper = new AuctionSniper(mockAuction, mockListener);
	});
	it('reports lost when auction closes', () => {
		sniper.auctionClosed();
		assert(mockListener.sniperLost.calledOnce, 'listener.sniperLost not called once');
	});

	it('bids higher and reports bidding when new price arrives', () => {
		let price = 1001;
		let increment = 25;

		sniper.currentPrice(price, increment);

		assert(mockAuction.bid.calledOnce, 'auction.bid not called once');
		assert(mockAuction.bid.calledWithExactly(SNIPER_ID, price + increment), 'auction.bid not called with right arguments');
		assert(mockListener.sniperBidding.calledOnce, 'listener.sniperBidding not called once');
	});
});