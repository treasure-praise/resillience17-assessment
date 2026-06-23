/* eslint-disable camelcase */
const { ERROR_CODE, throwAppError } = require('@app-core/errors');
const { randomBytes } = require('@app-core/randomness');
const { parse, validate } = require('@app-core/validator');
const creatorCardMessages = require('@app/messages/creator-card.messages');
const creatorCardRepository = require('../../repository/creator-card.repository');

const spec = `root {
  title string<trim|minLength:3|maxLength:100>
    description? string<maxLength:500>
    slug? string<trim|minLength:5|maxLength:50>
    creator_reference string<trim|minLength:20|maxLength:20>
    links[]? {
      title string<trim|minLength:1|maxLength:100>
      url string<maxLength:200>
    }
    service_rates? {
      currency string(NGN|USD|GBP|GHS)
      rates[] {
        name string<trim|minLength:3|maxLength:100>
        description? string<maxLength:250>
        amount number<min:1>
      }
    }
    status string(draft|published)
    access_type? string(public|private)
    access_code? string<minLength:6|maxLength:6>
}`;

const parsedSpec = parse(spec);

const SLUG_CHARSET = /^[a-zA-Z0-9_-]+$/;
const ACCESS_CODE_CHARSET = /^[a-zA-Z0-9]+$/;

// Generates a 6-character alphanumeric suffix using the template's randomBytes
function generateSuffix() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = randomBytes(6);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join('');
}

// Implements the spec's 4-step slug algorithm
function buildSlugFromTitle(title) {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '');
}

// Field-level rules the VSL grammar cannot express (charset, URL prefix, integer-only amounts)
function validateUnexpressibleRules(data) {
  if (data.slug && !SLUG_CHARSET.test(data.slug)) {
    throwAppError(creatorCardMessages.INVALID_SLUG_FORMAT, ERROR_CODE.VALIDATIONERR);
  }
  (data.links || []).forEach((link) => {
    if (!link.url.startsWith('http://') && !link.url.startsWith('https://')) {
      throwAppError(creatorCardMessages.INVALID_LINK_URL, ERROR_CODE.VALIDATIONERR);
    }
  });
  if (data.service_rates) {
    data.service_rates.rates.forEach((rate) => {
      if (!Number.isInteger(rate.amount)) {
        throwAppError(creatorCardMessages.INVALID_RATE_AMOUNT, ERROR_CODE.VALIDATIONERR);
      }
    });
  }
  if (data.access_code && !ACCESS_CODE_CHARSET.test(data.access_code)) {
    throwAppError(creatorCardMessages.INVALID_ACCESS_CODE_FORMAT, ERROR_CODE.VALIDATIONERR);
  }
}

const createCreatorCard = async (creatorCardData, options = {}) => {
  const data = validate(creatorCardData, parsedSpec);
  validateUnexpressibleRules(data);

  const { title, slug, access_type, access_code } = data;
  const effectiveAccessType = access_type || 'public';

  if (effectiveAccessType === 'private' && !access_code) {
    throwAppError(creatorCardMessages.ACCESS_CODE_REQUIRED, 'AC01');
  }
  if (effectiveAccessType === 'public' && access_code) {
    throwAppError(creatorCardMessages.ACCESS_CODE_NOT_ALLOWED, 'AC05');
  }
  let resolvedSlug;
  if (slug) {
    // Client provided a slug — check uniqueness, never auto-modify it
    const existing = await creatorCardRepository.findBySlug(slug);
    if (existing) throwAppError(creatorCardMessages.SLUG_TAKEN, 'SL02');
    resolvedSlug = slug;
  } else {
    // Auto-generate from title
    resolvedSlug = buildSlugFromTitle(title);

    // Must be at least 5 chars; if not, add suffix immediately
    if (resolvedSlug.length < 5) {
      resolvedSlug = `${resolvedSlug}-${generateSuffix()}`;
    } else {
      // Check if the clean slug is already taken
      const existing = await creatorCardRepository.findBySlug(resolvedSlug);
      if (existing) resolvedSlug = `${resolvedSlug}-${generateSuffix()}`;
    }
  }
  const now = Date.now();
  const card = await creatorCardRepository.create({
    ...data,
    slug: resolvedSlug,
    access_type: effectiveAccessType,
    created: now,
    updated: now,
    deleted: null,
  });

  return card;
};

module.exports = createCreatorCard;
