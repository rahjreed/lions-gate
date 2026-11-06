import {spawnSync} from 'node:child_process';
for(const name of ['probes.mjs','rules.mjs','verification.mjs']){
 const result=spawnSync(process.execPath,[name],{stdio:'inherit'});
 if(result.status!==0){process.exitCode=result.status||1;break;}
}
