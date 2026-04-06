import { Client } from "@opensearch-project/opensearch";

// Senior Note: In production, use AWS Signature V4 for security
export const searchClient = new Client({
    node: process.env.OPENSEARCH_NODE || "https://localhost:9200",
    /* auth: {
      username: process.env.OS_USERNAME || "admin",
      password: process.env.OS_PASSWORD || "admin"
    }, */
});