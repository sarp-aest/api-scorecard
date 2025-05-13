const express = require('express');
const fileUpload = require('express-fileupload');
const SwaggerParser = require('swagger-parser');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const yaml = require('js-yaml');
const cheerio = require('cheerio');

const app = express();
app.use(fileUpload());
app.use(express.json());

// Utility to extract embedded spec URL from HTML
function extractSpecUrlFromHtml(html, baseUrl) {
  const $ = cheerio.load(html);
  let specUrl = null;

  const redocTag = $('redoc, redocly-redoc').attr('spec-url');
  if (redocTag) {
    specUrl = new URL(redocTag, baseUrl).href;
  }

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

// Main analysis logic
const parseAndAnalyzeSpec = async (api) => {
  const paths = Object.entries(api.paths || {});
  const methods = paths.flatMap(([route, ops]) =>
    Object.entries(ops).map(([method, details]) => ({
      route,
      method,
      responses: details.responses || {},
      hasExample: Object.values(details.responses || {}).some(
        (resp) =>
          resp.content &&
          Object.values(resp.content).some((c) => c.example || c.examples)
      ),
    }))
  );

  const securitySchemes = api.components?.securitySchemes || {};
  const authTypes = Object.keys(securitySchemes);
  const hasAuth = authTypes.length > 0;
  const authScore = hasAuth ? 20 : 0;

  const exampleCount = methods.filter((m) => m.hasExample).length;
  const exampleCoverage = ((exampleCount / methods.length) * 100).toFixed(1);
  const exampleScore = (parseFloat(exampleCoverage) / 100) * 15;

  const schemaCount = methods.filter((m) => {
    return Object.values(m.responses).some(
      (resp) =>
        resp.content &&
        Object.values(resp.content).some((c) => c.schema)
    );
  }).length;
  const schemaCoverage = ((schemaCount / methods.length) * 100).toFixed(1);
  const schemaScore = (parseFloat(schemaCoverage) / 100) * 15;

  const statusCodes = new Set();
  methods.forEach((m) => {
    Object.keys(m.responses).forEach((code) => statusCodes.add(code));
  });
  const statusScore = statusCodes.size >= 5 ? 20 : (statusCodes.size / 5) * 20;

  const describedMethods = methods.filter((m) => {
    const methodData = api.paths[m.route][m.method];
    return methodData?.description && methodData.description.trim().length > 0;
  });
  const descriptionCoverage = ((describedMethods.length / methods.length) * 100).toFixed(1);
  const descriptionScore = (parseFloat(descriptionCoverage) / 100) * 30;

  const undocumented = methods
    .filter((m) => {
      const methodData = api.paths[m.route][m.method];
      return !methodData?.description;
    })
    .map((m) => `${m.method.toUpperCase()} ${m.route}`);

  const readinessScore = Math.round(authScore + exampleScore + schemaScore + statusScore + descriptionScore);

  let grade;
  if (readinessScore >= 90) grade = 'A';
  else if (readinessScore >= 80) grade = 'B';
  else if (readinessScore >= 70) grade = 'C';
  else if (readinessScore >= 60) grade = 'D';
  else grade = 'F';

  return {
    title: api.info.title,
    version: api.info.version,
    endpointCount: paths.length,
    methods: methods.map((m) => ({
      route: m.route,
      method: m.method,
      hasExample: m.hasExample,
      responseCodes: Object.keys(m.responses),
    })),
    insights: {
      authTypes: authTypes.length ? authTypes : ['None'],
      exampleCoverage: `${exampleCoverage}%`,
      schemaCoverage: `${schemaCoverage}%`,
      statusCodeCount: statusCodes.size,
      commonStatusCodes: Array.from(statusCodes),
      descriptionCoverage: `${descriptionCoverage}%`,
      undocumentedEndpoints: undocumented,
    },
    readinessScore,
    grade,
  };
};

// Upload a file
app.post('/api/upload', async (req, res) => {
  if (!req.files || !req.files.apiSpec) {
    return res.status(400).send("No file uploaded.");
  }

  const file = req.files.apiSpec;
  const filePath = path.join(__dirname, 'tmp', file.name);
  await file.mv(filePath);

  try {
    const api = await SwaggerParser.validate(filePath);
    const summary = await parseAndAnalyzeSpec(api);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    fs.unlinkSync(filePath);
  }
});

// Upload via URL (raw or doc page)
app.post('/api/upload-url', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing URL in request body' });

  try {
    const response = await axios.get(url);
    const contentType = response.headers['content-type'];
    let api = null;

    if (contentType.includes('application/json') || url.endsWith('.json')) {
      api = response.data;
    } else if (contentType.includes('application/yaml') || url.endsWith('.yaml') || url.endsWith('.yml')) {
      api = yaml.load(response.data);
    } else if (contentType.includes('text/html')) {
      const specUrl = extractSpecUrlFromHtml(response.data, url);
      if (!specUrl) {
        return res.status(400).json({
          error: "No OpenAPI spec found in the page. This documentation page does not embed a spec file. Please try providing a direct link to a .yaml or .json spec instead."
        });
      }

      const specRes = await axios.get(specUrl);
      if (specUrl.endsWith('.json')) {
        api = specRes.data;
      } else if (specUrl.endsWith('.yaml') || specUrl.endsWith('.yml')) {
        api = yaml.load(specRes.data);
      } else {
        return res.status(400).json({ error: 'Unsupported linked spec format.' });
      }
    } else {
      return res.status(400).json({ error: 'Unsupported content type or file format' });
    }

    const summary = await parseAndAnalyzeSpec(api);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(3001, () => console.log("Server running on port 3001"));