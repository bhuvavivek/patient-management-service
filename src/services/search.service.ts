import { searchClient } from "#config/opensearch.config";
import { logger } from "#utils/logger";

const INDEX_NAME = "patients";

export class SearchService {
    async searchByCondition(condition: string) {
        try {
            const response = await searchClient.search({
                index: INDEX_NAME,
                body: {
                    query: {
                        match: {
                            conditions: {
                                query: condition,
                                fuzziness: "AUTO"
                            }
                        }
                    }
                }
            });

            return response.body.hits.hits.map((hit: any) => hit._source);
        } catch (error) {
            logger.error("OpenSearch query failed", { error, condition });
            return [];
        }
    }

    async indexPatient(patient: any) {
        try {
            await searchClient.index({
                index: INDEX_NAME,
                id: patient.patientId,
                body: patient
            });
            logger.info("Patient indexed in OpenSearch", { patientId: patient.patientId });
        } catch (error) {
            logger.error("Failed to index patient in OpenSearch", { error, patientId: patient.patientId });
        }
    }

    async updatePatient(id: string, updates: any) {
        try {
            await searchClient.update({
                index: INDEX_NAME,
                id: id,
                body: { doc: updates }
            });
            logger.info("Patient updated in OpenSearch", { patientId: id });
        } catch (error) {
            logger.error("Failed to update patient in OpenSearch", { error, patientId: id });
        }
    }

    async removePatient(id: string) {
        try {
            await searchClient.delete({
                index: INDEX_NAME,
                id: id
            });
            logger.info("Patient removed from OpenSearch", { patientId: id });
        } catch (error) {
            logger.error("Failed to remove patient from OpenSearch", { error, patientId: id });
        }
    }
}