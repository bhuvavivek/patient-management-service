# Serverless Patient Management API

Welcome to the backend API for Patient Management! This project is a fully serverless, NodeJS/TypeScript REST API that handles patient records, structured specifically for AWS deployment.

## What's under the hood?
- **Framework**: Express.js mapped natively into AWS Lambda.
- **Auth**: AWS Cognito (JWT Bearer tokens) to safely guard mutation endpoints.
- **Database**: AWS DynamoDB for primary CRUD persistence because of its speed.
- **Search**: AWS OpenSearch for indexing medical conditions. DynamoDB isn't great at full-text array searches, so we offload condition queries directly to OpenSearch.
- **Code Quality**: Strict TypeScript configurations, Zod for request body validation, and Winston for production logging.

## Infrastructure as Code (`serverless.yml`)
You might notice the `serverless.yml` config in the root folder. **This is our entire deployment blueprint.**
Instead of manually clicking through the AWS Console to provision databases or setup Lambda routes, this file tells the [Serverless Framework](https://www.serverless.com/) exactly how to build our architecture. One command (`npx serverless deploy`) completely builds out the API Gateway, connects the Lambdas, spins up the Dynamo tables (`PatientsTable`), limits IAM roles, and injects our `.env` variables securely into the cloud infrastructure.

---

## Local Development Setup

### 1. Installation
Install everything you need via npm:
```bash
npm install
```

### 2. Environment Configuration
Copy the sample env file to create your own configuration:
```bash
cp .env.example .env
```

Open up your `.env` and fill in your AWS details. If you've already run `aws configure` on your machine, you don't even need to provide the `AWS_ACCESS_KEY_ID`—the AWS SDK will figure it out!
```bash
# General Setup
PORT=3000
NODE_ENV=development

# Core AWS
AWS_REGION=us-east-1

# Important: Fill these in from your AWS Console!
COGNITO_USER_POOL_ID=us-east-1_abcdefghi
COGNITO_CLIENT_ID=your_client_id
OPENSEARCH_NODE=https://search-[your-domain].us-east-1.es.amazonaws.com
```

### 3. Firing it up
To start the local development server with hot-reloading:
```bash
npm run dev
```
*Note: Our database connector actually includes a neat little hook that automatically creates the `PatientsTable` in your AWS account the millisecond you boot the server if it doesn't already exist!*

### 4. Running the Test Suite
The codebase is fully equipped with Jest. We mock all the AWS SDK calls heavily so you can run the test suite locally without burning AWS credits:
```bash
npm test
```

## Deliverables For Reviewers
- Check out `deployment_plan.md` for a deeper dive into the architectural decisions, limits, and potential Redis caching strategies.
- A fully prepared Postman collection is included as `Patient_Management_API.postman_collection.json`. Feel free to import it directly into Postman to play with the endpoints!
