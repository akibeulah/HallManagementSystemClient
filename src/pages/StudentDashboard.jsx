import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMyComplaints, createComplaint, previewAI,
  addComment, contestComplaint, searchAssets,
} from '../api/index.js';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge.jsx';
import { AssetPillList } from '../components/AssetPill.jsx';
import Navbar from '../components/Navbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';

/* ─── Icons ─────────────────────────────────── */
const Ico = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const IcoPlus    = () => <Ico d="M12 5v14M5 12h14" />;
const IcoClose   = () => <Ico d="M18 6L6 18M6 6l12 12" />;
const IcoAI      = () => <Ico d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />;
const IcoSend    = () => <Ico d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" size={14} />;
const IcoSearch  = () => <Ico d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" size={14} />;
const IcoBack    = () => <Ico d="M19 12H5M12 19l-7-7 7-7" size={14} />;
const IcoContest = () => <Ico d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" size={14} />;
const IcoChat    = () => <Ico d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" size={14} />;

const CATEGORIES = ['woodwork', 'metalwork', 'electrical', 'plumbing'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const DRAFT_KEY  = 'hms-complaint-draft';

const CAT_COLORS = {
  woodwork:   'bg-yellow-100 text-yellow-800',
  metalwork:  'bg-slate-100 text-slate-700',
  electrical: 'bg-blue-100 text-blue-800',
  plumbing:   'bg-cyan-100 text-cyan-800',
};
const PRIORITY_COLORS = {
  low:    'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high:   'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

function loadDraft() {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY)) || null; } catch { return null; }
}
function saveDraft(data) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(data)); } catch {}
}
function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch {}
}

