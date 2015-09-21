require('source-map-support').install();
var SNIPER_ID = 'sniper';

export default function AuctionSniper(auction, listener){

	var isWinning = false;

	const priceSource = {
		FROM_OTHER_BIDDER: 'someone else',
		FROM_SNIPER: 'sniper'
	};

	this.auctionClosed = function auctionClosed(){
		if (isWinning){
			listener.sniperWon();
		} else {
			listener.sniperLost();
		}
	};

	this.currentPrice = function currentPrice(price, increment, source){
		switch (source) {
			case priceSource.FROM_SNIPER:
				isWinning = true;
				listener.sniperWinning();
				break;
			case priceSource.FROM_OTHER_BIDDER:
				isWinning = false;
				auction.bid(SNIPER_ID, price + increment);
				listener.sniperBidding();
				break;
		}
	};
}