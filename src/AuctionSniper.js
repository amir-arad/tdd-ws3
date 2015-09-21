require('source-map-support').install();
var SNIPER_ID = 'sniper';

export default function AuctionSniper(auction, listener){

	const priceSource = {
		FROM_OTHER_BIDDER: 'someone else',
		FROM_SNIPER: 'sniper'
	};

	this.auctionClosed = function auctionClosed(){
		listener.sniperLost();
	};

	this.currentPrice = function currentPrice(price, increment, source){
		switch (source) {
			case priceSource.FROM_SNIPER:
				listener.sniperWinning();
				break;
			case priceSource.FROM_OTHER_BIDDER:
				auction.bid(SNIPER_ID, price + increment);
				listener.sniperBidding();
				break;
		}
	};
}