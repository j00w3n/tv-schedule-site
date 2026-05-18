import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';

export default function ProgramLibrary({ auth }) {
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Inline editing states
    const [editingTitle, setEditingTitle] = useState(null);
    const [editDescription, setEditDescription] = useState('');

    const fetchUploadedPrograms = async () => {
    setLoading(true);
    try {
        // Changed from '/api/program-dictionary' to '/program-library/data'
        const response = await axios.get('/program-library/data'); 
        setPrograms(response.data);
    } catch (err) {
        console.error("Failed to fetch uploaded program streams:", err);
    } finally {
        setLoading(false);
    }
};

    useEffect(() => {
        fetchUploadedPrograms();
    }, []);

    const startInlineEdit = (item) => {
        setEditingTitle(item.title);
        setEditDescription(item.description || '');
    };

   const saveInlineEdit = async (title) => {
    try {
        // Changed from '/api/program-dictionary/save' to '/program-library/save'
        await axios.post('/program-library/save', {
            title: title,
            description: editDescription
        });
        setEditingTitle(null);
        fetchUploadedPrograms(); 
    } catch (err) {
        console.error("Failed to commit global description rule:", err);
    }
};

    const filteredPrograms = programs.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-slate-200 leading-tight">Global Programmes</h2>}
        >
            <Head title="Program Library" />

            <div className="py-8 bg-slate-950 min-h-screen text-slate-100 antialiased">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    {/* Page Header */}
                    <div className="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-800/60 pb-6">
                        <div>
                            <p className="text-sm text-slate-400">
                                This page automatically extracts and indexes every unique program title found within your uploaded schedules.
                            </p>
                        </div>
                        
                        {/* Clean Search Input */}
                        <input 
                            type="text"
                            placeholder="Search unique titles or briefs..."
                            className="bg-slate-900 border border-slate-800 rounded-lg pl-3 pr-4 py-2 text-xs text-slate-200 w-full sm:w-72 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all shadow-inner"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Full Width Modern Table Container */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-md overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-medium tracking-wide uppercase text-[10px]">
                                        <th className="py-4 px-6 w-[35%]">Title</th>
                                        <th className="py-4 px-6 w-[50%]"> Description </th>
                                        <th className="py-4 px-6 text-right w-[15%]">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/40">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="3" className="py-16 text-center text-slate-500 animate-pulse font-medium">
                                                Compiling uploaded schedule titles...
                                            </td>
                                        </tr>
                                    ) : filteredPrograms.length > 0 ? (
                                        filteredPrograms.map((item) => {
                                            const isEditingThis = editingTitle === item.title;

                                            return (
                                                // Changed key from index to item.id for stable React rendering states
                                                <tr key={item.id} className="hover:bg-slate-850/20 transition-colors group">
                                                    
                                                    {/* Title column */}
                                                    <td className="py-4 px-6 text-white font-semibold tracking-wide uppercase">
                                                        {item.title}
                                                    </td>
                                                    
                                                    {/* Description column */}
                                                    <td className="py-4 px-6 text-slate-400 font-normal leading-relaxed">
                                                        {isEditingThis ? (
                                                            <input 
                                                                type="text"
                                                                className="w-full bg-slate-950 border border-indigo-500/50 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs transition-all"
                                                                value={editDescription}
                                                                onChange={(e) => setEditDescription(e.target.value)}
                                                                autoFocus
                                                            />
                                                        ) : item.description ? (
                                                            <span className="text-slate-300 font-medium">{item.description}</span>
                                                        ) : (
                                                            <span className="text-slate-600 italic select-none text-[11px]">
                                                                No description template attached
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Actions column */}
                                                    <td className="py-4 px-6 text-right font-medium">
                                                        {isEditingThis ? (
                                                            <div className="flex justify-end gap-3">
                                                                <button 
                                                                    onClick={() => saveInlineEdit(item.title)}
                                                                    className="text-emerald-400 hover:text-emerald-300 px-2 py-0.5 border border-emerald-500/20 bg-emerald-500/5 rounded transition-all"
                                                                >
                                                                    Save
                                                                </button>
                                                                <button onClick={() => setEditingTitle(null)} className="text-slate-400 hover:text-slate-300">
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button 
                                                                onClick={() => startInlineEdit(item)}
                                                                className="text-indigo-400 hover:text-indigo-300 opacity-40 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                {item.description ? 'Edit Brief' : 'Add Brief'}
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="py-16 text-center text-slate-500 text-xs">
                                                No uploaded programs matched your filter parameters.
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