<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\ScheduleImportController;
use App\Http\Controllers\ProgramDictionaryController;
use App\Http\Controllers\ScheduleArchiveController;


Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::post('/import-schedule', [ScheduleImportController::class, 'store'])->name('schedule.import');
});
Route::get('/library', function () {
    return Inertia::render('ScheduleLibrary');
})->middleware(['auth', 'verified'])->name('library');
require __DIR__ . '/auth.php';

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/program-library', [ProgramDictionaryController::class, 'index'])->name('program-library.index');
    Route::get('/program-library/data', [ProgramDictionaryController::class, 'getData'])->name('program-library.data');
    Route::post('/program-library/save', [ProgramDictionaryController::class, 'saveInline'])->name('program-library.save');
});


// 1. Render the React Page view
Route::get('/schedule-library/archive', function () {
    return Inertia::render('ArchiveManager');
})->name('archive.index');

// 2. Target API Endpoint for processing the clone mass action
Route::post('/schedule-library/clone-month', [ScheduleArchiveController::class, 'cloneMonth'])
    ->name('schedule.clone-month');