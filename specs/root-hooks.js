const { connectDb } = require('./test-helper');

exports.mochaHooks = {
  async beforeAll() {
    this.timeout(60000);
    await connectDb();
  },
};
