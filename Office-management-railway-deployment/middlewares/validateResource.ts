import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

const validateResource = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (e: any) {
        if (e instanceof ZodError) {
            return res.status(400).json({
                message: "Validation Error",
                errors: (e as any).errors
            });
        }
        return res.status(400).send(e.errors);
    }
};

export default validateResource;
