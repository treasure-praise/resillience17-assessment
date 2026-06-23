const { createModel } = require('@app-core/mongoose');
const { ulid } = require('@app-core/randomness');

module.exports = createModel('CreatorCard', (mtypes) => ({
  _id: {
    type: String,
    default: ulid,
  },
  title: { type: String },
  description: { type: String },
  slug: {
    type: String,
    unique: true,
    index: true,
  },
  creator_reference: { type: String },
  links: { type: mtypes.Mixed, default: [] },
  service_rates: { type: mtypes.Mixed, default: null },
  status: { type: String },
  access_type: { type: String, default: 'public' },
  access_code: { type: String, default: null },
  created: { type: Number },
  updated: { type: Number },
  deleted: { type: Number, default: null },
}));
