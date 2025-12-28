/**
 * API Documentation Routes
 * Implements T268 - Generate API documentation from OpenAPI specs using Swagger UI
 * Serves Swagger UI at /api-docs with links to OpenAPI spec files
 */

import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

const router: Router = Router();

/**
 * GET /api-docs
 * Serve Swagger UI with API documentation
 * Implements T268
 */
router.get('/', (_req: Request, res: Response) => {
  const contractsDir = path.join(process.cwd(), 'specs', '001-expo-management-platform', 'contracts');
  
  // Read available OpenAPI spec files
  const specFiles = [
    { name: 'Authentication API', file: 'auth-api.yaml', description: 'User authentication, registration, password reset, GDPR endpoints' },
    { name: 'Expo Management API', file: 'expo-api.yaml', description: 'Expo events, floor plans, schedules, exhibitor approvals, analytics' },
    { name: 'Exhibitor API', file: 'exhibitor-api.yaml', description: 'Exhibitor registration, profile management, booth selection' },
    { name: 'Attendee API', file: 'attendee-api.yaml', description: 'Attendee registration, expo browsing, session bookmarking' },
  ];

  // Check which files exist
  const availableSpecs = specFiles.filter(spec => {
    const filePath = path.join(contractsDir, spec.file);
    return fs.existsSync(filePath);
  });

  // Generate HTML page with Swagger UI
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EventSphere API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui.css" />
  <style>
    html {
      box-sizing: border-box;
      overflow: -moz-scrollbars-vertical;
      overflow-y: scroll;
    }
    *, *:before, *:after {
      box-sizing: inherit;
    }
    body {
      margin:0;
      background: #fafafa;
    }
    .swagger-ui .topbar {
      background-color: #1976d2;
    }
    .spec-selector {
      background: white;
      padding: 20px;
      border-bottom: 2px solid #e0e0e0;
      margin-bottom: 20px;
    }
    .spec-selector h1 {
      margin: 0 0 15px 0;
      color: #333;
      font-size: 28px;
    }
    .spec-list {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
    }
    .spec-card {
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      padding: 15px;
      background: white;
      cursor: pointer;
      transition: all 0.3s;
      min-width: 250px;
      flex: 1;
    }
    .spec-card:hover {
      border-color: #1976d2;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .spec-card.active {
      border-color: #1976d2;
      background: #e3f2fd;
    }
    .spec-card h3 {
      margin: 0 0 8px 0;
      color: #1976d2;
      font-size: 18px;
    }
    .spec-card p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }
    #swagger-ui {
      padding: 0 20px 40px 20px;
    }
    .info {
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 4px;
      padding: 15px;
      margin: 20px;
    }
  </style>
</head>
<body>
  <div class="spec-selector">
    <h1>EventSphere API Documentation</h1>
    <p style="color: #666; margin-bottom: 20px;">
      Select an API specification to view its documentation. All APIs require authentication via JWT token in the Authorization header.
    </p>
    <div class="spec-list">
      ${availableSpecs.map((spec, index) => `
        <div class="spec-card ${index === 0 ? 'active' : ''}" onclick="loadSpec('${spec.file}')">
          <h3>${spec.name}</h3>
          <p>${spec.description}</p>
        </div>
      `).join('')}
    </div>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-standalone-preset.js"></script>
  <script>
    let currentSpec = '${availableSpecs[0]?.file || ''}';
    
    function loadSpec(specFile) {
      currentSpec = specFile;
      // Update active card
      document.querySelectorAll('.spec-card').forEach(card => card.classList.remove('active'));
      event.currentTarget.classList.add('active');
      
      // Load spec
      const url = '/api-docs/spec/' + specFile;
      SwaggerUIBundle({
        url: url,
        dom_id: '#swagger-ui',
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "StandaloneLayout",
        deepLinking: true,
        filter: true,
        tryItOutEnabled: true
      });
    }
    
    // Load first spec by default
    if (currentSpec) {
      loadSpec(currentSpec);
    }
  </script>
</body>
</html>`;

  res.send(html);
});

/**
 * GET /api-docs/spec/:filename
 * Serve individual OpenAPI spec file
 */
router.get('/spec/:filename', (req: Request, res: Response) => {
  const filename = req.params.filename;
  const contractsDir = path.join(process.cwd(), 'specs', '001-expo-management-platform', 'contracts');
  const filePath = path.join(contractsDir, filename);

  // Security: Only allow YAML files from contracts directory
  if (!filename.endsWith('.yaml') && !filename.endsWith('.yml')) {
    return res.status(400).json({ error: 'Invalid file type' });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Spec file not found' });
  }

  // Check if path is within contracts directory (prevent directory traversal)
  const normalizedPath = path.normalize(filePath);
  const normalizedDir = path.normalize(contractsDir);
  if (!normalizedPath.startsWith(normalizedDir)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.setHeader('Content-Type', 'application/x-yaml');
  return res.sendFile(filePath);
});

/**
 * GET /api-docs/specs
 * List all available OpenAPI spec files
 */
router.get('/specs', (_req: Request, res: Response) => {
  const contractsDir = path.join(process.cwd(), 'specs', '001-expo-management-platform', 'contracts');
  
  const specFiles = [
    { name: 'Authentication API', file: 'auth-api.yaml' },
    { name: 'Expo Management API', file: 'expo-api.yaml' },
    { name: 'Exhibitor API', file: 'exhibitor-api.yaml' },
    { name: 'Attendee API', file: 'attendee-api.yaml' },
  ];

  const availableSpecs = specFiles
    .filter(spec => fs.existsSync(path.join(contractsDir, spec.file)))
    .map(spec => ({
      name: spec.name,
      file: spec.file,
      url: `/api-docs/spec/${spec.file}`,
    }));

  res.json({
    success: true,
    specs: availableSpecs,
    baseUrl: '/api-docs',
  });
});

export default router;

