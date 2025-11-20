/**
 * File: controllers/location.controller.js
 * Mô tả: Xử lý các chức năng liên quan đến địa điểm (locations)
 * Chức năng: Lấy danh sách, chi tiết, tạo, cập nhật và xóa địa điểm
 */

const Location = require('../models/location.model');
const Review = require('../models/review.model');
const Voucher = require('../models/voucher.model');
const {
  parseListInput,
  mergeFeatureList,
  inferMenuHighlightsFromText,
  normalizePriceRange,
  inferPriceLevelFromRange,
  inferPriceLevelFromText,
  buildKeywordSet,
  DESCRIPTION_MIN_LENGTH,
  FEATURE_MIN_COUNT
} = require('../utils/locationMetadata');

const normalizeDescription = (text = '') => text.replace(/\s+/g, ' ').trim();

const ensureDetailedDescription = (description) => {
  const normalized = normalizeDescription(description);
  if (!normalized || normalized.length < DESCRIPTION_MIN_LENGTH) {
    return null;
  }
  return normalized;
};

const ensureFeatureCoverage = (manualFeatures, description) => {
  const merged = mergeFeatureList(manualFeatures, description);
  return merged.slice(0, 10);
};

/**
 * Hàm: getAllLocations
 * Mô tả: Lấy danh sách tất cả địa điểm, có thể lọc theo loại
 */
const getAllLocations = async (req, res) => {
  try {
    const { type } = req.query;
    let query = {};
    if (type && type !== 'all') query.type = type;

    const locations = await Location.find(query)
      .populate('owner', 'username')
      .sort({ createdAt: -1 });

    res.render('pages/locations', {
      title: 'Danh sách địa điểm',
      locations,
      currentType: type || 'all'
    });
  } catch (error) {
    console.error('Get locations error:', error);
    req.flash('error', 'Có lỗi xảy ra khi tải danh sách địa điểm');
    res.redirect('/');
  }
};

/**
 * Hàm: getLocationById
 * Mô tả: Lấy chi tiết một địa điểm theo ID, kèm review và voucher
 */
const getLocationById = async (req, res) => {
  try {
    const { id } = req.params;

    const location = await Location.findById(id).populate('owner', 'username email phoneNumber');
    if (!location) {
      req.flash('error', 'Không tìm thấy địa điểm');
      return res.redirect('/locations');
    }

    const reviews = await Review.find({ location: id })
      .populate('user', 'username')
      .sort({ createdAt: -1 });

    const vouchers = await Voucher.find({
      location: id,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
      $expr: { $lt: ['$quantityClaimed', '$quantityTotal'] }
    }).sort({ createdAt: -1 });

    let averageRating = 0;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = (totalRating / reviews.length).toFixed(1);
    }

    res.render('pages/location_detail', {
      title: location.name,
      location,
      reviews,
      vouchers,
      averageRating,
      reviewCount: reviews.length
    });
  } catch (error) {
    console.error('Get location error:', error);
    req.flash('error', 'Có lỗi xảy ra khi tải thông tin địa điểm');
    res.redirect('/locations');
  }
};

/**
 * Hàm: createLocation
 * Mô tả: Tạo mới một địa điểm (dành cho chủ sở hữu)
 */
const createLocation = async (req, res) => {
  try {
    const {
      name,
      description,
      address,
      type,
      imageUrl,
      city,
      priceLevel,
      priceMin,
      priceMax,
      features,
      menuHighlights
    } = req.body;
    const ownerId = req.session.userId;

    const detailedDescription = ensureDetailedDescription(description);
    if (!detailedDescription) {
      req.flash('error', `Mô tả cần tối thiểu ${DESCRIPTION_MIN_LENGTH} ký tự với chi tiết về không gian, dịch vụ.`);
      return res.redirect('/owner/locations');
    }

    const cityName = (city || '').trim();
    if (!cityName) {
      req.flash('error', 'Vui lòng nhập thành phố/tỉnh để khách dễ tìm kiếm.');
      return res.redirect('/owner/locations');
    }

    const normalizedFeatures = ensureFeatureCoverage(features, detailedDescription);
    if (normalizedFeatures.length < FEATURE_MIN_COUNT) {
      req.flash('error', `Hãy chọn hoặc mô tả ít nhất ${FEATURE_MIN_COUNT} đặc điểm nổi bật để hỗ trợ tìm kiếm.`);
      return res.redirect('/owner/locations');
    }

    const manualMenus = parseListInput(menuHighlights);
    const inferredMenus = manualMenus.length ? manualMenus : inferMenuHighlightsFromText(detailedDescription);
    const priceRange = normalizePriceRange(priceMin, priceMax);
    const priceLevelFromRange = inferPriceLevelFromRange(priceRange);
    const resolvedPriceLevel = priceLevel || priceLevelFromRange || inferPriceLevelFromText(detailedDescription);

    const keywordSet = buildKeywordSet({
      name,
      city: cityName,
      address,
      type,
      description: detailedDescription,
      features: normalizedFeatures,
      menuHighlights: inferredMenus,
      priceLevel: resolvedPriceLevel
    });

    const location = new Location({
      name,
      description: detailedDescription,
      address,
      type,
      imageUrl: imageUrl || 'https://via.placeholder.com/400x300?text=No+Image',
      owner: ownerId,
      city: cityName,
      priceLevel: resolvedPriceLevel,
      priceRange,
      features: normalizedFeatures,
      menuHighlights: inferredMenus,
      keywords: keywordSet
    });

    await location.save();
    req.flash('success', 'Tạo địa điểm thành công!');
    res.redirect('/owner/locations');
  } catch (error) {
    console.error('Create location error:', error);
    req.flash('error', 'Có lỗi xảy ra khi tạo địa điểm');
    res.redirect('/owner/locations');
  }
};

