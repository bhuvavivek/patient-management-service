import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid'

export const PatientSchema = z.object({
    name: z.string().min(2, "Name is too short"),
    address: z.string().min(5, "Address must be descriptive"),
    conditions: z.array(z.string()).min(1, "At least one condition is required"),
    allergies: z.array(z.string()).default([]),
})

// Typescript type from zod schema
export type PatientInput = z.infer<typeof PatientSchema>;

//  Interface Record for dynamodb
export interface Patient extends PatientInput {
    patientId: string;
    createdAt: string;
    updatedAt: string;
}

// factory function to create a validated patient record
export const createPatientRecord = (data: PatientInput): Patient => {
    const now = new Date().toISOString();
    return {
        ...data,
        patientId: uuidv4(),
        createdAt: now,
        updatedAt: now,
    };
}