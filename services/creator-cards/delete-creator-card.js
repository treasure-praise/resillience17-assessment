const { parse, validate } = require('@app-core/validator');
const { throwAppError } = require('@app-core/errors');
const creatorCardMessages = require('@app/messages/creator-card.messages');
const creatorCardRepository = require('../../repository/creator-card.repository');

const spec = `root {
  creator_reference string<trim|minLength:20|maxLength:20>
}`;

const parsedSpec = parse(spec);

const deleteCreatorCard = async (serviceData, options = {}) => {
  validate(serviceData, parsedSpec);

  const existing = await creatorCardRepository.findBySlug(serviceData.slug);
  if (!existing) throwAppError(creatorCardMessages.CARD_NOT_FOUND, 'NF01');

  return creatorCardRepository.softDelete(serviceData.slug);
};

module.exports = deleteCreatorCard;
