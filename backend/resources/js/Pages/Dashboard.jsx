import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// --- TACTICAL MONITOR CARD ---
const ChannelMonitor = ({ ch, live, next, currentTime }) => {
    
    // 1. Determine if we are in "Filler" mode
    const isFiller = !live && next;
    
    const calculateProgress = () => {
        // If live, calculate normally
        if (live?.start_time && live?.end_time) {
            const today = new Date().toISOString().split('T')[0];
            const start = new Date(`${today}T${live.start_time}`).getTime();
            const end = new Date(`${today}T${live.end_time}`).getTime();
            const now = new Date().getTime();
            return Math.min(Math.max(((now - start) / (end - start)) * 100, 0), 100);
        }

        // 2. FILLER PROGRESS: Calculate distance to the next show
        if (isFiller) {
            const today = new Date().toISOString().split('T')[0];
            const nextStart = new Date(`${today}T${next.start_time}`).getTime();
            const now = new Date().getTime();
            
            // We'll assume a "Filler" is a 5-minute countdown or based on the last known end time
            // For now, let's just show it as an "Incoming" pulse
            return 100; // Keep it full or animate it differently
        }

        return 0;
    };
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
    const progress = calculateProgress();

    return (
        <div className={`bg-slate-900 border rounded shadow-sm overflow-hidden transition-colors ${isFiller ? 'border-blue-900/50' : 'border-slate-800'}`}>
            <div className="bg-slate-800/50 px-2 py-1 border-b border-slate-800 flex justify-between">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">{channelnamearray[ch] || `Channel ${ch}`}</span>
                {isFiller && <span className="text-[9px] text-blue-400 animate-pulse">● FILLER</span>}
            </div>

            <div className="p-3 space-y-3">
                <div>
                    {/* Dynamic Title: Show Filler if no live show */}
                    <h4 className={`text-[11px] font-bold truncate uppercase ${isFiller ? 'text-blue-400 italic' : 'text-amber-500'}`}>
                        {isFiller ? 'FILLER RUNNING...' : (live?.title || 'SYSTEM IDLE')}
                    </h4>
                    
                    <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
                        <span>{live?.start_time || '--:--'}</span>
                        <span>{isFiller ? next.start_time : (live?.end_time || '--:--')}</span>
                    </div>
                    
                    {/* Progress Bar: Blue for Filler, Amber for Live */}
                    <div className="w-full bg-slate-800 h-1 mt-1.5 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-1000 ease-linear ${isFiller ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`} 
                            style={{ width: `${isFiller ? '100' : progress}%` }} 
                        />
                    </div>
                </div>

                <div className="pt-2 border-t border-slate-800/50">
                    <p className="text-[8px] text-slate-600 uppercase font-black mb-0.5">Next Up</p>
                    <div className="flex justify-between items-center gap-2">
                        <p className="text-[10px] text-slate-400 truncate italic flex-1">
                            {next?.title || 'NO DATA'}
                        </p>
                        <span className="text-[9px] font-mono text-slate-600">
                            {next?.start_time}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function Dashboard({ auth }) {
    const { flash } = usePage().props;
    
    // 1. Initialize with empty objects to prevent "undefined" crashes
    const [monitorData, setMonitorData] = useState({ live: {}, next: {}, currentTime: '' });
    const [tick, setTick] = useState(0); // This forces the progress bars to update
    
    const getActiveOffset = () => {
        const anchorYear = 2026;
        const anchorMonth = 4; // May (0-indexed)
        const now = new Date();
        const diffMonths = (now.getFullYear() - anchorYear) * 12 + (now.getMonth() - anchorMonth);
        return Math.max(0, diffMonths * 100);
    };

    const [targetOffset, setTargetOffset] = useState(getActiveOffset());
    const { data, setData, post, processing, errors, reset } = useForm({
        channel_id: '1',
        day_cycle: '1', // Default to Day 1
        schedule_file: null,
        schedule_text: '', // New field for direct paste
    });
        // Inside your Dashboard component function: for logging and telemetry
        const [telemetryLogs, setTelemetryLogs] = useState([]);
        const [isLinkStable, setIsLinkStable] = useState(true);

        const fetchTelemetryFeed = async () => {
            try {
                const response = await axios.get('/api/telemetry/feed');
                setTelemetryLogs(response.data);
                setIsLinkStable(true);
            } catch (error) {
                console.error("Telemetry link tracking lost:", error);
                setIsLinkStable(false);
            }
        };
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
        useEffect(() => {
            // Initial fetch on view load
            fetchTelemetryFeed();

            // Auto-refresh interval (15 seconds) for real-time tracking
            const feedInterval = setInterval(fetchTelemetryFeed, 15000);

            // Cleanup link on unmount
            return () => clearInterval(feedInterval);
        }, []);
    const fetchMonitor = async () => {
        try {
            const res = await axios.get('/api/dashboard');
            setMonitorData(res.data);
        } catch (err) {
            console.error("Sync Error", err);
        }
    };
    const [importMode, setImportMode] = useState('file'); // 'file' or 'paste'

    useEffect(() => {
        fetchMonitor();
        
        // Polling API every 30s
        const dataTimer = setInterval(fetchMonitor, 30000);
        
        // Local UI Tick every 1s (for the progress bars)
        const uiTimer = setInterval(() => {
            setTick(t => t + 1);
        }, 1000);

        return () => {
            clearInterval(dataTimer);
            clearInterval(uiTimer);
        };
    }, []);

// 1. Generate month options dynamically starting from May 2026 to 12 months in the future
        const getMonthOptions = () => {
        const options = [];
        const anchorYear = 2026;
        const anchorMonth = 4; // May (0-indexed)
        
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        
        const futureLimitDate = new Date(currentYear, currentMonth + 12, 1);
        const totalMonths = (futureLimitDate.getFullYear() - anchorYear) * 12 + (futureLimitDate.getMonth() - anchorMonth);
        
        for (let i = 0; i <= totalMonths; i++) {
            const d = new Date(anchorYear, anchorMonth + i, 1);
            const monthName = d.toLocaleString('default', { month: 'long' }).toUpperCase();
            const year = d.getFullYear();
            const absoluteOffset = i * 100;
            const isLive = d.getFullYear() === currentYear && d.getMonth() === currentMonth;
            
            options.push({
                label: `${monthName} ${year}`,
                offset: absoluteOffset,
                isLive: isLive
            });
        }
        return options;
    };

    // Initialize options and state
    const monthOptions = getMonthOptions();
                // 2. Updated Submit Logic
        const submit = (e) => {
            e.preventDefault();
            
            // 1. Calculate the final number
            const finalValue = Number(targetOffset) + Number(data.day_cycle);
            
            // 2. LOG IT - If this doesn't show 101/201, targetOffset is definitely 0
            console.log("CRITICAL CHECK - Final Value:", finalValue);
            const selectedMonth = monthOptions.find(m => m.offset === targetOffset)?.label || 'UNKNOWN';

            // 3. Update the Inertia Form state MANUALLY
            // This ensures that 'data.day_cycle' is actually changed in the hook
            data.day_cycle = finalValue;

            // 4. Send the post request
            // We don't need to pass an object here because we already updated 'data'
            post(route('schedule.import'), {
                forceFormData: true,
                onSuccess: () => {
                    alert(`SUCCESS: Uploaded to Slot ${finalValue}`);
                    // Reset the value back to 1 if you want for the next upload
                    data.day_cycle = 1; 
                    addLog(`Successfully imported schedule for Channel ${data.channel_id} into Slot ${finalValue} for ${selectedMonth}` );
                },
                onError: (err) => {
                    console.log("Backend Rejected it:", err);
                    addLog(`Failed to import schedule for Channel ${data.channel_id} into Slot ${finalValue}`);
                }
            });
        };
        const [telemetry, setTelemetry] = useState([
            `[${new Date().toLocaleTimeString()}] SYS: CORE_INITIALIZED`,
            `[${new Date().toLocaleTimeString()}] NET: SCANNING_DATABASE...`
        ]);

        // Helper to add new logs
        const addLog = (msg) => {
            const timestamp = new Date().toLocaleTimeString();
            setTelemetry(prev => [`[${timestamp}] ${msg}`, ...prev].slice(0, 5)); // Keep last 5 logs
        };

    // If monitorData isn't ready, show a tactical loader so it doesn't crash
    if (!monitorData.live) return <div className="bg-black min-h-screen text-amber-500 p-10 font-mono">INITIALIZING NOC SYSTEMS...</div>;

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-black text-xl text-white leading-tight uppercase tracking-tighter">VivTech // Broadcast Control</h2>}
        >
            <Head title="NOC Dashboard" />

            <div className="bg-slate-950 min-h-screen p-6">
                <div className="max-w-full mx-auto space-y-6">
                    
                    {/* MONITOR GRID */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-2 mb-8">
                        {Array.from({ length: 11 }, (_, i) => i + 1).map(ch => (
                            <ChannelMonitor 
                                key={ch} 
                                ch={ch} 
                                live={monitorData.live[ch]} 
                                next={monitorData.next[ch]} 
                            />
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* IMPORT FORM */}
                        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-6 rounded-lg shadow-xl">
                            <h3 className="text-white font-bold mb-4 flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="p-1 bg-amber-500 text-black text-[10px] rounded font-black">CMD</span>
                                    IMPORT CONTROL
                                </div>
                                <div className="flex bg-slate-800 rounded p-0.5">
                                    <button 
                                        type="button"
                                        onClick={() => setImportMode('file')}
                                        className={`px-2 py-0.5 text-[9px] rounded ${importMode === 'file' ? 'bg-amber-500 text-black' : 'text-slate-400'}`}
                                    >FILE</button>
                                    <button 
                                        type="button"
                                        onClick={() => setImportMode('paste')}
                                        className={`px-2 py-0.5 text-[9px] rounded ${importMode === 'paste' ? 'bg-amber-500 text-black' : 'text-slate-400'}`}
                                    >PASTE</button>
                                </div>
                            </h3>
                            
                            <form onSubmit={submit} className="space-y-4">
                                {/* ROW: Channel & Day Selection */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-500">Channel</label>
                                        <select value={data.channel_id} onChange={e => setData('channel_id', e.target.value)} className="w-full bg-slate-800 text-white text-xs rounded border-slate-700">
                                            {[...Array(11)].map((_, i) => <option key={i+1} value={i+1}>{i+1} - {channelnamearray[i+1] || `Channel ${i+1}`}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-500">Group (1-12)</label>
                                        <select value={data.day_cycle} onChange={e => setData('day_cycle', e.target.value)} className="w-full bg-slate-800 text-white text-xs rounded border-slate-700">
                                            {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Day {i+1}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                            <label className="text-[10px] uppercase font-bold text-slate-500">Target Month</label>
                                        <div className="mb-4">
                                            <select 
                                                value={targetOffset} 
                                                onChange={(e) => setTargetOffset(Number(e.target.value))}
                                                className="w-full bg-slate-800 border-slate-700 text-amber-500 font-bold text-xs rounded focus:ring-amber-500"
                                            >
                                                {monthOptions.map((m) => (
                                                    <option key={m.offset} value={m.offset}>
                                                        {m.label} {m.isLive ? '(ACTIVE LIVE)' : '(BUFFER SLOTS)'}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                

                                {/* Dynamic Input: File or Textarea */}
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-500">
                                        {importMode === 'file' ? 'Source .txt' : 'Direct Playlist Paste'}
                                    </label>
                                    {importMode === 'file' ? (
                                        <input 
                                            type="file" 
                                            onChange={e => setData('schedule_file', e.target.files[0])}
                                            className="mt-1 block w-full text-[10px] text-slate-400 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-slate-700 file:text-slate-200"
                                        />
                                    ) : (
                                        <textarea 
                                            value={data.schedule_text}
                                            onChange={e => setData('schedule_text', e.target.value)}
                                            rows="6"
                                            placeholder="Paste Start time: ... text here"
                                            className="mt-1 block w-full bg-slate-800 border-slate-700 text-slate-300 rounded text-[10px] font-mono focus:border-amber-500"
                                        ></textarea>
                                    )}
                                </div>

                                <button 
                                    disabled={processing}
                                    className="w-full py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 text-white font-black text-[10px] uppercase rounded"
                                >
                                    {processing ? 'SYNCING...' : 'EXECUTE DATA SYNC'}
                                </button>
                            </form>
                        </div>

                        {/* LOGS */}
                       <div className="lg:col-span-2 bg-slate-950 border border-slate-800 p-6 rounded-lg shadow-2xl relative overflow-hidden">
                            {/* CRT Monitor Effects */}
                            {/* <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-20"></div> */}
                            <div className="absolute inset-0 pointer-events-none  bg-[length:100%_2px,3px_100%] z-20"></div>

                            <h3 className="text-white font-black mb-4 flex items-center justify-between text-[10px] tracking-[0.3em]">
                                <div className="flex items-center gap-2">
                                    <span className={`p-1 text-white text-[8px] rounded font-black ${isLinkStable ? 'bg-blue-600 animate-pulse' : 'bg-rose-600'}`}>
                                        {isLinkStable ? 'LIVE' : 'DOWN'}
                                    </span>
                                    SYSTEM LOGS
                                </div>
                                <span className="text-slate-600 font-mono text-[8px]">
                                    system logs
                                </span>
                            </h3>

                            <div className="font-sans text-[11px] space-y-1.5 relative z-10 min-h-[140px] max-h-[220px] overflow-y-auto custom-scrollbar">
                                {telemetryLogs.length > 0 ? (
                                    telemetryLogs.map((log) => {
                                        // Determine layout text color based on DB status_level column
                                        let textClass = "text-blue-400"; // default info status
                                        if (log.status_level === 'success') textClass = "text-emerald-400 font-bold";
                                        if (log.status_level === 'warning') textClass = "text-amber-500 font-bold";
                                        if (log.status_level === 'critical') textClass = "text-rose-500 font-black animate-pulse";

                                        // Format the timestamp nicely from DB string
                                        const logTime = new Date(log.created_at).toLocaleTimeString('en-US', { hour12: false });
                                        const createdat = log.created_at.slice(0, 10);
                                        return (
                                            <p key={log.id} className="tracking-tighter transition-all flex items-start gap-2">
                                                <span className="text-slate-600 select-none">[{logTime} {createdat}]</span>
                                                <span className="text-slate-500 font-black">[{log.log_type}]</span>
                                                <span className={textClass}>
                                                    {log.message} 
                                                    {/* {log.channel_name && ` | ${log.channel_name}`}  */} |
                                                    {channelnamearray[log.channel_name]}
                                                    {log.day_cycle && ` | DAY ${log.day_cycle}`}
                                                </span>
                                            </p>
                                        );
                                    })
                                ) : (
                                    <p className="text-slate-700 uppercase tracking-widest text-center pt-8 animate-pulse">
                                        &gt; INITIALIZING_PIPE_EMPTY_LOG_SET...
                                    </p>
                                )}
                            </div>
                        </div>
                   </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}