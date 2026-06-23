const { expect } = require('chai');
const {
  mockServer,
  connectDb,
  cleanupSlugs,
  uniqueSlug,
  uniqueCreatorReference,
} = require('./test-helper');

describe('DELETE /creator-cards/:slug', () => {
  const createdSlugs = [];

  before(connectDb);

  after(async () => {
    await cleanupSlugs(createdSlugs);
  });

  it('deletes a card and returns it in the creation response format with deleted set (TC6)', async () => {
    const slug = uniqueSlug('ada-designs-things-del');
    const creatorReference = uniqueCreatorReference();
    createdSlugs.push(slug);

    await mockServer.post('/creator-cards', {
      body: {
        title: 'Ada Designs Things',
        slug,
        creator_reference: creatorReference,
        status: 'published',
      },
    });

    const res = await mockServer.delete(`/creator-cards/${slug}`, {
      body: { creator_reference: creatorReference },
    });

    expect(res.statusCode).to.equal(200);
    expect(res.data.status).to.equal('success');
    expect(res.data.data.slug).to.equal(slug);
    expect(res.data.data.deleted).to.be.a('number');
  });

  it('makes the card unretrievable via the public endpoint after deletion (TC16)', async () => {
    const slug = uniqueSlug('ada-designs-things-del-2');
    const creatorReference = uniqueCreatorReference();
    createdSlugs.push(slug);

    await mockServer.post('/creator-cards', {
      body: {
        title: 'Ada Designs Things 2',
        slug,
        creator_reference: creatorReference,
        status: 'published',
      },
    });

    await mockServer.delete(`/creator-cards/${slug}`, {
      body: { creator_reference: creatorReference },
    });

    const res = await mockServer.get(`/creator-cards/${slug}`, {});

    expect(res.statusCode).to.equal(404);
    expect(res.data.code).to.equal('NF01');
  });

  it('returns 404 NF01 when deleting a slug that does not exist (TC15)', async () => {
    const res = await mockServer.delete('/creator-cards/does-not-exist-123', {
      body: { creator_reference: uniqueCreatorReference() },
    });

    expect(res.statusCode).to.equal(404);
    expect(res.data.code).to.equal('NF01');
  });

  it('returns 400 when creator_reference is not exactly 20 characters', async () => {
    const slug = uniqueSlug('short-ref-card');
    createdSlugs.push(slug);

    await mockServer.post('/creator-cards', {
      body: {
        title: 'Short Ref Card',
        slug,
        creator_reference: uniqueCreatorReference(),
        status: 'published',
      },
    });

    const res = await mockServer.delete(`/creator-cards/${slug}`, {
      body: { creator_reference: 'too-short' },
    });

    expect(res.statusCode).to.equal(400);
  });
});
