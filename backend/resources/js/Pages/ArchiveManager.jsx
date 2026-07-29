import React, { useState } from 'react';
import { Layers, ArrowRight, Copy, Server, CheckCircle2, AlertCircle, Check, Square } from 'lucide-react';
import { router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function ArchiveManager() {
    const getMonthsPool = () => {
        const list = [];
        const anchorYear = 2026;
        const anchorMonth = 4; // May (0-indexed)
        
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        
        const futureLimitDate = new Date(currentYear, currentMonth + 12, 1);
        const totalMonths = (futureLimitDate.getFullYear() - anchorYear) * 12 + (futureLimitDate.getMonth() - anchorMonth);
        
        for (let i = 0; i <= totalMonths; i++) {
            const d = new Date(anchorYear, anchorMonth + i, 1);
            const monthName = d.toLocaleString('en-US', { month: 'long' });
            const year = d.getFullYear();
            const offset = i * 100;
            const isLive = d.getFullYear() === currentYear && d.getMonth() === currentMonth;
            
            list.push({
                name: `${monthName} ${year}`,
                offset: offset,
                status: isLive ? 'Active Pool' : 'Standby',
                isActive: isLive
            });
        }
        return list;
    };

    const monthsPool = getMonthsPool();

    // Array dictionary matching your system layouts (omitting Ch 9)
    const availableChannels = [
        { id: 1, name: 'Channel 1' },
        { id: 2, name: 'Channel 2' },
        { id: 3, name: 'Channel 3' },
        { id: 4, name: 'Channel 4' },
        { id: 5, name: 'Channel 5' },
        { id: 6, name: 'Channel 6' },
        { id: 7, name: 'Channel 7' },
        { id: 8, name: 'Channel 8' },
        { id: 10, name: 'Channel 10' },
        { id: 11, name: 'Channel 11' },
    ];

    const [sourceOffset, setSourceOffset] = useState('');
    const [targetOffset, setTargetOffset] = useState('');
    const [selectedChannels, setSelectedChannels] = useState([]); // Array tracks active channel IDs
    const [copyWholeMonth, setCopyWholeMonth] = useState(true); // Default behavior clones everything
    const [isLoading, setIsLoading] = useState(false);
    const [operationLogs, setOperationLogs] = useState([]);

    // Checkbox selector matrix handler logic
    const toggleChannelSelection = (id) => {
        if (selectedChannels.includes(id)) {
            setSelectedChannels(selectedChannels.filter(item => item !== id));
        } else {
            setSelectedChannels([...selectedChannels, id]);
        }
    };

    const handleCloneExecution = async () => {
        if (!sourceOffset || !targetOffset) {
            alert('Please select both source and target partitions.');
            return;
        }

        if (sourceOffset === targetOffset) {
            alert('Source and target partitions cannot be identical.');
            return;
        }

        if (!copyWholeMonth && selectedChannels.length === 0) {
            alert('Please select at least one channel to replicate or choose Whole Month Data.');
            return;
        }

        const sourceMonthName = monthsPool.find(m => m.offset === parseInt(sourceOffset))?.name;
const targetMonthName = monthsPool.find(m => m.offset === parseInt(targetOffset))?.name;
        
        const scopeLabel = copyWholeMonth 
            ? 'the ENTIRE month data (All Channels)' 
            : `Channels [${selectedChannels.join(', ')}]`;

        const confirmCheck = window.confirm(
            `Confirm Data Replication:\n\nThis will clear existing matching slots in [${targetMonthName}] and copy templates for ${scopeLabel} from [${sourceMonthName}].\n\nAre you sure you want to proceed?`
        );

        if (!confirmCheck) return;

        setIsLoading(true);
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        // Build Payload
        // Prepare the payload object data
        const payload = {
            source_offset: sourceOffset,
            target_offset: targetOffset,
            channels: copyWholeMonth ? 'all' : selectedChannels
        };


// Dispatch the secure request via Inertia's Form Router
router.post('/schedule-library/clone-month', payload, {
    onStart: () => setIsLoading(true),
    onFinish: () => setIsLoading(false),
    onSuccess: () => {
        setOperationLogs(prev => [
            `[${timestamp}] Success: Replicated template layout configuration to ${targetMonthName} smoothly.`,
            ...prev
        ]);
    },
    onError: (errors) => {
        setOperationLogs(prev => [
            `[${timestamp}] Operational Failure: ${Object.values(errors).join(', ')}`,
            ...prev
        ]);
    }
});
    };

    return (
        <AuthenticatedLayout>
        <div className="min-h-screen bg-[#0b0f19] text-slate-200 p-8 antialiased">
            {/* Header Block */}
            <div className="mb-8 border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2.5">
                        <Layers className="w-5 h-5 text-indigo-500" />
                        Schedule Archive Manager
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Batch replicate entire monthly frameworks or isolate individual broadcast channels.
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full self-start md:self-auto">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-medium text-emerald-400 tracking-wide uppercase">System Connected</span>
                </div>
            </div>

            {/* Content Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Side Partition Overview */}
                <div className="lg:col-span-2 bg-[#111827]/60 border border-slate-800/80 rounded-xl p-6 shadow-sm self-start">
                    <h2 className="text-sm font-medium tracking-wide text-slate-300 mb-5 flex items-center gap-2">
                        <Server className="w-4 h-4 text-slate-400" /> Data Partitions Directory
                    </h2>
                    
                    <div className="space-y-3">
                        {monthsPool.map((month) => (
                            <div key={month.offset} className="flex items-center justify-between border border-slate-800/60 bg-[#151f32]/40 p-4 rounded-xl hover:bg-[#151f32]/80 transition-all duration-200">
                                <div className="flex items-center gap-4">
                                    <div className="bg-[#0b0f19] border border-slate-800 font-mono text-xs text-slate-400 px-3 py-1.5 rounded-lg shadow-inner">
                                        Offset +{month.offset}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-white">{month.name}</div>
                                        <div className="text-xs text-slate-400 mt-0.5">Cycle Day Range: {month.offset + 1} – {month.offset + 31}</div>
                                    </div>
                                </div>
                                <span className={`text-xs px-3 py-1 rounded-full font-medium ${month.isActive ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400' : 'bg-slate-800/40 border border-slate-800 text-slate-400'}`}>
                                    {month.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side Tools Container */}
                <div className="flex flex-col gap-6">
                    <div className="bg-[#111827]/60 border border-slate-800/80 rounded-xl p-6 shadow-sm flex flex-col">
                        <h2 className="text-sm font-medium tracking-wide text-slate-300 mb-5 flex items-center gap-2">
                            <Copy className="w-4 h-4 text-slate-400" /> Replication Control Configurator
                        </h2>

                        <div className="space-y-4 flex-1">
                            {/* Partition Selectors */}
                            <div className="grid grid-cols-1 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Source Month (Copy From)</label>
                                    <select 
                                        value={sourceOffset}
                                        onChange={(e) => setSourceOffset(e.target.value)}
                                        className="w-full bg-[#0b0f19] border border-slate-800 text-slate-200 p-3 rounded-lg text-xs font-medium focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                                    >
                                        <option value="">Select source database pool...</option>
                                        {monthsPool.map(m => <option key={m.offset} value={m.offset}>{m.name}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Target Destination (Deploy To)</label>
                                    <select 
                                        value={targetOffset}
                                        onChange={(e) => setTargetOffset(e.target.value)}
                                        className="w-full bg-[#0b0f19] border border-slate-800 text-slate-200 p-3 rounded-lg text-xs font-medium focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                                    >
                                        <option value="">Select target allocation...</option>
                                        {monthsPool.map(m => <option key={m.offset} value={m.offset}>{m.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Scope Toggle: Whole Month vs Channel Select */}
                            <div className="border-t border-slate-800/60 pt-4">
                                <label className="block text-xs font-medium text-slate-400 mb-3">Replication Scope</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setCopyWholeMonth(true)}
                                        className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${copyWholeMonth ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-400 font-semibold' : 'bg-[#0b0f19] border-slate-800 text-slate-400 hover:text-slate-200'}`}
                                    >
                                        Whole Month Data
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCopyWholeMonth(false)}
                                        className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${!copyWholeMonth ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-400 font-semibold' : 'bg-[#0b0f19] border-slate-800 text-slate-400 hover:text-slate-200'}`}
                                    >
                                        Select Channels
                                    </button>
                                </div>
                            </div>

                            {/* Multi-Select Channel Grid Subpanel */}
                            {!copyWholeMonth && (
                                <div className="bg-[#0b0f19] border border-slate-800/80 rounded-lg p-3.5 space-y-2 animate-fadeIn">
                                    <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">Isolate Channels</label>
                                    <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                                        {availableChannels.map((ch) => {
                                            const active = selectedChannels.includes(ch.id);
                                            return (
                                                <button
                                                    key={ch.id}
                                                    type="button"
                                                    onClick={() => toggleChannelSelection(ch.id)}
                                                    className={`flex items-center gap-2.5 p-2 rounded-md text-left text-xs transition-all border ${active ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-[#111827]/30 border-slate-900 text-slate-400 hover:text-slate-300'}`}
                                                >
                                                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${active ? 'bg-indigo-500 border-indigo-400 text-white' : 'border-slate-700 bg-slate-950'}`}>
                                                        {active && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                                    </div>
                                                    <span className="font-medium truncate">{ch.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3 flex gap-3 mt-1">
                                <AlertCircle className="w-4 h-4 text-amber-500/80 shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-300/70 leading-relaxed">
                                    <strong>Overwrite Warning:</strong> Replicating layout indices automatically drops legacy schedules inside destination month windows matching chosen parameters.
                                </p>
                            </div>

                            <button
                                onClick={handleCloneExecution}
                                disabled={isLoading}
                                className={`w-full py-3 rounded-lg text-xs font-semibold transition-all tracking-wide shadow-sm ${isLoading ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
                            >
                                {isLoading ? 'Processing Ingest Pipeline...' : 'Run Replication'}
                            </button>
                        </div>
                    </div>

                    {/* Operational Activity Feedback Feed */}
                    <div className="bg-[#111827]/60 border border-slate-800/80 rounded-xl p-6 shadow-sm flex flex-col flex-1">
                        <h3 className="text-xs font-medium tracking-wide text-slate-400 mb-3 uppercase">Activity Logs</h3>
                        <div className="bg-[#0b0f19] border border-slate-800/60 rounded-lg p-4 font-sans text-xs text-slate-300 flex-1 min-h-[140px] max-h-[200px] overflow-y-auto space-y-2.5">
                            {operationLogs.length === 0 ? (
                                <div className="text-slate-500 italic text-center pt-8">No transaction loops recorded.</div>
                            ) : (
                                operationLogs.map((log, index) => (
                                    <div key={index} className="flex gap-2.5 items-start text-slate-300 border-b border-slate-800/30 pb-2 last:border-0 last:pb-0">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                                        <span className="leading-normal font-sans text-[11px]">{log}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
        </AuthenticatedLayout>
    );
}