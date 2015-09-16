require('source-map-support').install();
var assert = require('chai').assert;
var sinon = require('sinon');
var AuctionMessageTranslator = require('../src/AuctionMessageTranslator');

describe('auction message translator', () => {
	const UNUSED_CHANNEL = null;
	let mockListener;
	let translator;
	beforeEach('init mock listener', ()=>{
		mockListener = {
			auctionClosed : sinon.spy(),
			currentPrice: sinon.spy()
		};
		translator = new AuctionMessageTranslator(mockListener);
	});
	it('notifies auction closed when close message received', () => {
		const message = JSON.stringify({event:'closed'});
		translator.processMessage(UNUSED_CHANNEL, message);
		assert(mockListener.auctionClosed.calledOnce, 'listener auctionClosed not called once');
	});

	it('notifies bid details when current price message received', () => {
		const message = JSON.stringify({event:'price', price: 192, increment: 7, bidder: 'someone else'});
		translator.processMessage(UNUSED_CHANNEL, message);
		assert(mockListener.currentPrice.calledOnce, 'listener currentPrice not called once');
		assert(mockListener.currentPrice.calledWithExactly(192, 7, 'someone else'), 'listener currentPrice was not called with correct parameters');
	});
});