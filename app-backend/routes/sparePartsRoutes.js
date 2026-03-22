import { Router } from 'express';
import {
    getAllParts,
    getPartById,
    createPart,
    updatePart,
    deletePart,
    getCompatibilityOptions,
    getPartActivity,
} from '../controllers/sparePartsController.js';
import verifyToken from '../middleware/verifyToken.js';
import authorize from '../middleware/authorize.js';
import { uploadImage } from '../middleware/upload.js';

const sparePartsRouter = Router();

const canManage = authorize(['admin', 'manager']);

// Must be declared before /:id so static paths aren't matched as mongo ids
sparePartsRouter.route('/compatibility-options')
    .get(verifyToken, getCompatibilityOptions);

sparePartsRouter.route('/activity')
    .get(verifyToken, canManage, getPartActivity);

sparePartsRouter.route('/')
    .get(verifyToken, getAllParts)
    // uploadImage handles multipart — JSON requests (no file) pass through untouched
    .post(verifyToken, canManage, uploadImage, createPart);

sparePartsRouter.route('/:id')
    .get(verifyToken, getPartById)
    .put(verifyToken, canManage, uploadImage, updatePart)
    .delete(verifyToken, canManage, deletePart);

export default sparePartsRouter;