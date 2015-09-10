'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _thenRedis = require('then-redis');

var _thenRedis2 = _interopRequireDefault(_thenRedis);

// import theRealThing from '../src/main';

require('source-map-support').install();
var Promise = require('bluebird');
var assert = require('chai').assert;
var childProcess = require('child_process');
var SNIPER_ID = 'sniper';
var REDIS_HOSTNAME = 'localhost';
var STATUS = 'STATUS';

var webdriverio = require('webdriverio');
var options = { desiredCapabilities: { browserName: 'phantomjs' } };

var statuses = {
	STATUS_JOINING: 'joining',
	STATUS_LOST: 'lost'
};
var client;

var AuctionSniperDriver = (function () {
	function AuctionSniperDriver() {
		_classCallCheck(this, AuctionSniperDriver);

		client = webdriverio.remote(options).init();
	}

	_createClass(AuctionSniperDriver, [{
		key: 'showsSniperStatus',
		value: function showsSniperStatus(statusText) {
			return client.url('http://localhost:8888').then(function () {
				return client.getText('#status');
			}).then(function (text) {
				assert.equal(text, statusText, 'wrong status');
				console.log('Assert Passed!!');
			});
		}
	}, {
		key: 'stop',
		value: function stop() {
			client.end();
		}
	}]);

	return AuctionSniperDriver;
})();

var ApplicationRunner = (function () {
	function ApplicationRunner() {
		_classCallCheck(this, ApplicationRunner);
	}

	_createClass(ApplicationRunner, [{
		key: 'startBiddingIn',
		value: function startBiddingIn(auction) {
			this.driver = new AuctionSniperDriver(1000);
			// start main program with some arguments
			this.runningServer = childProcess.exec('node ./dist/src/main.js ' + auction, function (error, stdout) {
				console.log(stdout);
				console.log(error);
			});
			return this.driver.showsSniperStatus(statuses.STATUS_JOINING);
		}
	}, {
		key: 'showsSniperHasLostAuction',
		value: function showsSniperHasLostAuction() {
			return this.driver.showsSniperStatus(statuses.STATUS_LOST);
		}
	}, {
		key: 'stop',
		value: function stop() {
			this.runningServer.kill('SIGINT');
			this.driver.stop();
		}
	}]);

	return ApplicationRunner;
})();

var FakeAuctionServer = (function () {
	function FakeAuctionServer(itemId) {
		var _this = this;

		_classCallCheck(this, FakeAuctionServer);

		this.count = 0;
		this.itemId = itemId;
		this.publisher = _thenRedis2['default'].createClient();
		this.listener = _thenRedis2['default'].createClient();
		this.listener.on('message', function (channel, msg) {
			_this.count += 1;
			_this.message = msg;
		});
	}

	_createClass(FakeAuctionServer, [{
		key: 'hasRecievedJoinRequestFromSniper',
		value: function hasRecievedJoinRequestFromSniper() {
			assert(this.count > 0, 'did not receive a message');
			return new Promise(function (res, rej) {
				res();
			});
		}
	}, {
		key: 'announceClosed',
		value: function announceClosed() {
			return this.publisher.publish(this.itemId, "lost");
		}
	}, {
		key: 'startSellingItem',
		value: function startSellingItem() {
			return this.listener.subscribe(this.itemId);
		}
	}, {
		key: 'stop',
		value: function stop() {
			this.listener.quit();
			this.publisher.quit();
		}
	}]);

	return FakeAuctionServer;
})();

describe('the auction sniper', function () {
	var auction;
	var application;
	beforeEach('auction sniper e2e', function () {
		auction = new FakeAuctionServer('item-5347');
		application = new ApplicationRunner();
	});

	it('joins an auction untill it closes', function () {
		return auction.startSellingItem().then(function () {
			return application.startBiddingIn('item-5347');
		}).then(function () {
			return auction.hasRecievedJoinRequestFromSniper();
		}).then(function () {
			return auction.announceClosed();
		}).then(function () {
			return application.showsSniperHasLostAuction();
		});
	});

	afterEach('something', function () {
		application.stop();
		auction.stop();
	});
});
//# sourceMappingURL=e2e.spec.js.map