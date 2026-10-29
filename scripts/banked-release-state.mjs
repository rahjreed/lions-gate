// Exact owner-authorized publication chain for regression tests, not runtime.
import {readFile} from 'node:fs/promises';
const json=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
export const bankedBaseline=await json('content/banked-publication/baseline.json');
export const bankedQuestions=await json('content/reviewed/banked-100-approved.json');
export const authorizedPublished=[...await json('content/launch/reviewed-candidates.json'),...await json('content/reviewed/course-50-approved.json'),...bankedQuestions];
