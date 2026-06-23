const { expect } = require('chai');
const {
  mockServer,
  connectDb,
  cleanupSlugs,
  uniqueSlug,
  uniqueCreatorReference,
} = require('./test-helper');

describe('GET /creator-cards/:slug', () => {
  const createdSlugs = [];
  let publicSlug;
  let privateSlug;
  let draftSlug;

  before(async () => {
    await connectDb();

    publicSlug = uniqueSlug('george-cooks-get');
    privateSlug = uniqueSlug('vip-rate-card-get');
    draftSlug = uniqueSlug('my-draft-card-get');
    createdSlugs.push(publicSlug, privateSlug, draftSlug);

    await mockServer.post('/creator-cards', {
      body: {
        title: 'George Cooks',
        slug: publicSlug,
        creator_reference: uniqueCreatorReference(),
        links: [{ title: 'YouTube', url: 'https://youtube.com/@georgecooks' }],
        status: 'published',
      },
    });

    await mockServer.post('/creator-cards', {
      body: {
        title: 'VIP Rate Card',
        slug: privateSlug,
        creator_reference: uniqueCreatorReference(),
        status: 'published',
        access_type: 'private',
        access_code: 'A1B2C3',
      },
    });

    await mockServer.post('/creator-cards', {
      body: {
        title: 'My Draft Card',
        slug: draftSlug,
        creator_reference: uniqueCreatorReference(),
        status: 'draft',
      },
    });
  });

  after(async () => {
    await cleanupSlugs(createdSlugs);
  });

  it('retrieves a published public card without an access_code field and exposes id, not _id (TC4)', async () => {
    const res = await mockServer.get(`/creator-cards/${publicSlug}`, {});

    expect(res.statusCode).to.equal(200);
    expect(res.data.status).to.equal('success');
    expect(res.data.data.slug).to.equal(publicSlug);
    expect(res.data.data.id).to.be.a('string');
    expect(res.data.data).to.not.have.property('_id');
    expect(res.data.data).to.not.have.property('access_code');
  });

  it('retrieves a private card with the correct access_code, omitting access_code from the response (TC5)', async () => {
    const res = await mockServer.get(`/creator-cards/${privateSlug}`, {
      query: { access_code: 'A1B2C3' },
    });

    expect(res.statusCode).to.equal(200);
    expect(res.data.data.slug).to.equal(privateSlug);
    expect(res.data.data).to.not.have.property('access_code');
  });

  it('returns 404 NF01 for a slug that does not exist (TC11)', async () => {
    const res = await mockServer.get('/creator-cards/does-not-exist-123', {});

    expect(res.statusCode).to.equal(404);
    expect(res.data.code).to.equal('NF01');
  });

  it('returns 404 NF02 for a card that exists but is a draft (TC12)', async () => {
    const res = await mockServer.get(`/creator-cards/${draftSlug}`, {});

    expect(res.statusCode).to.equal(404);
    expect(res.data.code).to.equal('NF02');
  });

  it('returns 403 AC03 for a private card requested without an access_code (TC13)', async () => {
    const res = await mockServer.get(`/creator-cards/${privateSlug}`, {});

    expect(res.statusCode).to.equal(403);
    expect(res.data.code).to.equal('AC03');
  });

  it('returns 403 AC04 for a private card requested with the wrong access_code (TC14)', async () => {
    const res = await mockServer.get(`/creator-cards/${privateSlug}`, {
      query: { access_code: 'WRONG1' },
    });

    expect(res.statusCode).to.equal(403);
    expect(res.data.code).to.equal('AC04');
  });
});
