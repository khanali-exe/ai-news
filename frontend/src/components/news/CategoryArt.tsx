/**
 * CategoryArt — beautiful SVG illustrations per category.
 * Used as a fallback when no real article image is available.
 */

const ARTS: Record<string, React.ReactNode> = {
  models: (
    <svg viewBox="0 0 400 220" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <radialGradient id="mg1" cx="30%" cy="40%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.6"/>
          <stop offset="100%" stopColor="#0d0e11" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="mg2" cx="75%" cy="65%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="#0d0e11" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="400" height="220" fill="#0d0e11"/>
      <circle cx="120" cy="88" r="90" fill="url(#mg1)"/>
      <circle cx="300" cy="143" r="70" fill="url(#mg2)"/>
      {/* Neural net nodes */}
      {[[60,60],[60,110],[60,160],[160,40],[160,90],[160,140],[160,190],[260,70],[260,120],[260,170],[340,95],[340,145]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r="5" fill="#7c3aed" opacity="0.8"/>
      ))}
      {/* Connections */}
      {[[60,60,160,40],[60,60,160,90],[60,110,160,90],[60,110,160,140],[60,160,160,140],[60,160,160,190],
        [160,40,260,70],[160,90,260,70],[160,90,260,120],[160,140,260,120],[160,140,260,170],[160,190,260,170],
        [260,70,340,95],[260,120,340,95],[260,120,340,145],[260,170,340,145]].map(([x1,y1,x2,y2],i)=>(
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#6366f1" strokeOpacity="0.3" strokeWidth="1"/>
      ))}
      <text x="340" y="30" textAnchor="end" fill="#7c3aed" fontSize="11" opacity="0.5" fontFamily="monospace">MODELS</text>
    </svg>
  ),

  research: (
    <svg viewBox="0 0 400 220" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <radialGradient id="rg1" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#0d0e11" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="400" height="220" fill="#0d0e11"/>
      <circle cx="200" cy="110" r="130" fill="url(#rg1)"/>
      {/* Sine wave */}
      <polyline points={Array.from({length:80},(_,i)=>`${i*5},${110+40*Math.sin(i*0.3)}`).join(' ')}
        fill="none" stroke="#3b82f6" strokeWidth="2" strokeOpacity="0.6"/>
      <polyline points={Array.from({length:80},(_,i)=>`${i*5},${110+25*Math.sin(i*0.5+1)}`).join(' ')}
        fill="none" stroke="#6366f1" strokeWidth="1.5" strokeOpacity="0.4"/>
      {/* Data points */}
      {Array.from({length:12},(_,i)=>(
        <circle key={i} cx={30+i*31} cy={110+40*Math.sin(i*1.1)} r="3.5" fill="#60a5fa" opacity="0.9"/>
      ))}
      <text x="340" y="30" textAnchor="end" fill="#3b82f6" fontSize="11" opacity="0.5" fontFamily="monospace">RESEARCH</text>
    </svg>
  ),

  tools: (
    <svg viewBox="0 0 400 220" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <radialGradient id="tg1" cx="40%" cy="50%">
          <stop offset="0%" stopColor="#059669" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#0d0e11" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="400" height="220" fill="#0d0e11"/>
      <circle cx="160" cy="110" r="110" fill="url(#tg1)"/>
      {/* Terminal lines */}
      {["$ npm install @ai/sdk","✓ Resolved 847 packages","$ node index.js","→ Model loaded","→ Processing...","✓ Done in 1.2s"].map((line,i)=>(
        <text key={i} x="40" y={55+i*26} fill={i===0?"#34d399":i===4?"#6ee7b7":"#059669"}
              fontSize="12" fontFamily="monospace" opacity={1-i*0.1}>{line}</text>
      ))}
      {/* Cursor blink */}
      <rect x="40" y="195" width="8" height="14" fill="#34d399" opacity="0.8"/>
      <text x="340" y="30" textAnchor="end" fill="#059669" fontSize="11" opacity="0.5" fontFamily="monospace">TOOLS</text>
    </svg>
  ),

  business: (
    <svg viewBox="0 0 400 220" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <radialGradient id="bg1" cx="60%" cy="60%">
          <stop offset="0%" stopColor="#d97706" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="#0d0e11" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="400" height="220" fill="#0d0e11"/>
      <circle cx="240" cy="140" r="120" fill="url(#bg1)"/>
      {/* Bar chart */}
      {[80,120,60,150,100,170,90,140].map((h,i)=>(
        <g key={i}>
          <rect x={40+i*42} y={190-h} width="28" height={h} rx="4"
                fill="#d97706" opacity={0.3+i*0.08}/>
          <rect x={40+i*42} y={190-h} width="28" height="4" rx="2"
                fill="#fbbf24" opacity={0.7+i*0.04}/>
        </g>
      ))}
      {/* Trend line */}
      <polyline points="54,150 96,110 138,130 180,70 222,100 264,50 306,80 348,60"
        fill="none" stroke="#fbbf24" strokeWidth="2" strokeOpacity="0.6" strokeDasharray="4 2"/>
      <text x="340" y="30" textAnchor="end" fill="#d97706" fontSize="11" opacity="0.5" fontFamily="monospace">BUSINESS</text>
    </svg>
  ),

  policy: (
    <svg viewBox="0 0 400 220" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <radialGradient id="pg1" cx="50%" cy="40%">
          <stop offset="0%" stopColor="#dc2626" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="#0d0e11" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="400" height="220" fill="#0d0e11"/>
      <circle cx="200" cy="90" r="120" fill="url(#pg1)"/>
      {/* Document lines */}
      <rect x="120" y="40" width="160" height="140" rx="8" fill="#1a0a0a" stroke="#dc2626" strokeOpacity="0.3" strokeWidth="1"/>
      {[60,80,100,120,140,155].map((y,i)=>(
        <rect key={i} x="140" y={y} width={i===5?60:110} height="8" rx="2" fill="#dc2626" opacity={0.2+i*0.05}/>
      ))}
      <rect x="140" y="48" width="80" height="4" rx="2" fill="#ef4444" opacity="0.6"/>
      {/* Shield icon */}
      <path d="M200,165 C200,165 225,152 225,138 L225,125 L200,118 L175,125 L175,138 C175,152 200,165 200,165Z"
            fill="none" stroke="#ef4444" strokeWidth="1.5" strokeOpacity="0.5"/>
      <text x="340" y="30" textAnchor="end" fill="#dc2626" fontSize="11" opacity="0.5" fontFamily="monospace">POLICY</text>
    </svg>
  ),

  other: (
    <svg viewBox="0 0 400 220" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <radialGradient id="og1" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.1"/>
        </radialGradient>
      </defs>
      <rect width="400" height="220" fill="#0d0e11"/>
      <circle cx="200" cy="110" r="140" fill="url(#og1)"/>
      {/* Grid dots */}
      {Array.from({length:10},(_,row)=>Array.from({length:18},(_,col)=>(
        <circle key={`${row}-${col}`} cx={22+col*21} cy={22+row*20} r="1.5"
                fill="#0ea5e9" opacity={0.1+Math.random()*0.3}/>
      )))}
      <text x="340" y="30" textAnchor="end" fill="#0ea5e9" fontSize="11" opacity="0.5" fontFamily="monospace">AI NEWS</text>
    </svg>
  ),
};

export function CategoryArt({ category }: { category: string | null }) {
  return (
    <div className="w-full h-full">
      {ARTS[category ?? "other"] ?? ARTS.other}
    </div>
  );
}
