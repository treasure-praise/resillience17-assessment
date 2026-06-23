const { createHandler } = require('@app-core/server');
const deleteCreatorCardService = require('../../services/creator-cards/delete-creator-card');
const serializeCreatorCard = require('../../services/creator-cards/serialize-creator-card');

module.exports = createHandler({
  path: '/creator-cards/:slug',
  method: 'delete',
  middlewares: [],
  async handler(rc, helpers) {
    const card = await deleteCreatorCardService({
      slug: rc.params.slug,
      creator_reference: rc.body.creator_reference,
    });
    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: 'Creator Card Deleted Successfully.',
      data: serializeCreatorCard(card),
    };
  },
});
