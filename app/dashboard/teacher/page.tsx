'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import SupportCentre from '@/components/SupportCentre';

export default function TeacherDashboard() {
  const [userId, setUserId] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [studentId, setStudentId] = useState('');
  const [subject, setSubject] = useState('');
  const [score, setScore] = useState('');
  const [term, setTerm] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    async function loadTeacherData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);

      const { data: studentRows } = await supabase.from('students').select('id, full_name, grade_level');
      if (studentRows && studentRows.length > 0) {
        setStudents(studentRows);
        setStudentId(studentRows[0].id);
      }
    }
    loadTeacherData();
  }, []);

  const handleAddResult = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg('');
    const { error } = await supabase.from('results').insert({
      student_id: studentId,
      subject,
      score: Number(score),
      term,
      teacher_id: userId || null,
    });
    if (error) setStatusMsg(error.message);
    else {
      setStatusMsg('Result uploaded.');
      setSubject('');
      setScore('');
      setTerm('');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
      {statusMsg && <p className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm">{statusMsg}</p>}

      <form onSubmit={handleAddResult} className="bg-white p-6 rounded-xl shadow-sm border space-y-3">
        <h2 className="text-lg font-bold">Upload Student Result</h2>
        <select
          className="w-full border p-2 rounded"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
        >
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name} ({s.grade_level})
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Subject (e.g., Mathematics)"
          className="w-full border p-2 rounded"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Term (e.g., Term 1)"
          className="w-full border p-2 rounded"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          required
        />
        <input
          type="number"
          min="0"
          max="100"
          placeholder="Score (0-100)"
          className="w-full border p-2 rounded"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          required
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-semibold">
          Submit Result
        </button>
      </form>

      {userId && <SupportCentre userId={userId} role="teacher" />}
    </div>
  );
}
