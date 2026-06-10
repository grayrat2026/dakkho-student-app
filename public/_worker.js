export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Serve static assets directly
    if (path.startsWith('/_next/') || path.startsWith('/_not-found')) {
      return env.ASSETS.fetch(request);
    }

    // Serve known static files
    if (path.match(/\.(png|svg|jpg|jpeg|ico|webp|css|js|json|txt|xml|woff|woff2|ttf|eot)$/)) {
      return env.ASSETS.fetch(request);
    }

    // For all other routes, serve index.html (SPA routing)
    const indexUrl = new URL('/', url.origin);
    const indexRequest = new Request(indexUrl.toString(), request);
    const response = await env.ASSETS.fetch(indexRequest);
    
    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
        ...Object.fromEntries(response.headers.entries()),
      },
    });
  },
};
