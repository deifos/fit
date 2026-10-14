import raw from './exercises.json';
import type {Exercise,Target,Template} from '../../lib/domain';
export const exercises=raw as Exercise[];
export const bySlug=Object.fromEntries(exercises.map(e=>[e.slug,e]));
function row(ids:string,sets:[number|null,number|null],reps:[number|null,number|null],extra:Partial<Target>={}):Target{const [first,...alternatives]=ids.split('|');return {exercise:bySlug[first],alternatives,setMin:sets[0],setMax:sets[1],repMin:reps[0],repMax:reps[1],optional:false,circuitGroup:null,restSeconds:180,notes:'',...extra}}
const days=[
 [row('incline-barbell-press|incline-dumbbell-press',[1,2],[6,10]),row('flat-barbell-bench-press|parallel-bar-dips',[1,1],[6,10]),row('dumbbell-fly|pec-deck',[1,1],[8,12]),row('triceps-pushdown|overhead-dumbbell-extension',[1,2],[8,12]),row('kettlebell-goblet-squat|two-hand-kettlebell-swing',[2,2],[10,12],{notes:'Light finisher.'})],
 [row('pull-up|lat-pulldown',[1,2],[6,10]),row('barbell-row|one-arm-dumbbell-row',[1,2],[6,10]),row('face-pull|dumbbell-rear-delt-fly',[1,1],[12,15]),row('barbell-curl|dumbbell-curl',[1,2],[6,10]),row('one-arm-kettlebell-row',[2,2],[8,10])],
 [row('barbell-back-squat|leg-press',[1,2],[6,10]),row('barbell-romanian-deadlift',[1,2],[8,12]),row('leg-extension|kettlebell-goblet-squat',[1,1],[10,15]),row('standing-barbell-calf-raise',[1,2],[10,15]),row('two-hand-kettlebell-swing',[2,2],[10,15],{notes:'Light to moderate.'})],
 [row('barbell-overhead-press|seated-dumbbell-overhead-press',[1,2],[6,10]),row('dumbbell-lateral-raise',[1,2],[10,15]),row('close-grip-bench-press|parallel-bar-dips',[1,1],[6,10]),row('hammer-curl|ez-bar-curl',[1,1],[8,12]),row('strict-kettlebell-press',[2,2],[6,8])],
 [row('barbell-deadlift|trap-bar-deadlift',[1,1],[5,8]),row('incline-dumbbell-press|push-up',[1,1],[8,12]),row('barbell-row|one-arm-dumbbell-row',[1,1],[6,10]),...['two-hand-kettlebell-swing','kettlebell-goblet-squat','one-arm-kettlebell-row|strict-kettlebell-press'].map(ids=>row(ids,[2,3],[null,null],{circuitGroup:'kb-circuit',notes:'2–3 circuit rounds. Reps are free to log.'}))]
];
const titles=['Chest & Triceps','Back & Biceps','Legs','Shoulders & Arms','Full Body'];
export const phaseNames=['Foundation','Intensity','Peak'];
export const generalNotes='Warm up thoroughly. Use a controlled lowering phase. Rest 3–5 minutes on heavy sets. The supplied plan uses 1–2 hard working sets close to technical failure. Kettlebells supplement the main lifts. Rest on weekends, or choose a four-day schedule when recovery lags.';
export const phaseNotes=['Build technique and a base. Keep kettlebell finishers light.','Supplied intensity note: increase weight or reps when form is solid. Optional rest-pause: rest 10–15 seconds, then 2–4 more reps. This is optional, not an automatic load or timer change.','Supplied peak note: one all-out set for main compounds, with optional rest-pause. Keep accessory targets from Foundation.'];
export const templates:Template[]=[];
for(let phase=1;phase<=3;phase++)for(let day=1;day<=5;day++){
 let entries=structuredClone(days[day-1]);
 if(phase===3&&day<5){const main=day===1?[0,1]:day===2?[0,1]:day===3?[0,1]:[0,2];entries=entries.map((e,i)=>main.includes(i)?{...e,setMin:1,setMax:1,notes:'One all-out set; optional rest-pause (supplied plan note).'}:e)}
 if(phase===2&&day===5)entries=[row('barbell-deadlift|barbell-back-squat',[1,1],[null,null]),row('single-kettlebell-clean-and-press',[3,3],[4,8]),row('two-hand-kettlebell-swing',[3,3],[8,12]),row('turkish-get-up',[null,null],[null,null],{optional:true,notes:'Very light practice.'})];
 if(phase===3&&day===5)entries=[row('barbell-deadlift|barbell-back-squat',[1,1],[null,null]),row('single-kettlebell-clean-and-press|double-kettlebell-clean-and-press',[3,4],[3,6]),row('double-kettlebell-front-squat|kettlebell-goblet-squat',[2,3],[6,10]),row('two-hand-kettlebell-swing',[3,3],[8,12]),row('turkish-get-up',[null,null],[null,null],{optional:true})];
 templates.push({id:`phase-${phase}-day-${day}`,revision:1,phase,dayIndex:day,title:titles[day-1],notes:phaseNotes[phase-1],exercises:entries});
}
export function targetText(t:Target){const range=(a:number|null,b:number|null)=>a===null?'Free':a===b?`${a}`:`${a}–${b}`;return `${range(t.setMin,t.setMax)} ${t.circuitGroup?'rounds':'sets'} · ${range(t.repMin,t.repMax)} reps${t.exercise.unilateral?' per side':''}${t.optional?' · Optional':''}`}
