import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

const today = () => {
    const date = new Date();
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
};

const emptyStudent = {
    student_id: '',
    full_name: '',
    course: '',
    year_level: '',
    section: '',
};

const emptyAttendance = () => ({
    student_id: '',
    date: today(),
    time: new Date().toTimeString().slice(0, 5),
    status: 'Present',
});

async function apiRequest(url, options = {}) {
    const token = localStorage.getItem('attendease_token');

    const response = await fetch(url, {
        ...options,
        headers: {
            Accept: 'application/json',
            ...(options.body
                ? { 'Content-Type': 'application/json' }
                : {}),
            ...(token
                ? { Authorization: `Bearer ${token}` }
                : {}),
            ...options.headers,
        },
    });

    if (response.status === 204) return null;

    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

    if (!response.ok) {
        const validationErrors = data?.errors
            ? Object.values(data.errors).flat().join(' ')
            : '';

        throw new Error(
            validationErrors ||
            data?.message ||
            'The request could not be completed.'
        );
    }

    return data;
}

function formatDate(value) {
    if (!value) return '—';
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime())
        ? value
        : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function StatusBadge({ status }) {
    return <span className={`status status-${String(status || '').toLowerCase()}`}>{status || 'Unknown'}</span>;
}

function App() {
const [page, setPage] = useState('dashboard');

const [students, setStudents] = useState([]);
const [attendances, setAttendances] = useState([]);

const [loading, setLoading] = useState(true);
const [busy, setBusy] = useState(false);
const [notice, setNotice] = useState({ type: '', text: '' });

const [studentSearch, setStudentSearch] = useState('');
const [attendanceSearch, setAttendanceSearch] = useState('');
const [attendanceDate, setAttendanceDate] = useState('');
const [reportDate, setReportDate] = useState('');

const [showStudentForm, setShowStudentForm] = useState(false);
const [showAttendanceForm, setShowAttendanceForm] = useState(false);

const [editingStudent, setEditingStudent] = useState(null);
const [editingAttendance, setEditingAttendance] = useState(null);

const [studentForm, setStudentForm] = useState(emptyStudent);
const [attendanceForm, setAttendanceForm] = useState(emptyAttendance);

// NEW: Login state
const [currentUser, setCurrentUser] = useState(null);
const [authChecking, setAuthChecking] = useState(true);
const [loginEmail, setLoginEmail] = useState('');
const [loginPassword, setLoginPassword] = useState('');
const [loginBusy, setLoginBusy] = useState(false);
const [loginError, setLoginError] = useState('');

    const refreshData = async () => {
        setLoading(true);
        try {
            const [studentData, attendanceData] = await Promise.all([
                apiRequest('/api/students'),
                apiRequest('/api/attendance'),
            ]);
            setStudents(Array.isArray(studentData) ? studentData : studentData?.data || []);
            setAttendances(Array.isArray(attendanceData) ? attendanceData : attendanceData?.data || []);
        } catch (error) {
            setNotice({ type: 'error', text: `Unable to load records. ${error.message}` });
        } finally {
            setLoading(false);
        }
    };
    
const handleLogin = async (event) => {
    event.preventDefault();
    setLoginBusy(true);
    setLoginError('');

    try {
        const result = await apiRequest('/api/login', {
            method: 'POST',
            body: JSON.stringify({
                email: loginEmail,
                password: loginPassword,
            }),
        });

        localStorage.setItem('attendease_token', result.token);
        setCurrentUser(result.user);
        setLoginPassword('');

        await refreshData();
    } catch (error) {
        setLoginError(error.message || 'Login failed. Please try again.');
    } finally {
        setLoginBusy(false);
    }
};

const handleLogout = async () => {
    try {
        await apiRequest('/api/logout', {
            method: 'POST',
        });
    } catch (error) {
        // Continue clearing the local session.
    } finally {
        localStorage.removeItem('attendease_token');
        setCurrentUser(null);
        setStudents([]);
        setAttendances([]);
        setPage('dashboard');
        setNotice({ type: '', text: '' });
        setLoginPassword('');
    }
};

    
useEffect(() => {
    const checkSession = async () => {
        const token = localStorage.getItem('attendease_token');

        if (!token) {
            setAuthChecking(false);
            return;
        }

        try {
            const result = await apiRequest('/api/me');
            setCurrentUser(result.user || result);
            await refreshData();
        } catch (error) {
            localStorage.removeItem('attendease_token');
            setCurrentUser(null);
            setStudents([]);
            setAttendances([]);
        } finally {
            setAuthChecking(false);
        }
    };

    checkSession();
}, []);

    useEffect(() => {
        if (!notice.text) return undefined;
        const timer = setTimeout(() => setNotice({ type: '', text: '' }), 5000);
        return () => clearTimeout(timer);
    }, [notice]);

    const todaysAttendances = useMemo(
        () => attendances.filter(item => item.date === today()),
        [attendances]
    );

    const counts = useMemo(() => ({
        present: todaysAttendances.filter(item => item.status === 'Present').length,
        late: todaysAttendances.filter(item => item.status === 'Late').length,
        absent: todaysAttendances.filter(item => item.status === 'Absent').length,
    }), [todaysAttendances]);

    const filteredStudents = useMemo(() => {
        const query = studentSearch.trim().toLowerCase();
        return students.filter(student =>
            [student.student_id, student.full_name, student.course, student.year_level, student.section]
                .some(value => String(value || '').toLowerCase().includes(query))
        );
    }, [students, studentSearch]);

    const filteredAttendance = useMemo(() => {
        const query = attendanceSearch.trim().toLowerCase();
        return attendances.filter(item => {
            const matchesDate = !attendanceDate || item.date === attendanceDate;
            const student = item.student || students.find(s => Number(s.id) === Number(item.student_id));
            const matchesQuery = !query || [
                student?.student_id,
                student?.full_name,
                item.status,
                item.date,
            ].some(value => String(value || '').toLowerCase().includes(query));
            return matchesDate && matchesQuery;
        });
    }, [attendances, attendanceDate, attendanceSearch, students]);

    const reportRows = useMemo(
        () => attendances.filter(item => !reportDate || item.date === reportDate),
        [attendances, reportDate]
    );

    const reportCounts = useMemo(() => ({
        present: reportRows.filter(item => item.status === 'Present').length,
        late: reportRows.filter(item => item.status === 'Late').length,
        absent: reportRows.filter(item => item.status === 'Absent').length,
    }), [reportRows]);

    const studentFor = (attendance) =>
        attendance.student || students.find(s => Number(s.id) === Number(attendance.student_id));

    const goToPage = (nextPage) => {
        setPage(nextPage);
        setShowStudentForm(false);
        setShowAttendanceForm(false);
        setEditingStudent(null);
        setEditingAttendance(null);
    };

    const startStudentAdd = () => {
        setEditingStudent(null);
        setStudentForm(emptyStudent);
        setShowStudentForm(true);
    };

    const startAttendanceAdd = () => {
        setEditingAttendance(null);
        setAttendanceForm(emptyAttendance());
        setShowAttendanceForm(true);
    };

    const saveStudent = async (event) => {
        event.preventDefault();
        setBusy(true);
        try {
            await apiRequest(
                editingStudent ? `/api/students/${editingStudent.id}` : '/api/students',
                {
                    method: editingStudent ? 'PUT' : 'POST',
                    body: JSON.stringify(studentForm),
                }
            );
            setNotice({ type: 'success', text: editingStudent ? 'Student updated successfully.' : 'Student added successfully.' });
            setShowStudentForm(false);
            setEditingStudent(null);
            setStudentForm(emptyStudent);
            await refreshData();
        } catch (error) {
            setNotice({ type: 'error', text: error.message });
        } finally {
            setBusy(false);
        }
    };

    const startStudentEdit = (student) => {
        setEditingStudent(student);
        setStudentForm({
            student_id: student.student_id || '',
            full_name: student.full_name || '',
            course: student.course || '',
            year_level: student.year_level || '',
            section: student.section || '',
        });
        setShowStudentForm(true);
    };

    const removeStudent = async (student) => {
        if (!window.confirm(`Delete ${student.full_name}? Related attendance records may also be deleted.`)) return;
        setBusy(true);
        try {
            await apiRequest(`/api/students/${student.id}`, { method: 'DELETE' });
            setNotice({ type: 'success', text: 'Student deleted.' });
            await refreshData();
        } catch (error) {
            setNotice({ type: 'error', text: error.message });
        } finally {
            setBusy(false);
        }
    };

    const saveAttendance = async (event) => {
        event.preventDefault();
        setBusy(true);
        try {
            const duplicate = attendances.some(item =>
                Number(item.student_id) === Number(attendanceForm.student_id) &&
                item.date === attendanceForm.date &&
                Number(item.id) !== Number(editingAttendance?.id)
            );
            if (duplicate) {
                setNotice({ type: 'error', text: 'An attendance record already exists for this student on that date. Edit the existing record instead.' });
                setBusy(false);
                return;
            }

            await apiRequest(
                editingAttendance ? `/api/attendance/${editingAttendance.id}` : '/api/attendance',
                {
                    method: editingAttendance ? 'PUT' : 'POST',
                    body: JSON.stringify({
                        ...attendanceForm,
                        student_id: Number(attendanceForm.student_id),
                        time: attendanceForm.time || null,
                    }),
                }
            );
            setNotice({ type: 'success', text: editingAttendance ? 'Attendance updated successfully.' : 'Attendance recorded successfully.' });
            setShowAttendanceForm(false);
            setEditingAttendance(null);
            setAttendanceForm(emptyAttendance());
            await refreshData();
        } catch (error) {
            setNotice({ type: 'error', text: error.message });
        } finally {
            setBusy(false);
        }
    };

    const startAttendanceEdit = (attendance) => {
        setEditingAttendance(attendance);
        setAttendanceForm({
            student_id: String(attendance.student_id || ''),
            date: attendance.date || today(),
            time: attendance.time || '',
            status: attendance.status || 'Present',
        });
        setShowAttendanceForm(true);
    };

    const removeAttendance = async (attendance) => {
        if (!window.confirm('Delete this attendance record?')) return;
        setBusy(true);
        try {
            await apiRequest(`/api/attendance/${attendance.id}`, { method: 'DELETE' });
            setNotice({ type: 'success', text: 'Attendance record deleted.' });
            await refreshData();
        } catch (error) {
            setNotice({ type: 'error', text: error.message });
        } finally {
            setBusy(false);
        }
    };

    const pageTitles = {
        dashboard: ['Dashboard', 'Your attendance overview at a glance.'],
        students: ['Student Management', 'Add, search, update, and manage student records.'],
        attendance: ['Attendance Management', 'Record attendance and review daily entries.'],
        reports: ['Attendance Reports', 'Filter attendance records and print a report.'],
        settings: ['System Information', 'Project details and quick guidance.'],
    };  
    
if (authChecking) {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily: 'Arial, sans-serif',
        }}>
            <h2>Checking login...</h2>
        </div>
    );
}

