'use strict';

let dynamoDBMock = {};

module.exports = {

	put: (region, table, keys, data) => {
		console.log({ event: "OBJECT_PUT", data: data });
		dynamoDBMock[JSON.stringify(keys)] = data;
		return Promise.resolve();
	},

	get: (region, table, keys) => {
		return Promise.resolve(dynamoDBMock[JSON.stringify(keys)]);
	},

	getAll: () => {
		return dynamoDBMock;
	},

	del: (region, table, keys) => {
		console.log({ event: "OBJECT_DELETED", keys: keys });
		delete dynamoDBMock[JSON.stringify(keys)]
	},

	reset: () => {
		console.log("event=URL_RESET MOCK");
		dynamoDBMock = {};
	}

};