import {Router} from 'express';
import { 
    getAllParts,
    getPartById,
    createPart,
    updatePart,
    deletePart
} from '../controllers/sparePartsController.js';

const sparePartsRouter = Router();

sparePartsRouter.route('/')
    .get(getAllParts)
    .post(createPart);

sparePartsRouter.route('/:id')
    .get(getPartById)
    .put(updatePart)
    .delete(deletePart);

export default sparePartsRouter; 