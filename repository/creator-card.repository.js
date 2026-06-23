const CreatorCard = require('@app/models/creator-card.models');

const creatorCardRepository = {
  findBySlug: (slug) => CreatorCard.findOne({ slug, deleted: null }),

  create: (data) => CreatorCard.create(data),

  softDelete: (slug) =>
    CreatorCard.findOneAndUpdate(
      { slug, deleted: null },
      {
        $set: {
          deleted: Date.now(),
          updated: Date.now(),
        },
      },
      { new: true }
    ),
};
module.exports = creatorCardRepository;
