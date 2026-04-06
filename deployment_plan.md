# Deployment & Architecture Strategy

Hey! Thanks for taking a look at the deployment strategy for the Patient Management API. Rather than just relying on manual configurations, the entire backend is architected to run seamlessly on AWS Serverless infrastructure. 

Here is a breakdown of how the pieces fit together when we launch this into production.

## 1. The Core Architecture

- **AWS API Gateway**: This is our front door. It handles all the incoming REST HTTP requests, manages throttling, and acts as the trigger.
- **AWS Lambda**: The actual brains of the operation. I used `serverless-http` to wrap our Express app so it runs frictionlessly inside a Lambda container event sequence.
- **AWS DynamoDB**: Our primary NoSQL database for keeping patient records. 
- **AWS OpenSearch**: We use OpenSearch exclusively to handle complex queries (specifically array items like medical conditions), since it handles fuzzy-text lookups infinitely better than DynamoDB.
- **AWS Cognito**: All our mutation endpoints (`POST`, `PUT`, `DELETE`) are guarded via JWTs provided by Cognito.

## 2. Dealing with Data: Schema & Indexing

When dealing with NoSQL, we have to know exactly how we plan to query things before we even build the table. 

**Our Primary Schema (`PatientsTable`)**:
- `patientId`: (String) **Partition Key**. A rigid, unique UUID.
- `name`: (String)
- `address`: (String)
- `conditions`: (String Array)
- `allergies`: (String Array)

**The Indexing Strategy**:
1. **Searching by Address**: Querying our primary table by address would force a full table scan, which is a massive performance bottleneck. To solve this, our deployment provisions a **Global Secondary Index (GSI)** called `AddressIndex`. The API directly queries this index when looking up an address, ensuring rapid speeds even at scale.
2. **Searching by Conditions**: DynamoDB is historically terrible at array queries and fuzzy matching. Creating a GSI for arrays is an anti-pattern. Instead, we use a dedicated Search Service that dynamically mirrors patient records straight into an AWS OpenSearch domain. Complex condition queries hit OpenSearch natively.

## 3. Provisioning the Cloud (Serverless Framework) 

Instead of configuring these resources manually, the entire CI/CD pipeline triggers off **Serverless Framework** (`serverless.yml`). 
Whenever we push to the `main` branch, our GitHub Action fires off `npx serverless deploy`.

When it deploys, Serverless builds a CloudFormation stack that automatically provisions the API Gateway, compiles and uploads the TS Lambda code, maps out the Dynamo tables (along with the `AddressIndex`), and strictly enforces IAM Roles.

### Security (IAM Roles)
By default, Lambdas should never have `AmazonDynamoDBFullAccess`. Inside the `serverless.yml`, the IAM role is restricted so the Lambda can *only* perform `PutItem`, `GetItem`, `UpdateItem`, `DeleteItem` and `Query` actions directly on our specific Table ARN.

## 4. Addressing Weaknesses: Timeouts & Cold Starts
- **Timeouts**: API Gateway natively hard-caps request timeouts at 29 seconds. If OpenSearch hangs, the client just gets a generic 504. To fail gracefully, we configure our Lambda execution timeout slightly lower (e.g., 25 seconds) so we can catch the crash and return a proper JSON error code.
- **Cold Starts**: Because this is a Node.js API, Lambdas that haven't been invoked recently might take 1-3 seconds to boot up a fresh container. If this latency becomes unacceptable in a production setting, we can flip on **Provisioned Concurrency** in AWS to keep the functions artificially "warm".

## 5. Bonus Idea: Redis Caching Layer

If we wanted to push this architecture a step further for high traffic, introducing an AWS ElastiCache (Redis) node would be the simplest optimization for the `GET` endpoints.

**The Workflow**:
1. Whenever a user searches by Address or ID, the system intercepts the database call and checks the Redis cache first.
2. If it's a "Cache Miss" (no data exists), we query DynamoDB normally, but then instantly inject that response back into Redis with a Time-To-Live (TTL) of around 5 minutes.
3. If it's a "Cache Hit", we completely bypass DynamoDB and return the memory, saving heavy read-capacity unit (RCU) billing costs.
4. When a patient is updated or deleted on our `PUT` / `DELETE` edges, we simultaneously fire a delete command into Redis to "invalidate" that cache key immediately, preventing stale data.
