const Location = require('../models/location.model');
const Voucher = require('../models/voucher.model');
const Review = require('../models/review.model');

const renderDashboard = async (req, res) => {
  try {
    const ownerId = req.session.userId;
    const locations = await Location.find({ owner: ownerId });
    const locationIds = locations.map((loc) => loc._id);

    const vouchers = await Voucher.find({ location: { $in: locationIds } })
      .populate('location', 'name')
      .sort({ createdAt: -1 });

    const now = new Date();
    const stats = {
      totalLocations: locations.length,
      totalVouchers: vouchers.length,
      activeVouchers: vouchers.filter(
        (voucher) =>
          voucher.startDate <= now &&
          voucher.endDate >= now &&
          voucher.quantityClaimed < voucher.quantityTotal
      ).length,
      totalClaims: vouchers.reduce((sum, voucher) => sum + voucher.quantityClaimed, 0)
    };

    const recentReviews = locationIds.length
      ? await Review.find({ location: { $in: locationIds } })
          .populate('user', 'username')
          .populate('location', 'name')
          .sort({ createdAt: -1 })
          .limit(5)
      : [];

    res.render('owner/dashboard', {
      title: 'Owner Dashboard',
      stats,
      locations,
      vouchers: vouchers.slice(0, 5),
      recentReviews
    });
  } catch (error) {
    console.error('Owner dashboard error:', error);
    req.flash('error', 'Co loi xay ra khi tai dashboard');
    res.redirect('/');
  }
};

const listLocations = async (req, res) => {
  try {
    const ownerId = req.session.userId;
    const locations = await Location.find({ owner: ownerId }).sort({ createdAt: -1 });

    res.render('owner/manage_location', {
      title: 'Quan ly dia diem',
      locations
    });
  } catch (error) {
    console.error('Owner locations error:', error);
    req.flash('error', 'Co loi xay ra khi tai danh sach dia diem');
    res.redirect('/owner/dashboard');
  }
};

module.exports = {
  renderDashboard,
  listLocations
};
