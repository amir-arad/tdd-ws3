require('source-map-support').install();
var assert = require('chai').assert;
var sinon = require('sinon');
var SniperTableModel = require('../src/SniperTableModel');
var statuses = require('../src/sniperStateDisplayer').statuses;

const columns = SniperTableModel.columns;
describe('sniper table model', () => {
	let mockListener, model;
	beforeEach('init mock listener', ()=>{
		mockListener = {
			tableChanged : sinon.spy()
		};
		model = new SniperTableModel();
		model.addTableModelListener(mockListener);
	});

	function assertColumnEquals(columnKey, expected) {
		var rowIndex = 0;
		const actual = model.getValueAt(rowIndex, columnKey);
		assert.equal(expected, actual, `value at column ${columnKey} is not expected`);
	}


	it('has enough columns', () => {
		assert.equal(model.getColumnCount(), columns.length, 'number of columns not right');
	});
	it('set sniper values in columns', () => {
		model.sniperStatusChanged("item id", 555, 666, statuses.BIDDING);

		assert(mockListener.tableChanged.calledOnce, 'mockListener.tableChanged not called once');
		assertColumnEquals(columns.ITEM_IDENTIFIER, "item id");
		assertColumnEquals(columns.LAST_PRICE, 555);
		assertColumnEquals(columns.LAST_BID, 666);
		assertColumnEquals(columns.SNIPER_STATUS, statuses.BIDDING);
	});
});