import React, { useState, useEffect, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';

export default function ScheduleLibrary({ auth }) {
    const getCurrentMonthName = () => {
        return new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date());
    };
    const [monthOffset, setMonthOffset] = useState(0); 
    const [channelFilter, setChannelFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthName());
    const [schedules, setSchedules] = useState([]);
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
        const currentDate = new Date();
            const currentMonthIdx = currentDate.getMonth(); // 4 for May
            const currentYear = currentDate.getFullYear();  // 2026

            // 2. Generate the 3 dynamic months array
            const dynamicMonths = Array.from({ length: 3 }, (_, i) => {
                // Calculate future month indices smoothly (handles December -> January rollover perfectly)
                const targetDate = new Date(currentYear, currentMonthIdx + i, 1);
                const monthName = targetDate.toLocaleString('en-US', { month: 'long' });
                const yearName = targetDate.getFullYear();

                return {
                    offsetValue: i * 100, // 0 for month 1, 100 for month 2, 200 for month 3
                    label: `${monthName} ${yearName}`
                };
            });
            // 1. Delete an individual row item
        const handleDeleteItem = async (id) => {
            if (!window.confirm("Are you sure you want to delete this programme?")) return;
            try {
                await axios.delete(`/api/schedules/items/${id}`);
                fetchSchedules(); // Refresh layout
            } catch (err) {
                alert("Failed to delete item");
            }
        };

        // 2. Delete an entire accordion day group block
        const handleDeleteDay = async (dayNum, e) => {
            e.stopPropagation(); // Preventsaccordion toggle opening/closing when clicking delete
            if (!window.confirm(`⚠️ CRITICAL: Delete ALL programs inside Day ${dayNum}?`)) return;
            try {
                await axios.delete(`/api/schedules/days/${dayNum}`);
                fetchSchedules(); 
            } catch (err) {
                alert("Failed to delete day cycle");
            }
        };

        // 3. Open add modal contextualized above or below
       const handleInsertProgram = (item, position) => {
            // 1. Pre-populate the contextual channel and rotation block day rules
            setNewForm({
                day_cycle: item.day_cycle,
                channel_id: item.channel_id,
                title: "",
                // If placing 'below', automatically grab the previous program's end time as the start!
                start_time: position === 'below' ? item.end_time : "", 
                end_time: position === 'above' ? item.start_time : "",  // If 'above', its start is our end limit
                description: ""
            });
            
            // 2. Fire open the dialogue modal container
            setIsModalOpen(true);
        };
        const [isModalOpen, setIsModalOpen] = useState(false);
            const [newForm, setNewForm] = useState({
                day_cycle: '',
                channel_id: '',
                title: '',
                start_time: '',
                end_time: '',
                description: '' // Optional description field
            });
            const handleSaveNewProgram = async (e) => {
                e.preventDefault();
                try {
                    await axios.post('/api/schedules/items', newForm);
                    setIsModalOpen(false); // Close the modal window popup
                    fetchSchedules();      // Reload layout lists instantly
                } catch (err) {
                    alert("Error saving new programme slot assignment entries.");
                }
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
                            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all cursor-pointer"
                        >
                            {dynamicMonths.map((month) => (
                                <option key={month.offsetValue} value={month.offsetValue}>
                                    {month.label}
                                </option>
                            ))}
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
                                    Object.keys(groupedSchedules)
                                        .sort((a, b) => a - b)
                                        // 🟢 STEP 1: Filter the Day keys based on your active monthOffset dropdown selection
                                        .filter((dayStr) => {
                                            const dayNum = parseInt(dayStr);

                                            if (monthOffset === 0) {
                                                // May Partition: Show only base layout tracks (Days 1 to 99)
                                                return dayNum < 100;
                                            }
                                            if (monthOffset === 100) {
                                                // June Partition: Show only the 100s track (Days 101 to 199)
                                                return dayNum >= 101 && dayNum < 200;
                                            }
                                            if (monthOffset === 200) {
                                                // July Partition: Show only the 200s track (Days 201 to 299)
                                                return dayNum >= 201 && dayNum < 300;
                                            }

                                            return true; // Fallback default
                                        })
                                        // 🔵 STEP 2: Map through only the matching partitioned days
                                        .map((day) => {
                                            const isExpanded = expandedDays.includes(day);
                                            const programs = groupedSchedules[day];
                                            
                                            // 🟢 STEP 3: Assign the month name tag directly matching the current filter option
                                            let monthName = "Unknown Month";
                                            if (monthOffset === 0) monthName = "May";
                                            else if (monthOffset === 100) monthName = "June";
                                            else if (monthOffset === 200) monthName = "July";

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
                                                                    <span className={`text-[10px] text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                                                                    <span className="font-semibold text-white tracking-tight">Day {day}</span>
                                                                    <span className="bg-slate-800/80 text-slate-400 text-[11px] px-2 py-0.5 rounded-md font-medium">{programs.length} items</span>
                                                                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] px-2 py-0.5 rounded-md font-medium">{monthName}</span>
                                                                </div>
                                                                
                                                                <div className="flex items-center gap-4">
                                                                    {/* 🔴 DELETE ENTIRE DAY BUTTON */}
                                                                    <button 
                                                                        onClick={(e) => handleDeleteDay(day, e)}
                                                                        className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 rounded border border-rose-500/20 transition-all"
                                                                    >
                                                                        Delete Day
                                                                    </button>
                                                                    <span className="text-xs text-indigo-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        {isExpanded ? 'Collapse' : 'Expand'}
                                                                    </span>
                                                                </div>
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
                                                                <td className="p-4 py-3 text-right w-[24%] font-medium">
                                                                    {isEditing ? (
                                                                        <div className="flex justify-end gap-3 text-xs">
                                                                            <button onClick={() => saveEdit(item.id)} className="text-emerald-400 hover:text-emerald-300">Save</button>
                                                                            <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-300">Cancel</button>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex justify-end items-center gap-3.5 text-xs">
                                                                            {/* 🟢 ADD ABOVE / BELOW ACTION BUTTONS */}
                                                                            <button 
                                                                                onClick={() => handleInsertProgram(item, 'above')}
                                                                                className="text-slate-400 hover:text-indigo-400 transition-colors" 
                                                                                title="Insert programme slot above"
                                                                            >
                                                                                + Above
                                                                            </button>
                                                                            <button 
                                                                                onClick={() => handleInsertProgram(item, 'below')}
                                                                                className="text-slate-400 hover:text-indigo-400 transition-colors"
                                                                                title="Insert programme slot below"
                                                                            >
                                                                                + Below
                                                                            </button>
                                                                            
                                                                            <div className="h-3 w-[1px] bg-slate-800"></div> {/* Visual Divider separator */}

                                                                            <button onClick={() => startEdit(item)} className="text-indigo-400 hover:text-indigo-300">
                                                                                Edit
                                                                            </button>
                                                                            
                                                                            {/* 🔴 DELETE SINGLE ROW ITEM */}
                                                                            <button 
                                                                                onClick={() => handleDeleteItem(item.id)} 
                                                                                className="text-rose-400 hover:text-rose-300 transition-colors"
                                                                            >
                                                                                Delete
                                                                            </button>
                                                                        </div>
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
            {/* 🟢 ADD NEW PROGRAMME DIALOGUE MODAL */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                        <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full shadow-2xl p-6 relative overflow-hidden">
                            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                                Insert New Programme (Day {newForm.day_cycle})
                            </h3>

                            {/* 🔥 Hooks up your handleSaveNewProgram submit action handler! */}
                            <form onSubmit={handleSaveNewProgram} className="space-y-4">
                                <div>
                                    <label className="text-[11px] font-medium text-slate-400 block mb-1">Programme Title</label>
                                    <input 
                                        type="text"
                                        required
                                        placeholder="e.g. RUSH HOUR 3"
                                        className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-lg p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all uppercase"
                                        value={newForm.title}
                                        onChange={(e) => setNewForm({...newForm, title: e.target.value})}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[11px] font-medium text-slate-400 block mb-1">Start Time</label>
                                        <input 
                                            type="text"
                                            required
                                            placeholder="00:00:00"
                                            className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-lg p-2.5 text-center focus:border-indigo-500 focus:outline-none transition-all"
                                            value={newForm.start_time}
                                            onChange={(e) => setNewForm({...newForm, start_time: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-medium text-slate-400 block mb-1">End Time</label>
                                        <input 
                                            type="text"
                                            required
                                            placeholder="01:30:00"
                                            className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-lg p-2.5 text-center focus:border-indigo-500 focus:outline-none transition-all"
                                            value={newForm.end_time}
                                            onChange={(e) => setNewForm({...newForm, end_time: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[11px] font-medium text-slate-400 block mb-1">Global Synopsis / Description</label>
                                    <textarea 
                                        rows="2"
                                        placeholder="Enter program outline overview metadata..."
                                        className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg p-2.5 focus:border-indigo-500 focus:outline-none transition-all resize-none"
                                        value={newForm.description}
                                        onChange={(e) => setNewForm({...newForm, description: e.target.value})}
                                    />
                                </div>

                                {/* MODAL FOOTER BUTTONS */}
                                <div className="flex justify-end gap-2.5 pt-2 text-xs font-medium">
                                    <button 
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-750 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-md shadow-indigo-600/10 transition-colors"
                                    >
                                        Save Entry
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
        </div>
    </AuthenticatedLayout>
);
}