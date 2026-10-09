<?php

namespace App\Http\Controllers;

use App\Models\Student;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    // READ - Get all students
    public function index()
    {
        return response()->json(Student::all());
    }

    // CREATE - Add a student
    public function store(Request $request)
    {
        $student = $request->validate([
            'student_id' => 'required|unique:students,student_id',
            'full_name' => 'required',
            'course' => 'required',
            'year_level' => 'required',
            'section' => 'required',
        ]);

        $student = Student::create($student);

        return response()->json($student, 201);
    }

    // READ - Get one student
    public function show(Student $student)
    {
        return response()->json($student);
    }

    // UPDATE - Edit a student
    public function update(Request $request, Student $student)
    {
        $data = $request->validate([
            'student_id' => 'required|unique:students,student_id,' . $student->id,
            'full_name' => 'required',
            'course' => 'required',
            'year_level' => 'required',
            'section' => 'required',
        ]);

        $student->update($data);

        return response()->json($student);
    }

    // DELETE - Delete a student
    public function destroy(Student $student)
    {
        $student->delete();

        return response()->json([
            'message' => 'Student deleted successfully'
        ]);
    }
}