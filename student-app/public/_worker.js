// Cloudflare Pages Function for SPA routing
// Serves index.html for all non-static asset requests
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Serve static assets directly (they will be handled by Cloudflare Pages)
    // For SPA routes, serve index.html
    if (
      path.startsWith('/_next/') ||
      path.startsWith('/static/') ||
      path.includes('.') // Files with extensions (CSS, JS, images, etc.)
    ) {
      return env.ASSETS.fetch(request);
    }

    // For all other routes, serve index.html for SPA routing
    return env.ASSETS.fetch(new Request(new URL('/index.html', url.origin)));
  }
};
