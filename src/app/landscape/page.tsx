'use client';

import React, { useState } from 'react';

interface ResearchDataItem {
  topic: string | null;
  papers: number | null;
  growth: string | null;
  score: number | null;
  signal: string;
  institutions: string[];
}

const AILandscape = () => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Research signal data - exact colours from specification
  const researchData: Record<string, ResearchDataItem> = {
    // OPPORTUNITIES
    "Disinformation Detection": { topic: "Bias, fairness, and ethics", papers: 818, growth: "655%", score: 4, signal: "Strong", institutions: ["Stanford AI", "MIT CSAIL", "EU AI", "NSF AI"] },
    "AI Cyber Defence": { topic: "AI safety / alignment", papers: 785, growth: null, score: 4, signal: "Strong", institutions: ["Anthropic", "OpenAI", "DeepMind", "DARPA AI"] },
    "Forecasting Systems": { topic: "Robustness / OOD / reliability", papers: 708, growth: null, score: 4, signal: "Strong", institutions: ["Google AI", "DeepMind", "Stanford AI"] },
    "Infrastructure Sharing": { topic: null, papers: null, growth: null, score: null, signal: "No Signal", institutions: [] },
    "Historical Doc Analysis": { topic: "Computer vision", papers: 1189, growth: null, score: 3, signal: "Moderate", institutions: ["Google AI", "Meta AI", "OpenAI"] },
    "Augmented Creativity": { topic: "Generative models", papers: 887, growth: null, score: 3, signal: "Moderate", institutions: ["Stability AI", "Midjourney", "OpenAI", "Meta AI"] },
    "Medical: Research, Impl, Society": { topic: "AI for healthcare", papers: 583, growth: "655%", score: 4, signal: "Strong", institutions: ["DeepMind", "Stanford AI", "MIT CSAIL", "Google AI"] },
    "AI Defence vs Malicious AI": { topic: "AI safety / alignment", papers: 785, growth: null, score: 4, signal: "Strong", institutions: ["Anthropic", "OpenAI", "DeepMind", "DARPA AI"] },
    "Longevity • Hedge Funds": { topic: "AI for healthcare", papers: 583, growth: "655%", score: 5, signal: "Very Strong", institutions: ["DeepMind", "Stanford AI", "MIT CSAIL", "Google AI"] },
    "Problem Simplification": { topic: null, papers: null, growth: null, score: null, signal: "No Signal", institutions: [] },
    "Automating Big Data": { topic: "AutoML / model search", papers: 598, growth: null, score: 3, signal: "Moderate", institutions: ["Google AI", "DeepMind", "Meta AI"] },
    "Personalised Education": { topic: null, papers: null, growth: null, score: null, signal: "No Signal", institutions: [] },
    "Automation of Labour": { topic: "Robotics", papers: 475, growth: "827%", score: 4, signal: "Strong", institutions: ["Tesla AI", "Stanford AI", "Berkeley AI"] },
    "Government Army AI": { topic: null, papers: null, growth: null, score: null, signal: "No Signal", institutions: [] },
    "Human-AI Collaboration": { topic: "Agentic / tool-using AI", papers: 143, growth: "929%", score: 3, signal: "Moderate", institutions: ["OpenAI", "Anthropic", "Google AI", "DeepMind"] },
    "AI Creativity": { topic: "Generative models", papers: 887, growth: null, score: 3, signal: "Moderate", institutions: ["Stability AI", "Midjourney", "OpenAI", "Meta AI"] },
    "Quantum • Drug Discovery • Finance": { topic: "AI for science / materials", papers: 942, growth: "680%", score: 4, signal: "Strong", institutions: ["DeepMind", "Google AI", "Stanford AI"] },
    "AI Identity": { topic: null, papers: null, growth: null, score: null, signal: "No Signal", institutions: [] },
    "Robots/Humanoids, Weapons, Space": { topic: "Robotics", papers: 475, growth: "827%", score: 4, signal: "Strong", institutions: ["Tesla AI", "Stanford AI", "Berkeley AI"] },
    "Climate Monitoring": { topic: "AI for climate / energy", papers: 745, growth: "870%", score: 4, signal: "Strong", institutions: ["Google AI", "DeepMind", "Microsoft AI"] },
    "Radical Abundance": { topic: null, papers: null, growth: null, score: null, signal: "No Signal", institutions: [] },
    "Size Reduction": { topic: null, papers: null, growth: null, score: null, signal: "No Signal", institutions: [] },

    // ENABLERS
    "AI Itself": { topic: "Agentic / tool-using AI", papers: 143, growth: "929%", score: 5, signal: "Very Strong", institutions: ["OpenAI", "Anthropic", "Google AI", "DeepMind", "Meta AI"] },
    "Dynamic Bayesian": { topic: null, papers: null, growth: null, score: null, signal: "No Signal", institutions: [] },
    "Active Inference": { topic: "NeuroAI / cognitive models", papers: 1073, growth: "600%", score: 4, signal: "Strong", institutions: ["MIT CSAIL", "Stanford AI", "DeepMind"] },
    "Incentive Systems": { topic: null, papers: null, growth: null, score: null, signal: "No Signal", institutions: [] },
    "Agent Protocols": { topic: "Agentic / tool-using AI", papers: 143, growth: "929%", score: 3, signal: "Moderate", institutions: ["OpenAI", "Anthropic", "Google AI", "LangChain"] },
    "Neurosymbolic AI": { topic: "Neurosymbolic AI", papers: 619, growth: "594%", score: 3, signal: "Moderate", institutions: ["MIT CSAIL", "Stanford AI", "IBM Research"] },
    "Bio/Neuro-informed": { topic: "NeuroAI / cognitive models", papers: 1073, growth: "600%", score: 4, signal: "Strong", institutions: ["MIT CSAIL", "Stanford AI", "DeepMind"] },
    "Open-access / Data Ecosystems": { topic: null, papers: null, growth: null, score: null, signal: "No Signal", institutions: [] },
    "Modularisation / Multi-agent": { topic: null, papers: null, growth: null, score: null, signal: "No Signal", institutions: [] },
    "RL for TEXT": { topic: "Reinforcement learning", papers: 493, growth: "662%", score: 3, signal: "Moderate", institutions: ["OpenAI", "DeepMind", "Berkeley AI", "Anthropic"] },
    "World Models": { topic: "AI for science / materials", papers: 942, growth: "680%", score: 4, signal: "Strong", institutions: ["DeepMind", "Google AI", "Stanford AI", "Meta AI"] },
    "Cyber-physical Infrastructure": { topic: "Robotics", papers: 475, growth: "827%", score: 4, signal: "Strong", institutions: ["Tesla AI", "Stanford AI", "Berkeley AI"] },
    "Evolutionary Algorithms": { topic: "AutoML / model search", papers: 598, growth: null, score: 3, signal: "Moderate", institutions: ["Google AI", "DeepMind", "Meta AI"] },
    "Multi-level Abstraction": { topic: null, papers: null, growth: null, score: null, signal: "No Signal", institutions: [] },
    "Graph-neural Networks": { topic: "Graph neural networks", papers: 537, growth: "673%", score: 3, signal: "Moderate", institutions: ["DeepMind", "Stanford AI", "Berkeley AI"] },
    "Classical ML": { topic: null, papers: null, growth: null, score: null, signal: "No Signal", institutions: [] },
    "New Tech: Bio, DNA, Rare Earth": { topic: "Bio-computing / synthetic biology", papers: 917, growth: "1009%", score: 4, signal: "Strong", institutions: ["Harvard", "MIT", "Oxford"] },
    "Diffraction Photonics": { topic: "Brain-inspired / neuromorphic", papers: 580, growth: "990%", score: 4, signal: "Strong", institutions: ["Intel", "IBM Research", "Stanford AI"] },
    "Control & Cyber-Physical": { topic: "Robotics", papers: 475, growth: "827%", score: 4, signal: "Strong", institutions: ["Tesla AI", "Stanford AI", "Berkeley AI"] },
    "Protein/DNA Computation": { topic: "Bio-computing / synthetic biology", papers: 917, growth: "1009%", score: 4, signal: "Strong", institutions: ["Harvard", "MIT", "Oxford"] },
    "Biological Computing": { topic: "Bio-computing / synthetic biology", papers: 917, growth: "1009%", score: 4, signal: "Strong", institutions: ["Harvard", "MIT", "Oxford"] },
    "Quantum ML: Hybrid HPC-QC, Cloud QC, Modularisation": { topic: null, papers: null, growth: null, score: null, signal: "No Signal", institutions: [] },
    "AI Triad: Compute, Data, Algorithms": { topic: null, papers: null, growth: null, score: null, signal: "Foundational", institutions: [] },
    "Sector-Specific Modular AI Systems": { topic: "AI for science / materials", papers: 942, growth: "680%", score: null, signal: "Foundational", institutions: ["DeepMind", "Google AI", "Stanford AI"] },

    // ACTORS
    "Frontier AI Developers": { topic: "Large language models", papers: 549, growth: null, score: 3, signal: "Moderate", institutions: ["OpenAI", "Anthropic", "Google AI", "Meta AI", "Mistral AI", "Cohere"] },
    "AI Societies": { topic: null, papers: null, growth: null, score: null, signal: "No Signal", institutions: [] },
  };

  const getSignalColor = (signal: string, layer: string) => {
    const colors: Record<string, Record<string, string>> = {
      opportunities: {
        "Very Strong": "#C44D5A",
        "Strong": "#D4707A",
        "Moderate": "#E8B4BC",
        "Weak": "#F5D5D9",
        "No Signal": "#F5D5D9"
      },
      enablers: {
        "Very Strong": "#3B82F6",
        "Strong": "#3B82F6",
        "Moderate": "#93C5FD",
        "Weak": "#DBEAFE",
        "No Signal": "#DBEAFE"
      },
      actors: {
        "Very Strong": "#D97706",
        "Strong": "#D97706",
        "Moderate": "#FDE68A",
        "Weak": "#FEF3C7",
        "No Signal": "#FEF3C7"
      },
      foundational: {
        "default": "#A78BFA"
      },
      special: {
        "AI Itself": "#C44D5A"
      }
    };
    return colors[layer]?.[signal] || colors[layer]?.["No Signal"] || colors[layer]?.["default"] || "#F5D5D9";
  };

  const HoverCard = ({ item, data, x, y }: { item: string; data: ResearchDataItem | undefined; x: number; y: number }) => {
    if (!data) return null;

    return (
      <div
        className="fixed z-50 bg-slate-800 border border-slate-600 rounded-lg p-4 shadow-xl pointer-events-none"
        style={{
          left: Math.min(x + 15, typeof window !== 'undefined' ? window.innerWidth - 320 : 800),
          top: Math.min(y + 15, typeof window !== 'undefined' ? window.innerHeight - 280 : 600),
          minWidth: '280px',
          maxWidth: '320px'
        }}
      >
        <div className="font-bold text-white mb-2 text-sm">{item}</div>
        <div className="space-y-1.5 text-xs">
          {data.topic && (
            <div className="flex justify-between gap-2">
              <span className="text-slate-400">Research Topic:</span>
              <span className="text-blue-300 text-right">{data.topic}</span>
            </div>
          )}
          {data.papers && (
            <div className="flex justify-between">
              <span className="text-slate-400">Papers:</span>
              <span className="text-white font-semibold">{data.papers.toLocaleString()}</span>
            </div>
          )}
          {data.growth && (
            <div className="flex justify-between">
              <span className="text-slate-400">Growth:</span>
              <span className="text-green-400 font-semibold">{data.growth}</span>
            </div>
          )}
          {data.score && (
            <div className="flex justify-between">
              <span className="text-slate-400">Total Score:</span>
              <span className="text-white">{data.score}/5</span>
            </div>
          )}
          <div className="flex justify-between pt-1 border-t border-slate-600 mt-2">
            <span className="text-slate-400">Research Signal:</span>
            <span className={`font-semibold ${
              data.signal === "Very Strong" ? "text-purple-400" :
              data.signal === "Strong" ? "text-green-400" :
              data.signal === "Moderate" ? "text-yellow-400" : "text-slate-500"
            }`}>{data.signal}</span>
          </div>
          {data.institutions && data.institutions.length > 0 && (
            <div className="pt-2 border-t border-slate-600 mt-2">
              <span className="text-slate-400 block mb-1">Top Institutions:</span>
              <div className="flex flex-wrap gap-1">
                {data.institutions.map((inst, i) => (
                  <span key={i} className="bg-slate-700 text-blue-200 px-2 py-0.5 rounded text-xs">
                    {inst}
                  </span>
                ))}
              </div>
            </div>
          )}
          {!data.topic && (
            <div className="text-slate-500 italic mt-2">No matching research topic found</div>
          )}
        </div>
      </div>
    );
  };

  const Box = ({ name, width, height, x = 0, y = 0, layer, votes = 0, starred = false, subtitle, isFoundational = false }: {
    name: string;
    width: number;
    height: number;
    x?: number;
    y?: number;
    layer: string;
    votes?: number;
    starred?: boolean;
    subtitle?: string;
    isFoundational?: boolean;
  }) => {
    const data = researchData[name];
    const signal = data?.signal || "No Signal";

    // Determine background colour
    let bgColor;
    if (name === "AI Itself") {
      bgColor = "#C44D5A"; // Special red for AI Itself
    } else if (isFoundational) {
      bgColor = "#A78BFA"; // Purple for foundational boxes
    } else {
      bgColor = getSignalColor(signal, layer);
    }

    const textColor = (name === "AI Itself" || isFoundational || signal === "Strong" || signal === "Very Strong") ? "#fff" : "#1e293b";

    const handleMouseEnter = (e: React.MouseEvent) => {
      setHoveredItem(name);
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseLeave = () => {
      setHoveredItem(null);
    };

    return (
      <g
        transform={`translate(${x},${y})`}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: 'pointer' }}
      >
        <rect
          width={width}
          height={height}
          rx={3}
          fill={bgColor}
          className="transition-opacity hover:opacity-80"
        />
        <text
          x={width/2}
          y={starred ? height/2 - 4 : height/2 + 4}
          textAnchor="middle"
          fill={textColor}
          fontSize={starred ? 11 : 10}
          fontWeight={starred ? 700 : 400}
        >
          {starred ? `★ ${name}` : name}
        </text>
        {subtitle && (
          <text x={width/2} y={height/2 + 12} textAnchor="middle" fill={textColor} fontSize={8} opacity={0.7}>
            {subtitle}
          </text>
        )}
        {votes > 0 && (
          <g>
            {[...Array(Math.min(votes, 4))].map((_, i) => (
              <circle
                key={i}
                cx={width - 10 - (i * 9)}
                cy={10}
                r={3}
                fill={textColor}
                opacity={0.5}
              />
            ))}
          </g>
        )}
      </g>
    );
  };

  return (
    <div className="relative w-full min-h-screen p-4" style={{ backgroundColor: '#0f172a' }}>
      {/* Navigation Link */}
      <div className="absolute top-4 left-4 z-50">
        <a
          href="/"
          style={{ color: '#ffffff' }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-sm font-medium border border-slate-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span style={{ color: '#ffffff' }}>Back to Board</span>
        </a>
      </div>

      <svg viewBox="0 0 1500 950" className="w-full h-auto" style={{ fontFamily: 'system-ui, sans-serif' }} onMouseLeave={() => setHoveredItem(null)}>
        {/* Invisible background to capture mouse events and clear hover */}
        <rect x="0" y="0" width="1500" height="950" fill="transparent" onMouseEnter={() => setHoveredItem(null)} />

        {/* Header */}
        <text x="750" y="28" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="13" letterSpacing="2">SI UNITS • NOVEMBER 2025</text>
        <text x="750" y="55" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="14">NETINTEL view of AI future</text>
        <text x="750" y="95" textAnchor="middle" fill="#fff" fontSize="42" fontWeight="700">AI Landscape</text>
        <text x="750" y="125" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="15">Evidence-led technology signal based on human expertise and network science</text>

        {/* Stats bar */}
        <rect x="390" y="140" width="720" height="38" rx="19" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)"/>
        <text x="430" y="165" fill="#fff" fontSize="17" fontWeight="600">66</text>
        <text x="458" y="165" fill="rgba(255,255,255,0.5)" fontSize="12">ideas</text>
        <text x="530" y="165" fill="#fff" fontSize="17" fontWeight="600">127</text>
        <text x="572" y="165" fill="rgba(255,255,255,0.5)" fontSize="12">votes</text>
        <text x="635" y="165" fill="#fff" fontSize="17" fontWeight="600">8</text>
        <text x="655" y="165" fill="rgba(255,255,255,0.5)" fontSize="12">contributors</text>
        <text x="780" y="165" fill="#fff" fontSize="17" fontWeight="600">1.4</text>
        <text x="815" y="165" fill="rgba(255,255,255,0.5)" fontSize="12">million documents</text>
        <text x="965" y="165" fill="rgba(255,255,255,0.4)" fontSize="12">Feb 2026</text>

        {/* Column headers */}
        <rect x="98" y="202" width="436" height="32" rx="4" fill="rgba(255,255,255,0.07)"/>
        <text x="316" y="224" textAnchor="middle" fill="#fff" fontSize="15" fontWeight="700">Imminent</text>

        <rect x="568" y="202" width="425" height="32" rx="4" fill="rgba(255,255,255,0.07)"/>
        <text x="780" y="224" textAnchor="middle" fill="#fff" fontSize="15" fontWeight="700">Near Future</text>

        <rect x="1028" y="202" width="425" height="32" rx="4" fill="rgba(255,255,255,0.07)"/>
        <text x="1240" y="224" textAnchor="middle" fill="#fff" fontSize="15" fontWeight="700">Far Future</text>

        {/* OPPORTUNITIES ROW */}
        <g transform="translate(45,246)">
          <rect width="48" height="128" rx="4" fill="#E8B4BC"/>
          <text x="24" y="64" textAnchor="middle" fill="#1e293b" fontSize="11" fontWeight="700" transform="rotate(-90,24,64)">OPPORTUNITIES</text>

          {/* Imminent */}
          <g transform="translate(53,5)">
            <Box name="Disinformation Detection" width={142} height={36} layer="opportunities" votes={2} />
            <Box name="AI Cyber Defence" width={142} height={36} x={147} layer="opportunities" votes={2} />
            <Box name="Forecasting Systems" width={142} height={36} x={294} layer="opportunities" votes={2} />
            <Box name="Infrastructure Sharing" width={142} height={36} y={41} layer="opportunities" votes={1} />
            <Box name="Historical Doc Analysis" width={142} height={36} x={147} y={41} layer="opportunities" votes={1} />
            <Box name="Augmented Creativity" width={142} height={36} x={294} y={41} layer="opportunities" votes={2} />
            <Box name="Medical: Research, Impl, Society" width={218} height={36} y={82} layer="opportunities" votes={1} />
            <Box name="AI Defence vs Malicious AI" width={213} height={36} x={223} y={82} layer="opportunities" votes={2} />
          </g>

          {/* Near Future */}
          <g transform="translate(523,5)">
            <Box name="Longevity • Hedge Funds" width={210} height={42} layer="opportunities" votes={4} starred subtitle="TOP PRIORITY" />
            <Box name="Problem Simplification" width={210} height={36} x={215} layer="opportunities" votes={3} />
            <Box name="Automating Big Data" width={142} height={36} y={47} layer="opportunities" votes={1} />
            <Box name="Personalised Education" width={142} height={36} x={147} y={47} layer="opportunities" votes={1} />
            <Box name="Automation of Labour" width={131} height={36} x={294} y={47} layer="opportunities" votes={3} />
            <Box name="Government Army AI" width={142} height={36} y={88} layer="opportunities" votes={1} />
            <Box name="Human-AI Collaboration" width={142} height={36} x={147} y={88} layer="opportunities" votes={1} />
          </g>

          {/* Far Future */}
          <g transform="translate(983,5)">
            <Box name="AI Creativity" width={190} height={42} layer="opportunities" votes={4} starred subtitle="TOP PRIORITY" />
            <Box name="Quantum • Drug Discovery • Finance" width={230} height={36} x={195} layer="opportunities" votes={3} />
            <Box name="AI Identity" width={140} height={36} y={47} layer="opportunities" votes={1} />
            <Box name="Robots/Humanoids, Weapons, Space" width={280} height={36} x={145} y={47} layer="opportunities" votes={2} />
            <Box name="Climate Monitoring" width={140} height={36} y={88} layer="opportunities" votes={2} />
            <Box name="Radical Abundance" width={140} height={36} x={145} y={88} layer="opportunities" votes={2} />
            <Box name="Size Reduction" width={135} height={36} x={290} y={88} layer="opportunities" votes={2} />
          </g>
        </g>

        {/* ENABLERS ROW */}
        <g transform="translate(45,388)">
          <rect width="48" height="320" rx="4" fill="#93C5FD"/>
          <text x="24" y="160" textAnchor="middle" fill="#1e293b" fontSize="11" fontWeight="700" transform="rotate(-90,24,160)">ENABLERS</text>

          {/* AI Itself - full width at top */}
          <g transform="translate(53,5)">
            <Box name="AI Itself" width={1355} height={42} layer="enablers" votes={4} starred subtitle="TOP PRIORITY" />
          </g>

          {/* Imminent */}
          <g transform="translate(53,52)">
            <Box name="Dynamic Bayesian" width={142} height={36} layer="enablers" votes={1} />
            <Box name="Active Inference" width={142} height={36} x={147} layer="enablers" votes={2} />
            <Box name="Incentive Systems" width={142} height={36} x={294} layer="enablers" votes={2} />
            <Box name="Agent Protocols" width={142} height={36} y={41} layer="enablers" votes={2} />
            <Box name="Neurosymbolic AI" width={142} height={36} x={147} y={41} layer="enablers" votes={1} />
            <Box name="Bio/Neuro-informed" width={142} height={36} x={294} y={41} layer="enablers" votes={2} />
            <Box name="Open-access / Data Ecosystems" width={218} height={36} y={82} layer="enablers" votes={2} />
            <Box name="Modularisation / Multi-agent" width={213} height={36} x={223} y={82} layer="enablers" votes={2} />
          </g>

          {/* Near Future */}
          <g transform="translate(523,52)">
            <Box name="RL for TEXT" width={210} height={42} layer="enablers" votes={4} starred subtitle="TOP PRIORITY" />
            <Box name="World Models" width={210} height={42} x={215} layer="enablers" votes={4} starred subtitle="TOP PRIORITY" />
            <Box name="Cyber-physical Infrastructure" width={210} height={36} y={47} layer="enablers" votes={3} />
            <Box name="Evolutionary Algorithms" width={210} height={36} x={215} y={47} layer="enablers" votes={1} />
            <Box name="Multi-level Abstraction" width={142} height={36} y={88} layer="enablers" votes={2} />
            <Box name="Graph-neural Networks" width={142} height={36} x={147} y={88} layer="enablers" votes={2} />
            <Box name="Classical ML" width={131} height={36} x={294} y={88} layer="enablers" votes={2} />
            <Box name="New Tech: Bio, DNA, Rare Earth" width={210} height={36} y={129} layer="enablers" votes={2} />
            <Box name="Diffraction Photonics" width={210} height={36} x={215} y={129} layer="enablers" votes={2} />
            <Box name="Control & Cyber-Physical" width={210} height={36} y={170} layer="enablers" votes={2} />
          </g>

          {/* Far Future */}
          <g transform="translate(983,52)">
            <Box name="Protein/DNA Computation" width={210} height={36} layer="enablers" votes={1} />
            <Box name="Biological Computing" width={210} height={36} x={215} layer="enablers" votes={2} />
            <Box name="Quantum ML: Hybrid HPC-QC, Cloud QC, Modularisation" width={425} height={36} y={41} layer="enablers" votes={0} />
          </g>

          {/* Foundational spanning all - two separate boxes with increased gap */}
          <g transform="translate(53,270)">
            <Box name="AI Triad: Compute, Data, Algorithms" width={670} height={40} layer="enablers" votes={2} isFoundational />
            <Box name="Sector-Specific Modular AI Systems" width={670} height={40} x={685} layer="enablers" votes={2} isFoundational />
          </g>
        </g>

        {/* KEY ACTORS ROW */}
        <g transform="translate(45,730)">
          <rect width="48" height="160" rx="4" fill="#FDE68A"/>
          <text x="24" y="80" textAnchor="middle" fill="#1e293b" fontSize="11" fontWeight="700" transform="rotate(-90,24,80)">KEY ACTORS</text>

          <g transform="translate(53,5)">
            {/* Row 1: Spanning actors */}
            <rect width="1355" height="32" rx="3" fill="#FDE68A"/>
            <text x="678" y="21" textAnchor="middle" fill="#1e293b" fontSize="10">Web/Platform Users • Chip/Infra Providers • Governments • Cyber Criminal / Malicious Actors • Research Institutions • Data Platforms • Industries (not AI) • Philanthropies</text>

            {/* Row 2 */}
            <rect y="37" width="1355" height="32" rx="3" fill="#FDE68A"/>
            <text x="678" y="58" textAnchor="middle" fill="#1e293b" fontSize="10">Public / Crowd • Public Opinion / Media • AI Pirates • DIY Hackers / OSS • Start-ups & VCs • Ethicists & Bodies • Regulators • Educators • Multinationals / Startups</text>

            {/* Row 3: Frontier AI Developers (Imminent + Near Future) - Blue Moderate */}
            <rect y="74" width="895" height="36" rx="3" fill="#93C5FD"
              onMouseEnter={(e) => {
                setHoveredItem("Frontier AI Developers");
                setMousePos({ x: e.clientX, y: e.clientY });
              }}
              onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setHoveredItem(null)}
              style={{ cursor: 'pointer' }}
              className="transition-opacity hover:opacity-80"
            />
            <text x="447" y="97" textAnchor="middle" fill="#1e293b" fontSize="10" style={{ pointerEvents: 'none' }}>Frontier AI Developers</text>
            {/* Vote dots */}
            <circle cx="885" cy="84" r="3" fill="#1e293b" opacity="0.5" style={{ pointerEvents: 'none' }} />
            <circle cx="876" cy="84" r="3" fill="#1e293b" opacity="0.5" style={{ pointerEvents: 'none' }} />

            {/* Google etc (Far Future only) */}
            <rect x="930" y="74" width="425" height="36" rx="3" fill="#FDE68A"/>
            <text x="1143" y="97" textAnchor="middle" fill="#1e293b" fontSize="10">Google • Nu quantum • Algorithmy</text>

            {/* AI Societies (Far Future only) - Yellow */}
            <rect x="930" y="115" width="425" height="36" rx="3" fill="#FDE68A"
              onMouseEnter={(e) => {
                setHoveredItem("AI Societies");
                setMousePos({ x: e.clientX, y: e.clientY });
              }}
              onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setHoveredItem(null)}
              style={{ cursor: 'pointer' }}
              className="transition-opacity hover:opacity-80"
            />
            <text x="1143" y="138" textAnchor="middle" fill="#1e293b" fontSize="10" style={{ pointerEvents: 'none' }}>AI Societies</text>
            {/* Vote dots */}
            <circle cx="1345" cy="125" r="3" fill="#1e293b" opacity="0.5" style={{ pointerEvents: 'none' }} />
            <circle cx="1336" cy="125" r="3" fill="#1e293b" opacity="0.5" style={{ pointerEvents: 'none' }} />
          </g>
        </g>

        {/* Footer */}
        <text x="750" y="920" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="11">AI Landscape • NETINTEL • SI Units Ltd • February 2026</text>

        {/* Legend - matching v15 */}
        <g transform="translate(50, 905)">
          <text x="0" y="0" fill="rgba(255,255,255,0.4)" fontSize="9">Signal strength:</text>
          <rect x="85" y="-10" width="40" height="14" rx="2" fill="#C44D5A"/>
          <text x="130" y="0" fill="rgba(255,255,255,0.5)" fontSize="9">Very Strong</text>
          <rect x="205" y="-10" width="40" height="14" rx="2" fill="#D4707A"/>
          <text x="250" y="0" fill="rgba(255,255,255,0.5)" fontSize="9">Strong</text>
          <rect x="305" y="-10" width="40" height="14" rx="2" fill="#E8B4BC"/>
          <text x="350" y="0" fill="rgba(255,255,255,0.5)" fontSize="9">Moderate</text>
          <rect x="415" y="-10" width="40" height="14" rx="2" fill="#F5D5D9"/>
          <text x="460" y="0" fill="rgba(255,255,255,0.5)" fontSize="9">Weak/No Signal</text>
          <rect x="555" y="-10" width="40" height="14" rx="2" fill="#A78BFA"/>
          <text x="600" y="0" fill="rgba(255,255,255,0.5)" fontSize="9">Foundational</text>
          <text x="700" y="0" fill="rgba(255,255,255,0.4)" fontSize="9">Hover over boxes for research details</text>
        </g>
      </svg>

      {/* Hover Card */}
      {hoveredItem && (
        <HoverCard
          item={hoveredItem}
          data={researchData[hoveredItem]}
          x={mousePos.x}
          y={mousePos.y}
        />
      )}
    </div>
  );
};

export default AILandscape;