/* ─── Asset Picker ───────────────────────────── */
function AssetPicker({ hallId, selected, onChange }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef();

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['asset-search', hallId, q],
    queryFn: () => searchAssets({ hallId, q }).then((r) => r.data),
    enabled: !!hallId && open,
  });

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function addItem(item) {
    if (!selected.find((s) => s._id === item._id)) {
      onChange([...selected, item]);
    }
    setQ('');
    setOpen(false);
  }

  function removeItem(id) {
    onChange(selected.filter((s) => s._id !== id));
  }

  return (
    <div ref={ref}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        Affected Items
        <span className="text-gray-400 font-normal ml-1">(optional)</span>
      </label>

      {/* Selected pills */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map((item) => (
            <span key={item._id}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-100 text-brand-700 border border-brand-200">
              {item.name}
              <button onClick={() => removeItem(item._id)}
                className="ml-0.5 text-brand-400 hover:text-brand-700 transition-colors leading-none">×</button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <IcoSearch />
        </div>
        <input
          className="input pl-8"
          placeholder={hallId ? 'Search items in your hall…' : 'No hall assigned'}
          value={q}
          disabled={!hallId}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        />
        {open && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-30 overflow-hidden">
            {isLoading ? (
              <p className="text-xs text-slate-400 px-3 py-3">Searching…</p>
            ) : results.length === 0 ? (
              <p className="text-xs text-slate-400 px-3 py-3 italic">
                {q ? `No items matching "${q}"` : 'Type to search assets in your hall'}
              </p>
            ) : (
              <ul className="max-h-48 overflow-y-auto divide-y divide-gray-50">
                {results.map((item) => {
                  const already = selected.find((s) => s._id === item._id);
                  return (
                    <li key={item._id}>
                      <button
                        onClick={() => addItem(item)}
                        disabled={!!already}
                        className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 transition-colors ${
                          already ? 'text-slate-400 cursor-default' : 'hover:bg-brand-50 text-slate-700'
                        }`}
                      >
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize ${CAT_COLORS.electrical || 'bg-gray-100 text-gray-600'}`}>
                          {item.type}
                        </span>
                        {item.name}
                        {item.condition === 'condemned' && (
                          <span className="ml-auto text-[10px] text-red-400">condemned</span>
                        )}
                        {already && <span className="ml-auto text-[10px] text-brand-400">added</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Create Complaint Modal ─────────────────── */
const BLANK_FORM = { message: '', category: '', priority: 'medium' };

function NewComplaintModal({ onClose, hallId }) {
  const qc = useQueryClient();
  const draft = loadDraft();

  const [step, setStep] = useState(draft?.step || 'form');
  const [form, setForm] = useState(draft?.form || BLANK_FORM);
  const [selectedItems, setSelectedItems] = useState(draft?.items || []);
  const [otherItem, setOtherItem] = useState(draft?.otherItem || '');
  const [aiSuggestion, setAiSuggestion] = useState(draft?.aiSuggestion || null);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const { mutate: fetchAI, isPending: loadingAI } = useMutation({
    mutationFn: () => previewAI({ category: form.category, message: form.message }),
    onSuccess: (res) => {
      const suggestion = res.data.suggestion;
      setAiSuggestion(suggestion);
      setStep('preview');
      saveDraft({ form, items: selectedItems, otherItem, aiSuggestion: suggestion, step: 'preview' });
    },
    onError: () => {
      // AI failed or not configured → go straight to submit
      setStep('preview');
      saveDraft({ form, items: selectedItems, otherItem, aiSuggestion: null, step: 'preview' });
    },
  });

  const { mutate: submit, isPending } = useMutation({
    mutationFn: () => createComplaint({
      ...form,
      itemIds: selectedItems.map((i) => i._id),
      otherItem: otherItem || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-complaints'] });
      clearDraft();
      onClose();
    },
    onError: (err) => setError(err.response?.data?.message || 'Failed to submit'),
  });

  function handleReview() {
    if (!form.message.trim() || !form.category) return setError('Category and description are required.');
    setError('');
    fetchAI();
  }

  function handleDirectSubmit() {
    if (!form.message.trim() || !form.category) return setError('Category and description are required.');
    setError('');
    submit();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overlay-anim">
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl shadow-slate-900/20 modal-anim overflow-hidden"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          {step === 'preview' && (
            <button onClick={() => setStep('form')} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors mr-2">
              <IcoBack />
            </button>
          )}
          <h3 className="font-semibold text-slate-800 text-base tracking-tight flex-1">
            {step === 'form' ? 'New Complaint' : '🤖 AI Diagnostics'}
          </h3>
          {step === 'preview' && (
            <span className="text-xs text-slate-400 mr-4">Step 2 of 2</span>
          )}
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <IcoClose />
          </button>
        </div>

        <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">
          {/* ── Step 1: Form ── */}
          {step === 'form' && (
            <div className="space-y-4">
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select className="input" value={form.category} onChange={set('category')}>
                    <option value="">Select…</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} className="capitalize">{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select className="input" value={form.priority} onChange={set('priority')}>
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p} className="capitalize">{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="input"
                  rows={4}
                  placeholder="Describe the issue in detail…"
                  value={form.message}
                  onChange={set('message')}
                />
              </div>

              <AssetPicker
                hallId={hallId}
                selected={selectedItems}
                onChange={setSelectedItems}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Other item not in list
                  <span className="text-gray-400 font-normal ml-1">(optional)</span>
                </label>
                <input
                  className="input"
                  placeholder="e.g. ceiling fan, wardrobe lock"
                  value={otherItem}
                  onChange={(e) => setOtherItem(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button onClick={onClose} className="btn-secondary">Cancel</button>
                <button
                  onClick={handleReview}
                  disabled={loadingAI}
                  className="flex items-center gap-2 btn-primary"
                >
                  <IcoAI />
                  {loadingAI ? 'Getting AI advice…' : 'Review with AI'}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: AI Preview ── */}
          {step === 'preview' && (
            <div className="space-y-4">
              {/* Complaint summary */}
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex gap-2 mb-2">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${CAT_COLORS[form.category] || 'bg-gray-100 text-gray-600'}`}>
                    {form.category}
                  </span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${PRIORITY_COLORS[form.priority]}`}>
                    {form.priority}
                  </span>
                </div>
                <p className="text-sm text-slate-700">{form.message}</p>
                {selectedItems.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedItems.map((it) => (
                      <span key={it._id} className="text-[11px] bg-white border border-gray-200 px-2 py-0.5 rounded-full text-slate-600">
                        {it.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* AI suggestion */}
              {aiSuggestion ? (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                      <IcoAI />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-blue-800">AI Diagnostics</p>
                      <p className="text-[10px] text-blue-400">Initial assessment and troubleshooting advice</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{aiSuggestion}</p>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-center">
                  <p className="text-sm text-slate-400">AI advice not available — proceed to submit below.</p>
                </div>
              )}

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-amber-700 font-medium">
                  If the AI advice resolves your issue, you don't need to submit. Otherwise, click "Submit Complaint" to log it with maintenance.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button onClick={onClose} className="btn-secondary text-sm">
                  Issue resolved — dismiss
                </button>
                <button
                  onClick={() => { setError(''); submit(); }}
                  disabled={isPending}
                  className="btn-primary text-sm"
                >
                  {isPending ? 'Submitting…' : 'Submit Complaint'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Comment thread on a complaint ─────────── */
function ComplaintRow({ complaint, onExpand, expanded }) {
  const qc = useQueryClient();
  const [comment, setComment] = useState('');
  const [contestReason, setContestReason] = useState('');
  const [showContest, setShowContest] = useState(false);

  const { mutate: postComment, isPending: commenting } = useMutation({
    mutationFn: () => addComment(complaint._id, { text: comment }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-complaints'] });
      setComment('');
    },
  });

  const { mutate: contest, isPending: contesting } = useMutation({
    mutationFn: () => contestComplaint(complaint._id, { reason: contestReason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-complaints'] });
      setShowContest(false);
      setContestReason('');
    },
  });

  const isDone         = complaint.status === 'done';
  const isNeedsReview  = complaint.status === 'needs_review';
  const canContest     = isDone;

  return (
    <div className={`card transition-all ${complaint.status === 'blocked' ? 'border-rose-200 bg-rose-50/20' : ''} ${isNeedsReview ? 'border-violet-200 bg-violet-50/20' : ''}`}>
      {/* ── Header row ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 line-clamp-1">{complaint.message}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {complaint.category}
            {complaint.roomId?.roomNumber && ` · Room ${complaint.roomId.roomNumber}`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <StatusBadge status={complaint.status} />
          <PriorityBadge priority={complaint.priority} />
        </div>
      </div>

      {/* Affected items pills */}
      {complaint.itemIds?.length > 0 && (
        <div className="mt-2.5">
          <AssetPillList items={complaint.itemIds} showCondition />
        </div>
      )}

      {/* Assigned officer */}
      {complaint.assignedTo && (
        <p className="text-xs text-emerald-600 bg-emerald-50 rounded-full px-2.5 py-0.5 inline-flex mt-2 items-center gap-1">
          <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" /></svg>
          {complaint.assignedTo.firstname} {complaint.assignedTo.lastname}
        </p>
      )}

      <p className="text-xs text-gray-400 mt-2">
        {new Date(complaint.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>

      {/* ── Action bar ── */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={() => onExpand(expanded ? null : complaint._id)}
          className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-800 font-medium transition-colors"
        >
          <IcoChat />
          {expanded ? 'Hide comments' : 'Add comment'}
        </button>

        {canContest && !showContest && (
          <button
            onClick={() => setShowContest(true)}
            className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-800 font-medium transition-colors ml-auto"
          >
            <IcoContest />
            Contest completion
          </button>
        )}
      </div>

      {/* ── Contest form ── */}
      {showContest && (
        <div className="mt-3 bg-violet-50 border border-violet-200 rounded-xl p-3 space-y-2">
          <p className="text-xs font-semibold text-violet-700">Contest this completion</p>
          <textarea
            className="input text-sm"
            rows={2}
            placeholder="Explain why the work isn't complete (optional)…"
            value={contestReason}
            onChange={(e) => setContestReason(e.target.value)}
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowContest(false)} className="text-xs text-slate-500 hover:text-slate-700">Cancel</button>
            <button
              onClick={() => contest()}
              disabled={contesting}
              className="text-xs font-semibold bg-violet-600 text-white px-3 py-1.5 rounded-lg hover:bg-violet-700 transition-colors"
            >
              {contesting ? 'Submitting…' : 'Submit Contest'}
            </button>
          </div>
        </div>
      )}

      {/* ── Comment box ── */}
      {expanded && (
        <div className="mt-3 space-y-2">
          <textarea
            className="input text-sm"
            rows={2}
            placeholder="Add a comment or update…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="flex justify-end">
            <button
              onClick={() => postComment()}
              disabled={!comment.trim() || commenting}
              className="flex items-center gap-1.5 text-xs font-semibold bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 disabled:opacity-40 transition-colors"
            >
              <IcoSend />
              {commenting ? 'Posting…' : 'Post Comment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main page ──────────────────────────────── */
export default function StudentDashboard() {
  const { auth } = useAuth();
  const [modal, setModal] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const hallId = auth?.user?.hallId;
  const draft  = loadDraft();

  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ['my-complaints'],
    queryFn: () => getMyComplaints().then((r) => r.data),
  });

  const openCount   = complaints.filter((c) => !['done'].includes(c.status)).length;
  const blockedCount = complaints.filter((c) => c.status === 'blocked').length;
  const reviewCount  = complaints.filter((c) => c.status === 'needs_review').length;

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Complaints</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {complaints.length === 0
                ? 'No complaints submitted yet'
                : `${openCount} open · ${complaints.length} total`}
              {blockedCount > 0 && <span className="text-rose-500 ml-2">· {blockedCount} blocked</span>}
              {reviewCount > 0 && <span className="text-violet-500 ml-2">· {reviewCount} needs review</span>}
            </p>
          </div>
          <button onClick={() => setModal(true)} className="flex items-center gap-2 btn-primary">
            <IcoPlus />
            New Complaint
            {draft && <span className="w-2 h-2 rounded-full bg-amber-300 ml-0.5" title="Unsaved draft" />}
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 h-24 animate-pulse" />
            ))}
          </div>
        ) : complaints.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-gray-400 text-sm">No complaints yet. Use the button above to report an issue.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map((c) => (
              <ComplaintRow
                key={c._id}
                complaint={c}
                expanded={expandedId === c._id}
                onExpand={setExpandedId}
              />
            ))}
          </div>
        )}
      </main>

      {modal && <NewComplaintModal onClose={() => setModal(false)} hallId={hallId} />}
    </div>
  );
}
