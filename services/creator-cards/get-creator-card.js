/* eslint-disable camelcase */
const { throwAppError } = require('@app-core/errors');
const creatorCardMessages = require('@app/messages/creator-card.messages');
const creatorCardRepository = require('../../repository/creator-card.repository');

const getCreatorCard = async (serviceData, options = {}) => {
  const { slug, access_code } = serviceData;

  const existing = await creatorCardRepository.findBySlug(slug);
  if (!existing) throwAppError(creatorCardMessages.CARD_NOT_FOUND, 'NF01');
  if (existing.status === 'draft') throwAppError(creatorCardMessages.CARD_IS_DRAFT, 'NF02');

  if (existing.access_type === 'private') {
    if (!access_code) throwAppError(creatorCardMessages.CARD_IS_PRIVATE, 'AC03');
    if (access_code !== existing.access_code) {
      throwAppError(creatorCardMessages.INVALID_ACCESS_CODE, 'AC04');
    }
  }

  return existing;
};

module.exports = getCreatorCard;
