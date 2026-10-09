import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
    const [page, setPage] = useState('dashboard');

    const [students, setStudents] = useState([]);
    const [attendances, setAttendances] = useState([]);

    const [showStudentForm, setShowStudentForm] = useState(false);
    const [showAttendanceForm, setShowAttendanceForm] = useState(false);

    const [editingStudent, setEditingStudent] = useState(null);
    const [editingAttendance, setEditingAttendance] = useState(null);

    const [studentForm, setStudentForm] = useState({
        student_id: '',
        full_name: '',
        course: '',
        year_level: '',
        section: ''
    });

    const [attendanceForm, setAttendanceForm] = useState({
        student_id: '',
        date: '2026-10-05',
        time: '',
        status: 'Present'
    });

    // ==========================
    // LOAD DATA
    // ==========================

    useEffect(() => {
        fetchStudents();
        fetchAttendances();
    }, []);

    // ==========================
    // STUDENTS
    // ==========================

    const fetchStudents = async () => {
        try {
            const response = await fetch('/api/students');
            const data = await response.json();
            setStudents(data);
        } catch (error) {
            console.error('Error loading students:', error);
        }
    };

    const handleStudentChange = (e) => {
        setStudentForm({
            ...studentForm,
            [e.target.name]: e.target.value
        });
    };

    const addStudent = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('/api/students', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(studentForm)
            });

            if (!response.ok) {
                const error = await response.json();
                console.error(error);
                alert('Failed to add student.');
                return;
            }

            resetStudentForm();
            fetchStudents();
        } catch (error) {
            console.error(error);
            alert('Something went wrong.');
        }
    };

    const editStudent = (student) => {
        setEditingStudent(student);

        setStudentForm({
            student_id: student.student_id,
            full_name: student.full_name,
            course: student.course,
            year_level: student.year_level,
            section: student.section
        });

        setShowStudentForm(true);
    };

    const updateStudent = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(
                `/api/students/${editingStudent.id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(studentForm)
                }
            );

            if (!response.ok) {
                alert('Failed to update student.');
                return;
            }

            resetStudentForm();
            fetchStudents();
            fetchAttendances();
        } catch (error) {
            console.error(error);
            alert('Something went wrong.');
        }
    };

    const deleteStudent = async (id) => {
        if (!confirm('Are you sure you want to delete this student?')) {
            return;
        }

        try {
            const response = await fetch(`/api/students/${id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                alert('Failed to delete student.');
                return;
            }

            fetchStudents();
            fetchAttendances();
        } catch (error) {
            console.error(error);
        }
    };

    const resetStudentForm = () => {
        setStudentForm({
            student_id: '',
            full_name: '',
            course: '',
            year_level: '',
            section: ''
        });

        setEditingStudent(null);
        setShowStudentForm(false);
    };

    // ==========================
    // ATTENDANCE
    // ==========================

    const fetchAttendances = async () => {
        try {
            const response = await fetch('/api/attendance');
            const data = await response.json();
            setAttendances(data);
        } catch (error) {
            console.error('Error loading attendance:', error);
        }
    };

    const handleAttendanceChange = (e) => {
        setAttendanceForm({
            ...attendanceForm,
            [e.target.name]: e.target.value
        });
    };

    const addAttendance = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('/api/attendance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(attendanceForm)
            });

            if (!response.ok) {
                const error = await response.json();
                console.error(error);
                alert('Failed to save attendance.');
                return;
            }

            resetAttendanceForm();
            fetchAttendances();
        } catch (error) {
            console.error(error);
            alert('Something went wrong.');
        }
    };

    const editAttendance = (attendance) => {
        setEditingAttendance(attendance);

        setAttendanceForm({
            student_id: attendance.student_id,
            date: attendance.date,
            time: attendance.time || '',
            status: attendance.status
        });

        setShowAttendanceForm(true);
    };

    const updateAttendance = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(
                `/api/attendance/${editingAttendance.id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(attendanceForm)
                }
            );

            if (!response.ok) {
                alert('Failed to update attendance.');
                return;
            }

            resetAttendanceForm();
            fetchAttendances();
        } catch (error) {
            console.error(error);
            alert('Something went wrong.');
        }
    };

    const deleteAttendance = async (id) => {
        if (!confirm('Are you sure you want to delete this attendance record?')) {
            return;
        }

        try {
            const response = await fetch(`/api/attendance/${id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                alert('Failed to delete attendance.');
                return;
            }

            fetchAttendances();
        } catch (error) {
            console.error(error);
        }
    };

    const resetAttendanceForm = () => {
        setAttendanceForm({
            student_id: '',
            date: '2026-10-05',
            time: '',
            status: 'Present'
        });

        setEditingAttendance(null);
        setShowAttendanceForm(false);
    };

    // ==========================
    // ATTENDANCE COUNTS
    // ==========================

    const presentCount = attendances.filter(
        (attendance) => attendance.status === 'Present'
    ).length;

    const lateCount = attendances.filter(
        (attendance) => attendance.status === 'Late'
    ).length;

    const absentCount = attendances.filter(
        (attendance) => attendance.status === 'Absent'
    ).length;

    // ==========================
    // NAVIGATION
    // ==========================

    const goToPage = (newPage) => {
        setPage(newPage);

        setShowStudentForm(false);
        setShowAttendanceForm(false);

        setEditingStudent(null);
        setEditingAttendance(null);
    };

    // ==========================
    // PAGE
    // ==========================

    return (
        <div style={styles.app}>

            {/* SIDEBAR */}

            <aside style={styles.sidebar}>

                <h2 style={styles.logo}>
                    AttendEase
                </h2>

                <p style={styles.logoSubtitle}>
                    Attendance System
                </p>

                <button
                    style={
                        page === 'dashboard'
                            ? styles.activeMenu
                            : styles.menu
                    }
                    onClick={() => goToPage('dashboard')}
                >
                    🏠 Dashboard
                </button>

                <button
                    style={
                        page === 'students'
                            ? styles.activeMenu
                            : styles.menu
                    }
                    onClick={() => goToPage('students')}
                >
                    👨‍🎓 Students
                </button>

                <button
                    style={
                        page === 'attendance'
                            ? styles.activeMenu
                            : styles.menu
                    }
                    onClick={() => goToPage('attendance')}
                >
                    📝 Attendance
                </button>

                <button
                    style={
                        page === 'reports'
                            ? styles.activeMenu
                            : styles.menu
                    }
                    onClick={() => goToPage('reports')}
                >
                    📊 Reports
                </button>

                <button
                    style={
                        page === 'settings'
                            ? styles.activeMenu
                            : styles.menu
                    }
                    onClick={() => goToPage('settings')}
                >
                    ⚙️ Settings
                </button>

            </aside>

            {/* MAIN CONTENT */}

            <main style={styles.main}>

                {/* ==========================
                    DASHBOARD
                ========================== */}

                {page === 'dashboard' && (
                    <>
                        <h1>Dashboard</h1>

                        <p style={styles.subtitle}>
                            Welcome to the AttendEase Student Attendance
                            Monitoring System.
                        </p>

                        <div style={styles.cards}>

                            <div style={styles.card}>
                                <h3>Total Students</h3>
                                <h2>{students.length}</h2>
                                <p style={styles.cardText}>
                                    Registered students
                                </p>
                            </div>

                            <div style={styles.card}>
                                <h3>Present Today</h3>
                                <h2>{presentCount}</h2>
                                <p style={styles.cardText}>
                                    Present records
                                </p>
                            </div>

                            <div style={styles.card}>
                                <h3>Late Today</h3>
                                <h2>{lateCount}</h2>
                                <p style={styles.cardText}>
                                    Late records
                                </p>
                            </div>

                            <div style={styles.card}>
                                <h3>Absent Today</h3>
                                <h2>{absentCount}</h2>
                                <p style={styles.cardText}>
                                    Absent records
                                </p>
                            </div>

                        </div>

                        <div style={styles.welcome}>
                            <h2>
                                Welcome to AttendEase 👋
                            </h2>

                            <p>
                                Manage students, record attendance, and
                                view attendance reports in one place.
                            </p>
                        </div>
                    </>
                )}

                {/* ==========================
                    STUDENTS
                ========================== */}

                {page === 'students' && (
                    <>
                        <div style={styles.pageHeader}>

                            <div>
                                <h1>Students</h1>

                                <p style={styles.subtitle}>
                                    Manage registered students.
                                </p>
                            </div>

                            <button
                                style={styles.addButton}
                                onClick={() => {
                                    setEditingStudent(null);

                                    setStudentForm({
                                        student_id: '',
                                        full_name: '',
                                        course: '',
                                        year_level: '',
                                        section: ''
                                    });

                                    setShowStudentForm(true);
                                }}
                            >
                                + Add Student
                            </button>

                        </div>

                        {showStudentForm && (
                            <form
                                onSubmit={
                                    editingStudent
                                        ? updateStudent
                                        : addStudent
                                }
                                style={styles.form}
                            >

                                <h2>
                                    {editingStudent
                                        ? 'Edit Student'
                                        : 'Add Student'}
                                </h2>

                                <input
                                    name="student_id"
                                    placeholder="Student ID"
                                    value={studentForm.student_id}
                                    onChange={handleStudentChange}
                                    required
                                    style={styles.input}
                                />

                                <input
                                    name="full_name"
                                    placeholder="Full Name"
                                    value={studentForm.full_name}
                                    onChange={handleStudentChange}
                                    required
                                    style={styles.input}
                                />

                                <input
                                    name="course"
                                    placeholder="Course"
                                    value={studentForm.course}
                                    onChange={handleStudentChange}
                                    required
                                    style={styles.input}
                                />

                                <input
                                    name="year_level"
                                    placeholder="Year Level"
                                    value={studentForm.year_level}
                                    onChange={handleStudentChange}
                                    required
                                    style={styles.input}
                                />

                                <input
                                    name="section"
                                    placeholder="Section"
                                    value={studentForm.section}
                                    onChange={handleStudentChange}
                                    required
                                    style={styles.input}
                                />

                                <button
                                    type="submit"
                                    style={styles.saveButton}
                                >
                                    {editingStudent
                                        ? 'Update Student'
                                        : 'Save Student'}
                                </button>

                                <button
                                    type="button"
                                    onClick={resetStudentForm}
                                    style={styles.cancelButton}
                                >
                                    Cancel
                                </button>

                            </form>
                        )}

                        <div style={styles.tableContainer}>

                            <table style={styles.table}>

                                <thead>
                                    <tr>
                                        <th style={styles.th}>
                                            Student ID
                                        </th>

                                        <th style={styles.th}>
                                            Full Name
                                        </th>

                                        <th style={styles.th}>
                                            Course
                                        </th>

                                        <th style={styles.th}>
                                            Year
                                        </th>

                                        <th style={styles.th}>
                                            Section
                                        </th>

                                        <th style={styles.th}>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {students.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="6"
                                                style={styles.empty}
                                            >
                                                No students found.
                                            </td>
                                        </tr>
                                    ) : (
                                        students.map((student) => (
                                            <tr key={student.id}>

                                                <td style={styles.td}>
                                                    {student.student_id}
                                                </td>

                                                <td style={styles.td}>
                                                    {student.full_name}
                                                </td>

                                                <td style={styles.td}>
                                                    {student.course}
                                                </td>

                                                <td style={styles.td}>
                                                    {student.year_level}
                                                </td>

                                                <td style={styles.td}>
                                                    {student.section}
                                                </td>

                                                <td style={styles.td}>

                                                    <button
                                                        onClick={() =>
                                                            editStudent(
                                                                student
                                                            )
                                                        }
                                                        style={
                                                            styles.editButton
                                                        }
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            deleteStudent(
                                                                student.id
                                                            )
                                                        }
                                                        style={
                                                            styles.deleteButton
                                                        }
                                                    >
                                                        Delete
                                                    </button>

                                                </td>

                                            </tr>
                                        ))
                                    )}

                                </tbody>

                            </table>

                        </div>
                    </>
                )}

                {/* ==========================
                    ATTENDANCE
                ========================== */}

                {page === 'attendance' && (
                    <>
                        <div style={styles.pageHeader}>

                            <div>
                                <h1>Attendance</h1>

                                <p style={styles.subtitle}>
                                    Record and manage student attendance.
                                </p>
                            </div>

                            <button
                                style={styles.addButton}
                                onClick={() => {
                                    setEditingAttendance(null);

                                    setAttendanceForm({
                                        student_id: '',
                                        date: '2026-10-05',
                                        time: '',
                                        status: 'Present'
                                    });

                                    setShowAttendanceForm(true);
                                }}
                            >
                                + Record Attendance
                            </button>

                        </div>

                        {showAttendanceForm && (
                            <form
                                onSubmit={
                                    editingAttendance
                                        ? updateAttendance
                                        : addAttendance
                                }
                                style={styles.form}
                            >

                                <h2>
                                    {editingAttendance
                                        ? 'Edit Attendance'
                                        : 'Record Attendance'}
                                </h2>

                                <label style={styles.label}>
                                    Student
                                </label>

                                <select
                                    name="student_id"
                                    value={attendanceForm.student_id}
                                    onChange={handleAttendanceChange}
                                    required
                                    style={styles.input}
                                >

                                    <option value="">
                                        Select Student
                                    </option>

                                    {students.map((student) => (
                                        <option
                                            key={student.id}
                                            value={student.id}
                                        >
                                            {student.student_id} -{' '}
                                            {student.full_name}
                                        </option>
                                    ))}

                                </select>

                                <label style={styles.label}>
                                    Date
                                </label>

                                <input
                                    type="date"
                                    name="date"
                                    value={attendanceForm.date}
                                    onChange={handleAttendanceChange}
                                    required
                                    style={styles.input}
                                />

                                <label style={styles.label}>
                                    Time
                                </label>

                                <input
                                    type="time"
                                    name="time"
                                    value={attendanceForm.time}
                                    onChange={handleAttendanceChange}
                                    style={styles.input}
                                />

                                <label style={styles.label}>
                                    Status
                                </label>

                                <select
                                    name="status"
                                    value={attendanceForm.status}
                                    onChange={handleAttendanceChange}
                                    style={styles.input}
                                >

                                    <option value="Present">
                                        Present
                                    </option>

                                    <option value="Late">
                                        Late
                                    </option>

                                    <option value="Absent">
                                        Absent
                                    </option>

                                </select>

                                <button
                                    type="submit"
                                    style={styles.saveButton}
                                >
                                    {editingAttendance
                                        ? 'Update Attendance'
                                        : 'Save Attendance'}
                                </button>

                                <button
                                    type="button"
                                    onClick={resetAttendanceForm}
                                    style={styles.cancelButton}
                                >
                                    Cancel
                                </button>

                            </form>
                        )}

                        <div style={styles.tableContainer}>

                            <table style={styles.table}>

                                <thead>
                                    <tr>
                                        <th style={styles.th}>
                                            Student ID
                                        </th>

                                        <th style={styles.th}>
                                            Student Name
                                        </th>

                                        <th style={styles.th}>
                                            Date
                                        </th>

                                        <th style={styles.th}>
                                            Time
                                        </th>

                                        <th style={styles.th}>
                                            Status
                                        </th>

                                        <th style={styles.th}>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {attendances.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="6"
                                                style={styles.empty}
                                            >
                                                No attendance records found.
                                            </td>
                                        </tr>
                                    ) : (
                                        attendances.map((attendance) => (
                                            <tr key={attendance.id}>

                                                <td style={styles.td}>
                                                    {
                                                        attendance.student
                                                            ?.student_id
                                                    }
                                                </td>

                                                <td style={styles.td}>
                                                    {
                                                        attendance.student
                                                            ?.full_name
                                                    }
                                                </td>

                                                <td style={styles.td}>
                                                    {attendance.date}
                                                </td>

                                                <td style={styles.td}>
                                                    {attendance.time || '-'}
                                                </td>

                                                <td style={styles.td}>

                                                    <span
                                                        style={
                                                            attendance.status ===
                                                            'Present'
                                                                ? styles.present
                                                                : attendance.status ===
                                                                  'Late'
                                                                ? styles.late
                                                                : styles.absent
                                                        }
                                                    >
                                                        {attendance.status}
                                                    </span>

                                                </td>

                                                <td style={styles.td}>

                                                    <button
                                                        onClick={() =>
                                                            editAttendance(
                                                                attendance
                                                            )
                                                        }
                                                        style={
                                                            styles.editButton
                                                        }
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            deleteAttendance(
                                                                attendance.id
                                                            )
                                                        }
                                                        style={
                                                            styles.deleteButton
                                                        }
                                                    >
                                                        Delete
                                                    </button>

                                                </td>

                                            </tr>
                                        ))
                                    )}

                                </tbody>

                            </table>

                        </div>
                    </>
                )}

                {/* ==========================
                    REPORTS
                ========================== */}

                {page === 'reports' && (
                    <>
                        <div style={styles.pageHeader}>

                            <div>
                                <h1>Attendance Reports</h1>

                                <p style={styles.subtitle}>
                                    View attendance summaries and records.
                                </p>
                            </div>

                            <button
                                style={styles.printButton}
                                onClick={() => window.print()}
                            >
                                🖨️ Print Report
                            </button>

                        </div>

                        <div style={styles.cards}>

                            <div style={styles.card}>
                                <h3>Total Students</h3>
                                <h2>{students.length}</h2>
                                <p style={styles.cardText}>
                                    Registered students
                                </p>
                            </div>

                            <div style={styles.card}>
                                <h3>Present</h3>
                                <h2>{presentCount}</h2>
                                <p style={styles.cardText}>
                                    Present records
                                </p>
                            </div>

                            <div style={styles.card}>
                                <h3>Late</h3>
                                <h2>{lateCount}</h2>
                                <p style={styles.cardText}>
                                    Late records
                                </p>
                            </div>

                            <div style={styles.card}>
                                <h3>Absent</h3>
                                <h2>{absentCount}</h2>
                                <p style={styles.cardText}>
                                    Absent records
                                </p>
                            </div>

                        </div>

                        <div style={styles.reportBox}>

                            <h2>
                                Attendance Records
                            </h2>

                            <p style={styles.reportDescription}>
                                Complete attendance records of registered
                                students.
                            </p>

                            <div style={styles.tableContainer}>

                                <table style={styles.table}>

                                    <thead>
                                        <tr>

                                            <th style={styles.th}>
                                                Student ID
                                            </th>

                                            <th style={styles.th}>
                                                Student Name
                                            </th>

                                            <th style={styles.th}>
                                                Date
                                            </th>

                                            <th style={styles.th}>
                                                Time
                                            </th>

                                            <th style={styles.th}>
                                                Status
                                            </th>

                                        </tr>
                                    </thead>

                                    <tbody>

                                        {attendances.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan="5"
                                                    style={styles.empty}
                                                >
                                                    No attendance records
                                                    found.
                                                </td>
                                            </tr>
                                        ) : (
                                            attendances.map(
                                                (attendance) => (
                                                    <tr
                                                        key={
                                                            attendance.id
                                                        }
                                                    >

                                                        <td
                                                            style={
                                                                styles.td
                                                            }
                                                        >
                                                            {
                                                                attendance
                                                                    .student
                                                                    ?.student_id
                                                            }
                                                        </td>

                                                        <td
                                                            style={
                                                                styles.td
                                                            }
                                                        >
                                                            {
                                                                attendance
                                                                    .student
                                                                    ?.full_name
                                                            }
                                                        </td>

                                                        <td
                                                            style={
                                                                styles.td
                                                            }
                                                        >
                                                            {
                                                                attendance.date
                                                            }
                                                        </td>

                                                        <td
                                                            style={
                                                                styles.td
                                                            }
                                                        >
                                                            {
                                                                attendance.time ||
                                                                '-'
                                                            }
                                                        </td>

                                                        <td
                                                            style={
                                                                styles.td
                                                            }
                                                        >

                                                            <span
                                                                style={
                                                                    attendance.status ===
                                                                    'Present'
                                                                        ? styles.present
                                                                        : attendance.status ===
                                                                          'Late'
                                                                        ? styles.late
                                                                        : styles.absent
                                                                }
                                                            >
                                                                {
                                                                    attendance.status
                                                                }
                                                            </span>

                                                        </td>

                                                    </tr>
                                                )
                                            )
                                        )}

                                    </tbody>

                                </table>

                            </div>

                        </div>
                    </>
                )}

                {/* ==========================
                    SETTINGS
                ========================== */}

                {page === 'settings' && (
                    <>
                        <h1>Settings</h1>

                        <p style={styles.subtitle}>
                            System settings.
                        </p>

                        <div style={styles.welcome}>

                            <h2>
                                AttendEase Settings ⚙️
                            </h2>

                            <p>
                                Settings and system configuration can be
                                added here in the future.
                            </p>

                        </div>
                    </>
                )}

            </main>

        </div>
    );
}