if (!currentUser) {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#f1f5f9',
            fontFamily: 'Arial, sans-serif',
            padding: '20px',
        }}>
            <form
                onSubmit={handleLogin}
                style={{
                    width: '100%',
                    maxWidth: '400px',
                    padding: '30px',
                    background: 'white',
                    borderRadius: '14px',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                }}
            >
                <h1 style={{ textAlign: 'center', color: '#4338ca' }}>
                    AttendEase
                </h1>

                <p style={{ textAlign: 'center', color: '#64748b' }}>
                    Student Attendance Monitoring System
                </p>

                {loginError && (
                    <p style={{ color: 'red' }}>{loginError}</p>
                )}

                <label>Email Address</label>
                <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    style={{
                        display: 'block',
                        width: '100%',
                        padding: '12px',
                        margin: '8px 0 18px',
                        boxSizing: 'border-box',
                    }}
                />

                <label>Password</label>
                <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    style={{
                        display: 'block',
                        width: '100%',
                        padding: '12px',
                        margin: '8px 0 20px',
                        boxSizing: 'border-box',
                    }}
                />

                <button
                    type="submit"
                    disabled={loginBusy}
                    style={{
                        width: '100%',
                        padding: '12px',
                        background: '#4338ca',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                    }}
                >
                    {loginBusy ? 'Signing in...' : 'Sign In'}
                </button>
            </form>
        </div>
    );
}

    return (
        <div className="app-shell">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap');
                :root { font-family: 'DM Sans', Arial, sans-serif; color: #172033; background: #f5f7fb; font-synthesis: none; }
                * { box-sizing: border-box; }
                body { margin: 0; }
                button, input, select { font: inherit; }
                button { cursor: pointer; transition: .18s ease; }
                button:disabled { opacity: .6; cursor: not-allowed; }
                .app-shell { min-height: 100vh; }
                .sidebar { width: 250px; position: fixed; inset: 0 auto 0 0; z-index: 5; background: #111b34; color: #fff; padding: 28px 18px; display: flex; flex-direction: column; }
                .brand { display: flex; gap: 12px; align-items: center; padding: 2px 10px 28px; }
                .brand-mark { width: 42px; height: 42px; border-radius: 13px; display: grid; place-items: center; color: #fff; font-weight: 800; background: linear-gradient(135deg,#6366f1,#3b82f6); box-shadow: 0 8px 18px #4f46e540; }
                .brand h2 { margin: 0; font: 800 20px Manrope, sans-serif; letter-spacing: -.6px; }
                .brand p { margin: 4px 0 0; font-size: 11px; color: #aab5cc; }
                .nav-label { color: #7887a5; font-size: 10px; letter-spacing: 1.5px; font-weight: 700; padding: 14px 12px 10px; }
                .nav-button { border: 0; width: 100%; display: flex; gap: 12px; align-items: center; text-align: left; padding: 12px 14px; margin: 3px 0; border-radius: 10px; background: transparent; color: #b8c2d8; font-size: 13px; font-weight: 600; }
                .nav-button:hover { background: #ffffff10; color: white; }
                .nav-button.active { background: linear-gradient(100deg,#4f46e5,#4361ee); color: white; box-shadow: 0 7px 18px #4338ca35; }
                .nav-icon { width: 20px; text-align: center; font-size: 16px; }
                .sidebar-footer { margin-top: auto; border-top: 1px solid #ffffff16; padding: 18px 10px 0; display: flex; gap: 10px; align-items: center; }
                .avatar { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 50%; background: #27365b; color: #dbeafe; font-weight: 700; font-size: 12px; }
                .sidebar-footer strong { display: block; font-size: 12px; }
                .sidebar-footer small { color: #8d9ab4; font-size: 10px; }
                .main { margin-left: 250px; min-height: 100vh; }
                .topbar { height: 78px; display: flex; justify-content: space-between; align-items: center; padding: 0 36px; background: #fff; border-bottom: 1px solid #e9edf5; }
                .breadcrumb { font-size: 11px; color: #8a94a8; margin-bottom: 4px; }
                .topbar h1 { font: 800 19px Manrope, sans-serif; margin: 0; letter-spacing: -.4px; }
                .today-chip { border: 1px solid #e6eaf2; padding: 9px 12px; border-radius: 9px; color: #566176; font-size: 11px; font-weight: 600; background: #fbfcfe; }
                .content { padding: 30px 36px 45px; max-width: 1600px; margin: 0 auto; }
                .welcome-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 25px; }
                .welcome-row h2 { font: 800 25px Manrope, sans-serif; letter-spacing: -.8px; margin: 0 0 8px; }
                .muted { color: #7a8498; font-size: 13px; margin: 0; line-height: 1.6; }
                .eyebrow { color: #5967dc; font-weight: 700; font-size: 10px; letter-spacing: 1.3px; text-transform: uppercase; margin-bottom: 9px; }
                .btn { border: 0; border-radius: 9px; padding: 11px 15px; font-size: 12px; font-weight: 700; display: inline-flex; gap: 7px; align-items: center; justify-content: center; }
                .btn-primary { background: #4f46e5; color: white; box-shadow: 0 5px 12px #4f46e520; }
                .btn-primary:hover { background: #4338ca; transform: translateY(-1px); }
                .btn-light { color: #4e5b73; background: #eef1f7; }
                .btn-light:hover { background: #e2e7f0; }
                .btn-danger { color: #c2414a; background: #fff0f0; }
                .btn-danger:hover { background: #ffe0e0; }
                .btn-small { padding: 7px 10px; font-size: 11px; margin-right: 5px; }
                .stats-grid { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 16px; margin-bottom: 24px; }
                .stat-card { border: 1px solid #e9edf5; background: #fff; padding: 20px; border-radius: 14px; box-shadow: 0 3px 12px #18284b05; min-width: 0; }
                .stat-top { display: flex; align-items: center; justify-content: space-between; color: #6c778d; font-size: 11px; font-weight: 700; }
                .stat-icon { width: 35px; height: 35px; border-radius: 10px; display: grid; place-items: center; font-size: 16px; }
                .stat-number { font: 800 28px Manrope, sans-serif; margin: 14px 0 5px; letter-spacing: -1px; }
                .stat-foot { color: #8b95a7; font-size: 10px; }
                .stat-blue .stat-icon { color: #4f46e5; background: #eef0ff; }
                .stat-green .stat-icon { color: #16865d; background: #e6f8ef; }
                .stat-amber .stat-icon { color: #b7791f; background: #fff5df; }
                .stat-red .stat-icon { color: #d04451; background: #ffebed; }
                .panel { border: 1px solid #e9edf5; background: #fff; border-radius: 14px; box-shadow: 0 3px 12px #18284b05; margin-bottom: 22px; overflow: hidden; }
                .panel-head { display: flex; justify-content: space-between; align-items: center; gap: 15px; padding: 19px 22px; border-bottom: 1px solid #edf0f6; }
                .panel-head h3 { margin: 0; font: 700 14px Manrope, sans-serif; }
                .panel-head p { margin: 5px 0 0; color: #8992a5; font-size: 11px; }
                .panel-body { padding: 20px 22px; }
                .toolbar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
                .field { width: 100%; border: 1px solid #dfe4ee; background: #fff; border-radius: 8px; padding: 11px 12px; color: #27324a; outline: none; font-size: 12px; }
                .field:focus { border-color: #818cf8; box-shadow: 0 0 0 3px #818cf81a; }
                .search-field { width: min(100%, 300px); }
                .filter-field { width: auto; min-width: 150px; }
                .table-wrap { width: 100%; overflow-x: auto; }
                table { width: 100%; border-collapse: collapse; white-space: nowrap; }
                th { text-align: left; background: #f8f9fc; color: #8490a4; font-size: 10px; text-transform: uppercase; letter-spacing: .65px; font-weight: 700; padding: 13px 17px; border-bottom: 1px solid #e9edf5; }
                td { padding: 14px 17px; border-bottom: 1px solid #f0f2f7; color: #536078; font-size: 12px; }
                tbody tr:hover { background: #fafbff; }
                tbody tr:last-child td { border-bottom: 0; }
                .student-cell { display: flex; align-items: center; gap: 10px; }
                .student-avatar { width: 31px; height: 31px; border-radius: 9px; display: grid; place-items: center; background: #edf0ff; color: #4f46e5; font-weight: 800; font-size: 10px; }
                .student-name { font-weight: 700; color: #263149; font-size: 12px; }
                .student-sub { font-size: 10px; color: #929bad; margin-top: 3px; }
                .status { display: inline-flex; padding: 5px 9px; border-radius: 20px; font-size: 10px; font-weight: 700; }
                .status-present { background: #e5f8ee; color: #168454; }
                .status-late { background: #fff4dc; color: #a56b0b; }
                .status-absent { background: #ffebed; color: #c23f4b; }
                .empty-state { text-align: center; padding: 42px 20px; color: #8a94a8; font-size: 12px; }
                .empty-state span { display: block; font-size: 25px; margin-bottom: 9px; }
                .form-panel { padding: 22px; margin-bottom: 22px; border: 1px solid #dfe4ff; background: #fff; border-radius: 14px; box-shadow: 0 5px 20px #4f46e508; }
                .form-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 15px; }
                .form-field label { display: block; color: #59647a; font-size: 11px; font-weight: 700; margin-bottom: 7px; }
                .form-actions { display: flex; gap: 9px; margin-top: 18px; }
                .notice { padding: 12px 15px; border-radius: 9px; margin-bottom: 20px; font-size: 12px; font-weight: 600; }
                .notice-success { background: #e8f8ef; color: #176d48; border: 1px solid #c7efd9; }
                .notice-error { background: #fff0f0; color: #a73540; border: 1px solid #ffd4d8; }
                .quick-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 20px; }
                .quick-list { display: grid; gap: 12px; }
                .quick-item { display: flex; align-items: center; gap: 12px; border: 1px solid #edf0f6; border-radius: 10px; padding: 13px; }
                .quick-item .quick-icon { width: 35px; height: 35px; border-radius: 10px; display: grid; place-items: center; background: #eef0ff; color: #4f46e5; }
                .quick-item strong { display: block; font-size: 12px; }
                .quick-item small { display: block; margin-top: 4px; color: #8b95a7; font-size: 10px; }
                .progress-row { margin: 17px 0; }
                .progress-label { display: flex; justify-content: space-between; font-size: 11px; color: #657087; margin-bottom: 8px; }
                .progress-track { height: 7px; background: #eef1f6; border-radius: 10px; overflow: hidden; }
                .progress-fill { height: 100%; border-radius: 10px; }
                .settings-note { background: #f7f8ff; border: 1px solid #e5e7ff; border-radius: 12px; padding: 18px; color: #58627b; font-size: 12px; line-height: 1.7; }
                .loading { padding: 30px; text-align: center; color: #8791a4; font-size: 12px; }
                @media (max-width: 1100px) { .stats-grid { grid-template-columns: repeat(2,minmax(0,1fr)); } .content { padding: 25px; } .topbar { padding: 0 25px; } .quick-grid { grid-template-columns: 1fr; } }
                @media (max-width: 760px) { .sidebar { position: static; width: 100%; padding: 13px; } .brand { padding: 3px 7px 13px; } .nav-label, .sidebar-footer { display: none; } .sidebar nav { display: flex; overflow-x: auto; gap: 5px; } .nav-button { min-width: max-content; width: auto; padding: 10px; margin: 0; } .main { margin-left: 0; } .topbar { height: 65px; padding: 0 18px; } .content { padding: 22px 16px; } .welcome-row { flex-direction: column; } .welcome-row h2 { font-size: 22px; } .stats-grid { gap: 10px; } .stat-card { padding: 14px; } .stat-number { font-size: 24px; } .panel-head, .panel-body { padding: 15px; } .form-grid { grid-template-columns: 1fr; } .today-chip { display: none; } }
                @media print { .sidebar, .topbar, .no-print, .notice { display: none !important; } .main { margin: 0; } .content { padding: 0; max-width: none; } body, :root { background: white; } .panel, .stat-card { box-shadow: none; break-inside: avoid; } th { background: #f1f1f1 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
            `}</style>

            <aside className="sidebar">
                <div className="brand">
                    <div className="brand-mark">A</div>
                    <div><h2>AttendEase</h2><p>STUDENT ATTENDANCE</p></div>
                </div>
                <div className="nav-label">WORKSPACE</div>
                <nav>
                    {[
                        ['dashboard', '▦', 'Dashboard'],
                        ['students', '♟', 'Students'],
                        ['attendance', '✓', 'Attendance'],
                        ['reports', '▤', 'Reports'],
                        ['settings', '⚙', 'System Info'],
                    ].map(([key, icon, label]) => (
                        <button key={key} className={`nav-button ${page === key ? 'active' : ''}`} onClick={() => goToPage(key)}>
                            <span className="nav-icon">{icon}</span>{label}
                        </button>
                    ))}
                </nav>
                <button
    type="button"
    onClick={handleLogout}
    style={{
        width: 'calc(100% - 32px)',
        margin: '12px 16px',
        background: '#dc2626',
        color: '#ffffff',
        border: 'none',
        borderRadius: '8px',
        padding: '12px',
        cursor: 'pointer',
    }}
>
    🚪 Logout
</button>   
                <div className="sidebar-footer">
                    <div className="avatar">AE</div>
                    <div><strong>AttendEase Admin</strong><small>Attendance workspace</small></div>
                </div>
            </aside>

            <main className="main">
                <header className="topbar">
                    <div><div className="breadcrumb">ATTENDEASE / {page.toUpperCase()}</div><h1>{pageTitles[page][0]}</h1></div>
                    <div className="today-chip">▦ &nbsp; {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
                </header>

                <div className="content">
                    {notice.text && <div className={`notice notice-${notice.type}`} role="status">{notice.text}</div>}

                    {page === 'dashboard' && <>
                        <div className="welcome-row">
                            <div><div className="eyebrow">OVERVIEW</div><h2>Good day! Welcome back 👋</h2><p className="muted">Here is what is happening with your students today.</p></div>
                            <button className="btn btn-primary no-print" onClick={() => { goToPage('attendance'); startAttendanceAdd(); }}>+ Record attendance</button>
                        </div>
                        <div className="stats-grid">
                            <StatCard tone="blue" icon="♟" label="Total students" number={students.length} foot="Registered student profiles" />
                            <StatCard tone="green" icon="✓" label="Present today" number={counts.present} foot="Marked present for today" />
                            <StatCard tone="amber" icon="â—·" label="Late today" number={counts.late} foot="Arrivals marked late" />
                            <StatCard tone="red" icon="×" label="Absent today" number={counts.absent} foot="Marked absent for today" />
                            <StatCard
        tone="blue"
        icon="📋"
        label="Total attendance records"
        number={attendances.length}
        foot="All recorded attendance entries"
    />
                        </div>
                        <div className="quick-grid">
                            <section className="panel">
                                <div className="panel-head"><div><h3>Recent attendance</h3><p>Latest attendance entries</p></div><button className="btn btn-light" onClick={() => goToPage('attendance')}>View all →</button></div>
                                {loading ? <div className="loading">Loading records...</div> : <AttendanceTable rows={[...attendances].sort((a,b) => `${b.date} ${b.time || ''}`.localeCompare(`${a.date} ${a.time || ''}`)).slice(0, 5)} studentFor={studentFor} emptyText="No attendance records yet." compact />}
                            </section>
                            <section className="panel">
                                <div className="panel-head"><div><h3>Today's attendance</h3><p>Attendance status distribution</p></div></div>
                                <div className="panel-body">
                                    <div className="progress-row"><div className="progress-label"><span>Present</span><strong>{counts.present}</strong></div><div className="progress-track"><div className="progress-fill" style={{ width: `${todaysAttendances.length ? counts.present / todaysAttendances.length * 100 : 0}%`, background: '#21a56b' }} /></div></div>
                                    <div className="progress-row"><div className="progress-label"><span>Late</span><strong>{counts.late}</strong></div><div className="progress-track"><div className="progress-fill" style={{ width: `${todaysAttendances.length ? counts.late / todaysAttendances.length * 100 : 0}%`, background: '#e4a126' }} /></div></div>
                                    <div className="progress-row"><div className="progress-label"><span>Absent</span><strong>{counts.absent}</strong></div><div className="progress-track"><div className="progress-fill" style={{ width: `${todaysAttendances.length ? counts.absent / todaysAttendances.length * 100 : 0}%`, background: '#dc5360' }} /></div></div>
                                    <p className="muted" style={{ marginTop: 20 }}>{todaysAttendances.length} attendance record(s) dated {formatDate(today())}.</p>
                                </div>
                            </section>
                        </div>
                        <section className="panel">
                            <div className="panel-head"><div><h3>Quick actions</h3><p>Common tasks for managing attendance</p></div></div>
                            <div className="panel-body quick-list">
                                <div className="quick-item"><div className="quick-icon">♟</div><div style={{ flex: 1 }}><strong>Manage students</strong><small>Add new students or update their information.</small></div><button className="btn btn-light" onClick={() => goToPage('students')}>Open →</button></div>
                                <div className="quick-item"><div className="quick-icon">✓</div><div style={{ flex: 1 }}><strong>Record attendance</strong><small>Enter a student's date, time, and attendance status.</small></div><button className="btn btn-light" onClick={() => { goToPage('attendance'); startAttendanceAdd(); }}>Record →</button></div>
                                <div className="quick-item"><div className="quick-icon">▤</div><div style={{ flex: 1 }}><strong>View reports</strong><small>Filter records by date and print a report.</small></div><button className="btn btn-light" onClick={() => goToPage('reports')}>Reports →</button></div>
                            </div>
                        </section>
                    </>}

                    {page === 'students' && <>
                        <div className="welcome-row"><div><div className="eyebrow">DIRECTORY</div><h2>Student records</h2><p className="muted">Maintain accurate and up-to-date student information.</p></div><button className="btn btn-primary no-print" onClick={startStudentAdd}>+ Add student</button></div>
                        {showStudentForm && <section className="form-panel">
                            <div className="panel-head" style={{ padding: '0 0 18px', marginBottom: 18 }}><div><h3>{editingStudent ? 'Edit student details' : 'Register a student'}</h3><p>Complete all required fields below.</p></div><button className="btn btn-light" type="button" onClick={() => { setShowStudentForm(false); setEditingStudent(null); }}>× Close</button></div>
                            <form onSubmit={saveStudent}>
                                <div className="form-grid">
                                    <FormField label="Student ID" required><input className="field" name="student_id" value={studentForm.student_id} onChange={e => setStudentForm({ ...studentForm, student_id: e.target.value })} placeholder="e.g. 2026-001" required /></FormField>
                                    <FormField label="Full name" required><input className="field" name="full_name" value={studentForm.full_name} onChange={e => setStudentForm({ ...studentForm, full_name: e.target.value })} placeholder="Enter student's full name" required /></FormField>
                                    <FormField label="Course" required><input className="field" name="course" value={studentForm.course} onChange={e => setStudentForm({ ...studentForm, course: e.target.value })} placeholder="e.g. BSIT" required /></FormField>
                                    <FormField label="Year level" required><select className="field" name="year_level" value={studentForm.year_level} onChange={e => setStudentForm({ ...studentForm, year_level: e.target.value })} required><option value="">Select year level</option>{['1st year','2nd year','3rd year','4th year','5th year'].map(y => <option key={y}>{y}</option>)}</select></FormField>
                                    <FormField label="Section" required><input className="field" name="section" value={studentForm.section} onChange={e => setStudentForm({ ...studentForm, section: e.target.value })} placeholder="e.g. A" required /></FormField>
                                </div>
                                <div className="form-actions"><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : editingStudent ? 'Save changes' : 'Register student'}</button><button className="btn btn-light" type="button" onClick={() => { setShowStudentForm(false); setEditingStudent(null); }}>Cancel</button></div>
                            </form>
                        </section>}
                        <section className="panel">
                            <div className="panel-head"><div><h3>All students <span style={{ color: '#929bad', fontWeight: 500 }}>({filteredStudents.length})</span></h3><p>Search by student ID, name, course, year, or section.</p></div><input className="field search-field" value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder="Search  Search students..." /></div>
                            {loading ? <div className="loading">Loading student records...</div> : <div className="table-wrap"><table><thead><tr><th>Student</th><th>Course</th><th>Year level</th><th>Section</th><th className="no-print">Actions</th></tr></thead><tbody>
                                {filteredStudents.length ? filteredStudents.map(student => <tr key={student.id}><td><div className="student-cell"><div className="student-avatar">{String(student.full_name || 'S').split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase()}</div><div><div className="student-name">{student.full_name}</div><div className="student-sub">{student.student_id}</div></div></div></td><td>{student.course}</td><td>{student.year_level}</td><td>{student.section}</td><td className="no-print"><button className="btn btn-light btn-small" onClick={() => startStudentEdit(student)}>Edit</button><button className="btn btn-danger btn-small" disabled={busy} onClick={() => removeStudent(student)}>Delete</button></td></tr>) : <tr><td colSpan="5"><EmptyState icon="♟" text={studentSearch ? 'No students match your search.' : 'No students registered yet.'} /></td></tr>}
                            </tbody></table></div>}
                        </section>
                    </>}

                    {page === 'attendance' && <>
                        <div className="welcome-row"><div><div className="eyebrow">DAILY REGISTER</div><h2>Attendance records</h2><p className="muted">Create and maintain attendance records for your students.</p></div><button className="btn btn-primary no-print" onClick={startAttendanceAdd} disabled={!students.length}>+ Record attendance</button></div>
                        {!students.length && <div className="notice notice-error">Add a student first before recording attendance.</div>}
                        {showAttendanceForm && <section className="form-panel">
                            <div className="panel-head" style={{ padding: '0 0 18px', marginBottom: 18 }}><div><h3>{editingAttendance ? 'Edit attendance record' : 'New attendance entry'}</h3><p>Select a student and complete the attendance details.</p></div><button className="btn btn-light" type="button" onClick={() => { setShowAttendanceForm(false); setEditingAttendance(null); }}>× Close</button></div>
                            <form onSubmit={saveAttendance}>
                                <div className="form-grid">
                                    <FormField label="Student" required><select className="field" value={attendanceForm.student_id} onChange={e => setAttendanceForm({ ...attendanceForm, student_id: e.target.value })} required><option value="">Select student</option>{students.map(student => <option key={student.id} value={student.id}>{student.student_id} — {student.full_name}</option>)}</select></FormField>
                                    <FormField label="Date" required><input className="field" type="date" value={attendanceForm.date} onChange={e => setAttendanceForm({ ...attendanceForm, date: e.target.value })} required /></FormField>
                                    <FormField label="Time"><input className="field" type="time" value={attendanceForm.time} onChange={e => setAttendanceForm({ ...attendanceForm, time: e.target.value })} /></FormField>
                                    <FormField label="Attendance status" required><select className="field" value={attendanceForm.status} onChange={e => setAttendanceForm({ ...attendanceForm, status: e.target.value })} required><option>Present</option><option>Late</option><option>Absent</option></select></FormField>
                                </div>
                                <div className="form-actions"><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : editingAttendance ? 'Save changes' : 'Save attendance'}</button><button className="btn btn-light" type="button" onClick={() => { setShowAttendanceForm(false); setEditingAttendance(null); }}>Cancel</button></div>
                            </form>
                        </section>}
                        <section className="panel">
                            <div className="panel-head"><div><h3>Attendance register <span style={{ color: '#929bad', fontWeight: 500 }}>({filteredAttendance.length})</span></h3><p>Filter by date or search student details and status.</p></div><div className="toolbar no-print"><input className="field search-field" value={attendanceSearch} onChange={e => setAttendanceSearch(e.target.value)} placeholder="Search  Search records..." /><input className="field filter-field" type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} title="Filter by date" /><button className="btn btn-light" onClick={() => { setAttendanceSearch(''); setAttendanceDate(''); }}>Reset</button></div></div>
                            {loading ? <div className="loading">Loading attendance records...</div> : <AttendanceTable rows={filteredAttendance} studentFor={studentFor} onEdit={startAttendanceEdit} onDelete={removeAttendance} emptyText="No attendance records match your filters." />}
                        </section>
                    </>}

                    {page === 'reports' && <>
                        <div className="welcome-row"><div><div className="eyebrow">ANALYTICS & EXPORT</div><h2>Attendance summary</h2><p className="muted">Review attendance data for all dates or choose a specific day.</p></div><div className="toolbar no-print"><input className="field filter-field" type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} /><button className="btn btn-light" onClick={() => setReportDate('')}>All dates</button><button className="btn btn-primary" onClick={() => window.print()}>â–£ Print report</button></div></div>
                        <div className="stats-grid">
                            <StatCard tone="blue" icon="♟" label="Total students" number={students.length} foot="Registered student profiles" />
                            <StatCard tone="green" icon="✓" label="Present records" number={reportCounts.present} foot={reportDate ? `For ${formatDate(reportDate)}` : 'Across all dates'} />
                            <StatCard tone="amber" icon="â—·" label="Late records" number={reportCounts.late} foot={reportDate ? `For ${formatDate(reportDate)}` : 'Across all dates'} />
                            <StatCard tone="red" icon="×" label="Absent records" number={reportCounts.absent} foot={reportDate ? `For ${formatDate(reportDate)}` : 'Across all dates'} />
                            <StatCard
    tone="blue"
    icon="📋"
    label="Total attendance records"
    number={attendances.filter(a => !reportDate || a.date === reportDate).length}
    foot={reportDate ? `For ${formatDate(reportDate)}` : 'Across all dates'}
/>
                        </div>
                        <section className="panel">
                            <div className="panel-head"><div><h3>Attendance details</h3><p>{reportDate ? `Records for ${formatDate(reportDate)}` : 'All recorded attendance entries'} · {reportRows.length} record(s)</p></div><div className="muted">Generated {new Date().toLocaleDateString()}</div></div>
                            {loading ? <div className="loading">Loading report...</div> : <AttendanceTable rows={reportRows} studentFor={studentFor} emptyText="No report records found for this selection." />}
                        </section>
                        <p className="muted">Report summary counts attendance entries, not unique students. A student can have one entry per date.</p>
                    </>}

                    {page === 'settings' && <>
                        <div className="welcome-row"><div><div className="eyebrow">ABOUT THE SYSTEM</div><h2>AttendEase information</h2><p className="muted">Basic project information and usage notes.</p></div></div>
                        <section className="panel"><div className="panel-head"><div><h3>About AttendEase</h3><p>Web-Based Student Attendance Monitoring System</p></div></div><div className="panel-body">
                            <div className="settings-note"><strong>AttendEase</strong> helps manage student profiles, record attendance, and review attendance summaries in one place. This interface connects to the existing Laravel API and MySQL database.</div>
                            <div className="quick-grid" style={{ marginTop: 18 }}>
                                <div className="quick-item"><div className="quick-icon">♟</div><div><strong>Student records</strong><small>Create, view, edit, and delete student profiles.</small></div></div>
                                <div className="quick-item"><div className="quick-icon">✓</div><div><strong>Attendance tracking</strong><small>Record Present, Late, or Absent status.</small></div></div>
                                <div className="quick-item"><div className="quick-icon">▤</div><div><strong>Reports</strong><small>Filter attendance by date and print the current report.</small></div></div>
                            </div>
                            <p className="muted" style={{ marginTop: 18 }}>For security, a real deployment should also add authenticated access and server-side authorization.</p>
                        </div></section>
                    </>}
                </div>
            </main>
        </div>
    );
}

function StatCard({ tone, icon, label, number, foot }) {
    return <div className={`stat-card stat-${tone}`}><div className="stat-top"><span>{label}</span><span className="stat-icon">{icon}</span></div><div className="stat-number">{number}</div><div className="stat-foot">{foot}</div></div>;
}

function FormField({ label, required, children }) {
    return <div className="form-field"><label>{label}{required ? ' *' : ''}</label>{children}</div>;
}

function EmptyState({ icon = '▤', text }) {
    return <div className="empty-state"><span>{icon}</span>{text}</div>;
}

function AttendanceTable({ rows, studentFor, onEdit, onDelete, emptyText, compact = false }) {
    return <div className="table-wrap"><table><thead><tr><th>Student</th><th>Date</th><th>Time</th><th>Status</th>{(onEdit || onDelete) && <th className="no-print">Actions</th>}</tr></thead><tbody>
        {rows.length ? rows.map(item => {
            const student = studentFor(item);
            return <tr key={item.id}>
                <td><div className="student-cell"><div className="student-avatar">{String(student?.full_name || '?').split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase()}</div><div><div className="student-name">{student?.full_name || 'Student not found'}</div><div className="student-sub">{student?.student_id || `Student #${item.student_id}`}</div></div></div></td>
                <td>{formatDate(item.date)}</td><td>{item.time || '—'}</td><td><StatusBadge status={item.status} /></td>
                {(onEdit || onDelete) && <td className="no-print">{onEdit && <button className="btn btn-light btn-small" onClick={() => onEdit(item)}>Edit</button>}{onDelete && <button className="btn btn-danger btn-small" onClick={() => onDelete(item)}>Delete</button>}</td>}
            </tr>;
        }) : <tr><td colSpan={(onEdit || onDelete) ? 5 : 4}><EmptyState text={emptyText || 'No records found.'} /></td></tr>}
    </tbody></table></div>;
}

createRoot(document.getElementById('app')).render(<App />);