import express, { type Request, type Response, type NextFunction } from "express";
import { logger } from '#utils/logger';

const app = express();

app.use(express.json());

app.get('/health', (_req: Request, res: Response, _next: NextFunction) => {
    logger.info("Health check endpoint hit");
    res.status(200).json({
        status: 'UP',
        timestamp: new Date().toISOString()
    });
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    logger.error('Unhandled Exception', {
        message: err.message,
        stack: err.stack
    });

    res.status(err.status || 500).json({
        error: "InternalServerError",
        message: err.message || "An unexpected error occured."
    })
});

export default app;