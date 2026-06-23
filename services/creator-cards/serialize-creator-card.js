/* eslint-disable camelcase */
// Maps a Mongoose Creator Card document to its API response shape:
// - _id becomes id (string)
// - __v is stripped
// - access_code is omitted entirely for retrieval responses (excludeAccessCode), null otherwise
function serializeCreatorCard(doc, options = {}) {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  const { _id, __v, access_code, ...rest } = obj;
  const card = { id: String(_id), ...rest };
  if (!options.excludeAccessCode) {
    card.access_code = access_code ?? null;
  }
  return card;
}

module.exports = serializeCreatorCard;
