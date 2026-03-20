// Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-tracks.js tracks.json
// tracks.json: [{ "filename": "track-001.mp3", "title": "Track Name" }, ...]

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const tracks = JSON.parse(readFileSync(process.argv[2], 'utf8'));

const { error } = await supabase
  .from('tracks')
  .upsert(tracks, { onConflict: 'filename' });

if (error) {
  console.error('Seed failed:', error);
  process.exit(1);
}

console.log(`Seeded ${tracks.length} tracks.`);
