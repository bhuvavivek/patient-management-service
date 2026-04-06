import { type Request, type Response } from 'express';
import { ZodError } from 'zod';
import { PatientRepository } from '#services/patient.repository';
import { PatientSchema, createPatientRecord, type PatientInput, type PatientUpdateInput } from '#models/patient.model';
import { SearchService } from '#services/search.service';

const repo = new PatientRepository();
const searchService = new SearchService();

export const PatientController = {
    create: async (req: Request, res: Response) => {
        try {
            const validatedData = PatientSchema.parse(req.body);
            const patient = createPatientRecord(validatedData);
            await repo.create(patient);
            await searchService.indexPatient(patient);
            res.status(201).json(patient);
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({ error: 'Validation Failed', details: error.issues });
            }
            throw error;
        }
    },

    get: async (req: Request, res: Response) => {
        const { id } = req.params;
        if (!id) return res.status(400).json({ error: 'Patient ID is required' });

        if (typeof id !== 'string') {
            return res.status(400).json({
                error: 'Invalid Request',
                message: 'ID must be a single string'
            });
        }
        const patient = await repo.getById(id);
        if (!patient) return res.status(404).json({ error: 'Patient not found' });

        res.json(patient);
    },

    getByAddress: async (req: Request, res: Response) => {
        const address = req.query.address as string;
        if (!address) return res.status(400).json({ error: 'Address query parameter is required' });

        const patients = await repo.getByAddress(address);
        res.json(patients);
    },


    remove: async (req: Request, res: Response) => {
        const { id } = req.params;

        if (!id) return res.status(400).json({ error: 'Patient ID is required' });

        if (typeof id !== 'string') {
            return res.status(400).json({
                error: 'Invalid Request',
                message: 'ID must be a single string'
            });
        }

        await repo.delete(id);
        await searchService.removePatient(id);
        res.status(204).send();
    },

    searchByCondition: async (req: Request, res: Response) => {
        const { q } = req.query;

        if (typeof q != 'string') {
            return res.status(400).json({
                error: "Query parameter 'q' is required"
            })
        }

        const patients = await searchService.searchByCondition(q);
        res.json(patients);
    },

    update: async (req: Request, res: Response) => {
        const { id } = req.params;
        if (typeof id !== 'string') return res.status(400).json({ error: "Invalid ID" });

        const validatedData: PatientUpdateInput = PatientSchema.partial().parse(req.body);

        await repo.update(id, validatedData);
        await searchService.updatePatient(id, validatedData);

        res.status(200).json({ message: "Patient updated successfully" });
    }
};