// ==========================
// STYLES
// ==========================

const styles = {

    app: {
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f4f6f8',
        minHeight: '100vh'
    },

    sidebar: {
        width: '230px',
        backgroundColor: '#1e293b',
        color: 'white',
        position: 'fixed',
        top: 0,
        bottom: 0,
        padding: '25px 15px',
        boxSizing: 'border-box'
    },

    logo: {
        textAlign: 'center',
        marginBottom: '5px'
    },

    logoSubtitle: {
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: '12px',
        marginBottom: '35px'
    },

    menu: {
        width: '100%',
        padding: '12px',
        marginBottom: '10px',
        border: 'none',
        background: 'none',
        color: 'white',
        textAlign: 'left',
        cursor: 'pointer',
        fontSize: '15px',
        borderRadius: '8px'
    },

    activeMenu: {
        width: '100%',
        padding: '12px',
        marginBottom: '10px',
        border: 'none',
        backgroundColor: '#334155',
        color: 'white',
        textAlign: 'left',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '15px'
    },

    main: {
        marginLeft: '230px',
        padding: '35px'
    },

    subtitle: {
        color: '#64748b',
        marginBottom: '30px'
    },

    cards: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px',
        marginBottom: '30px'
    },

    card: {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
    },

    cardText: {
        color: '#64748b',
        fontSize: '13px'
    },

    welcome: {
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    },

    pageHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '25px'
    },

    addButton: {
        backgroundColor: '#2563eb',
        color: 'white',
        border: 'none',
        padding: '12px 18px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px'
    },

    printButton: {
        backgroundColor: '#475569',
        color: 'white',
        border: 'none',
        padding: '12px 18px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px'
    },

    form: {
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '12px',
        marginBottom: '25px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    },

    label: {
        display: 'block',
        marginBottom: '6px',
        fontWeight: 'bold'
    },

    input: {
        display: 'block',
        width: '100%',
        boxSizing: 'border-box',
        padding: '12px',
        marginBottom: '12px',
        border: '1px solid #cbd5e1',
        borderRadius: '6px',
        backgroundColor: 'white'
    },

    saveButton: {
        backgroundColor: '#16a34a',
        color: 'white',
        border: 'none',
        padding: '12px 18px',
        borderRadius: '8px',
        cursor: 'pointer',
        marginRight: '8px'
    },

    cancelButton: {
        backgroundColor: '#64748b',
        color: 'white',
        border: 'none',
        padding: '12px 18px',
        borderRadius: '8px',
        cursor: 'pointer'
    },

    tableContainer: {
        backgroundColor: 'white',
        borderRadius: '12px',
        overflow: 'auto',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    },

    table: {
        width: '100%',
        borderCollapse: 'collapse'
    },

    th: {
        backgroundColor: '#e2e8f0',
        padding: '14px',
        textAlign: 'left'
    },

    td: {
        padding: '14px',
        borderTop: '1px solid #e2e8f0'
    },

    empty: {
        padding: '30px',
        textAlign: 'center',
        color: '#64748b'
    },

    editButton: {
        backgroundColor: '#f59e0b',
        color: 'white',
        border: 'none',
        padding: '7px 12px',
        borderRadius: '6px',
        cursor: 'pointer',
        marginRight: '8px'
    },

    deleteButton: {
        backgroundColor: '#dc2626',
        color: 'white',
        border: 'none',
        padding: '7px 12px',
        borderRadius: '6px',
        cursor: 'pointer'
    },

    present: {
        backgroundColor: '#dcfce7',
        color: '#166534',
        padding: '5px 10px',
        borderRadius: '20px'
    },

    late: {
        backgroundColor: '#fef3c7',
        color: '#92400e',
        padding: '5px 10px',
        borderRadius: '20px'
    },

    absent: {
        backgroundColor: '#fee2e2',
        color: '#991b1b',
        padding: '5px 10px',
        borderRadius: '20px'
    },

    reportBox: {
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    },

    reportDescription: {
        color: '#64748b',
        marginBottom: '20px'
    }
};

createRoot(document.getElementById('app')).render(<App />);