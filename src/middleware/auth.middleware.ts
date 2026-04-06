import { type Request, type Response, type NextFunction } from 'express';
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { logger } from "#utils/logger";

const verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.COGNITO_USER_POOL_ID || "us-east-1_example",
    tokenUse: "access",
    clientId: process.env.COGNITO_CLIENT_ID || "example_client_id",
});


export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Unauthorized", message: "Missing or malformed token" });
        }

        const token = authHeader.split(" ")[1]!;

        const payload = await verifier.verify(token);

        (req as any).user = payload;

        next();
    } catch (err) {
        logger.warn("Authentication failed", { error: (err as Error).message });
        res.status(401).json({ error: "Unauthorized", message: "Invalid or expired token" });
    }
};