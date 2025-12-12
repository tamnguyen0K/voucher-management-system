/**
 * File: utils/locationMetadata.js
 * Purpose: Shared helpers + metadata catalogs for richer location descriptions/search
 */

const FEATURE_LIBRARY = [
  {
    value: 'View đẹp',
    hint: 'Toàn cảnh thành phố, sông hoặc biển',
    keywords: ['view', 'song', 'bien', 'cau', 'rooftop', 'toan canh', 'sky', 'panorama', 'dep']
  },
  {
    value: 'Không gian yên tĩnh',
    hint: 'Phù hợp đọc sách, trò chuyện nhỏ',
    keywords: ['yen tinh', 'doc sach', 'thu gian', 'nhe nhang', 'quiet', 'library']
  },
  {
    value: 'Phù hợp làm việc',
    hint: 'Có ổ điện, wifi mạnh, bàn rộng',
    keywords: ['lam viec', 'work', 'remote', 'co working', 'coworking', 'o dien', 'wifi', 'laptop']
  },
  {
    value: 'Không gian ngoài trời',
    hint: 'Sân thượng, ban công, vườn',
    keywords: ['ngoai troi', 'san vuon', 'vuon', 'ban cong', 'terrace', 'san thuong', 'garden']
  },
  {
    value: 'Phục vụ bánh ngọt / pastry',
    hint: 'Croissant, bánh ngọt kiểu Âu',
    keywords: ['croissant', 'pastry', 'banh', 'dessert', 'patisserie', 'banh ngot']
  },
  {
    value: 'Đồ uống signature',
    hint: 'Cold brew, signature drink',
    keywords: ['signature', 'cold brew', 'specialty', 'cocktail', 'mocktail', 'sang tao']
  },
  {
    value: 'Phù hợp gia đình / nhóm',
    hint: 'Không gian rộng, thân thiện trẻ em',
    keywords: ['gia dinh', 'tre em', 'nhom', 'team', 'kid', 'family']
  },
  {
    value: 'Sống ảo / check-in',
    hint: 'Decor đẹp, nhiều góc chụp',
    keywords: ['song ao', 'check in', 'decor', 'instagram', 'goc chup', 'concept']
  }
];

const MENU_LIBRARY = [
  { label: 'Croissant bơ', keywords: ['croissant', 'butter croissant'] },
  { label: 'Cold Brew', keywords: ['cold brew', 'coldbrew'] },
  { label: 'Bánh ngọt kiểu Pháp', keywords: ['pastry', 'patisserie', 'banh phap'] },
  { label: 'Trà trái cây', keywords: ['tra trai cay', 'fruit tea', 'tra hoa qua'] },
  { label: 'Cà phê rang xay', keywords: ['specialty', 'rang xay', 'arabica', 'robusta'] }
];

const PRICE_LEVELS = [
  { value: 'budget', label: 'Tiết kiệm (< 80k/người)' },
  { value: 'standard', label: 'Phổ biến (80k - 150k/người)' },
  { value: 'premium', label: 'Cao cấp (> 150k/người)' }
];

const DESCRIPTION_MIN_LENGTH = 80;
const FEATURE_MIN_COUNT = 2;

const TYPE_LABELS = {
  restaurant: 'Nhà hàng',
  cafe: 'Cà phê',
  tourist_spot: 'Địa điểm du lịch'
};

const CITY_LIBRARY = [
  { name: 'Hà Nội', aliases: ['ha noi', 'hn'] },
  { name: 'Đà Nẵng', aliases: ['da nang', 'danang'] },
  { name: 'Hồ Chí Minh', aliases: ['ho chi minh', 'sai gon', 'tphcm', 'tp hcm'] },
  { name: 'Hải Phòng', aliases: ['hai phong'] },
  { name: 'Huế', aliases: ['hue'] },
  { name: 'Nha Trang', aliases: ['nha trang'] },
  { name: 'Đà Lạt', aliases: ['da lat', 'dalat'] },
  { name: 'Cần Thơ', aliases: ['can tho'] },
  { name: 'Quy Nhơn', aliases: ['quy nhon'] },
  { name: 'Phú Quốc', aliases: ['phu quoc'] }
];

