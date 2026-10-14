const exerciseTargets = [
  ['Barbell compounds', '6–10', 'Bench, overhead press, and rows. Rest 3–5 minutes between hard working sets.'],
  ['Dumbbell compounds', '6–10', 'Use the same progression rule with strict form.'],
  ['Isolation', '8–12', 'Laterals, curls, pushdowns, flyes, and extensions.'],
  ['Legs', '6–12', 'Squat, RDL, and leg press. Use the higher range if it feels better on your joints.'],
  ['Kettlebell work', '6–12', 'Start light. Follow the movement instructions for swings and complex sequences.'],
];

export function WorkingSetGuide({compact=false}:{compact?:boolean}){
  return <aside className="working-set-guide" aria-label="Working-set rules">
    <span className="eyebrow">YOUR WORKING-SET RULE</span>
    <h2>6–10 strict reps. Form comes first.</h2>
    <p>For your main barbell and dumbbell lifts: <strong>10 solid reps → add a little weight next session.</strong> If you get 5 or fewer, reduce the load slightly.</p>
    <p className="working-set-cue">Lower controlled lifts over 2–3 seconds. No bouncing. Stop when form starts to break down.</p>
    <details open={compact?undefined:true}>
      <summary>Rep ranges and progression guide</summary>
      <div className="working-set-details">
        <h3>How to use the rule</h3>
        <ul>
          <li>Choose a load that brings you near technical failure within the target range. Technical failure means you cannot do another rep with strict form.</li>
          <li>The last 1–2 reps should feel hard. Do not force extra reps with poor form.</li>
          <li>At 10 solid reps in the default 6–10 range, increase the load next session. Use a small increase, such as 2.5–5 lb when the equipment permits.</li>
          <li>For a different target range, use its upper limit before increasing the load. Reduce the load if you cannot reach its lower limit with good form.</li>
          <li>Log the weight and reps on your main lifts. Compare the same exercise and load basis over time.</li>
        </ul>
        <div className="working-set-table"><table>
          <caption>Your Mentzer-style working-set guide</caption>
          <thead><tr><th scope="col">Exercise type</th><th scope="col">Reps</th><th scope="col">Notes</th></tr></thead>
          <tbody>{exerciseTargets.map(([type,reps,note])=><tr key={type}><th scope="row">{type}</th><td>{reps}</td><td>{note}</td></tr>)}</tbody>
        </table></div>
        <p className="muted">This reminder applies to working sets, not warm-ups. Exercise-specific targets stay visible in your plan. Use the leg range for squats and RDLs; use the default compound range for conventional deadlifts. Follow the exercise instructions for tempo and technique on swings, cleans, and get-ups.</p>
      </div>
    </details>
  </aside>;
}
