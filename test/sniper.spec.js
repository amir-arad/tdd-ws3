require('source-map-support').install();
var assert = require('chai').assert;
var sinon = require('sinon');
var AuctionSniper = require('../src/AuctionSniper');
var SNIPER_ID = 'sniper';


describe('auction sniper', () => {
	let mockListener;
	let mockAuction;
	let sniper;
	let priceSource;
	beforeEach('init mock listener', ()=>{
		mockAuction = {
			bid : sinon.spy()
		};
		mockListener = {
			sniperLost : sinon.spy(),
			sniperBidding : sinon.spy(),
			sniperWon : sinon.spy(),
			sniperWinning : sinon.spy()
		};
		priceSource = {
			FROM_OTHER_BIDDER: 'someone else',
			FROM_SNIPER: 'sniper'
		};
		sniper = new AuctionSniper(mockAuction, mockListener);
	});
	it('reports lost when auction closes immediately', () => {
		sniper.auctionClosed();
		assert(mockListener.sniperLost.calledOnce, 'listener.sniperLost not called once');
	});

	it('reports lost if auction closes when bidding', () => {
		let price = 1001;
		let increment = 25;

		sniper.currentPrice(price, increment, priceSource.FROM_OTHER_BIDDER);
		sniper.auctionClosed();
		assert(mockListener.sniperBidding.calledOnce, 'listener.sniperBidding not called once');
		assert(mockListener.sniperLost.calledOnce, 'listener.sniperLost not called once');
		assert(mockListener.sniperBidding.calledBefore(mockListener.sniperLost), 'listener.sniperBidding not called before listener.sniperLost');

	});

	it('bids higher and reports bidding when new price arrives', () => {
		let price = 1001;
		let increment = 25;

		sniper.currentPrice(price, increment, priceSource.FROM_OTHER_BIDDER);

		assert(mockAuction.bid.calledOnce, 'auction.bid not called once');
		assert(mockAuction.bid.calledWithExactly(SNIPER_ID, price + increment), 'auction.bid not called with right arguments');
		assert(mockListener.sniperBidding.calledOnce, 'listener.sniperBidding not called once');
	});

	it('reports is winning when current price comes from sniper', function () {
		let price = 123;
		let increment = 45;

		sniper.currentPrice(price, increment, priceSource.FROM_SNIPER);

		assert(mockListener.sniperWinning.calledOnce, 'listener.sniperWinning not called once');
	});

	it('reports won if auction closes when winning', function () {
		let price = 123;
		let increment = 45;

		sniper.currentPrice(price, increment, priceSource.FROM_SNIPER);
		sniper.auctionClosed();

		assert(mockListener.sniperWinning.calledOnce, 'listener.sniperWinning not called once');
		assert(mockListener.sniperWon.calledOnce, 'listener.sniperWon not called once');
		assert(mockListener.sniperWinning.calledBefore(mockListener.sniperWon), 'listener.sniperWinning not called before listener.sniperWon');
	});
});