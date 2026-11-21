'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import SupportCentre from '@/components/SupportCentre';

export default function AdminDashboard() {
  const [userId, setUserId] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [requiresParentParticipation, setRequiresParentParticipation] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [totalFees, setTotalFees] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    async function loadAdminData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);

      const { data: studentRows } = await supabase.from('students').select('id, full_name, grade_level');
      if (studentRows && studentRows.length > 0) {
        setStudents(studentRows);
        setSelectedStudentId(studentRows[0].id);
      }
    }
    loadAdminData();
  }, []);

  const handlePublishAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg('');
    const { error } = await supabase.from('announcements').insert({
      title,
      message,
      event_date: eventDate,
      requires_parent_participation: requiresParentParticipation,
    });
    if (error) setStatusMsg(error.message);
    else {
      setStatusMsg('Community announcement published.');
      setTitle('');
      setMessage('');
      setEventDate('');
      setRequiresParentParticipation(false);
    }
  };

  const handleUpdateFees = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg('');
    const { error } = await supabase.from('fees').upsert(
      {
        student_id: selectedStudentId,
        total_fees: Number(totalFees),
        amount_paid: Number(amountPaid),
      },
      { onConflict: 'student_id' }
    );
    if (error) setStatusMsg(error.message);
    else setStatusMsg('Student fee record saved.');
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Administrator Dashboard</h1>
      {statusMsg && <p className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm">{statusMsg}</p>}

      <form onSubmit={handlePublishAlert} className="bg-white p-6 rounded-xl shadow-sm border space-y-3">
        <h2 className="text-lg font-bold">Send Community Alert</h2>
        <input
          type="text"
          placeholder="Activity or Alert Title"
          className="w-full border p-2 rounded"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Details for parents, teachers, and the school community"
          className="w-full border p-2 rounded h-24"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
        <input
          type="date"
          className="border p-2 rounded"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          required
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={requiresParentParticipation}
            onChange={(e) => setRequiresParentParticipation(e.target.checked)}
          />
          Requires parent participation
        </label>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-semibold">
          Publish Alert
        </button>
      </form>

      <form onSubmit={handleUpdateFees} className="bg-white p-6 rounded-xl shadow-sm border space-y-3">
        <h2 className="text-lg font-bold">Update School Fees & Payments</h2>
        <select
          className="w-full border p-2 rounded"
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
        >
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name} ({s.grade_level})
            </option>
          ))}
        </select>
        <input
          type="number"
          step="0.01"
          placeholder="Total Fees"
          className="w-full border p-2 rounded"
          value={totalFees}
          onChange={(e) => setTotalFees(e.target.value)}
          required
        />
        <input
          type="number"
          step="0.01"
          placeholder="Amount Paid"
          className="w-full border p-2 rounded"
          value={amountPaid}
          onChange={(e) => setAmountPaid(e.target.value)}
          required
        />
        <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded text-sm font-semibold">
          Save Fee Record
        </button>
      </form>

      {userId && <SupportCentre userId={userId} role="admin" />}
    </div>
  );
}
