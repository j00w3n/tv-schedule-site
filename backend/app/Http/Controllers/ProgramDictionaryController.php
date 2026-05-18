<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\ProgramDictionary;

class ProgramDictionaryController extends Controller
{
    /**
     * Render the main Inertia view page framework
     */
    public function index()
    {
        return Inertia::render('ProgramLibrary');
    }

    /**
     * API Fetch endpoint for the React component data grid
     */
    public function getData(Request $request)
    {
        $search = $request->query('search');

        $query = DB::table('program_dictionaries')
            ->select('id', 'title', 'description')
            ->orderBy('title');

        if (!empty($search)) {
            $query->where('title', 'LIKE', '%' . strtoupper(trim($search)) . '%')
                  ->orWhere('description', 'LIKE', '%' . trim($search) . '%');
        }

        return response()->json($query->get());
    }

    /**
     * Inline update or create handler for descriptions
     */
    public function saveInline(Request $request)
    {
        $validatedTitle = strtoupper(trim($request->title));
        $descriptionText = trim($request->description);

        DB::table('program_dictionaries')->updateOrInsert(
            ['title' => $validatedTitle],
            [
                'description' => $descriptionText,
                'updated_at'  => now()
            ]
        );

        return response()->json(['message' => 'Success']);
    }
}