const express = require('express');
const {
  uploadDoc,
  getMyDocuments,
  getDocument,
  deleteDoc,
} = require('../controllers/documentController');
const { protectRoute } = require('../middlewares/authMiddleware');
const { uploadDocument } = require('../middlewares/uploadMiddleware');

const router = express.Router();

// All document routes require authentication
router.use(protectRoute);

router.post('/upload', uploadDocument.single('document'), uploadDoc);
router.get('/my-documents', getMyDocuments);
router.get('/:id', getDocument);
router.delete('/:id', deleteDoc);

module.exports = router;
