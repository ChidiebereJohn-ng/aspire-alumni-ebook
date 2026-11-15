export const onRequest: PagesFunction = async (context) => {
  const { request, next } = context;
  const url = new URL(request.url);

  const response = await next();

  // Only rewrite HTML pages
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    return response;
  }

  // Check if this is a cohort-prefilled form link, e.g. /join?cohort=2026
  const cohort = url.searchParams.get('cohort');
  if (url.pathname === '/join' && cohort) {
    const title = `Aspire Cohort ${cohort} — Join the Alumni Directory`;
    const desc = `Submit your graduation portrait, career profile, and advice to be featured in the official Class of ${cohort} yearbook.`;

    return new HTMLRewriter()
      .on('title', {
        element(el) {
          el.setInnerContent(title);
        },
      })
      .on('meta[property="og:title"]', {
        element(el) {
          el.setAttribute('content', title);
        },
      })
      .on('meta[name="twitter:title"]', {
        element(el) {
          el.setAttribute('content', title);
        },
      })
      .on('meta[name="description"]', {
        element(el) {
          el.setAttribute('content', desc);
        },
      })
      .on('meta[property="og:description"]', {
        element(el) {
          el.setAttribute('content', desc);
        },
      })
      .on('meta[name="twitter:description"]', {
        element(el) {
          el.setAttribute('content', desc);
        },
      })
      .transform(response);
  }

  return response;
};
