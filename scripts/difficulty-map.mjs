// Opt-in authoring bridge. Existing source ratings/runtime values are never remapped.
export const mappingVersion='editorial-1-10-v1';
export const complexityByRating=[null,1,1,2,3,3,4,5,6,6,7];
export function mappedDifficulty(rating){
 if(!Number.isInteger(rating)||rating<1||rating>10)throw Error('Editorial difficulty must be an integer 1–10.');
 return {complexity:complexityByRating[rating],difficulty:rating<=3?1:rating<=6?2:3};
}
export function calibrateForExport(question,rating){
 const q=structuredClone(question);if(rating==null)return q;
 const mapped=mappedDifficulty(rating);q.difficulty=mapped.difficulty;
 q.knowledge={...q.knowledge,complexity:mapped.complexity,editorialDifficulty:rating,difficultyMapping:mappingVersion};
 return q;
}
