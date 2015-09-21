require('source-map-support').install();
var assert = require('chai').assert;
var sinon = require('sinon');
var AuctionMessageTranslator = require('../src/AuctionMessageTranslator');

const SNIPER_ID = 'sniper';
const priceSource = AuctionMessageTranslator.priceSource;

describe('auction message translator', () => {
	const UNUSED_CHANNEL = null;
	let mockListener;
	let translator;
	beforeEach('init mock listener', ()=>{
		mockListener = {
			auctionClosed : sinon.spy(),
			currentPrice: sinon.spy()
		};
		translator = new AuctionMessageTranslator(SNIPER_ID, mockListener);
	});
	it('notifies auction closed when close message received', () => {
		const message = JSON.stringify({event:'closed'});
		translator.processMessage(UNUSED_CHANNEL, message);
		assert(mockListener.auctionClosed.calledOnce, 'listener auctionClosed not called once');
	});

	it('notifies bid details when current price message received from other bidder', () => {
		const message = JSON.stringify({event:'price', price: 192, increment: 7, bidder: 'hsgdqghsdfhsg'});
		translator.processMessage(UNUSED_CHANNEL, message);
		assert(mockListener.currentPrice.calledOnce, 'listener currentPrice not called once');
		assert(mockListener.currentPrice.calledWithExactly(192, 7, priceSource.FROM_OTHER_BIDDER), 'listener currentPrice was not called with correct parameters');
	});

	it('notifies bid details when current price message received from sniper', () => {
		const message = JSON.stringify({event:'price', price: 234, increment: 5, bidder: SNIPER_ID});
		translator.processMessage(UNUSED_CHANNEL, message);
		assert(mockListener.currentPrice.calledOnce, 'listener currentPrice not called once');
		assert(mockListener.currentPrice.calledWithExactly(234, 5, priceSource.FROM_SNIPER), 'listener currentPrice was not called with correct parameters');
	});
});