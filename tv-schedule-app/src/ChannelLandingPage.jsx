import React from 'react';

// Premium imagery & configuration mapping matching the network layout
const CHANNEL_GROUPS = [
  {
    category: "Blockbuster",
    colorTheme: "from-amber-500/20 to-transparent",
    borderTheme: "group-hover:border-amber-500/50",
    badgeTheme: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    glowDot: "bg-amber-500",
    channels: [
      { id: 1, name: "VIV PRIME", code: "VIV-PRM", tagline: "Premium Movies & Premieres", bgImage: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop" },
      { id: 2, name: "VIV ACTION", code: "VIV-ACT", tagline: "High-Octane Action & Thrillers", bgImage: "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=600&auto=format&fit=crop" },
      { id: 3, name: "VIV DRAMA", code: "VIV-DRM", tagline: "Intense Series & Drama", bgImage: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop" },
      { id: 4, name: "VIV EASY", code: "VIV-ESY", tagline: "Light Comedies & Sitcoms", bgImage: "https://images.unsplash.com/photo-1543536448-d209d2d13a1c?q=80&w=600&auto=format&fit=crop" },
      { id: 5, name: "VIV CHOICE", code: "VIV-CHM", tagline: "Fan Favorites & Award Winners", bgImage: "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=600&auto=format&fit=crop" },
      { id: 6, name: "VIV VARIETY", code: "VIV-VAR", tagline: "Unscripted Entertainment", bgImage: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop" },
    ]
  },
  {
    category: "Documentary",
    colorTheme: "from-cyan-500/20 to-transparent",
    borderTheme: "group-hover:border-cyan-500/50",
    badgeTheme: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    glowDot: "bg-cyan-500",
    channels: [
      { id: 7, name: "VIV WORLD", code: "VIV-WLD", tagline: "Global Culture & Nature", bgImage: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=600&auto=format&fit=crop" },
      { id: 8, name: "VIV MOSAIC", code: "VIV-MSC", tagline: "History, Science, Docs", bgImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop" },
    ]
  },
  {
    category: "Asia",
    colorTheme: "from-purple-500/20 to-transparent",
    borderTheme: "group-hover:border-purple-500/50",
    badgeTheme: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    glowDot: "bg-purple-500",
    channels: [
      { id: 10, name: "VIV ASIA", code: "VIV-ASA", tagline: "Regional Hits & Pan-Asian", bgImage: "https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=600&auto=format&fit=crop" },
      { id: 11, name: "VIV EAST", code: "VIV-EST", tagline: "Premium Far-East Entertainment", bgImage: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=600&auto=format&fit=crop" },
    ]
  }
];

export default function ChannelLandingPage({ onChannelSelect }) {
  return (
    <div className="min-h-screen bg-[#070d19] text-slate-100 font-sans relative overflow-x-hidden selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Dynamic Background Matrix Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-[#070d19] to-[#050810] z-0 pointer-events-none" />
      
      {/* Global Application Nav Bar */}
      <nav className="relative z-10 border-b border-slate-800/60 bg-[#070d19]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 font-black text-white tracking-tighter text-sm">
            V
          </div>
          <span className="text-lg font-black tracking-wider text-white">VIV TV <span className="text-slate-500 font-light text-xs ml-2">// NETWORK INDEX</span></span>
        </div>
        
        {/* Real-time system telemetry clock */}
        <div className="hidden md:flex items-center gap-4 text-xs font-mono text-slate-400 bg-slate-900/60 px-4 py-1.5 rounded-full border border-slate-800/80">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>19 MAY 2026 16:05 KUL</span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400 font-bold">SYS: OK</span>
        </div>

        {/* Global Navigation Nodes */}
        <div className="flex items-center gap-1 font-mono text-xs">
          <button className="px-3 py-1.5 text-cyan-400 border-b-2 border-cyan-500 font-medium">LIVE BROADCAST</button>
          <button className="px-3 py-1.5 text-slate-400 hover:text-white transition-colors">SCHEDULES</button>
          <button className="px-3 py-1.5 text-slate-400 hover:text-white transition-colors">ARCHIVES</button>
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto p-6 md:p-8 relative z-10 space-y-8">
        
        {/* Cinematic Welcome Marquee Header */}
        <header className="text-center md:text-left py-4">
          <h2 className="text-xs font-mono tracking-[0.25em] text-cyan-400 uppercase font-bold mb-2">
            Discover the VIV Universe
          </h2>
          <p className="text-2xl md:text-3xl font-light text-slate-300 tracking-tight">
            Premium Broadcast Networks <span className="text-slate-600 font-normal">|</span> <span className="text-sm text-slate-400 font-mono inline-block align-middle">CHOOSE A CHANNEL TO VIEW FULL SCHEDULE</span>
          </p>
        </header>

        {/* Core Content Grid Configured structurally exactly like file "13128754613783679867.jpeg" */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Column: Huge 6-Card Blockbuster Workspace */}
          <div className="lg:col-span-2 space-y-6">
            {CHANNEL_GROUPS.filter(g => g.category === "Blockbuster").map((group) => (
              <div key={group.category} className="bg-[#0b1325]/70 border border-slate-800/80 rounded-xl p-5 shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-6 border-b border-slate-800/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${group.glowDot} shadow-[0_0_8px_currentColor]`}></span>
                    <h3 className="font-mono font-bold tracking-widest text-white text-sm uppercase">{group.category}</h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">SYS_STATUS: <span className="text-emerald-400 font-bold">ONLINE</span> &nbsp;//&nbsp; ACTIVE NODES: 06</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {group.channels.map((channel) => (
                    <ChannelCard key={channel.id} channel={channel} group={group} onSelect={onChannelSelect} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Stacked Sidebar for Secondary Categories (Documentary & Asia) - FIXED VARIANT LOOKUP */}
          <div className="space-y-6">
            {CHANNEL_GROUPS.filter(g => g.category !== "Blockbuster").map((group) => (
              <div key={group.category} className="bg-[#0b1325]/70 border border-slate-800/80 rounded-xl p-5 shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-4 border-b border-slate-800/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${group.glowDot} shadow-[0_0_8px_currentColor]`}></span>
                    <h3 className="font-mono font-bold tracking-widest text-white text-sm uppercase">{group.category}</h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">ACTIVE NODES: 02</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {group.channels.map((channel) => (
                    <ChannelCard key={channel.id} channel={channel} group={group} onSelect={onChannelSelect} />
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

// Stylized sub-component for the card rendering logic
function ChannelCard({ channel, group, onSelect }) {
  return (
    <button
      onClick={() => onSelect?.(channel.id)}
      className="group relative h-56 w-full rounded-lg overflow-hidden border border-slate-800/90 bg-slate-900 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
    >
      {/* Background Graphic Image Overlay with Blur-Fade Aspect */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
        style={{ backgroundImage: `url(${channel.bgImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#090f1c] via-[#090f1c]/70 to-transparent z-10" />
      
      {/* Interactive Bottom Glow Layer */}
      <div className={`absolute inset-0 bg-gradient-to-b ${group.colorTheme} opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10`} />
      
      {/* Outer Glow Border Accent */}
      <div className={`absolute inset-0 border border-transparent ${group.borderTheme} rounded-lg transition-colors duration-300 z-30 pointer-events-none`} />

      {/* Content Stack */}
      <div className="absolute inset-0 p-4 flex flex-col justify-between z-20">
        
        {/* Top-line Meta Badge */}
        <div className="flex justify-end">
          <span className={`text-[9px] font-mono px-2 py-0.5 border rounded backdrop-blur-sm ${group.badgeTheme}`}>
            {channel.code}
          </span>
        </div>

        {/* Info Blocks */}
        <div className="space-y-2">
          <div>
            <h4 className="text-lg font-black tracking-wide text-white group-hover:text-cyan-300 transition-colors">
              {channel.name}
            </h4>
            {/* FIXED EXTRANEOUS CLOSE TAG TYPO HERE */}
            <p className="text-xs text-slate-300/90 line-clamp-1 font-light tracking-wide mt-0.5">
              {channel.tagline}
            </p> 
          </div>

          {/* Premium UI Dynamic Action Node Button */}
          <div className="pt-2 border-t border-slate-800/40 opacity-90 group-hover:opacity-100 transition-opacity">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-mono tracking-wider text-slate-400 group-hover:text-white uppercase transition-colors bg-slate-950/80 px-2.5 py-1.5 rounded border border-slate-800/80 w-full justify-between">
              <span>Explore Schedule</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>
        </div>

      </div>
    </button>
  );
}