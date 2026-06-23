const { createHandler } = require('@app-core/server');
const getCreatorCardService = require('../../services/creator-cards/get-creator-card');
const serializeCreatorCard = require('../../services/creator-cards/serialize-creator-card');

module.exports = createHandler({
  path: '/creator-cards/:slug',
  method: 'get',
  middlewares: [],
  async handler(rc, helpers) {
    const card = await getCreatorCardService({
      slug: rc.params.slug,
      access_code: rc.query.access_code,
    });
    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: 'Creator Card Retrieved Successfully.',
      data: serializeCreatorCard(card, { excludeAccessCode: true }),
    };
  },
});