/**
 * Hàm: updateLocation
 * Mô tả: Cập nhật thông tin địa điểm (chỉ chủ sở hữu)
 */
const updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      address,
      type,
      imageUrl,
      city,
      priceLevel,
      priceMin,
      priceMax,
      features,
      menuHighlights
    } = req.body;
    const ownerId = req.session.userId;

    const location = await Location.findOne({
      _id: id,
      owner: ownerId
    });

    if (!location) {
      req.flash('error', 'Không tìm thấy địa điểm hoặc bạn không có quyền chỉnh sửa');
      return res.redirect('/owner/locations');
    }

    const detailedDescription = ensureDetailedDescription(description);
    if (!detailedDescription) {
      req.flash('error', `Mô tả cần tối thiểu ${DESCRIPTION_MIN_LENGTH} ký tự với chi tiết về không gian, dịch vụ.`);
      return res.redirect('/owner/locations');
    }

    const cityName = (city || '').trim();
    if (!cityName) {
      req.flash('error', 'Vui lòng nhập thành phố/tỉnh để khách dễ tìm kiếm.');
      return res.redirect('/owner/locations');
    }

    const normalizedFeatures = ensureFeatureCoverage(features, detailedDescription);
    if (normalizedFeatures.length < FEATURE_MIN_COUNT) {
      req.flash('error', `Hãy chọn hoặc mô tả ít nhất ${FEATURE_MIN_COUNT} đặc điểm nổi bật để hỗ trợ tìm kiếm.`);
      return res.redirect('/owner/locations');
    }

    const manualMenus = parseListInput(menuHighlights);
    const inferredMenus = manualMenus.length ? manualMenus : inferMenuHighlightsFromText(detailedDescription);
    const priceRange = normalizePriceRange(priceMin, priceMax);
    const priceLevelFromRange = inferPriceLevelFromRange(priceRange);
    const resolvedPriceLevel = priceLevel || priceLevelFromRange || inferPriceLevelFromText(detailedDescription);
    const keywordSet = buildKeywordSet({
      name,
      city: cityName,
      address,
      type,
      description: detailedDescription,
      features: normalizedFeatures,
      menuHighlights: inferredMenus,
      priceLevel: resolvedPriceLevel
    });

    location.name = name;
    location.description = detailedDescription;
    location.address = address;
    location.type = type;
    location.city = cityName;
    location.priceLevel = resolvedPriceLevel;
    location.priceRange = priceRange;
    location.features = normalizedFeatures;
    location.menuHighlights = inferredMenus;
    location.keywords = keywordSet;
    if (imageUrl) location.imageUrl = imageUrl;

    await location.save();
    req.flash('success', 'Cập nhật địa điểm thành công!');
    res.redirect('/owner/locations');
  } catch (error) {
    console.error('Update location error:', error);
    req.flash('error', 'Có lỗi xảy ra khi cập nhật địa điểm');
    res.redirect('/owner/locations');
  }
};

/**
 * Hàm: deleteLocation
 * Mô tả: Xóa địa điểm và toàn bộ dữ liệu liên quan (voucher, review)
 */
const deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.session.userId;

    const location = await Location.findOne({ _id: id, owner: ownerId });
    if (!location) {
      req.flash('error', 'Không tìm thấy địa điểm hoặc bạn không có quyền xóa');
      return res.redirect('/owner/locations');
    }

    await Voucher.deleteMany({ location: id });
    await Review.deleteMany({ location: id });
    await Location.findByIdAndDelete(id);

    req.flash('success', 'Xóa địa điểm thành công!');
    res.redirect('/owner/locations');
  } catch (error) {
    console.error('Delete location error:', error);
    req.flash('error', 'Có lỗi xảy ra khi xóa địa điểm');
    res.redirect('/owner/locations');
  }
};

/**
 * Hàm: getLocationSummary
 * Mô tả: Lấy dữ liệu tóm tắt địa điểm (dùng cho popup nhanh)
 */
const getLocationSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const location = await Location.findById(id).lean();
    if (!location) {
      return res.status(404).json({ message: 'Không tìm thấy địa điểm' });
    }

    const vouchers = await Voucher.find({
      location: id,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
      $expr: { $lt: ["$quantityClaimed", "$quantityTotal"] }
    }).sort({ createdAt: -1 }).limit(3).lean();

    const reviews = await Review.find({ location: id })
      .populate('user', 'username')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    let averageRating = 0;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
      averageRating = Number((totalRating / reviews.length).toFixed(1));
    }

    return res.json({
      location: {
        _id: location._id,
        name: location.name,
        description: location.description,
        address: location.address,
        type: location.type,
        imageUrl: location.imageUrl,
        city: location.city,
        priceLevel: location.priceLevel,
        priceRange: location.priceRange,
        features: location.features,
        menuHighlights: location.menuHighlights
      },
      vouchers,
      reviews,
      averageRating,
      reviewCount: await Review.countDocuments({ location: id })
    });
  } catch (error) {
    console.error('Get location summary error:', error);
    return res.status(500).json({ message: 'Có lỗi xảy ra khi tải dữ liệu' });
  }
};

module.exports = {
  getAllLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
  getLocationSummary
};
