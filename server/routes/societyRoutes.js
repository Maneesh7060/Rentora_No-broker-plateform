const express = require('express');
const router = express.Router();
const {
  getNearbySocieties,
  getSocietyDetails,
  getAllSocieties,
} = require('../controllers/societyController');

// Public endpoints
router.get('/nearby', getNearbySocieties);
router.get('/:id', getSocietyDetails);
router.get('/', getAllSocieties);

module.exports = router;
