require('source-map-support').install();

var redis = require('then-redis');

export default function Auction(itemId){
	let publisher;

	this.join = function join(){
		publisher = redis.createClient();
	};

	this.bid = function bid(bidder, price) {
		publisher.publish(itemId, JSON.stringify({bidder: bidder, type: 'bid', price}));
	};

	this.close = function close(){
		publisher.quit();
	}
}