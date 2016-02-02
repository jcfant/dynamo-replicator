'use strict';

var AWS = require('aws-sdk');
var denodeify = require('denodeify');

var dynamos = {};

module.exports = {
	put: put,
	del: del
};

function getDynamo(region) {
	if (!dynamos[region]) {
		dynamos[region] = new AWS.DynamoDB({ region: region });
	}
	return dynamos[region];
}

function put(region, table, keys, data) {
	var dynamo = getDynamo(region);
	return denodeify(dynamo.putItem.bind(dynamo))({
			TableName: table,
			Item: data
		})
		.then(function() {
			console.log({ event: "OBJECT_PUT", data: JSON.stringify(data) });
		});
}

function del(region, table, keys) {
	var dynamo = getDynamo(region);
	return denodeify(dynamo.deleteItem.bind(dynamo))({
			TableName: table,
			Key: keys
		})
		.then(function() {
			console.log({ event: "OBJECT_DELETED", keys: JSON.stringify(keys) });
		});
}
