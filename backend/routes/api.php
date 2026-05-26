<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use App\Http\Controllers\Api\DashboardController;
// routes/api.php
use App\Models\SystemLog;
use App\Models\ProgramDictionary;

Route::get('/telemetry/feed', function () {
    return response()->json(
        SystemLog::latest()->limit(10)->get()
    );
});
Route::get('/dashboard', [DashboardController::class, 'index']);
// 1. Fixed Current/Next Logic
Route::get('/current-schedule/{channel}', function ($channel) {
    // Standardize time format to match your start_time/end_time columns
    $now = now()->toTimeString();

    // Get the program currently playing using channel_id
    $current = DB::table('tv_schedules')
        ->where('channel_id', $channel)
        ->where('start_time', '<=', $now)
        ->where('end_time', '>=', $now)
        ->first();

    // Get the next program in the queue
    $next = DB::table('tv_schedules')
        ->where('channel_id', $channel)
        ->where('start_time', '>', $now)
        ->orderBy('start_time', 'asc')
        ->first();

    return response()->json([
        'current' => $current,
        'next' => $next,
        'server_time' => $now
    ]);
});

// 2. Main Schedule List
Route::get('/schedule/{channel}', function ($channel) {
    return DB::table('tv_schedules')
        ->where('channel_id', $channel)
        ->orderBy('start_time', 'asc')
        ->get();
});

Route::get('/schedules/list', [App\Http\Controllers\ScheduleListController::class, 'index']);
Route::put('/schedules/{id}', [App\Http\Controllers\ScheduleListController::class, 'update']);
Route::delete('/schedules/items/{id}', [App\Http\Controllers\ScheduleListController::class, 'destroyItem']);
Route::delete('/schedules/days/{day}', [App\Http\Controllers\ScheduleListController::class, 'destroyDay']);
Route::post('/schedules/items', [App\Http\Controllers\ScheduleListController::class, 'storeItem']);
Route::post('/api/program-dictionary/save', function(Request $request) {
    // Force uppercase and clean spaces before checking
    $cleanTitle = strtoupper(trim($request->title));
    $editingId = $request->input('id'); // Pass ID if updating an existing record

    $request->merge(['title' => $cleanTitle]);

    $request->validate([
        // If creating new, title must be unique in program_dictionaries table.
        // If editing, ignore the current record's ID so it doesn't block itself.
        'title' => 'required|string|unique:program_dictionaries,title,' . ($editingId ?? 'NULL') . ',id',
        'description' => 'required|string'
    ]);

    $dictionary = \App\Models\ProgramDictionary::updateOrCreate(
        ['title' => $cleanTitle],
        ['description' => trim($request->description)]
    );

    return response()->json(['status' => 'SUCCESS', 'data' => $dictionary]);
});

//for program dictionary management
Route::get('/api/program-dictionary', function() {
    return response()->json(
        ProgramDictionary::orderBy('title')->paginate(50)
    );
});

Route::post('/api/program-dictionary/save', function(Request $request) {
    $request->validate([
        'title' => 'required|string',
        'description' => 'required|string'
    ]);

    $dictionary = ProgramDictionary::updateOrCreate(
        ['title' => strtoupper(trim($request->title))],
        ['description' => trim($request->description)]
    );

    return response()->json(['status' => 'SUCCESS', 'data' => $dictionary]);
});

Route::delete('/api/program-dictionary/{id}', function($id) {
    ProgramDictionary::destroy($id);
    return response()->json(['status' => 'DELETED']);
});
// routes/api.php or your API route framework
Route::get('/api/program-dictionary', function(Request $request) {
    $search = $request->query('search');

    // 1. Build an optimized query grouping directly by the raw title string
    $query = DB::table('schedule_templates')
        ->select('title')
        ->groupBy('title');

    if (!empty($search)) {
        $query->where('title', 'LIKE', '%' . strtoupper(trim($search)) . '%');
    }

    // 2. Fetch the flat rows from the database engine
    $uploadedRows = $query->get();

    // 3. Fetch all dictionary descriptions currently stored
    $dictionaryMap = DB::table('program_dictionaries')
        ->pluck('description', 'title')
        ->toArray();

    // 4. Map the pairs cleanly together
    $compiledList = $uploadedRows->map(function($row) use ($dictionaryMap) {
        $normalizedTitle = strtoupper(trim($row->title));
        return [
            'title' => $normalizedTitle,
            'description' => $dictionaryMap[$normalizedTitle] ?? null
        ];
    });

    // 5. Use ->values() to reset array index positions to a clean [0, 1, 2...] list
    return response()->json($compiledList->values());
});
