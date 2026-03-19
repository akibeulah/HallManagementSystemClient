import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getComplaints } from '../api/index.js';
import Navbar from '../components/Navbar.jsx';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge.jsx';

/* ─── Icons ─────────────────────────────────────── */
const Ico = ({ d, size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const IcoEmpty    = () => <Ico d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" size={20} />;
const IcoComment  = () => <Ico d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" size={13} />;
const IcoRoom     = () => <Ico d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" size={12} />;

const COLUMNS = [
  {
    key:    'new',
    label:  'New',
    statuses: ['logged', 'seen'],
    color:  'border-blue-400',
    bg:     'bg-blue-50',
    dot:    'bg-blue-400',
    header: 'bg-blue-100 text-blue-700',
    count:  'bg-blue-200 text-blue-800',
  },
  {
    key:    'in_progress',
    label:  'In Progress',
    statuses: ['work_in_progress'],
    color:  'border-amber-400',
    bg:     'bg-amber-50',
    dot:    'bg-amber-400',
    header: 'bg-amber-100 text-amber-700',
    count:  'bg-amber-200 text-amber-800',
  },
  {
    key:    'blocked',
    label:  'Blocked',
    statuses: ['blocked'],
    color:  'border-rose-400',
    bg:     'bg-rose-50',
    dot:    'bg-rose-400',
    header: 'bg-rose-100 text-rose-700',
    count:  'bg-rose-200 text-rose-800',
  },
  {
    key:    'done',
    label:  'Done',
    statuses: ['done'],
    color:  'border-emerald-400',
    bg:     'bg-emerald-50',
    dot:    'bg-emerald-400',
    header: 'bg-emerald-100 text-emerald-700',
    count:  'bg-emerald-200 text-emerald-800',
  },
];

const PRIORITY_RING = {
  urgent: 'ring-2 ring-red-400 ring-offset-1',
  high:   'ring-2 ring-orange-300 ring-offset-1',
  medium: '',
  low:    '',
};

const CAT_COLORS = {
  woodwork:    'bg-yellow-100 text-yellow-700',
  metalwork:   'bg-slate-100 text-slate-600',
  electrical:  'bg-blue-100 text-blue-700',
  plumbing:    'bg-cyan-100 text-cyan-700',
};

function KanbanCard({ complaint }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/complaints/${complaint._id}`)}
      className={`w-full text-left bg-white rounded-xl border border-gray-100 shadow-sm
        hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 p-3.5 group
        ${PRIORITY_RING[complaint.priority] || ''}`}
    >
      {/* Message */}
      <p className="text-[13px] font-semibold text-slate-800 leading-snug line-clamp-2 mb-2">
        {complaint.message}
      </p>

      {/* Tags row */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md capitalize ${CAT_COLORS[complaint.category] || 'bg-gray-100 text-gray-600'}`}>
          {complaint.category}
        </span>
        {complaint.roomId?.roomNumber && (
          <span className="flex items-center gap-0.5 text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
            <IcoRoom />
            {complaint.roomId.roomNumber}
          </span>
        )}
        <PriorityBadge priority={complaint.priority} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-400">
          {new Date(complaint.createdAt).toLocaleDateString('en-NG', {
            day: 'numeric', month: 'short',
          })}
        </span>
        <span className="flex items-center gap-1 text-[10px] text-slate-400 group-hover:text-brand-600 transition-colors">
          <IcoComment />
          View
        </span>
      </div>
    </button>
  );
}

function KanbanColumn({ col, complaints }) {
  return (
    <div className="flex flex-col min-w-0">
      {/* Column header */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-3 ${col.header}`}>
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${col.dot}`} />
        <span className="text-[11px] font-bold uppercase tracking-wide flex-1">{col.label}</span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${col.count}`}>
          {complaints.length}
        </span>
      </div>

      {/* Cards */}
      <div className={`flex-1 rounded-xl border-2 border-dashed ${col.color} ${col.bg} p-2 space-y-2 min-h-[120px]`}>
        {complaints.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <IcoEmpty />
            <p className="text-[11px] mt-2">None here</p>
          </div>
        ) : (
          complaints.map((c) => <KanbanCard key={c._id} complaint={c} />)
        )}
      </div>
    </div>
  );
}

export default function OfficerDashboard() {
  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ['complaints'],
    queryFn: () => getComplaints().then((r) => r.data),
  });

  const grouped = {};
  COLUMNS.forEach((col) => {
    grouped[col.key] = complaints.filter((c) => col.statuses.includes(c.status));
  });

  const total = complaints.length;
  const blocked = grouped.blocked?.length || 0;

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">My Work Board</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {total === 0
                ? 'No tasks assigned yet'
                : `${total} task${total !== 1 ? 's' : ''} assigned to you`}
              {blocked > 0 && (
                <span className="ml-2 text-rose-500 font-semibold">
                  · {blocked} blocked
                </span>
              )}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl bg-white border border-gray-100 h-48 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {COLUMNS.map((col) => (
              <KanbanColumn key={col.key} col={col} complaints={grouped[col.key]} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
