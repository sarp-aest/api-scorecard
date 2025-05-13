
const cheerio = require('cheerio');

/**
 * Attempts to extract an OpenAPI spec URL from a documentation HTML page.
 * Supports Swagger UI and Redoc-style docs.
 * @param {string} html - Raw HTML string
 * @param {string} baseUrl - The base URL (for resolving relative links)
 * @returns {string|null} - The spec URL if found, else null
 */
function extractSpecUrlFromHtml(html, baseUrl) {
  const $ = cheerio.load(html);
  let specUrl = null;

  // Try Redoc-style: <redoc spec-url="...">
  const redocTag = $('redoc, redocly-redoc').attr('spec-url');
  if (redocTag) {
    specUrl = new URL(redocTag, baseUrl).href;
  }

  // Try Swagger UI: look for a script or config in window.ui
  if (!specUrl) {
    const scripts = $('script').get();
    for (const script of scripts) {
      const content = $(script).html();
      const match = content && content.match(/url: ['"`](.*?\.ya?ml|\.json)['"`]/);
      if (match && match[1]) {
        specUrl = new URL(match[1], baseUrl).href;
        break;
      }
    }
  }

  return specUrl;
}

module.exports = { extractSpecUrlFromHtml };
