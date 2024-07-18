import express from 'express';
import { createClass, updateClass, deleteClass, getClass, getAllClasses, countByCity, searchByCity, searchByType } from '../controls/classcontro.js';
import { verifyAdmin } from '../utils/verifytoken.js';

const router = express.Router();

// Route to count classes by city
router.get('/countByCity', countByCity);

// Route to search classes by city
router.get('/searchByCity', searchByCity);

// Route to search classes by type
router.get('/searchByType', searchByType);

// Route to get all classes
router.get('/all', getAllClasses);

// Route to create a new class
router.post('/', verifyAdmin, createClass);

// Route to update an existing class by ID
router.put('/:id', verifyAdmin, updateClass);

// Route to delete an existing class by ID
router.delete('/:id', verifyAdmin, deleteClass);

// Route to get an existing class by ID
router.get('/:id', getClass);

export default router;