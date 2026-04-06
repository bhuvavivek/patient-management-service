import { jest } from '@jest/globals';
import request from 'supertest';

// Mock upstream AWS SDKs instead of internal modules to avoid ESM read-only issues
jest.unstable_mockModule('aws-jwt-verify', () => ({
    CognitoJwtVerifier: {
        create: jest.fn().mockReturnValue({
            verify: jest.fn<any>().mockResolvedValue({ sub: 'test-user' })
        })
    }
}));

const { PatientRepository } = await import('../src/services/patient.repository');
const { SearchService } = await import('../src/services/search.service');

// Mock classes Right on the prototypes
jest.spyOn(PatientRepository.prototype, 'create').mockResolvedValue(undefined);
jest.spyOn(PatientRepository.prototype, 'getById').mockImplementation(async (id: string) => {
    if (id === '123') return { patientId: '123', name: 'John Doe', address: '123 Main', conditions: [], allergies: [], createdAt: '', updatedAt: '' };
    return null;
});
jest.spyOn(PatientRepository.prototype, 'delete').mockResolvedValue(undefined);
jest.spyOn(PatientRepository.prototype, 'update').mockResolvedValue(undefined);
jest.spyOn(PatientRepository.prototype, 'getByAddress').mockResolvedValue([]);

jest.spyOn(SearchService.prototype, 'searchByCondition').mockResolvedValue([]);
jest.spyOn(SearchService.prototype, 'indexPatient').mockResolvedValue(undefined);
jest.spyOn(SearchService.prototype, 'updatePatient').mockResolvedValue(undefined);
jest.spyOn(SearchService.prototype, 'removePatient').mockResolvedValue(undefined);

const { default: app } = await import('../src/app');
const mockedApp = app;

describe('Patient API Endpoints', () => {
    describe('POST /patients', () => {
        it('should return 400 for invalid data', async () => {
            const res = await request(mockedApp)
                .post('/patients')
                .set('Authorization', 'Bearer fake_token')
                .send({ name: 'J' }); // name too short
            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toBe('Validation Failed');
        });

        it('should successfully create a new patient', async () => {
            const res = await request(mockedApp)
                .post('/patients')
                .set('Authorization', 'Bearer fake_token')
                .send({
                    name: 'Jane Doe',
                    address: '456 Side Street',
                    conditions: ['Asthma'],
                    allergies: ['Peanuts']
                });
            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('patientId');
            expect(res.body.name).toBe('Jane Doe');
        });
    });

    describe('GET /patients/:id', () => {
        it('should return 404 for unknown ID', async () => {
            const res = await request(mockedApp).get('/patients/999');
            expect(res.statusCode).toEqual(404);
        });

        it('should return 200 and patient for valid ID', async () => {
            const res = await request(mockedApp).get('/patients/123');
            expect(res.statusCode).toEqual(200);
            expect(res.body.name).toBe('John Doe');
        });
    });

    describe('PUT /patients/:id', () => {
        it('should update and return 200', async () => {
            const res = await request(mockedApp)
                .put('/patients/123')
                .set('Authorization', 'Bearer fake_token')
                .send({
                    address: 'New Address'
                });
            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toBe('Patient updated successfully');
        });
    });

    describe('DELETE /patients/:id', () => {
        it('should successfully delete a patient', async () => {
            const res = await request(mockedApp)
                .delete('/patients/123')
                .set('Authorization', 'Bearer fake_token');
            expect(res.statusCode).toEqual(204);
        });
    });
});
