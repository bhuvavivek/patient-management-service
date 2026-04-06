import express, { type Request, type Response, type NextFunction } from "express";
import { logger } from '#utils/logger';
import { authenticate } from '#middleware/auth.middleware';
import { PatientController } from '#controllers/patient.controller';
import { ensureTableExists } from '#config/dynamo.config';

const app = express();

// Ensures Evaluators immediately build the required Dynamo Environment
ensureTableExists(process.env.PATIENTS_TABLE || "PatientsTable");

app.use(express.json());

app.get('/health', (_req: Request, res: Response, _next: NextFunction) => {
    logger.info("Health check endpoint hit");
    res.status(200).json({
        status: 'UP',
        timestamp: new Date().toISOString()
    });
});

app.get('/patients/search/address', PatientController.getByAddress);
app.get('/patients/:id', PatientController.get);

app.post('/patients', authenticate, PatientController.create);
app.put('/patients/:id', authenticate, PatientController.update);
app.delete('/patients/:id', authenticate, PatientController.remove);
app.get('/patients/search/condition', PatientController.searchByCondition);

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