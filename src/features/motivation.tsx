const interview='https://tim.blog/2018/06/04/the-tim-ferriss-show-transcripts-jocko-willink-on-discipline-leadership-and-overcoming-doubt/';
const book='https://davidgoggins.com/wp-content/uploads/2022/05/CantHurtMe-Intro.pdf';
export const quotes={
 today:{text:'Discipline equals freedom.',author:'Jocko Willink',source:'https://jocko.com/about/'},
 login:{text:'The hero is you.',author:'David Goggins',source:book},
 plan:{text:'You know what you have to do.',author:'Jocko Willink',source:interview},
 history:{text:'Human beings change through study, habit, and stories.',author:'David Goggins',source:book},
 progress:{text:'We all have the potential to be so much more.',author:'David Goggins',source:book},
 exercises:{text:'I’m still learning, still trying to get better',author:'Jocko Willink',source:interview},
 settings:{text:'Do not lie to yourself.',author:'Jocko Willink',source:interview},
 workout:{text:'Count on discipline.',author:'Jocko Willink',source:interview},
 weight:{text:'What if?',author:'David Goggins',source:book},
} as const;
export function Motivation({name}:{name:keyof typeof quotes}){
 const quote=quotes[name];
 return <figure className="motivation" data-quote={name}><blockquote>“{quote.text}”</blockquote><figcaption>— <a href={quote.source} target="_blank" rel="noreferrer" aria-label={`${quote.author} — quote source`}>{quote.author}</a></figcaption></figure>;
}
export function PageQuote({path}:{path:string}){
 const name=({'/plan':'plan','/workouts':'history','/progress':'progress','/exercises':'exercises','/settings':'settings','/progress/body-weight':'weight'} as const)[path as '/plan'];
 return name?<Motivation name={name}/>:path.startsWith('/workouts/')?<Motivation name="workout"/>:null;
}
