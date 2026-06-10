// SPA fallback worker — serves index.html for all non-static routes
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Static assets — serve normally via Cloudflare Pages
    if (
      path.startsWith('/_next/static/') ||
      path.startsWith('/_next/image/') ||
      path === '/favicon.png' ||
      path === '/logo.png' ||
      path === '/logo.svg' ||
      path === '/robots.txt' ||
      path === '/_headers' ||
      path === '/_redirects'
    ) {
      return env.ASSETS.fetch(request);
    }

    // Everything else → serve index.html (SPA routing)
    const indexRequest = new Request(new URL('/', url).toString(), request);
    const response = await env.ASSETS.fetch(indexRequest);
    return new Response(response.body, {
      status: 200,
      headers: response.headers,
    });
  },
};
