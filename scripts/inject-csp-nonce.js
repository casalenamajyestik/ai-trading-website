/**
 * CSP Nonce Generator & Injector
 * Generates a cryptographically secure nonce and injects it into all HTML files
 * Also updates vercel.json with the new CSP nonce (REPLACES old nonce, not append)
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';

const DIST_DIR = '/home/lenovo/ai-trading-website/dist';
const VERCEL_JSON = '/home/lenovo/ai-trading-website/vercel.json';

// Generate a secure random nonce (base64, 32 bytes = 43 chars base64)
function generateNonce() {
  return randomBytes(32).toString('base64').replace(/[+/=]/g, '').substring(0, 32);
}

// Inject nonce into HTML file
function injectNonceIntoHtml(htmlPath, nonce) {
  let content = readFileSync(htmlPath, 'utf-8');
  
  // Add nonce to all <script> tags (both module and regular)
  content = content.replace(
    /<script(\s+[^>]*)?>/g,
    (match, attrs) => {
      // Skip if already has nonce
      if (attrs && attrs.includes('nonce=')) return match;
      return `<script${attrs || ''} nonce="${nonce}">`;
    }
  );
  
  // NO nonce for <style> tags - CSP style-src uses 'unsafe-inline' not nonce
  
  writeFileSync(htmlPath, content, 'utf-8');
  console.log(`✓ Injected nonce into ${htmlPath}`);
}

// Update vercel.json CSP header with nonce (REPLACE existing nonce)
function updateVercelJson(nonce) {
  const vercelConfig = JSON.parse(readFileSync(VERCEL_JSON, 'utf-8'));
  
  // Find the CSP header and update it
  for (const headerGroup of vercelConfig.headers) {
    if (headerGroup.source === '/(.*)') {
      for (const header of headerGroup.headers) {
        if (header.key === 'Content-Security-Policy') {
          // REPLACE the entire script-src and style-src with new nonce
          let csp = header.value;
          
          // Replace script-src: allow 'self' for same-origin scripts (Vite assets), nonce for inline
          // NO strict-dynamic - it breaks Vite multi-entry points
          csp = csp.replace(
            /script-src\s+[^;]+;/,
            `script-src 'self' 'nonce-${nonce}' 'wasm-unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com https://fonts.googleapis.com;`
          );
          
          // Replace style-src: NO nonce (so 'unsafe-inline' works for inline styles)
          csp = csp.replace(
            /style-src\s+[^;]+;/,
            `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;`
          );
          
          header.value = csp;
          break;
        }
      }
      break;
    }
  }
  
  writeFileSync(VERCEL_JSON, JSON.stringify(vercelConfig, null, 2), 'utf-8');
  console.log('✓ Updated vercel.json with CSP nonce (replaced old)');
}

// Main
function main() {
  const nonce = generateNonce();
  console.log(`Generated CSP nonce: ${nonce}`);
  
  // Process all HTML files in dist
  const files = readdirSync(DIST_DIR);
  const htmlFiles = files.filter(f => f.endsWith('.html'));
  
  for (const file of htmlFiles) {
    injectNonceIntoHtml(join(DIST_DIR, file), nonce);
  }
  
  // Also process HTML files in subdirectories
  const wellKnownDir = join(DIST_DIR, '.well-known');
  try {
    const wkFiles = readdirSync(wellKnownDir);
    for (const file of wkFiles) {
      if (file.endsWith('.html')) {
        injectNonceIntoHtml(join(wellKnownDir, file), nonce);
      }
    }
  } catch (e) {
    // directory might not exist
  }
  
  updateVercelJson(nonce);
  
  console.log('\n✅ CSP nonce injection complete!');
  console.log(`   Nonce: ${nonce}`);
  console.log(`   Files processed: ${htmlFiles.length}`);
}

main();