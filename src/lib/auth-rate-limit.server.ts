import {database} from './db.server';

// One SQLite statement makes the limit atomic without D1 interactive transactions.
export function authRateLimit(binding:D1Database){
 return {async consume(key:string,rule:{window:number;max:number}){
  const now=Date.now(),cutoff=now-rule.window*1000;
  const rows=await database(binding).$queryRaw<Array<{count:number}>>`
   INSERT INTO "rateLimit" (id,key,count,lastRequest)
   VALUES (${crypto.randomUUID()},${key},1,${now})
   ON CONFLICT(key) DO UPDATE SET
    count=CASE WHEN lastRequest<=${cutoff} THEN 1 ELSE count+1 END,
    lastRequest=CASE WHEN lastRequest<=${cutoff} THEN ${now} ELSE lastRequest END
   WHERE lastRequest<=${cutoff} OR count<${rule.max}
   RETURNING count`;
  return {allowed:rows.length>0,retryAfter:rows.length?null:rule.window};
 }};
}
