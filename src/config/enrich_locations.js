/**
 * Script: enrich_locations.js
 * Purpose: Normalize and enrich existing location documents with detailed metadata.
 *
 * Usage:
 *   node src/config/enrich_locations.js         # apply changes
 *   node src/config/enrich_locations.js --dry   # preview only
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'dotenv') });

const connectDB = require('./db');
const Location = require('../models/location.model');
const {
  mergeFeatureList,
  inferMenuHighlightsFromText,
  normalizePriceRange,
  inferPriceLevelFromRange,
  inferPriceLevelFromText,
  buildKeywordSet,
  deriveCityFromText,
  parseListInput
} = require('../utils/locationMetadata');

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry');

const arraysEqual = (a = [], b = []) => {
  if (a.length !== b.length) return false;
  const normalizedA = [...a].sort();
  const normalizedB = [...b].sort();
  return normalizedA.every((value, index) => value === normalizedB[index]);
};

const summary = {
  processed: 0,
  updated: 0,
  city: 0,
  features: 0,
  menuHighlights: 0,
  priceLevel: 0,
  keywords: 0
};

const inferCity = (location) => {
  if (location.city && location.city !== 'Chưa cập nhật') return location.city;
  return deriveCityFromText(`${location.address || ''} ${location.description || ''}`) || location.city;
};

const ensureMenuHighlights = (location) => {
  const existing = parseListInput(location.menuHighlights);
  if (existing.length > 0) return existing;
  return inferMenuHighlightsFromText(location.description || '');
};

const run = async () => {
  await connectDB();
  const locations = await Location.find();
  summary.processed = locations.length;

  for (const location of locations) {
    let hasChange = false;
    const logParts = [];

    if (!location.priceRange) {
      location.priceRange = { min: 0, max: 0 };
    }

    const enrichedFeatures = mergeFeatureList(location.features, location.description || '');
    if (enrichedFeatures.length && !arraysEqual(enrichedFeatures, location.features || [])) {
      if (!isDryRun) location.features = enrichedFeatures;
      hasChange = true;
      summary.features += 1;
      logParts.push('features');
    }

    const menus = ensureMenuHighlights(location);
    if (menus.length && !arraysEqual(menus, location.menuHighlights || [])) {
      if (!isDryRun) location.menuHighlights = menus;
      hasChange = true;
      summary.menuHighlights += 1;
      logParts.push('menu');
    }

    const normalizedRange = normalizePriceRange(
      location.priceRange ? location.priceRange.min : null,
      location.priceRange ? location.priceRange.max : null
    );
    const existingRange = location.priceRange || {};
    if (!existingRange.min && normalizedRange.min) {
      if (!isDryRun) location.priceRange.min = normalizedRange.min;
      hasChange = true;
    }
    if (!existingRange.max && normalizedRange.max) {
      if (!isDryRun) location.priceRange.max = normalizedRange.max;
      hasChange = true;
    }

    const inferredLevel =
      location.priceLevel ||
      inferPriceLevelFromRange(location.priceRange || normalizedRange) ||
      inferPriceLevelFromText(location.description || '', 'standard');
    if (inferredLevel && location.priceLevel !== inferredLevel) {
      if (!isDryRun) location.priceLevel = inferredLevel;
      hasChange = true;
      summary.priceLevel += 1;
      logParts.push('priceLevel');
    }

    const guessedCity = inferCity(location);
    if (guessedCity && guessedCity !== location.city) {
      if (!isDryRun) location.city = guessedCity;
      hasChange = true;
      summary.city += 1;
      logParts.push('city');
    }

    const keywords = buildKeywordSet({
      name: location.name,
      city: guessedCity || location.city,
      address: location.address,
      type: location.type,
      description: location.description,
      features: location.features,
      menuHighlights: location.menuHighlights,
      priceLevel: location.priceLevel
    });
    if (keywords.length && !arraysEqual(keywords, location.keywords || [])) {
      if (!isDryRun) location.keywords = keywords;
      hasChange = true;
      summary.keywords += 1;
      logParts.push('keywords');
    }

    if (hasChange) {
      summary.updated += 1;
      if (isDryRun) {
        console.log(`DRY ${location.name}: would update -> ${logParts.join(', ')}`);
      } else {
        await location.save();
        console.log(`UPDATED ${location.name}: ${logParts.join(', ')}`);
      }
    }
  }

  console.log('\n=== Enrichment Summary ===');
  console.log(`Processed: ${summary.processed}`);
  console.log(`Updated : ${summary.updated}`);
  console.log(`- City fields       : ${summary.city}`);
  console.log(`- Feature sets      : ${summary.features}`);
  console.log(`- Menu highlights   : ${summary.menuHighlights}`);
  console.log(`- Price level/range : ${summary.priceLevel}`);
  console.log(`- Keyword vectors   : ${summary.keywords}`);
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no data written)' : 'APPLIED CHANGES'}`);

  process.exit(0);
};

run().catch(error => {
  console.error('Enrichment script failed:', error);
  process.exit(1);
});
