#!/usr/bin/env node

// Seed the tracks table from a JSON file.
//
// Usage:
//   SUPABASE_URL=https://xxx.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
//   node scripts/seed-tracks.js tracks.json
//
// tracks.json format:
//   [
//     { "filename": "track-001-artist-title.mp3", "title": "Track Title" },
//     { "filename": "track-002-artist-title.mp3", "title": "Another Track" }
//   ]
//
// The "filename" must exactly match the object key in your R2 bucket.
// "title" is optional (displayed in the player UI).
//
// Install dependency first: npm install @supabase/supabase-js

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';

// Validate environment
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing required environment variables:');
  if (!url) console.error('  SUPABASE_URL');
  if (!key) console.error('  SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nUsage:');
  console.error('  SUPABASE_URL=https://xxx.supabase.co \\');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=eyJ... \\');
  console.error('  node scripts/seed-tracks.js tracks.json');
  process.exit(1);
}

// Validate input file
const inputFile = process.argv[2];
if (!inputFile) {
  console.error('Missing tracks JSON file argument.');
  console.error('Usage: node scripts/seed-tracks.js tracks.json');
  process.exit(1);
}
if (!existsSync(inputFile)) {
  console.error(`File not found: ${inputFile}`);
  process.exit(1);
}

// Parse and validate tracks
let tracks;
try {
  tracks = JSON.parse(readFileSync(inputFile, 'utf8'));
} catch (e) {
  console.error(`Failed to parse ${inputFile}:`, e.message);
  process.exit(1);
}

if (!Array.isArray(tracks) || tracks.length === 0) {
  console.error('tracks.json must be a non-empty array.');
  process.exit(1);
}

const invalid = tracks.filter(t => !t.filename);
if (invalid.length > 0) {
  console.error(`${invalid.length} track(s) missing "filename" field.`);
  process.exit(1);
}

// Seed
const supabase = createClient(url, key);

const { data, error } = await supabase
  .from('tracks')
  .upsert(tracks, { onConflict: 'filename' })
  .select('id, filename');

if (error) {
  console.error('Seed failed:', error.message);
  process.exit(1);
}

console.log(`Seeded ${data.length} tracks:`);
data.forEach(t => console.log(`  ${t.filename} → ${t.id}`));
