export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Serve static assets directly
    if (path.startsWith('/_next/') || path.startsWith('/_not-found')) {
      return env.ASSETS.fetch(request);
    }

    // Serve known static files
    if (path.match(/\.(png|svg|jpg|jpeg|ico|webp|css|js|json|txt|xml|woff|woff2|ttf|eot|mp4|webm|pdf)$/)) {
      return env.ASSETS.fetch(request);
    }

    // Try serving the route-specific HTML first (e.g., /courses/index.html for /courses)
    // This ensures Next.js gets the correct RSC data for each route
    if (path !== '/' && !path.endsWith('/')) {
      const routeHtmlUrl = new URL(path + '/index.html', url.origin);
      const routeHtmlRequest = new Request(routeHtmlUrl.toString(), request);
      const routeResponse = await env.ASSETS.fetch(routeHtmlRequest);
      if (routeResponse.status === 200) {
        return new Response(routeResponse.body, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
          },
        });
      }
    }

    // Try with trailing slash
    if (path !== '/' && path.endsWith('/')) {
      const routeHtmlUrl = new URL(path + 'index.html', url.origin);
      const routeHtmlRequest = new Request(routeHtmlUrl.toString(), request);
      const routeResponse = await env.ASSETS.fetch(routeHtmlRequest);
      if (routeResponse.status === 200) {
        return new Response(routeResponse.body, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
          },
        });
      }
    }

    // Fall back to root index.html (SPA routing)
    const indexUrl = new URL('/', url.origin);
    const indexRequest = new Request(indexUrl.toString(), request);
    const response = await env.ASSETS.fetch(indexRequest);
    
    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
      },
    });
  },
};