const uniq = (items = []) => Array.from(new Set(items.filter(Boolean)));

const removeVietnameseTone = (text = '') => text
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .toLowerCase();

const escapeRegex = (text = '') => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseListInput = (input) => {
  if (!input && input !== 0) return [];
  if (Array.isArray(input)) {
    return uniq(input.flatMap(item => parseListInput(item)));
  }
  return uniq(
    input
      .toString()
      .split(/[,;\n]/)
      .map(item => item && item.trim())
      .filter(Boolean)
  );
};

const mergeFeatureList = (manualList, description = '') => {
  const baseFeatures = parseListInput(manualList);
  const inferred = inferFeaturesFromText(description);
  return uniq([...baseFeatures, ...inferred]);
};

const inferFeaturesFromText = (text = '') => {
  const normalized = removeVietnameseTone(text);
  const results = new Set();
  FEATURE_LIBRARY.forEach(feature => {
    if (feature.keywords.some(keyword => normalized.includes(keyword))) {
      results.add(feature.value);
    }
  });
  return Array.from(results);
};

const inferMenuHighlightsFromText = (text = '') => {
  const normalized = removeVietnameseTone(text);
  const hits = new Set();
  MENU_LIBRARY.forEach(item => {
    if (item.keywords.some(keyword => normalized.includes(keyword))) {
      hits.add(item.label);
    }
  });
  return Array.from(hits);
};

const parseCurrencyValue = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (!value) return null;
  const str = value.toString().trim().toLowerCase();
  let multiplier = 1;
  if (/[kK]/.test(str)) multiplier = 1000;
  if (/tr/.test(str) || /triệu/.test(str)) multiplier = 1000000;
  const numeric = parseFloat(str.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(numeric)) return null;
  return Math.round(numeric * multiplier);
};

const normalizePriceRange = (minInput, maxInput) => {
  let min = parseCurrencyValue(minInput);
  let max = parseCurrencyValue(maxInput);
  if (min && max && min > max) {
    const temp = min;
    min = max;
    max = temp;
  }
  return {
    min: min || 0,
    max: max || min || 0
  };
};

const inferPriceLevelFromRange = (range = {}) => {
  const pivot = range.max || range.min;
  if (!pivot) return null;
  if (pivot <= 80000) return 'budget';
  if (pivot >= 150000) return 'premium';
  return 'standard';
};

const inferPriceLevelFromText = (text = '', fallback = 'standard') => {
  const normalized = removeVietnameseTone(text);
  if (/(gia re|binh dan|tiet kiem|sinh vien)/.test(normalized)) return 'budget';
  if (/(cao cap|luxury|fine dining|thuong luu|sang chanh)/.test(normalized)) return 'premium';
  return fallback;
};

const buildKeywordSet = (payload = {}) => {
  const bag = [
    payload.name,
    payload.city,
    TYPE_LABELS[payload.type] || payload.type,
    payload.address,
    payload.description,
    ...(payload.features || []),
    ...(payload.menuHighlights || []),
    payload.priceLevel
  ];
  return uniq(
    bag
      .map(item => item && removeVietnameseTone(item.toString()).replace(/[^a-z0-9\s]/g, ' ').trim())
      .filter(Boolean)
  );
};

const deriveCityFromText = (text = '') => {
  const normalized = removeVietnameseTone(text);
  const hit = CITY_LIBRARY.find(city =>
    city.aliases.some(alias => normalized.includes(alias.replace(/\s+/g, ' ')))
  );
  return hit ? hit.name : null;
};

module.exports = {
  FEATURE_LIBRARY,
  PRICE_LEVELS,
  DESCRIPTION_MIN_LENGTH,
  FEATURE_MIN_COUNT,
  removeVietnameseTone,
  escapeRegex,
  parseListInput,
  mergeFeatureList,
  inferFeaturesFromText,
  inferMenuHighlightsFromText,
  normalizePriceRange,
  inferPriceLevelFromRange,
  inferPriceLevelFromText,
  buildKeywordSet,
  deriveCityFromText
};