'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import SupportCentre from '@/components/SupportCentre';

interface FeeRecord {
  total_fees: number;
  amount_paid: number;
  balance: number;
}

interface ResultRecord {
  id: string;
  subject: string;
  score: number;
  term: string;
}

interface StudentRecord {
  id: string;
  full_name: string;
  grade_level: string;
  results: ResultRecord[];
  fees: FeeRecord[];
}

interface AnnouncementRecord {
  id: string;
  title: string;
  message: string;
  event_date: string;
  requires_parent_participation: boolean;
}

export default function ParentDashboard() {
  const [userId, setUserId] = useState('');
  const [parentName, setParentName] = useState('');
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [alerts, setAlerts] = useState<AnnouncementRecord[]>([]);
  const [selectedTerm, setSelectedTerm] = useState('All');
  const [onlyParticipation, setOnlyParticipation] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadParentPortal() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      if (profile?.full_name) setParentName(profile.full_name);

      const { data: kids } = await supabase
        .from('students')
        .select('id, full_name, grade_level, results(id, subject, score, term), fees(total_fees, amount_paid, balance)')
        .eq('parent_id', user.id)
        .order('full_name', { ascending: true });

      if (kids) setStudents(kids as StudentRecord[]);

      const { data: news } = await supabase
        .from('announcements')
        .select('id, title, message, event_date, requires_parent_participation')
        .order('event_date', { ascending: true });

      if (news) setAlerts(news as AnnouncementRecord[]);
      setLoading(false);
    }

    loadParentPortal();
  }, []);

  const terms = [
    'All',
    ...Array.from(
      new Set(students.flatMap((child) => child.results?.map((r) => r.term) || []))
    ),
  ];

  const visibleAlerts = onlyParticipation
    ? alerts.filter((item) => item.requires_parent_participation)
    : alerts;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Parent Dashboard</h1>
          <p className="text-sm text-slate-500">
            {parentName ? `Welcome, ${parentName}` : 'View child results, fee balances, and school activity alerts'}
          </p>
        </div>
        <span className="text-xs font-medium bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full self-start">
          {students.length} {students.length === 1 ? 'Linked Child' : 'Linked Children'}
        </span>
      </div>

      {/* School Activity Notifications & Parent Participation Days */}
      <section className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">School Activities & Notifications</h2>
            <p className="text-xs text-slate-500">Important school days and events requiring parent attendance</p>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyParticipation}
              onChange={(e) => setOnlyParticipation(e.target.checked)}
              className="rounded"
            />
            Parent participation only
          </label>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading notifications...</p>
        ) : visibleAlerts.length === 0 ? (
          <p className="text-sm text-slate-500">No school activity notifications available.</p>
        ) : (
          <div className="space-y-3">
            {visibleAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 ${
                  alert.requires_parent_participation ? 'bg-amber-50/70 border-amber-200' : 'bg-slate-50'
                }`}
              >
                <div className="space-y-1">
                  <h3 className="font-semibold text-slate-900">{alert.title}</h3>
                  <p className="text-sm text-slate-700">{alert.message}</p>
                  <p className="text-xs text-slate-500">Event Date: {alert.event_date}</p>
                </div>
                {alert.requires_parent_participation && (
                  <span className="bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1 rounded-full shrink-0">
                    Parent Participation Required
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Linked Children: School Fees, Balances & Exam Results */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-900">Children&apos;s Results & Fee Balances</h2>
          {terms.length > 1 && (
            <div className="flex items-center gap-2 text-sm">
              <label htmlFor="term-filter" className="text-slate-600">Term:</label>
              <select
                id="term-filter"
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="border rounded-lg px-3 py-1.5 bg-white text-slate-800"
              >
                {terms.map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <div className="bg-white p-6 rounded-xl shadow-sm border text-sm text-slate-500">
            Loading student records...
          </div>
        ) : students.length === 0 ? (
          <div className="bg-white p-6 rounded-xl shadow-sm border text-sm text-slate-600">
            No students are linked to your account yet. Ask the school administrator to link your child&apos;s profile.
          </div>
        ) : (
          students.map((child) => {
            const fee = child.fees?.[0];
            const totalFees = Number(fee?.total_fees ?? 0);
            const amountPaid = Number(fee?.amount_paid ?? 0);
            const balance = Number(fee?.balance ?? totalFees - amountPaid);

            const filteredResults =
              selectedTerm === 'All'
                ? child.results || []
                : (child.results || []).filter((r) => r.term === selectedTerm);

            return (
              <div key={child.id} className="bg-white p-6 rounded-xl shadow-sm border space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b pb-3">
                  <h3 className="text-xl font-bold text-blue-700">{child.full_name}</h3>
                  <span className="text-sm font-medium text-slate-600">{child.grade_level}</span>
                </div>

                {/* School Fees, Payments & Balance */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border">
                  <div>
                    <p className="text-xs text-slate-500">Total School Fees</p>
                    <p className="text-lg font-bold text-slate-900">{totalFees.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Amount Paid</p>
                    <p className="text-lg font-bold text-emerald-700">{amountPaid.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Remaining Balance</p>
                    <p className={`text-lg font-bold ${balance > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {balance.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Exam Results Table */}
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-2">Exam Results</h4>
                  {filteredResults.length === 0 ? (
                    <p className="text-sm text-slate-500">No results posted for this filter.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="border-b text-slate-500">
                            <th className="py-2 pr-4">Subject</th>
                            <th className="py-2 pr-4">Term</th>
                            <th className="py-2">Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredResults.map((res) => (
                            <tr key={res.id} className="border-b last:border-b-0">
                              <td className="py-2 pr-4 font-medium text-slate-800">{res.subject}</td>
                              <td className="py-2 pr-4 text-slate-600">{res.term}</td>
                              <td className="py-2 font-bold text-slate-900">{res.score}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </section>

      {userId && <SupportCentre userId={userId} role="parent" />}
    </div>
  );
}
