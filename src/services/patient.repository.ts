import { PutCommand, GetCommand, DeleteCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "#config/dynamo.config";
import { type Patient, type PatientInput, type PatientUpdateInput } from '#models/patient.model';
import { logger } from "#utils/logger";

const TABLE_NAME = process.env.PATIENTS_TABLE || "PatientsTable";

export class PatientRepository {
    async create(patient: Patient): Promise<void> {
        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: patient,
        }));
        logger.info("Patient record saved to DynamoDB", { patientId: patient.patientId });
    }

    async getById(id: string): Promise<Patient | null> {
        const { Item } = await docClient.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { patientId: id },
        }));
        return (Item as Patient) || null;
    }

    async getByAddress(address: string): Promise<Patient[]> {
        const { Items } = await docClient.send(new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "AddressIndex",
            KeyConditionExpression: "address = :addr",
            ExpressionAttributeValues: { ":addr": address },
        }));
        return (Items as Patient[]) || [];
    }

    async delete(id: string): Promise<void> {
        await docClient.send(new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { patientId: id },
        }));
        logger.info("Patient record deleted", { patientId: id });
    }

    async update(id: string, updates: PatientUpdateInput): Promise<void> {
        const timestamp = new Date().toISOString();

        const updateExpressions: string[] = ["#updatedAt = :updatedAt"];
        const expressionAttributeNames: Record<string, string> = {
            "#updatedAt": "updatedAt"
        };
        const expressionAttributeValues: Record<string, any> = {
            ":updatedAt": timestamp
        };

        for (const [key, value] of Object.entries(updates)) {
            if (value !== undefined) {
                updateExpressions.push(`#${key} = :${key}`);
                expressionAttributeNames[`#${key}`] = key;
                expressionAttributeValues[`:${key}`] = value;
            }
        }

        await docClient.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { patientId: id },
            UpdateExpression: "set " + updateExpressions.join(", "),
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
        }));
    }
}