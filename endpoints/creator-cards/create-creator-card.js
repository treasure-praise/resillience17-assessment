const { createHandler } = require('@app-core/server');
const createCreatorCardService = require('../../services/creator-cards/create-creator-cards');
const serializeCreatorCard = require('../../services/creator-cards/serialize-creator-card');

module.exports = createHandler({
  path: '/creator-cards',
  method: 'post',
  middlewares: [],
  async handler(rc, helpers) {
    const card = await createCreatorCardService(rc.body);
    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: 'Creator Card Created Successfully.',
      data: serializeCreatorCard(card),
    };
  },
});
