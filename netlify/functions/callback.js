// Step 2 of the GitHub OAuth login for Decap CMS.
// Exchanges the code GitHub sent for an access token, then hands it back to the
// Decap admin window using the postMessage handshake Decap expects.

exports.handler = async (event) => {
  const code = event.queryStringParameters && event.queryStringParameters.code;
  const clientId = process.env.GITHUB_OAUTH_ID;
  const clientSecret = process.env.GITHUB_OAUTH_SECRET;

  if (!code) return { statusCode: 400, body: 'Missing ?code from GitHub.' };
  if (!clientId || !clientSecret) {
    return { statusCode: 500, body: 'Missing GITHUB_OAUTH_ID / GITHUB_OAUTH_SECRET environment variables.' };
  }

  let token;
  try {
    const resp = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });
    const data = await resp.json();
    if (data.error || !data.access_token) {
      return render('error', data.error_description || data.error || 'No access token returned.');
    }
    token = data.access_token;
  } catch (err) {
    return render('error', String(err));
  }

  return render('success', { token, provider: 'github' });
};

function render(status, payload) {
  const message =
    status === 'success'
      ? `authorization:github:success:${JSON.stringify(payload)}`
      : `authorization:github:error:${JSON.stringify({ message: payload })}`;

  const html = `<!doctype html><html><body><script>
    (function () {
      function receiveMessage(e) {
        window.opener && window.opener.postMessage(${JSON.stringify(message)}, e.origin);
        window.removeEventListener('message', receiveMessage, false);
      }
      window.addEventListener('message', receiveMessage, false);
      window.opener && window.opener.postMessage('authorizing:github', '*');
    })();
  </script><p>${status === 'success' ? 'Logged in — you can close this window.' : 'Login failed.'}</p></body></html>`;

  return { statusCode: 200, headers: { 'Content-Type': 'text/html' }, body: html };
}
