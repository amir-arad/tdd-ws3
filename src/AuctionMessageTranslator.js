require('source-map-support').install();


export default function AuctionMessageTranslator(sniperId, listener){

	function isFrom(bidder) {
		return sniperId === bidder ? priceSource.FROM_SNIPER : priceSource.FROM_OTHER_BIDDER;
	}

	this.processMessage = function processMessage(channel, message){
		const parsedMessage = JSON.parse(message);
		if (!parsedMessage.type) {
			switch (parsedMessage.event) {
				case 'closed':
					listener.auctionClosed();
					break;
				case 'price':
					listener.currentPrice(parsedMessage.price, parsedMessage.increment, isFrom(parsedMessage.bidder));
					break;
				default:
					throw new Error('wtf ' + parsedMessage.event);
			}
		}
	}
}

export var priceSource = {
	FROM_OTHER_BIDDER: 'someone else',
	FROM_SNIPER: 'sniper'
};