const { expect } = require('chai');
const {
  RUN_ID,
  mockServer,
  connectDb,
  cleanupSlugs,
  uniqueSlug,
  uniqueCreatorReference,
} = require('./test-helper');

describe('POST /creator-cards', () => {
  const createdSlugs = [];

  before(connectDb);

  after(async () => {
    await cleanupSlugs(createdSlugs);
  });

  let georgeCooksSlug;

  it('creates a public card from a full payload, defaulting access_type to public (TC1)', async () => {
    georgeCooksSlug = uniqueSlug('george-cooks');

    const res = await mockServer.post('/creator-cards', {
      body: {
        title: 'George Cooks',
        description: 'Weekly cooking podcast',
        slug: georgeCooksSlug,
        creator_reference: uniqueCreatorReference(),
        links: [{ title: 'YouTube', url: 'https://youtube.com/@georgecooks' }],
        service_rates: {
          currency: 'NGN',
          rates: [{ name: 'IG Story Post', description: 'One story mention', amount: 5000000 }],
        },
        status: 'published',
      },
    });
    createdSlugs.push(georgeCooksSlug);

    expect(res.statusCode).to.equal(200);
    expect(res.data.status).to.equal('success');
    expect(res.data.data).to.not.have.property('_id');
    expect(res.data.data.id).to.be.a('string');
    expect(res.data.data.slug).to.equal(georgeCooksSlug);
    expect(res.data.data.access_type).to.equal('public');
  });

  it('auto-generates the slug from the title when slug is omitted (TC2)', async () => {
    const title = `Ada Designs Things ${RUN_ID}`;
    const expectedSlug = title.toLowerCase().replace(/\s+/g, '-');

    const res = await mockServer.post('/creator-cards', {
      body: {
        title,
        creator_reference: uniqueCreatorReference(),
        status: 'published',
      },
    });
    createdSlugs.push(expectedSlug);

    expect(res.statusCode).to.equal(200);
    expect(res.data.data.slug).to.equal(expectedSlug);
  });

  it('creates a private card and returns the access_code in the creation response (TC3)', async () => {
    const slug = uniqueSlug('vip-rate-card');

    const res = await mockServer.post('/creator-cards', {
      body: {
        title: 'VIP Rate Card',
        slug,
        creator_reference: uniqueCreatorReference(),
        status: 'published',
        access_type: 'private',
        access_code: 'A1B2C3',
      },
    });
    createdSlugs.push(slug);

    expect(res.statusCode).to.equal(200);
    expect(res.data.data.access_type).to.equal('private');
    expect(res.data.data.access_code).to.equal('A1B2C3');
  });

  it('rejects a duplicate slug with SL02 (TC7)', async () => {
    const res = await mockServer.post('/creator-cards', {
      body: {
        title: 'Another George',
        slug: georgeCooksSlug,
        creator_reference: uniqueCreatorReference(),
        status: 'published',
      },
    });

    expect(res.statusCode).to.equal(400);
    expect(res.data.status).to.equal('error');
    expect(res.data.code).to.equal('SL02');
  });

  it('rejects a private card with no access_code via AC01 (TC8)', async () => {
    const res = await mockServer.post('/creator-cards', {
      body: {
        title: 'Secret Card',
        creator_reference: uniqueCreatorReference(),
        status: 'published',
        access_type: 'private',
      },
    });

    expect(res.statusCode).to.equal(400);
    expect(res.data.code).to.equal('AC01');
  });

  it('rejects access_code set on a public card via AC05 (TC9)', async () => {
    const res = await mockServer.post('/creator-cards', {
      body: {
        title: 'Public Card',
        creator_reference: uniqueCreatorReference(),
        status: 'published',
        access_type: 'public',
        access_code: 'A1B2C3',
      },
    });

    expect(res.statusCode).to.equal(400);
    expect(res.data.code).to.equal('AC05');
  });

  it('returns HTTP 400 for a framework-level validation failure (TC10)', async () => {
    const res = await mockServer.post('/creator-cards', {
      body: {
        title: 'Bad Status Card',
        creator_reference: uniqueCreatorReference(),
        status: 'archived',
      },
    });

    expect(res.statusCode).to.equal(400);
    expect(res.data.status).to.equal('error');
  });

  it('rejects a slug containing disallowed characters', async () => {
    const res = await mockServer.post('/creator-cards', {
      body: {
        title: 'Bad Slug Card',
        slug: uniqueSlug('not a valid slug!'),
        creator_reference: uniqueCreatorReference(),
        status: 'published',
      },
    });

    expect(res.statusCode).to.equal(400);
  });

  it('rejects a link url that does not start with http:// or https://', async () => {
    const res = await mockServer.post('/creator-cards', {
      body: {
        title: 'Bad Link Card',
        creator_reference: uniqueCreatorReference(),
        status: 'published',
        links: [{ title: 'Bad', url: 'ftp://example.com' }],
      },
    });

    expect(res.statusCode).to.equal(400);
  });

  it('rejects a non-integer service_rates amount', async () => {
    const res = await mockServer.post('/creator-cards', {
      body: {
        title: 'Bad Rate Card',
        creator_reference: uniqueCreatorReference(),
        status: 'published',
        service_rates: {
          currency: 'NGN',
          rates: [{ name: 'Story Post', description: 'desc', amount: 99.5 }],
        },
      },
    });

    expect(res.statusCode).to.equal(400);
  });

  it('rejects an access_code with non-alphanumeric characters', async () => {
    const res = await mockServer.post('/creator-cards', {
      body: {
        title: 'Bad Access Code Card',
        creator_reference: uniqueCreatorReference(),
        status: 'published',
        access_type: 'private',
        access_code: 'A1-B2C',
      },
    });

    expect(res.statusCode).to.equal(400);
  });
});
