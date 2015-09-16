require('source-map-support').install();

export default function AuctionSniper(auction, listener){

	this.auctionClosed = function auctionClosed(){
		listener.sniperLost();
	};

	this.currentPrice = function currentPrice(price, increment){
		auction.bid(price + increment);
		listener.sniperBidding();
	};
}