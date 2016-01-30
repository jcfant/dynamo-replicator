# DynamoDB Replicator

Lambda-ready npm package for replicating DynamoDB tables within or between regions.

Supports one-way replication (single master to slave(s))

## Usage

### Prerequisites

You'll need NodeJS and NPM installed on your local machine.

### Prepare your DynamoDB table

Add a stream to the DynamoDB table you want to use as your master.

1. In the Overview tab of the DynamoDB table in the AWS console click **Manage Stream**.
1. In the overlay that pops up choose **New Image** (although **New and old images** should also work).
1. Click **Enable**.

Alternatively, if you want to provision your DynamoDB table with CloudFormation add the `StreamSpecification` property to the `AWS::DynamoDB::Table` object, e.g.

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Resources": {
    "myTable": {
      "TableName": "mytable",
      "StreamSpecification": {
        "StreamViewType": "NEW_IMAGE"
      }
    }
  }
}
```

### Create the replication Lambda function

1. Create a new empty directory on your computer
1. Within that folder create two files, one called `package.json` and another called `index.js`.
1. Edit `package.json` and save `{}` as the contents of that file.
1. In your terminal type `npm install --save dynamo-replicator es6-promise`
1. Edit `index.js` and save the contents of the file shown below (changing `SLAVE-REGION` and `SLAVE-TABLE` to be the region and table name of the DynamoDB to be replicated to).
1. zip the contents of the folder up.
1. Create a new Lambda function with a role that has sufficient IAM permissions (as a minimum it needs `dynamodb::PutItem` and `dynamodb::DeleteItem` on the **slave** table.
1. On the **Triggers** tab of your **master** DynamoDB, click **Create Trigger** and **New Function**; for the **Configure event source** options, leave everything as default and click **Next**; for the **Configure function** options name your function something like `dynamodb-replicator` and for **Code entry type** select **Upload a .ZIP file** and choose the zip file created earlier.
1. Repeat the previous step for multiple slaves changing `SLAVE-REGION` and `SLAVE-TABLE` in `index.js` each time and re-zipping for each slave.
1. Test by creating and deleting items from the **master** table and ensuring that the slaves update accordingly.

**Contents of `index.json`**:
```js
'use strict';

require('es6-promise').polyfill();

var replicator = require('dynamo-replicator')({
	region: 'SLAVE-REGION',
	table: 'SLAVE-TABLE'
});

exports.handle = function(event, context) {
	replicator.process(event)
		.then(function() {
			context.succeed('success');
		})
		.catch(function(err) {
			context.fail(err);
		});
};
```
