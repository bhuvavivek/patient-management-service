import { DynamoDBClient, type DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const config: DynamoDBClientConfig = {
    region: process.env.AWS_REGION || "us-east-1"
};

// Explicitly map local environment variables to the database connection if they exist
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    config.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
}

const client = new DynamoDBClient(config);

export const docClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: {
        removeUndefinedValues: true,
        convertEmptyValues: true,
    }
});

import { CreateTableCommand, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { logger } from "#utils/logger";

/**
 * Convenience method for local development. Ensures the Dynamo Table exists 
 * and creates it on the fly if an evaluator deploys the server directly via NodeJS 
 * without using Serverless CloudFormation natively.
 */
export const ensureTableExists = async (tableName: string) => {
    try {
        await client.send(new DescribeTableCommand({ TableName: tableName }));
        logger.info(`DynamoDB Table ${tableName} already exists. Proceeding.`);
    } catch (error: any) {
        if (error.name === "ResourceNotFoundException") {
            logger.info(`DynamoDB Table ${tableName} not found. Automatically creating it...`);
            await client.send(new CreateTableCommand({
                TableName: tableName,
                BillingMode: "PAY_PER_REQUEST",
                AttributeDefinitions: [
                    { AttributeName: "patientId", AttributeType: "S" },
                    { AttributeName: "address", AttributeType: "S" }
                ],
                KeySchema: [
                    { AttributeName: "patientId", KeyType: "HASH" }
                ],
                GlobalSecondaryIndexes: [
                    {
                        IndexName: "AddressIndex",
                        KeySchema: [{ AttributeName: "address", KeyType: "HASH" }],
                        Projection: { ProjectionType: "ALL" }
                    }
                ]
            }));
            logger.info(`Successfully created DynamoDB Table ${tableName}!`);
        } else {
            logger.error("Error checking DynamoDB Table status", { error });
        }
    }
};