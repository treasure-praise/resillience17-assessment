require('dotenv').config();
const mongoose = require('mongoose');
const { createConnection } = require('@app-core/mongoose');
const createMockServer = require('@app-core/mock-server');
const CreatorCard = require('@app/models/creator-card.models');

const RUN_ID = Date.now().toString(36);

const mockServer = createMockServer(['endpoints/creator-cards']);

async function connectDb() {
  if (mongoose.connection.readyState === 0) {
    await createConnection({ uri: process.env.MONGODB_URI });
  }
}

async function cleanupSlugs(slugs) {
  if (slugs.length) await CreatorCard.deleteMany({ slug: { $in: slugs } });
}

function uniqueSlug(base) {
  return `${base}-${RUN_ID}`;
}

function uniqueCreatorReference() {
  return `crt_${RUN_ID}`.padEnd(20, 'x').slice(0, 20);
}

module.exports = {
  RUN_ID,
  mockServer,
  connectDb,
  cleanupSlugs,
  uniqueSlug,
  uniqueCreatorReference,
};
