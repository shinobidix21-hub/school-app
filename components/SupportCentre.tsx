'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface SupportCentreProps {
  userId: string;
  role: 'admin' | 'teacher' | 'parent';
}

export default function SupportCentre({ userId, role }: SupportCentreProps) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg('');
    setIsError(false);

    if (!userId) {
      setIsError(true);
      setStatusMsg('You must be signed in to send a support ticket.');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('support_tickets').insert({
      user_id: userId,
      user_role: role,
      subject: subject.trim(),
      description: description.trim(),
    });
    setSubmitting(false);

    if (error) {
      setIsError(true);
      setStatusMsg(`Could not send ticket: ${error.message}`);
      return;
    }

    setStatusMsg('Support ticket sent to the programmers.');
    setSubject('');
    setDescription('');
  };

  return (
    <section className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Programmer Support Centre</h2>
        <p className="text-sm text-slate-500">
          Report a bug, login problem, or data issue directly to the programmers.
        </p>
      </div>

      {statusMsg && (
        <p
          className={`text-sm p-3 rounded-lg ${
            isError ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-800'
          }`}
        >
          {statusMsg}
        </p>
      )}

      <form onSubmit={submitTicket} className="space-y-3">
        <input
          type="text"
          placeholder="Subject (e.g., Fee balance not updating)"
          className="w-full border p-2.5 rounded-lg text-sm"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
        <textarea
          placeholder="Describe what happened and what page you were on..."
          className="w-full border p-2.5 rounded-lg text-sm h-24"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={submitting}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 disabled:opacity-50"
        >
          {submitting ? 'Sending...' : 'Send to Programmers'}
        </button>
      </form>
    </section>
  );
}
