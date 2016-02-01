# DynamoDB Replicator

Lambda-ready npm package for replicating DynamoDB tables within or between regions.

Supports one-way replication (single master to one or many slave(s)).

## Usage

### Prerequisites

You'll need NodeJS and NPM installed on your local machine.

### Limitations

Your **master** DynamoDB table **must** be in a region that supports AWS Lambda.  The slaves can be in any region.

### Prepare your DynamoDB table

Add a stream to the DynamoDB table you want to use as your master.

1. In the Overview tab of the DynamoDB table in the AWS console click **Manage Stream**.
1. In the overlay that pops up choose **New Image** (although **New and old images** should also work should you need that for other reasons).
1. Click **Enable**.

Alternatively, if you want to provision your DynamoDB table with CloudFormation add the `StreamSpecification` property to the `AWS::DynamoDB::Table` object, e.g.

```
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Resources": {
    "myTable": {
      "TableName": "mytable",
      [..],
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
  - Or run `echo {} > package.json` in your terminal
1. In your terminal run `npm install --save dynamo-replicator es6-promise`
1. Edit `index.js` and save the contents of the file shown below (changing `SLAVE-REGION` and `SLAVE-TABLE` to be the region and table name of the DynamoDB to be replicated to).
1. zip the contents of the folder up.  (Remember to zip the contents of the folder, not the folder itself)
  - In the terminal you could achieve this by runnning `find . -exec zip ../replication-lambda-function.zip {} +` within the same directory.
1. Create a new Lambda function with a role that has sufficient IAM permissions.  As a minimum it needs:-
  - For the **master** table and its **stream**:
    - `dynamodb:GetRecords`
    - `dynamodb:GetShardIterator`
    - `dynamodb:DescribeStream`
    - `dynamodb:ListStreams`
  - For the **slave** table:
    - `dynamodb:PutItem`
    - `dynamodb:DeleteItem`
  - You might like to use the inline policy for the role below.
1. On the **Triggers** tab of your **master** DynamoDB, click **Create Trigger** and **New Function**; for the **Configure event source** options, ensure the **DynamoDB table** is your master table and leave everything else as default and click **Next**; for the **Configure function** options name your function something like `dynamodb-replicator` and for **Code entry type** select **Upload a .ZIP file** and choose the zip file created earlier.
1. Repeat the previous step for multiple slaves changing `SLAVE-REGION` and `SLAVE-TABLE` in `index.js` each time and re-zipping for each slave.
1. Test by creating and deleting items from the **master** table and ensuring that the slaves update accordingly.

### Appendix

**Contents of `index.json`**:-
```js
'use strict';

require('es6-promise').polyfill();

var replicator = require('dynamo-replicator')({
	region: 'SLAVE-REGION',
	table: 'SLAVE-TABLE'
});

exports.handler = function(event, context) {
	replicator.process(event)
		.then(function() {
			context.succeed('success');
		})
		.catch(function(err) {
			context.fail(err);
		});
};
```

**Lambda function Role inline policy**:-

Inline Policy:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": [
                "*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "lambda:InvokeFunction"
            ],
            "Resource": "arn:aws:lambda:*:*:function:LAMBDA-FUNCTION-NAME"
        },
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:PutItem",
                "dynamodb:DeleteItem"
            ],
            "Resource": "arn:aws:dynamodb:*:*:table/SLAVE-TABLE"
        },
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:GetRecords",
                "dynamodb:GetShardIterator",
                "dynamodb:DescribeStream",
                "dynamodb:ListStreams"
            ],
            "Resource": "arn:aws:dynamodb:*:*:table/MASTER-TABLE*"
        }
    ]
}
```
Remember to replace `LAMBDA-FUNCTION-NAME` with the name of the Lambda function name, `SLAVE-TABLE` with the name of the slave DynamoDB table and `MASTER-TABLE` with the name of the master DynamoDB table.  Or all with `*`'s if you're feeling lucky.  Remember to include an `*` after the master table name, e.g. `arn:aws:dynamodb:*:*:table/MasterTable*` so that the role gets access to the update stream associated with the table as well as the table itself.


Trust relationship:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```
