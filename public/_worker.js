export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Serve static assets directly
    if (path.startsWith('/_next/')) {
      return env.ASSETS.fetch(request);
    }

    // Serve known static files by extension
    if (path.match(/\.(png|svg|jpg|jpeg|ico|webp|css|js|json|txt|xml|woff|woff2|ttf|eot|mp4|webm|pdf|map)$/)) {
      return env.ASSETS.fetch(request);
    }

    // For any other path, serve root index.html (SPA routing)
    // This handles ALL dynamic routes including UUIDs like /courses/xxx/settings
    try {
      const indexUrl = new URL('/', url.origin);
      const indexRequest = new Request(indexUrl.toString(), request);
      const response = await env.ASSETS.fetch(indexRequest);

      if (response.status === 200) {
        return new Response(response.body, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
          },
        });
      }
    } catch (e) {
      // Fallback failed
    }

    // Last resort: return the original request's response
    return env.ASSETS.fetch(request);
  },
};
