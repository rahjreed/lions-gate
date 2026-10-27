// Release counters are integers, not decimals or semantic-version minor numbers.
// Keep strings in JSON so even very large counters remain exact.
export function releaseLabel(state){
 if(!state||!/^\d+$/.test(state.series)||!/^\d+$/.test(state.update)||
  BigInt(state.series)<1n||BigInt(state.update)<1n||
  String(BigInt(state.series))!==state.series||String(BigInt(state.update))!==state.update||
  !(state.contentDigest===null||/^[a-f0-9]{64}$/.test(state.contentDigest)))throw Error('Invalid game-release.json; restore the release record rather than resetting its counter.');
 return `${state.series}.${state.update}`;
}
export function planRelease(state,contentDigest){
 releaseLabel(state);
 if(!/^[a-f0-9]{64}$/.test(contentDigest))throw Error('Invalid release content digest');
 return {...state,update:state.contentDigest&&state.contentDigest!==contentDigest?(BigInt(state.update)+1n).toString():state.update,contentDigest};
}
