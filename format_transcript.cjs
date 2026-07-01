const fs = require('fs');

const text = fs.readFileSync('Transcript.txt', 'utf8');
// Replace some common words with newlines to break it into chunks of ~100-200 chars
// Gujarati doesn't always use full stops (.) properly in speech-to-text transcripts.
// Let's replace ' ' with '\n' every 20 words.

const words = text.split(' ');
let formatted = '';
for (let i = 0; i < words.length; i++) {
  formatted += words[i] + ' ';
  if ((i + 1) % 15 === 0) {
    formatted += '\n';
  }
}

fs.writeFileSync('Transcript_formatted.txt', formatted);
console.log('Formatted successfully. Lines:', formatted.split('\n').length);
