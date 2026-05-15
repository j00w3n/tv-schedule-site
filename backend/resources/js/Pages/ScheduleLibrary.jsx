import React, { useState, useEffect, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';

export default function ScheduleLibrary({ auth }) {
    const [schedules, setSchedules] = useState([]);
    const [monthOffset, setMonthOffset] = useState(0); 
    const [channelFilter, setChannelFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchSchedules = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/schedules/list', { 
                params: { 
                    offset: monthOffset,
                    channel: channelFilter,
                    search: searchQuery
                } 
            });
            // If using pagination in backend, use res.data.data
            setSchedules(res.data.data || res.data);
        } catch (err) {
            console.error("Filtering error", err);
        } finally {
            setLoading(false);
        }
    };

    // Trigger fetch when any filter changes
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchSchedules();
        }, 300); // Small debounce for search input

        return () => clearTimeout(delayDebounceFn);
    }, [monthOffset, channelFilter, searchQuery]);
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
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ title: '', start_time: '', end_time: '' });

    const startEdit = (item) => {
        setEditingId(item.id);
        setEditForm({ 
            title: item.title, 
            start_time: item.start_time, 
            end_time: item.end_time 
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
    };

    const saveEdit = async (id) => {
        try {
            await axios.put(`/api/schedules/${id}`, editForm);
            setEditingId(null);
            fetchSchedules(); // Refresh the table
        } catch (err) {
            alert("Error updating record. Check console for details.");
        }
    };
    // Ensure 'schedules' is at least an empty array to avoid .reduce errors
    const groupedSchedules = useMemo(() => {
        if (!schedules || !Array.isArray(schedules)) return {};
        
        return schedules.reduce((acc, item) => {
            const cycle = item.day_cycle;
            if (!acc[cycle]) acc[cycle] = [];
            acc[cycle].push(item);
            return acc;
        }, {});
    }, [schedules]);
    // Tracks which days are currently "Open"
        const [expandedDays, setExpandedDays] = useState([]);

        const toggleDay = (day) => {
            setExpandedDays(prev => 
                prev.includes(day) 
                    ? prev.filter(d => d !== day) 
                    : [...prev, day]
            );
        };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-bold text-xl text-white uppercase tracking-tight">Archive Explorer</h2>}
        >
            <Head title="Library" />

            <div className="bg-slate-950 min-h-screen p-6">
                <div className="max-w-full mx-auto space-y-4">
                    
                    {/* FILTER BAR */}
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg shadow-xl grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        
                        {/* Search Input */}
                        <div className="md:col-span-1">
                            <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Search Program</label>
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="E.G. MONSTER CARP..."
                                className="w-full bg-slate-800 border-slate-700 text-white text-xs rounded focus:ring-amber-500 placeholder:text-slate-600"
                            />
                        </div>

                        {/* Month Filter */}
                        <div>
                            <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Month Partition</label>
                            <select 
                                value={monthOffset}
                                onChange={(e) => setMonthOffset(parseInt(e.target.value))}
                                className="w-full bg-slate-800 border-slate-700 text-amber-500 font-bold text-xs rounded"
                            >
                                <option value="0">MAY 2026</option>
                                <option value="100">JUNE 2026</option>
                                <option value="200">JULY 2026</option>
                            </select>
                        </div>

                        {/* Channel Filter */}
                        <div>
                            <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Target Feed</label>
                            <select 
                                value={channelFilter}
                                onChange={(e) => setChannelFilter(e.target.value)}
                                className="w-full bg-slate-800 border-slate-700 text-white text-xs rounded"
                            >
                                <option value="all">ALL CHANNELS</option>
                                {[...Array(11)].map((_, i) => (
                                    <option key={i+1} value={i+1}>{channelnamearray[i+1]}</option>
                                ))}
                            </select>
                        </div>

                        {/* Reset Button */}
                        <button 
                            onClick={() => {setSearchQuery(''); setChannelFilter('all'); setMonthOffset(0);}}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-bold py-2 rounded uppercase transition-colors"
                        >
                            Reset Filters
                        </button>
                    </div>

                    {/* DATA TABLE */}
                    <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-xl overflow-hidden">
                        <div className="flex gap-2 mb-4">
                        <button 
                            onClick={() => setExpandedDays(Object.keys(schedules))} 
                            className="text-[9px] px-2 py-1 border border-slate-700 text-slate-500 hover:text-amber-500 uppercase font-bold"
                        >
                            Expand All
                        </button>
                        <button 
                            onClick={() => setExpandedDays([])} 
                            className="text-[9px] px-2 py-1 border border-slate-700 text-slate-500 hover:text-amber-500 uppercase font-bold"
                        >
                            Collapse All
                        </button>
                    </div>
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-900/50 border-b border-slate-700">
                                <tr>
                                    {/* Match the indent of the program rows by adding pl-12 to the first header */}
                                    <th className="p-4 text-left text-[10px] uppercase font-black text-slate-500 tracking-widest pl-12 w-[15%]">Channel</th>
                                    <th className="p-4 text-left text-[10px] uppercase font-black text-slate-500 tracking-widest w-[45%]">Program Title</th>
                                    <th className="p-4 text-center text-[10px] uppercase font-black text-slate-500 tracking-widest w-[12%]">Start</th>
                                    <th className="p-4 text-center text-[10px] uppercase font-black text-slate-500 tracking-widest w-[12%]">End</th>
                                    <th className="p-4 text-right text-[10px] uppercase font-black text-slate-500 tracking-widest w-[16%]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="font-mono bg-slate-950">
                                {Object.keys(groupedSchedules).length > 0 ? (
                                    Object.keys(groupedSchedules).sort((a, b) => a - b).map((day) => {
                                        const isExpanded = expandedDays.includes(day);
                                        const programs = groupedSchedules[day];

                                        return (
                                            <React.Fragment key={day}>
                                                {/* GROUP HEADER: The "Folder" row */}
                                                <tr 
                                                    onClick={() => toggleDay(day)}
                                                    className="cursor-pointer border-y border-slate-800 bg-slate-900/50 hover:bg-slate-800 transition-colors group"
                                                >
                                                    <td colSpan="6" className="p-3 px-5">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-4">
                                                                {/* Tactical Arrow Icon */}
                                                                <span className={`text-amber-500 text-[8px] transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                                                                    ▶
                                                                </span>
                                                                <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">
                                                                    CYCLE_ID: {day}
                                                                </span>
                                                                <span className="bg-slate-800 px-2 py-0.5 rounded text-[9px] text-slate-400 font-bold">
                                                                    {programs.length} ENTRIES
                                                                </span>
                                                            </div>
                                                            <span className="text-[8px] text-slate-600 uppercase font-black tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {isExpanded ? '[ CLOSE_STREAM ]' : '[ VIEW_STREAM ]'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* GROUP CONTENT: Individual Program Rows */}
                                                {/* This only shows if the Day Cycle header was clicked */}
                                                {isExpanded && programs.map((item) => {
                                                    const isEditing = editingId === item.id;

                                                    return (
                                                        <tr key={item.id} className={`border-b border-slate-900/50 ${isEditing ? 'bg-amber-500/5' : 'hover:bg-white/5'}`}>
                                                            <td className="p-4 py-2 text-[10px] text-slate-500 font-bold italic pl-12 w-[15%]">
                                                                {channelnamearray[item.channel_id] || `CH_${item.channel_id}`}
                                                            </td>

                                                            {/* Title Column */}
                                                            <td className="p-4 py-2 w-[45%]">
                                                                {isEditing ? (
                                                                    <input 
                                                                        className="bg-slate-900 border border-amber-500/50 text-amber-500 text-xs p-1 w-full rounded font-bold uppercase focus:outline-none"
                                                                        value={editForm.title}
                                                                        onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                                                                    />
                                                                ) : (
                                                                    <span className="text-xs text-slate-300 font-bold uppercase">{item.title}</span>
                                                                )}
                                                            </td>

                                                            {/* Start Time Column */}
                                                            <td className="p-4 py-2 text-center w-[12%]">
                                                                {isEditing ? (
                                                                    <input 
                                                                        className="bg-slate-900 border border-slate-700 text-slate-200 text-xs p-1 w-20 text-center rounded focus:border-amber-500/50"
                                                                        value={editForm.start_time}
                                                                        onChange={(e) => setEditForm({...editForm, start_time: e.target.value})}
                                                                    />
                                                                ) : (
                                                                    <span className="text-xs text-slate-400 font-mono">{item.start_time}</span>
                                                                )}
                                                            </td>

                                                            {/* End Time Column */}
                                                            <td className="p-4 py-2 text-center w-[12%]">
                                                                {isEditing ? (
                                                                    <input 
                                                                        className="bg-slate-900 border border-slate-700 text-slate-200 text-xs p-1 w-20 text-center rounded focus:border-amber-500/50"
                                                                        value={editForm.end_time}
                                                                        onChange={(e) => setEditForm({...editForm, end_time: e.target.value})}
                                                                    />
                                                                ) : (
                                                                    <span className="text-xs text-slate-400 font-mono">{item.end_time}</span>
                                                                )}
                                                            </td>

                                                            {/* Actions Column */}
                                                            <td className="p-4 py-2 text-right w-[16%]">
                                                                {isEditing ? (
                                                                    <div className="flex justify-end gap-3">
                                                                        <button 
                                                                            onClick={() => saveEdit(item.id)} 
                                                                            className="text-[9px] text-emerald-500 hover:text-emerald-400 font-black uppercase tracking-tighter"
                                                                        >
                                                                            [ SAVE ]
                                                                        </button>
                                                                        <button 
                                                                            onClick={cancelEdit} 
                                                                            className="text-[9px] text-rose-500 hover:text-rose-400 font-black uppercase tracking-tighter"
                                                                        >
                                                                            [ CANCEL ]
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <button 
                                                                        onClick={() => startEdit(item)} 
                                                                        className="text-[9px] text-slate-600 hover:text-amber-500 font-black uppercase tracking-widest"
                                                                    >
                                                                        EDIT_DATA
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </React.Fragment>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="p-20 text-center">
                                            <span className="text-[10px] text-slate-700 font-black uppercase tracking-[0.5em] animate-pulse">
                                                No active stream data found for this sector
                                            </span>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}