'use strict';

var dynamo = require('./dynamo');

module.exports = function(opts) {
	return new Replicator(opts);
};

function Replicator(opts) {
	this.region = opts.region;
	this.table = opts.table;
}

Replicator.prototype.process = function(event) {
	var region = this.region;
	var table = this.table;

	// HACK: Eliminate, as much as possible, the need to wrap
	// the calling of this function in a try { } catch.
	return Promise.resolve()
		.then(function() {
			var records = event.Records;

			return Promise.all(records.map(function(record) {
					switch(record.eventName) {
						case 'MODIFY':
						case 'INSERT':
							return dynamo.put(region, table, record.dynamodb.Keys, record.dynamodb.NewImage);
						case 'REMOVE':
							return dynamo.del(region, table, record.dynamodb.Keys);
					}
				}));
		});
};
