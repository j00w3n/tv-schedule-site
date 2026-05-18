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
        end_time: item.end_time,
        // Pre-fill with the existing global description if it exists, otherwise leave blank
        description: item.global_description || '' 
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
        header={<h1 className="text-xl font-semibold text-slate-200 tracking-tight">Schedule Library</h1>}
    >
        <Head title="Schedule Library" />

        <div className="bg-slate-950 min-h-screen p-8 antialiased selection:bg-indigo-500/30">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* MODERN FILTER BAR */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end text-sm">
                    {/* Search Input */}
                    <div>
                        <label className="text-xs font-medium text-slate-400 block mb-1.5">Search Program</label>
                        <input 
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="e.g., Monster Carp..."
                            className="w-full bg-slate-950 border-slate-800 text-slate-200 text-xs rounded-lg p-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-600 transition-all"
                        />
                    </div>

                    {/* Month Filter */}
                    <div>
                        <label className="text-xs font-medium text-slate-400 block mb-1.5">Month Partition</label>
                        <select 
                            value={monthOffset}
                            onChange={(e) => setMonthOffset(parseInt(e.target.value))}
                            className="w-full bg-slate-950 border-slate-800 text-slate-200 text-xs rounded-lg p-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all cursor-pointer"
                        >
                            <option value="0">May 2026</option>
                            <option value="100">June 2026</option>
                            <option value="200">July 2026</option>
                        </select>
                    </div>

                    {/* Channel Filter */}
                    <div>
                        <label className="text-xs font-medium text-slate-400 block mb-1.5">Target Feed</label>
                        <select 
                            value={channelFilter}
                            onChange={(e) => setChannelFilter(e.target.value)}
                            className="w-full bg-slate-950 border-slate-800 text-slate-200 text-xs rounded-lg p-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all cursor-pointer"
                        >
                            <option value="all">All Channels</option>
                            {[...Array(11)].map((_, i) => (
                                <option key={i+1} value={i+1}>{channelnamearray[i+1]}</option>
                            ))}
                        </select>
                    </div>

                    {/* Reset Button */}
                    <button 
                        onClick={() => {setSearchQuery(''); setChannelFilter('all'); setMonthOffset(0);}}
                        className="w-full bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium py-2 px-4 rounded-lg transition-colors shadow-sm"
                    >
                        Reset Filters
                    </button>
                </div>

                {/* DATA TABLE WRAPPER */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden p-6">
                    
                    {/* View Controls */}
                    <div className="flex gap-2 mb-4">
                        <button 
                            onClick={() => setExpandedDays(Object.keys(schedules))} 
                            className="text-xs px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors font-medium"
                        >
                            Expand All
                        </button>
                        <button 
                            onClick={() => setExpandedDays([])} 
                            className="text-xs px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors font-medium"
                        >
                            Collapse All
                        </button>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-slate-800/60">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-medium">
                                    <th className="p-4 pl-12 w-[15%]">Channel</th>
                                    <th className="p-4 w-[45%]">Program Title</th>
                                    <th className="p-4 text-center w-[12%]">Start Time</th>
                                    <th className="p-4 text-center w-[12%]">End Time</th>
                                    <th className="p-4 text-right w-[16%]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-slate-900 divide-y divide-slate-800/40">
                                {Object.keys(groupedSchedules).length > 0 ? (
                                    Object.keys(groupedSchedules).sort((a, b) => a - b).map((day) => {
                                        const isExpanded = expandedDays.includes(day);
                                        const programs = groupedSchedules[day];

                                        return (
                                            <React.Fragment key={day}>
                                                {/* GROUP HEADER: Accordion Day Toggle */}
                                                <tr 
                                                    onClick={() => toggleDay(day)}
                                                    className="cursor-pointer bg-slate-950/60 hover:bg-slate-850/40 transition-colors border-y border-slate-800"
                                                >
                                                    <td colSpan="5" className="p-3.5 px-5">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <span className={`text-[10px] text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                                                                    ▶
                                                                </span>
                                                                <span className="font-semibold text-white tracking-tight">
                                                                    Cycle ID: Day {day}
                                                                </span>
                                                                <span className="bg-slate-800/80 text-slate-400 text-[11px] px-2 py-0.5 rounded-md font-medium">
                                                                    {programs.length} items
                                                                </span>
                                                            </div>
                                                            <span className="text-xs text-indigo-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {isExpanded ? 'Collapse' : 'Expand'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* GROUP CONTENT: Core Rows */}
                                                {isExpanded && programs.map((item) => {
                                                    const isEditing = editingId === item.id;

                                                    return (
                                                        <tr key={item.id} className={`border-b border-slate-800/30 transition-colors ${isEditing ? 'bg-indigo-500/5' : 'hover:bg-slate-850/20'}`}>
                                                            {/* Channel Column */}
                                                            <td className="p-4 py-3 text-slate-400 font-medium pl-12 w-[15%]">
                                                                {channelnamearray[item.channel_id] || `Channel ${item.channel_id}`}
                                                            </td>

                                                            {/* Title & Description Column */}
                                                            <td className="p-4 py-3 w-[45%]">
                                                                {isEditing ? (
                                                                    <div className="flex flex-col gap-2 w-full max-w-md">
                                                                        <input 
                                                                            className="bg-slate-950 border border-indigo-500/50 text-white text-xs p-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                                                                            value={editForm.title}
                                                                            onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                                                                            placeholder="Program Title"
                                                                        />
                                                                        <input 
                                                                            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs p-2 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                                                            value={editForm.description}
                                                                            onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                                                            placeholder="Global description snippet..."
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-col">
                                                                        <span className="text-white font-semibold text-sm tracking-tight">
                                                                            {item.title}
                                                                        </span>
                                                                        {item.global_description ? (
                                                                            <span className="text-slate-400 font-normal leading-relaxed mt-0.5 line-clamp-1 max-w-md">
                                                                                {item.global_description}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-slate-600 italic mt-0.5 select-none">
                                                                                No global description attached
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </td>

                                                            {/* Start Time Column */}
                                                            <td className="p-4 py-3 text-center w-[12%] text-slate-300 font-medium">
                                                                {isEditing ? (
                                                                    <input 
                                                                        className="bg-slate-950 border border-slate-800 text-slate-200 text-xs p-1.5 w-20 text-center rounded-md focus:border-indigo-500 focus:outline-none transition-all"
                                                                        value={editForm.start_time}
                                                                        onChange={(e) => setEditForm({...editForm, start_time: e.target.value})}
                                                                    />
                                                                ) : (
                                                                    <span>{item.start_time}</span>
                                                                )}
                                                            </td>

                                                            {/* End Time Column */}
                                                            <td className="p-4 py-3 text-center w-[12%] text-slate-300 font-medium">
                                                                {isEditing ? (
                                                                    <input 
                                                                        className="bg-slate-950 border border-slate-800 text-slate-200 text-xs p-1.5 w-20 text-center rounded-md focus:border-indigo-500 focus:outline-none transition-all"
                                                                        value={editForm.end_time}
                                                                        onChange={(e) => setEditForm({...editForm, end_time: e.target.value})}
                                                                    />
                                                                ) : (
                                                                    <span>{item.end_time}</span>
                                                                )}
                                                            </td>

                                                            {/* Actions Column */}
                                                            <td className="p-4 py-3 text-right w-[16%] font-medium">
                                                                {isEditing ? (
                                                                    <div className="flex justify-end gap-3 text-xs">
                                                                        <button 
                                                                            onClick={() => saveEdit(item.id)} 
                                                                            className="text-emerald-400 hover:text-emerald-300 transition-colors"
                                                                        >
                                                                            Save
                                                                        </button>
                                                                        <button 
                                                                            onClick={cancelEdit} 
                                                                            className="text-slate-400 hover:text-slate-300 transition-colors"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <button 
                                                                        onClick={() => startEdit(item)} 
                                                                        className="text-indigo-400 hover:text-indigo-300 transition-colors"
                                                                    >
                                                                        Edit
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
                                        <td colSpan="5" className="p-16 text-center text-slate-500 text-sm font-medium">
                                            No active schedule entries found for this selection.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    </AuthenticatedLayout>
);
}