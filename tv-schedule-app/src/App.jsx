import React, { useState, useEffect } from 'react';
import { Clock, PlayCircle, Calendar, Search, Monitor } from 'lucide-react';

const App = () => {
const [scheduleData, setScheduleData] = useState([]); // Initialize as empty array
const [loading, setLoading] = useState(true);
const [searchTerm, setSearchTerm] = useState('');
useEffect(() => {
  fetch('http://127.0.0.1:8000/api/schedule')
    .then(res => {
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    })
    .then(data => {
      // Ensure we are setting an array even if the API fails
      setScheduleData(Array.isArray(data) ? data : []);
      setLoading(false);
    })
    .catch(err => {
      console.error("Fetch error:", err);
      setLoading(false);
    });
}, []);

// 1. Loading State
if (loading) {
  return <div className="min-h-screen bg-slate-950 text-blue-500 flex items-center justify-center font-mono">INITIALIZING SYSTEM_V4...</div>;
}

// UPDATED: Added safety check for item.title
  const filteredSchedule = scheduleData?.filter(item => 
    (item.title || "").toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8">
      {/* Top Navigation / Dashboard Header */}
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <div className="flex items-center gap-2 text-blue-500 mb-2">
            <Monitor size={20} />
            <span className="font-black tracking-[0.3em] text-xs">SYSTEM V4 / BROADCAST</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">TV Schedule <span className="text-slate-500">Monitor</span></h1>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Search programs..."
            className="bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-10 pr-6 w-full md:w-80 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all backdrop-blur-sm"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-5xl mx-auto">
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md">
          <div className="divide-y divide-slate-800/50">
            {filteredSchedule.map((item) => (
              <div 
                key={item.id} 
                className={`flex flex-col md:flex-row md:items-center p-6 transition-all hover:bg-slate-800/30 ${
                  item.status === 'live' ? 'bg-blue-600/5 border-l-4 border-l-blue-500' : 'opacity-70'
                }`}
              >
                {/* Time Section */}
                <div className="w-32 flex-shrink-0 mb-2 md:mb-0">
                  <div className={`text-xl font-mono ${item.status === 'live' ? 'text-blue-400 font-bold' : 'text-slate-400'}`}>
                    {item.time}
                  </div>
                </div>

                {/* Info Section */}
                <div className="flex-grow">
                  <h2 className="text-lg font-bold tracking-wide uppercase">{item.title}</h2>
                  <p className="text-slate-500 text-sm font-medium">{item.episode}</p>
                </div>

                {/* Status Section */}
                <div className="mt-4 md:mt-0 flex-shrink-0">
                  {item.status === 'live' ? (
                    <div className="flex items-center gap-3">
                       <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                      </span>
                      <span className="bg-blue-500 text-white text-[10px] font-black px-3 py-1 rounded-md tracking-tighter">LIVE NOW</span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-3 py-1 border border-slate-800 rounded-md">
                      {item.status === 'finished' ? 'Playback Finished' : 'Queueing'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Info (Reflecting your system specialist background) */}
        <div className="mt-8 flex justify-between items-center text-slate-600 text-[10px] font-mono tracking-widest uppercase">
          <span>Location: Malaysia Central Node</span>
          <span>Last Sync: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};

export default App;