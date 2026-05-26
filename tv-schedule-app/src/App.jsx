import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Clock, PlayCircle, Calendar, Search, Monitor, Activity, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import ChannelLandingPage from './ChannelLandingPage'; // Import your new page component

const App = () => {
    // ---- Global State Drivers ----
    // Set to null by default so the landing page displays first
    const [activeChannel, setActiveChannel] = useState(null); 
    const [scheduleData, setScheduleData] = useState([]);
    const [loading, setLoading] = useState(false); // Set to false initially since landing page doesn't API fetch
    const [searchTerm, setSearchTerm] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());
    const liveRef = useRef(null);

    const scrollToLive = () => {
        liveRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    };

    // 1. Sync Clock every second for the Live Indicator
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // 2. Fetch data based on selected Channel
    const fetchData = async () => {
        if (!activeChannel) return; // Don't fetch if we are on the landing page index
        
        try {
            const res = await axios.get(`http://127.0.0.1:8000/api/schedule/${activeChannel}`);
            setScheduleData(Array.isArray(res.data) ? res.data : []);
            setLoading(false);
        } catch (err) {
            console.error("System V4 Sync Error:", err);
            setLoading(false);
        }
    };

    // Trigger loading state and fetch logic only when an active channel is picked
    useEffect(() => {
        if (activeChannel) {
            setLoading(true);
            fetchData();
            const syncInterval = setInterval(fetchData, 30000); // Auto-refresh every 30s
            return () => clearInterval(syncInterval);
        } else {
            // Clear prior dataset memory if heading back to index
            setScheduleData([]);
        }
    }, [activeChannel]);

    // 3. Process Schedule with Live Status
    const processedSchedule = useMemo(() => {
        const nowStr = currentTime.toLocaleTimeString('en-GB', { hour12: false });
        
        return scheduleData.map(item => {
            let status = 'queueing';
            if (nowStr >= item.start_time && nowStr <= item.end_time) {
                status = 'live';
            } else if (nowStr > item.end_time) {
                status = 'finished';
            }
            return { ...item, calculatedStatus: status };
        }).filter(item => 
            item.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [scheduleData, searchTerm, currentTime]);

    // ---- VIEW ROUTER CONDITIONAL ----
    
    // CONDITION A: Render the Premium Showcase Index if no channel is selected
    if (activeChannel === null) {
        return (
            <ChannelLandingPage 
                onChannelSelect={(channelNumericId) => {
                    setActiveChannel(channelNumericId);
                }} 
            />
        );
    }
        const channelnamearray = {
        1: "VIV PRIME",
        2: "VIV ACTION",
        3: "VIV DRAMA",
        4: "VIV EASY",
        5: "VIV CHOICE",
        6: "VIV VARIETY",
        7: "VIV WORLD",
        8: "VIV MOSAIC",
        9: "VIV KIDS",
        10: "VIV ASIA",
        11: "VIV EAST"
    };
    // CONDITION B: Render System Loader if an API stream sync is running
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 text-blue-500 flex flex-col items-center justify-center font-mono gap-4">
                <Activity className="animate-pulse" size={48} />
                <span className="tracking-[0.5em] animate-pulse">SYNC_CHANNEL_{String(activeChannel).padStart(2, '0')}_MATRIX...</span>
            </div>
        );
    }

    // CONDITION C: Render the Dedicated Channel Schedule Dashboard
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8">
            {/* Floating Jump to Live Button */}
            {processedSchedule.some(item => item.calculatedStatus === 'live') && (
                <button 
                    onClick={scrollToLive}
                    className="fixed bottom-8 right-8 z-50 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.5)] flex items-center gap-2 font-bold tracking-tighter transition-all hover:scale-105 active:scale-95 border border-blue-400"
                >
                    <Activity size={18} className="animate-pulse" />
                    JUMP TO LIVE
                </button>
            )}
            
            <div className="max-w-6xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        {/* Dynamic Back Navigation Action Node */}
                        <button 
                            onClick={() => setActiveChannel(null)}
                            className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white mb-4 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded transition-colors group"
                        >
                            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                            RETURN TO NETWORK INDEX
                        </button>

                        <div className="flex items-center gap-2 text-blue-500 mb-2">
                            <Monitor size={20} />
                            <span className="font-black tracking-[0.3em] text-xs uppercase">
                                Broadcast Node: CH_{String(activeChannel).padStart(2, '0')} // KUL_CENTRAL
                            </span>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight">VIVTV <span className="text-slate-500">Schedule</span></h1>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <div className="text-2xl font-mono font-bold text-blue-400">
                            {currentTime.toLocaleTimeString('en-GB')}
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input 
                                type="text"
                                placeholder="Search Channel Buffer..."
                                className="bg-slate-900/80 border border-slate-800 rounded-lg py-2 pl-10 pr-4 w-64 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Structured Channel Quick Switch Tab Rail (Two Rows) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 gap-3 mb-8 border-b border-slate-800/50 pb-6">
                    {[...Array(11)]
                        .map((_, i) => i + 1)            // Convert to true Channel IDs: [1, 2, 3, ..., 11]
                        .filter((id) => id !== 9)         // CRITICAL EXCLUSION: Drops Channel 9 entirely
                        .map((channelId) => (
                            <button
                                key={channelId}
                                onClick={() => setActiveChannel(channelId)}
                                className={`px-4 py-3 rounded-xl text-xs font-medium tracking-tight transition-all border text-center ${
                                    activeChannel === channelId 
                                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_15px_rgba(79,70,229,0.25)]' 
                                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                                }`}
                            >
                                {channelnamearray[channelId] || `Channel ${channelId}`}
                            </button>
                        ))}
                </div>

                {/* Schedule List Workspace */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="divide-y divide-slate-800/40">
                        {processedSchedule.length === 0 ? (
                            <div className="p-10 text-center text-sm font-mono text-slate-500">
                                NO LOGICAL STREAM METADATA IN BUFFER RESOURCE TARGETS.
                            </div>
                        ) : (
                            processedSchedule.map((item) => (
                                <div 
                                    key={item.id} 
                                    ref={item.calculatedStatus === 'live' ? liveRef : null}
                                    className={`flex flex-col md:flex-row md:items-center p-5 transition-all ${
                                        item.calculatedStatus === 'live' 
                                        ? 'bg-blue-600/10 border-l-4 border-l-blue-500 shadow-[inset_10px_0_30px_rgba(37,99,235,0.1)]' 
                                        : 'opacity-60'
                                    }`}
                                >
                                    {/* Time Cell */}
                                    <div className="w-40 shrink-0">
                                        <div className={`text-xl font-mono ${item.calculatedStatus === 'live' ? 'text-blue-400 font-bold' : 'text-slate-500'}`}>
                                            {item.start_time.substring(0, 5)} 
                                            <span className="text-[10px] ml-1 opacity-50">-{item.end_time.substring(0, 5)}</span>
                                        </div>
                                    </div>

                                    {/* Title Cell */}
                                    <div className="flex-grow py-2 md:py-0">
                                        <h2 className={`text-lg font-bold tracking-wide uppercase ${item.calculatedStatus === 'live' ? 'text-white' : 'text-slate-300'}`}>
                                            {item.title}
                                        </h2>
                                        <div className="flex gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-1">
                                            <span>
                                                DUR: {(() => {
                                                    const totalSeconds = parseInt(item.duration_seconds) || 0;
                                                    const mins = Math.floor(totalSeconds / 60);
                                                    const secs = totalSeconds % 60;
                                                    return `${mins}m ${secs}s`;
                                                })()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Status Cell */}
                                    <div className="shrink-0 flex items-center gap-4">
                                        {item.calculatedStatus === 'live' ? (
                                            <div className="flex items-center gap-3 bg-blue-500/20 px-3 py-1.5 rounded-lg border border-blue-500/30">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                                </span>
                                                <span className="text-blue-400 text-[10px] font-black tracking-widest uppercase">Streaming</span>
                                            </div>
                                        ) : (
                                            <span className={`text-[9px] font-bold px-3 py-1 rounded border ${
                                                item.calculatedStatus === 'finished' 
                                                ? 'border-slate-800 text-slate-700 bg-slate-900/50' 
                                                : 'border-slate-700 text-slate-500'
                                            }`}>
                                                {item.calculatedStatus === 'finished' ? 'COMPLETED' : 'STANDBY'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Footer Metadata */}
                <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-600 text-[9px] font-mono tracking-widest uppercase border-t border-slate-900 pt-6">
                    <div className="flex gap-6">
                        <span>Database: MySQL_Production</span>
                        <span>Node: {window.location.hostname}</span>
                    </div>
                    <span>System v4.0.2 / Encryption: AES-256-Active</span>
                </div>
            </div>
        </div>
    );
};

export default App;