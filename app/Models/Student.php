<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    protected $fillable = [
        'student_id',
        'full_name',
        'course',
        'year_level',
        'section',
    ];
}