import fs from 'node:fs';
import {exercises,templates} from '../src/features/plan/catalog';
const quote=(s:string)=>"'"+s.replaceAll("'","''")+"'";
const sql=['-- Static training content only. No owner or workout records.'];
for(const e of exercises)sql.push(`INSERT INTO Exercise (slug,payload) VALUES (${quote(e.slug)},${quote(JSON.stringify(e))}) ON CONFLICT(slug) DO UPDATE SET payload=excluded.payload;`);
for(const t of templates){sql.push(`INSERT INTO PlanTemplate (id,revision,payload) VALUES (${quote(t.id)},${t.revision},${quote(JSON.stringify(t))}) ON CONFLICT(id) DO UPDATE SET revision=excluded.revision,payload=excluded.payload;`);for(const [i,e] of t.exercises.entries())sql.push(`INSERT INTO PlanExercise (id,templateId,"order",payload) VALUES (${quote(t.id+'-'+i)},${quote(t.id)},${i},${quote(JSON.stringify(e))}) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload;`)}
fs.writeFileSync('migrations/0003_catalog.sql',sql.join('\n'));
