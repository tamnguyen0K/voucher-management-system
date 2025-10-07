const express = require('express');
const router = express.Router();
const locationController = require('../controllers/location.controller');
const reviewController = require('../controllers/review.controller');
const { requireAuth, requireOwner } = require('../middleware/auth');

// Public routes
router.get('/locations', locationController.getAllLocations);
router.get('/locations/:id', locationController.getLocationById);

// Review routes
router.post('/locations/:locationId/reviews', requireAuth, reviewController.createReview);

// Owner routes
router.post('/owner/locations', requireAuth, requireOwner, locationController.createLocation);
router.put('/owner/locations/:id', requireAuth, requireOwner, locationController.updateLocation);
router.delete('/owner/locations/:id', requireAuth, requireOwner, locationController.deleteLocation);

module.exports = router;
