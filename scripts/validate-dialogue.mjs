// Read-only local proposal validation. This command cannot approve or publish.
import {readFile} from 'node:fs/promises';
import {dialogueBank} from '../dist/dialogue-bank.js';
import {validateDialogue} from '../dist/dialogue-catalog.js';
const file=process.argv[2]||new URL('../content/dialogue/submissions.example.json',import.meta.url);
const data=JSON.parse(await readFile(file,'utf8')),entries=data.entries;
if(!Array.isArray(entries))throw Error('Expected an entries array');
const ids=new Set(dialogueBank.map(e=>e.id));
for(const entry of entries){validateDialogue(entry);if(ids.has(entry.id))throw Error('Duplicate dialogue ID: '+entry.id);ids.add(entry.id)}
console.log(`Valid proposals: ${entries.length}. Pending: ${entries.filter(e=>e.reviewStatus==='pending').length}. Rejected: ${entries.filter(e=>e.reviewStatus==='rejected').length}. Approved proposals: ${entries.filter(e=>e.reviewStatus==='approved').length}. Nothing approved or published by this command.`);
