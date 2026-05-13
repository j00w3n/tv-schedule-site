import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'; // Check if this file exists in /Layouts
import { Head, useForm, usePage } from '@inertiajs/react';

export default function Dashboard({ auth }) {
    const { flash } = usePage().props;
    
    const { data, setData, post, processing, errors, reset } = useForm({
        channel_id: '1',
        schedule_file: null,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('schedule.import'), {
            forceFormData: true, // Crucial for file uploads
            onSuccess: () => reset('schedule_file'),
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Broadcast Control Center</h2>}
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Success Message */}
                    {flash?.message && (
                        <div className="mb-4 p-4 bg-green-100 border-l-4 border-green-500 text-green-700">
                            {flash.message}
                        </div>
                    )}

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <form onSubmit={submit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Target Channel (1-11)</label>
                                <select 
                                    value={data.channel_id}
                                    onChange={e => setData('channel_id', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                                >
                                    {[...Array(11)].map((_, i) => (
                                        <option key={i+1} value={i+1}>Channel {i+1}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Upload Mosaic.m3u</label>
                                <input 
                                    type="file" 
                                    onChange={e => setData('schedule_file', e.target.files[0])}
                                    className="mt-1 block w-full text-sm"
                                />
                                {errors.schedule_file && <div className="text-red-500 text-xs">{errors.schedule_file}</div>}
                            </div>

                            <button 
                                type="submit" 
                                disabled={processing}
                                className="inline-flex items-center px-4 py-2 bg-gray-800 text-white rounded-md font-semibold text-xs uppercase"
                            >
                                {processing ? 'Importing...' : 'Sync Channel Template'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}