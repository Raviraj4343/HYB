import { Router } from 'express';
import { submitContact } from '../controllers/contact.controller.js';

const router = Router();

// POST /api/v1/contact
router.post('/', submitContact);

export default router;
