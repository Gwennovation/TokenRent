/**
 * HandCash Connect helper — wraps the SDK for exchanging an authToken
 * for a user profile. The App Secret stays here on the backend.
 */
const { HandCashConnect } = require('@handcash/handcash-connect');

let _client = null;
function client() {
  if (_client) return _client;
  const appId = process.env.HANDCASH_APP_ID;
  const appSecret = process.env.HANDCASH_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error('HandCash credentials missing — set HANDCASH_APP_ID and HANDCASH_APP_SECRET in .env');
  }
  _client = new HandCashConnect({ appId, appSecret });
  return _client;
}

/**
 * Get the user's HandCash profile from an authToken.
 * Returns { handle, paymail, avatarUrl, publicKey, id }
 */
async function getProfileFromAuthToken(authToken) {
  const account = client().getAccountFromAuthToken(authToken);
  const profile = await account.profile.getCurrentProfile();
  const pub = profile.publicProfile || {};
  return {
    id:        pub.id,
    handle:    pub.handle ? `$${pub.handle}` : null,
    paymail:   pub.paymail,
    avatarUrl: pub.avatarUrl,
    publicKey: pub.publicKey,
  };
}

/**
 * Build the URL the user is redirected to to start the OAuth flow.
 */
function authorizeUrl() {
  const appId = process.env.HANDCASH_APP_ID;
  if (!appId) throw new Error('HANDCASH_APP_ID missing from .env');
  return `https://app.handcash.io/#/authorizeApp?appId=${encodeURIComponent(appId)}`;
}

module.exports = { getProfileFromAuthToken, authorizeUrl };
