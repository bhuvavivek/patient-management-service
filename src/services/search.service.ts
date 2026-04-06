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
}