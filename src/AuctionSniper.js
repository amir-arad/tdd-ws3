require('source-map-support').install();
var SNIPER_ID = 'sniper';

export default function AuctionSniper(auction, listener){

	this.auctionClosed = function auctionClosed(){
		listener.sniperLost();
	};

	this.currentPrice = function currentPrice(price, increment){
		auction.bid(SNIPER_ID, price + increment);
		listener.sniperBidding();
	};
}