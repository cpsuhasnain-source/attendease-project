<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function index()
    {
        return response()->json(
            Attendance::with('student')->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'student_id' => 'required|exists:students,id',
            'date' => 'required|date',
            'time' => 'nullable',
            'status' => 'required|in:Present,Late,Absent',
        ]);

        $attendance = Attendance::create($data);

        return response()->json(
            $attendance->load('student'),
            201
        );
    }

    public function show(Attendance $attendance)
    {
        return response()->json(
            $attendance->load('student')
        );
    }

    public function update(Request $request, Attendance $attendance)
    {
        $data = $request->validate([
            'student_id' => 'required|exists:students,id',
            'date' => 'required|date',
            'time' => 'nullable',
            'status' => 'required|in:Present,Late,Absent',
        ]);

        $attendance->update($data);

        return response()->json(
            $attendance->load('student')
        );
    }

    public function destroy(Attendance $attendance)
    {
        $attendance->delete();

        return response()->json([
            'message' => 'Attendance deleted successfully'
        ]);
    }
}