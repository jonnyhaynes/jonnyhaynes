import { readFile, writeFile } from 'node:fs/promises';

const README = 'README.md';
const START = '<!-- now-playing:start -->';
const END = '<!-- now-playing:end -->';
const url =
  process.env.NOW_PLAYING_URL ?? 'https://jonnyhaynes.com/api/now-playing';

function escape(text) {
  return String(text).replace(/([\\`*_[\]()<>#|])/g, '\\$1');
}

function line(data) {
  if (!data?.title) return '';

  const title = data.url
    ? `[${escape(data.title)}](${data.url})`
    : escape(data.title);
  const artist = data.artist ? ` — ${escape(data.artist)}` : '';
  const lead = data.isPlaying ? 'On the turntable' : 'Last on the turntable';

  return `> ${lead}: **${title}**${artist}`;
}

const readme = await readFile(README, 'utf8');

let data = null;
try {
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (res.ok) data = await res.json();
} catch (err) {
  console.log(`now-playing unavailable: ${err.message}`);
}

if (!data) {
  console.log('Leaving the line as-is.');
  process.exit(0);
}

const block = line(data);
const next = readme.replace(
  /<!-- now-playing:start -->[\s\S]*?<!-- now-playing:end -->/,
  `${START}\n${block ? `${block}\n` : ''}${END}`,
);

if (next === readme) {
  console.log('No change.');
} else {
  await writeFile(README, next);
  console.log(block ? `Updated: ${block}` : 'Cleared: nothing on the turntable.');
}
