const express = require('express');

const ownerController = require('../controllers/owner.controller');
const userController = require('../controllers/user.controller');
const reviewController = require('../controllers/review.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const requireOwnerOnly = requireRole('owner');

router.use(requireAuth, requireOwnerOnly);

router.get('/dashboard', ownerController.renderDashboard);
router.get('/locations', ownerController.listLocations);
router.get('/profile', userController.getOwnerProfile);
router.get('/reviews', reviewController.getOwnerReviews);
router.get('/reviews/:reviewId', reviewController.ownerGetReviewDetail);

module.exports = router;
