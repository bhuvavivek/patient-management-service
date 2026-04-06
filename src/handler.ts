import serverless from 'serverless-http';
import app from '#app';
import { logger } from '#utils/logger';

// Wrap the Express app for AWS Lambda
const serverlessHandler = serverless(app);

export const handler = async (event: any, context: any) => {
    logger.info("Lambda event received", { path: event.rawPath });
    return await serverlessHandler(event, context);
};