/**
 * File: controllers/location.controller.js
 * 
 * Mô tả: Controller xử lý các thao tác liên quan đến địa điểm (Location)
 * - Lấy danh sách địa điểm (có thể lọc theo loại)
 * - Lấy chi tiết địa điểm kèm reviews và vouchers
 * - Tạo, cập nhật, xóa địa điểm (chỉ owner)
 * 
 * Công nghệ sử dụng:
 * - Express.js: Framework web server
 * - Mongoose: ODM cho MongoDB
 * - EJS: Template engine để render views
 * - Location Metadata Utils: Xử lý metadata (features, keywords, price level)
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

const validateAndProcessLocationData = (name, description, address, type, city, features, menuHighlights, priceLevel, priceMin, priceMax) => {
  const normalizedDesc = normalizeDescription(description);
  if (!normalizedDesc || normalizedDesc.length < DESCRIPTION_MIN_LENGTH) {
    return { error: `Mô tả cần tối thiểu ${DESCRIPTION_MIN_LENGTH} ký tự với chi tiết về không gian, dịch vụ.` };
  }

  const cityName = (city || '').trim();
  if (!cityName) {
    return { error: 'Vui lòng nhập thành phố/tỉnh để khách dễ tìm kiếm.' };
  }

  const normalizedFeatures = mergeFeatureList(features, normalizedDesc).slice(0, 10);
  if (normalizedFeatures.length < FEATURE_MIN_COUNT) {
    return { error: `Hãy chọn hoặc mô tả ít nhất ${FEATURE_MIN_COUNT} đặc điểm nổi bật để hỗ trợ tìm kiếm.` };
  }

  const manualMenus = parseListInput(menuHighlights);
  const inferredMenus = manualMenus.length ? manualMenus : inferMenuHighlightsFromText(normalizedDesc);
  const priceRange = normalizePriceRange(priceMin, priceMax);
  const priceLevelFromRange = inferPriceLevelFromRange(priceRange);
  const resolvedPriceLevel = priceLevel || priceLevelFromRange || inferPriceLevelFromText(normalizedDesc);

  const keywordSet = buildKeywordSet({
    name,
    city: cityName,
    address,
    type,
    description: normalizedDesc,
    features: normalizedFeatures,
    menuHighlights: inferredMenus,
    priceLevel: resolvedPriceLevel
  });

  return {
    description: normalizedDesc,
    city: cityName,
    features: normalizedFeatures,
    menuHighlights: inferredMenus,
    priceRange,
    priceLevel: resolvedPriceLevel,
    keywords: keywordSet
  };
};

const getAllLocations = async (req, res) => {
  try {
    const { type } = req.query;
    const query = type && type !== 'all' ? { type } : {};
    const locations = await Location.find(query).populate('owner', 'username').sort({ createdAt: -1 });

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

const getLocationById = async (req, res) => {
  try {
    const { id } = req.params;
    const location = await Location.findById(id).populate('owner', 'username email phoneNumber');
    
    if (!location) {
      req.flash('error', 'Không tìm thấy địa điểm');
      return res.redirect('/locations');
    }

    const [reviews, vouchers] = await Promise.all([
      Review.find({ location: id }).populate('user', 'username').sort({ createdAt: -1 }),
      Voucher.find({
        location: id,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
        $expr: { $lt: ['$quantityClaimed', '$quantityTotal'] }
      }).sort({ createdAt: -1 })
    ]);

    res.render('pages/location_detail', {
      title: location.name,
      location,
      reviews,
      vouchers,
      averageRating: (location.rating || 0).toFixed(1),
      reviewCount: reviews.length
    });
  } catch (error) {
    console.error('Get location error:', error);
    req.flash('error', 'Có lỗi xảy ra khi tải thông tin địa điểm');
    res.redirect('/locations');
  }
};

const createLocation = async (req, res) => {
  try {
    const { name, description, address, type, imageUrl, city, priceLevel, priceMin, priceMax, features, menuHighlights } = req.body;
    const ownerId = req.session.userId;

    const processed = validateAndProcessLocationData(name, description, address, type, city, features, menuHighlights, priceLevel, priceMin, priceMax);
    if (processed.error) {
      req.flash('error', processed.error);
      return res.redirect('/owner/locations');
    }

    const location = new Location({
      name,
      description: processed.description,
      address,
      type,
      imageUrl: imageUrl || 'https://via.placeholder.com/400x300?text=No+Image',
      owner: ownerId,
      city: processed.city,
      priceLevel: processed.priceLevel,
      priceRange: processed.priceRange,
      features: processed.features,
      menuHighlights: processed.menuHighlights,
      keywords: processed.keywords
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

const updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, address, type, imageUrl, city, priceLevel, priceMin, priceMax, features, menuHighlights } = req.body;
    const ownerId = req.session.userId;

    const location = await Location.findOne({ _id: id, owner: ownerId });
    if (!location) {
      req.flash('error', 'Không tìm thấy địa điểm hoặc bạn không có quyền chỉnh sửa');
      return res.redirect('/owner/locations');
    }

    const processed = validateAndProcessLocationData(name, description, address, type, city, features, menuHighlights, priceLevel, priceMin, priceMax);
    if (processed.error) {
      req.flash('error', processed.error);
      return res.redirect('/owner/locations');
    }

    Object.assign(location, {
      name,
      description: processed.description,
      address,
      type,
      city: processed.city,
      priceLevel: processed.priceLevel,
      priceRange: processed.priceRange,
      features: processed.features,
      menuHighlights: processed.menuHighlights,
      keywords: processed.keywords,
      ...(imageUrl && { imageUrl })
    });

    await location.save();
    req.flash('success', 'Cập nhật địa điểm thành công!');
    res.redirect('/owner/locations');
  } catch (error) {
    console.error('Update location error:', error);
    req.flash('error', 'Có lỗi xảy ra khi cập nhật địa điểm');
    res.redirect('/owner/locations');
  }
};

const deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.session.userId;

    const location = await Location.findOne({ _id: id, owner: ownerId });
    if (!location) {
      req.flash('error', 'Không tìm thấy địa điểm hoặc bạn không có quyền xóa');
      return res.redirect('/owner/locations');
    }

    await Promise.all([
      Voucher.deleteMany({ location: id }),
      Review.deleteMany({ location: id }),
      Location.findByIdAndDelete(id)
    ]);

    req.flash('success', 'Xóa địa điểm thành công!');
    res.redirect('/owner/locations');
  } catch (error) {
    console.error('Delete location error:', error);
    req.flash('error', 'Có lỗi xảy ra khi xóa địa điểm');
    res.redirect('/owner/locations');
  }
};

module.exports = {
  getAllLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation
};