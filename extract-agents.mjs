import fs from 'fs';

const content = fs.readFileSync('src/seed/agents.seed.js', 'utf-8');

// Find the array start and end
const startMatch = content.indexOf('export const agentsSeedData = [');
const endMatch = content.lastIndexOf(']', content.indexOf('export async function seedAgents'));

if (startMatch === -1 || endMatch === -1) {
  console.error('Could not find agentsSeedData array');
  process.exit(1);
}

// Extract just the array content
const arrayStart = content.indexOf('[', startMatch);
const arrayContent = content.substring(arrayStart, endMatch + 1);

// Write to a temp file that we can import
fs.writeFileSync('temp-agents.mjs', `export const agentsSeedData = ${arrayContent}`);

// Import and re-export as JSON
import('./temp-agents.mjs').then(module => {
  fs.writeFileSync('seeds/agents.json', JSON.stringify(module.agentsSeedData, null, 2));
  fs.unlinkSync('temp-agents.mjs');
  console.log('✅ Created seeds/agents.json with', module.agentsSeedData.length, 'agents');
}).catch(err => {
  console.error('Error:', err);
  if (fs.existsSync('temp-agents.mjs')) fs.unlinkSync('temp-agents.mjs');
});
