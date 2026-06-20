// Step 1 of the GitHub OAuth login for Decap CMS.
// Sends the user to GitHub to authorise, then GitHub returns to callback.js.
const crypto = require('crypto');

exports.handler = async (event) => {
  const clientId = process.env.GITHUB_OAUTH_ID;
  if (!clientId) {
    return { statusCode: 500, body: 'Missing GITHUB_OAUTH_ID environment variable.' };
  }
  const site = process.env.URL || `https://${event.headers.host}`;
  const redirectUri = `${site}/.netlify/functions/callback`;
  const state = crypto.randomBytes(12).toString('hex');

  const authUrl =
    'https://github.com/login/oauth/authorize' +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=public_repo` +          // use "repo" instead if you make the repository private
    `&state=${state}`;

  return { statusCode: 302, headers: { Location: authUrl }, body: '' };
};
