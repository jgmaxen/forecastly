import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Router, type Request, type Response } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = Router();

// Serve index.html for all unmatched routes (*)
router.get('*', (__req: Request, res: Response) => {
    // Serve the index.html file from the 'public' folder
    res.sendFile(path.resolve(__dirname, '../public/index.html'));
});

export default router;
