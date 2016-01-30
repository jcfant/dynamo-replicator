'use strct';

const rewire = require('rewire');
const expect = require('chai').expect;
const Replicator = rewire('../replicator');
const replicator = Replicator({ region: 'matts-house-1', table: 'mytable_slave' });
const dynamoMock = require('./utils/dynamo-mock');
const fixture = require('./fixtures/dynamo-db-stream.json');

describe('process events', () => {

	before(() => {
		Replicator.__set__('dynamo', dynamoMock);
	});

	afterEach(() => {
		dynamoMock.reset();
	});

	it('will process the stream', () => {
		return replicator.process({ Records: [fixture.Records[0], fixture.Records[1]] })
			.then(() => dynamoMock.getAll())
			.then(all => {
				expect(all).to.have.all.keys([JSON.stringify(fixture.Records[1].dynamodb.Keys)]);
			})
			.then(() => replicator.process({ Records: [fixture.Records[2]] }))
			.then(() => dynamoMock.getAll())
			.then(all => {
				expect(all).to.be.empty;
			});
	});

});
