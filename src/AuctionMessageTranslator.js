require('source-map-support').install();

export default function AuctionMessageTranslator(listener){

	this.processMessage = function processMessage(channel, message){
		const parsedMessage = JSON.parse(message);
		if (!parsedMessage.type) {
			switch (parsedMessage.event) {
				case 'closed':
					listener.auctionClosed();
					break;
				case 'price':
					listener.currentPrice(parsedMessage.price, parsedMessage.increment, parsedMessage.bidder);
					break;
				default:
					throw new Error('wtf ' + parsedMessage.event);
			}
		}
	}
}