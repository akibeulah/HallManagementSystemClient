import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query';
import {
  getComplaints, getAssets, getDueAssets, createAsset, updateAsset, deleteAsset,
  getHalls, saveAIConfig, testAIConfig, getAIConfig,
  getAllUsers, getUser, createUser, updateUser, deleteUser,
  createHall, updateHall, deleteHall, getRooms, createRoom, updateRoom, deleteRoom,
  getOfficers, assignComplaint,
} from '../api/index.js';
import { AssetPill, AssetPillList } from '../components/AssetPill.jsx';
import ComplaintCard from '../components/ComplaintCard.jsx';
import AssetTable from '../components/AssetTable.jsx';
import { useSetBreadcrumb } from '../layouts/AdminLayout.jsx';

/* ─── Tiny icons ─────────────────────────────────────────── */
const Ico = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const IcoAlert   = () => <Ico d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />;
const IcoBox     = () => <Ico d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />;
const IcoRoom    = () => <Ico d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />;
const IcoStaff   = () => <Ico d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z" />;
const IcoPlus    = () => <Ico d="M12 5v14M5 12h14" />;
const IcoPencil  = () => <Ico d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />;
const IcoTrash   = () => <Ico d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />;
const IcoClose   = () => <Ico d="M18 6L6 18M6 6l12 12" />;
const IcoChevron = ({ open }) => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const IcoBack    = () => <Ico d="M19 12H5M12 19l-7-7 7-7" />;

/* ─── Shared UI helpers ──────────────────────────────────── */
function Modal({ open, onClose, title, children, wide = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overlay-anim">
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} bg-white rounded-2xl shadow-2xl shadow-slate-900/20 modal-anim overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-slate-800 text-base tracking-tight">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <IcoClose />
          </button>
        </div>
        <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function useConfirm() {
  const [state, setState] = useState({ open: false, msg: '', resolve: null });
  const confirm = (msg) => new Promise((res) => setState({ open: true, msg, resolve: res }));
  const handle = (val) => { state.resolve?.(val); setState({ open: false, msg: '', resolve: null }); };
  const Dialog = state.open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overlay-anim">
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm modal-anim">
        <p className="text-slate-700 text-sm font-medium mb-5">{state.msg}</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => handle(false)} className="btn-secondary text-sm px-4 py-2">Cancel</button>
          <button onClick={() => handle(true)} className="btn-danger text-sm px-4 py-2">Delete</button>
        </div>
      </div>
    </div>
  ) : null;
  return { confirm, Dialog };
}

function RingProgress({ value, color, size = 52, stroke = 5 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, value)) / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
        strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
    </svg>
  );
}

const STAT_COLORS = {
  red:     { icon: 'bg-red-100 text-red-500',        value: 'text-red-600',     ring: '#ef4444' },
  green:   { icon: 'bg-emerald-100 text-emerald-600',value: 'text-emerald-600', ring: '#10b981' },
  blue:    { icon: 'bg-blue-100 text-blue-600',      value: 'text-brand-600',   ring: '#3b82f6' },
  emerald: { icon: 'bg-emerald-100 text-emerald-600',value: 'text-emerald-600', ring: '#10b981' },
  violet:  { icon: 'bg-violet-100 text-violet-600',  value: 'text-violet-600',  ring: '#8b5cf6' },
};

function StatCard({ label, value, subtitle, color, icon, progress }) {
  const c = STAT_COLORS[color] || STAT_COLORS.blue;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.icon}`}>{icon}</div>
        {progress !== undefined && <RingProgress value={progress} color={c.ring} />}
      </div>
      <p className={`text-3xl font-bold leading-none ${c.value}`}>{value}</p>
      <p className="text-sm font-semibold text-slate-700 mt-2">{label}</p>
      <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
    </div>
  );
}

function PageShell({ title, action, children }) {
  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-7">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h1>
        {action}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

function HealthBar({ pct, label }) {
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden max-w-[60px]">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-slate-600">{pct}%</span>
      {label && <span className="text-xs text-slate-400">{label}</span>}
    </div>
  );
}

const PAGE_SIZE = 10;

/* Generic pagination for complaint lists (hides when only 1 page) */
function Pagination({ page, total, onPageChange }) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
      <p className="text-xs text-slate-400">{total} total · page {page + 1} of {totalPages}</p>
      <div className="flex gap-2">
        <button disabled={page === 0} onClick={() => onPageChange(page - 1)}
          className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          ← Prev
        </button>
        <button disabled={(page + 1) >= totalPages} onClick={() => onPageChange(page + 1)}
          className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          Next →
        </button>
      </div>
    </div>
  );
}

/* Full-featured pagination for the Users table — always visible */
const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

function UsersPagination({ page, pageSize, total, onPageChange, onPageSizeChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to   = Math.min((page + 1) * pageSize, total);

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-slate-50/60">
      <div className="flex items-center gap-3">
        <p className="text-xs text-slate-500">
          {total === 0 ? 'No results' : `Showing ${from}–${to} of ${total}`}
        </p>
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-slate-400">Rows</label>
          <select
            value={pageSize}
            onChange={(e) => { onPageSizeChange(Number(e.target.value)); onPageChange(0); }}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-400"
          >
            {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(0)} disabled={page === 0}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-slate-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs" title="First">«</button>
        <button onClick={() => onPageChange(page - 1)} disabled={page === 0}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-slate-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs" title="Previous">‹</button>

        {Array.from({ length: totalPages }, (_, i) => i)
          .filter((i) => i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 1)
          .reduce((acc, i, idx, arr) => {
            if (idx > 0 && i - arr[idx - 1] > 1) acc.push('ellipsis-' + i);
            acc.push(i);
            return acc;
          }, [])
          .map((item) =>
            String(item).startsWith('ellipsis')
              ? <span key={item} className="w-7 text-center text-xs text-slate-400">…</span>
              : <button key={item} onClick={() => onPageChange(item)}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                    item === page ? 'bg-brand-600 text-white shadow-sm' : 'border border-gray-200 text-slate-500 hover:bg-white'
                  }`}>{item + 1}</button>
          )}

        <button onClick={() => onPageChange(page + 1)} disabled={page + 1 >= totalPages}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-slate-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs" title="Next">›</button>
        <button onClick={() => onPageChange(totalPages - 1)} disabled={page + 1 >= totalPages}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-slate-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs" title="Last">»</button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   OVERVIEW PAGE
════════════════════════════════════════════════════════════ */
export function OverviewPage() {
  const { data: complaints = [], isLoading: lc } = useQuery({
    queryKey: ['complaints'],
    queryFn: () => getComplaints().then((r) => r.data),
  });
  const { data: assets = [], isLoading: la } = useQuery({
    queryKey: ['assets'],
    queryFn: () => getAssets().then((r) => r.data),
  });
  const { data: users = [], isLoading: lu } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => getAllUsers().then((r) => r.data),
  });
  const { data: halls = [] } = useQuery({
    queryKey: ['halls-admin'],
    queryFn: () => getHalls().then((r) => r.data),
  });

  const roomQueries = useQueries({
    queries: halls.map((h) => ({
      queryKey: ['rooms-hall', h._id],
      queryFn: () => getRooms(h._id).then((r) => r.data),
    })),
  });
  const allRooms = roomQueries.flatMap((q) => q.data || []);

  const openComplaints = complaints.filter((c) => c.status !== 'done');
  const untreatedCount = openComplaints.length;
  const workingAssets = assets.filter((a) => a.condition !== 'condemned').length;
  const workingPct = assets.length > 0 ? Math.round((workingAssets / assets.length) * 100) : 0;
  const roomsWithIssues = new Set(
    openComplaints.filter((c) => c.roomId).map((c) => c.roomId?._id || c.roomId)
  );
  const healthyRoomCount = allRooms.filter((r) => !roomsWithIssues.has(r._id)).length;
  const healthyRoomPct = allRooms.length > 0 ? Math.round((healthyRoomCount / allRooms.length) * 100) : 0;
  const officers = users.filter((u) => u.role === 'maintenance_officer');
  const engagedIds = new Set(
    openComplaints.filter((c) => c.assignedTo).map((c) => c.assignedTo?._id || c.assignedTo)
  );

  const isLoading = lc || la || lu;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Overview</h1>
        <p className="text-slate-400 text-sm mt-0.5">Hall management at a glance</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-36 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Untreated Issues" value={untreatedCount} subtitle={`${complaints.length} total complaints`}
            color={untreatedCount > 0 ? 'red' : 'green'} icon={<IcoAlert />} />
          <StatCard label="Working Assets" value={`${workingPct}%`} subtitle={`${assets.length} total assets`}
            color="blue" icon={<IcoBox />} progress={workingPct} />
          <StatCard label="Healthy Rooms" value={`${healthyRoomPct}%`} subtitle={`${allRooms.length} total rooms`}
            color="emerald" icon={<IcoRoom />} progress={healthyRoomPct} />
          <StatCard label="Engaged Staff" value={engagedIds.size} subtitle={`of ${officers.length} maintenance staff`}
            color="violet" icon={<IcoStaff />} />
        </div>
      )}

      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Open Complaints</h2>
          {openComplaints.length > 6 && <span className="text-xs text-slate-400">Showing 6 of {openComplaints.length}</span>}
        </div>
        {openComplaints.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-14 text-center">
            <p className="text-slate-400 text-sm">No open complaints — all clear!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {openComplaints.slice(0, 6).map((c) => (
              <ComplaintCard key={c._id} complaint={c} to={`/admin/complaints/${c._id}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   COMPLAINTS PAGE
════════════════════════════════════════════════════════════ */
const COMPLAINT_FILTERS = [
  { label: 'All',        value: 'all'         },
  { label: 'Unassigned', value: 'unassigned'  },
  { label: 'Blocked',    value: 'blocked'     },
  { label: 'In Progress',value: 'in_progress' },
  { label: 'Done',       value: 'done'        },
];

function QuickAssignModal({ complaint, officers, onClose }) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleAssign() {
    if (!selected) return;
    setBusy(true);
    try {
      await assignComplaint(complaint._id, { assignedTo: selected });
      qc.invalidateQueries({ queryKey: ['complaints'] });
      onClose();
    } catch {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Assign complaint`}>
      <p className="text-sm text-slate-500 mb-4 line-clamp-2 italic">"{complaint.message}"</p>
      <Field label="Select Officer">
        <select className="input" value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">— choose officer —</option>
          {officers.map((o) => (
            <option key={o._id} value={o._id}>
              {o.firstname} {o.lastname} ({o.category})
            </option>
          ))}
        </select>
      </Field>
      <div className="flex justify-end gap-3 mt-5">
        <button onClick={onClose} className="btn-secondary text-sm px-5">Cancel</button>
        <button onClick={handleAssign} disabled={!selected || busy} className="btn-primary text-sm px-5">
          {busy ? 'Assigning…' : 'Assign'}
        </button>
      </div>
    </Modal>
  );
}

export function ComplaintsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [assignTarget, setAssignTarget] = useState(null);

  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ['complaints'],
    queryFn: () => getComplaints().then((r) => r.data),
  });
  const { data: officers = [] } = useQuery({
    queryKey: ['officers'],
    queryFn: () => getOfficers().then((r) => r.data),
  });

  const filtered = complaints.filter((c) => {
    if (filter === 'all')         return true;
    if (filter === 'unassigned')  return !c.assignedTo;
    if (filter === 'blocked')     return c.status === 'blocked';
    if (filter === 'in_progress') return c.status === 'work_in_progress';
    if (filter === 'done')        return c.status === 'done';
    return true;
  });

  const blockedCount    = complaints.filter((c) => c.status === 'blocked').length;
  const unassignedCount = complaints.filter((c) => !c.assignedTo).length;

  return (
    <PageShell
      title="Complaints"
      action={
        <div className="flex items-center gap-2">
          {blockedCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-semibold">
              {blockedCount} blocked
            </span>
          )}
          {unassignedCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-semibold">
              {unassignedCount} unassigned
            </span>
          )}
          <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold">
            {complaints.length} total
          </span>
        </div>
      }
    >
      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-5 flex-wrap">
        {COMPLAINT_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === f.value
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            {f.label}
            {f.value === 'blocked' && blockedCount > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${filter === f.value ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-600'}`}>
                {blockedCount}
              </span>
            )}
            {f.value === 'unassigned' && unassignedCount > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${filter === f.value ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-600'}`}>
                {unassignedCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-36 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <p className="text-slate-400 text-sm">No complaints in this view.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <ComplaintCard
              key={c._id}
              complaint={c}
              to={`/admin/complaints/${c._id}`}
              onAssign={officers.length > 0 && !c.assignedTo ? () => setAssignTarget(c) : null}
            />
          ))}
        </div>
      )}

      {assignTarget && (
        <QuickAssignModal
          complaint={assignTarget}
          officers={officers}
          onClose={() => setAssignTarget(null)}
        />
      )}
    </PageShell>
  );
}

/* ════════════════════════════════════════════════════════════
   USERS PAGE
════════════════════════════════════════════════════════════ */
const ROLES = ['student', 'maintenance_officer', 'admin'];
const CATEGORIES = ['woodwork', 'metalwork', 'electrical', 'plumbing'];
const BLANK_USER = { firstname: '', lastname: '', email: '', password: '', gender: 'male', role: 'student', category: '', hallId: '', roomId: '' };
const ROLE_FILTERS = [
  { label: 'All',     value: ''                    },
  { label: 'Students',value: 'student'             },
  { label: 'Officers',value: 'maintenance_officer' },
  { label: 'Admins',  value: 'admin'               },
];

export function UsersPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK_USER);
  const [error, setError] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const { confirm, Dialog: ConfirmDialog } = useConfirm();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => getAllUsers().then((r) => r.data),
  });
  const { data: halls = [] } = useQuery({
    queryKey: ['halls-admin'],
    queryFn: () => getHalls().then((r) => r.data),
  });
  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms-for-user-form', form.hallId],
    queryFn: () => getRooms(form.hallId).then((r) => r.data),
    enabled: !!form.hallId && form.role === 'student',
  });

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data) => editing ? updateUser(editing, data) : createUser(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); closeModal(); },
    onError: (err) => setError(err.response?.data?.message || 'Save failed'),
  });
  const { mutate: remove } = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
    onError: (err) => alert(err.response?.data?.message || 'Delete failed'),
  });

  function openNew() { setEditing(null); setForm(BLANK_USER); setError(''); setModal(true); }
  function startEdit(u) {
    setEditing(u._id);
    setForm({ firstname: u.firstname, lastname: u.lastname, email: u.email, password: '', gender: u.gender, role: u.role, category: u.category || '', hallId: u.hallId?._id || '', roomId: u.roomId?._id || '' });
    setError(''); setModal(true);
  }
  function closeModal() { setModal(false); setEditing(null); setForm(BLANK_USER); setError(''); }
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  function handleSave() {
    const payload = { ...form };
    if (editing && !payload.password) delete payload.password;
    if (payload.role !== 'maintenance_officer') delete payload.category;
    if (payload.role !== 'student') { delete payload.hallId; delete payload.roomId; }
    save(payload);
  }
  async function handleDelete(u) {
    const ok = await confirm(`Delete "${u.firstname} ${u.lastname}"? This cannot be undone.`);
    if (ok) remove(u._id);
  }

  const filtered = roleFilter ? users.filter((u) => u.role === roleFilter) : users;
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const roleChip = (role) => {
    const map = { admin: 'bg-purple-100 text-purple-700', maintenance_officer: 'bg-blue-100 text-blue-700', student: 'bg-green-100 text-green-700' };
    return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${map[role] || 'bg-gray-100 text-gray-600'}`}>{role.replace('_', ' ')}</span>;
  };

  return (
    <>
      {ConfirmDialog}
      <PageShell title="Users" action={<button onClick={openNew} className="btn-primary flex items-center gap-1.5"><IcoPlus /> Add User</button>}>
        {/* Role filter tabs */}
        <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-xl w-fit">
          {ROLE_FILTERS.map(({ label, value }) => (
            <button key={value} onClick={() => { setRoleFilter(value); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${roleFilter === value ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {label}
              <span className="ml-1.5 text-slate-400">
                {(value ? users.filter((u) => u.role === value) : users).length}
              </span>
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl border border-gray-100 h-48 animate-pulse" />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-100">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Hall / Room</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((u) => (
                  <tr key={u._id}
                    onClick={() => navigate(`/admin/users/${u._id}`)}
                    className="hover:bg-brand-50/40 transition-colors cursor-pointer">
                    <td className="px-5 py-3.5 font-semibold text-slate-800">{u.firstname} {u.lastname}</td>
                    <td className="px-5 py-3.5 text-slate-500">{u.email}</td>
                    <td className="px-5 py-3.5">{roleChip(u.role)}</td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {u.hallId?.name ? `${u.hallId.name}${u.roomId?.roomNumber ? ` / ${u.roomId.roomNumber}` : ''}` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 capitalize">{u.category || '—'}</td>
                    <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => startEdit(u)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors" title="Edit"><IcoPencil /></button>
                        <button onClick={() => handleDelete(u)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete"><IcoTrash /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400">No users found.</td></tr>
                )}
              </tbody>
            </table>
            <UsersPagination page={page} pageSize={pageSize} total={filtered.length}
              onPageChange={setPage} onPageSizeChange={setPageSize} />
          </div>
        )}
      </PageShell>

      <Modal open={modal} onClose={closeModal} title={editing ? 'Edit User' : 'New User'} wide>
        {error && <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <Field label="First name"><input className="input" value={form.firstname} onChange={set('firstname')} required /></Field>
          <Field label="Last name"><input className="input" value={form.lastname} onChange={set('lastname')} required /></Field>
          <Field label="Email" hint="Must end with @babcock.edu.ng"><input className="input" type="email" value={form.email} onChange={set('email')} required /></Field>
          <Field label={editing ? 'Password (leave blank to keep)' : 'Password'}><input className="input" type="password" value={form.password} onChange={set('password')} minLength={editing ? 0 : 6} required={!editing} /></Field>
          <Field label="Gender">
            <select className="input" value={form.gender} onChange={set('gender')}>
              <option value="male">Male</option><option value="female">Female</option>
            </select>
          </Field>
          <Field label="Role">
            <select className="input" value={form.role} onChange={set('role')}>
              {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
            </select>
          </Field>
          {form.role === 'maintenance_officer' && (
            <Field label="Category">
              <select className="input" value={form.category} onChange={set('category')} required>
                <option value="">Select category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          )}
          {form.role === 'student' && (<>
            <Field label="Hall">
              <select className="input" value={form.hallId} onChange={set('hallId')}>
                <option value="">Select hall</option>
                {halls.map((h) => <option key={h._id} value={h._id}>{h.name}</option>)}
              </select>
            </Field>
            <Field label="Room">
              <select className="input" value={form.roomId} onChange={set('roomId')} disabled={!form.hallId}>
                <option value="">Select room</option>
                {rooms.map((r) => <option key={r._id} value={r._id}>{r.roomNumber}</option>)}
              </select>
            </Field>
          </>)}
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-gray-100">
          <button onClick={closeModal} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={isPending} className="btn-primary">
            {isPending ? 'Saving…' : editing ? 'Update User' : 'Create User'}
          </button>
        </div>
      </Modal>
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   USER DETAIL PAGE
════════════════════════════════════════════════════════════ */
export function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['user', id],
    queryFn: () => getUser(id).then((r) => r.data),
  });

  const { data: allComplaints = [], isLoading: loadingComplaints } = useQuery({
    queryKey: ['complaints'],
    queryFn: () => getComplaints().then((r) => r.data),
  });

  // Set breadcrumb label once user loads
  useSetBreadcrumb(user ? `${user.firstname} ${user.lastname}` : null);

  if (loadingUser) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-2xl border border-gray-100 h-48 animate-pulse" />
      </div>
    );
  }
  if (!user) return <div className="p-8 text-slate-400">User not found.</div>;

  const isStudent = user.role === 'student';
  const isOfficer = user.role === 'maintenance_officer';

  // Filter relevant complaints
  let userComplaints = [];
  if (isStudent) {
    userComplaints = allComplaints.filter(
      (c) => (c.userId?._id || c.userId) === id
    );
  } else if (isOfficer) {
    userComplaints = allComplaints.filter(
      (c) => (c.assignedTo?._id || c.assignedTo) === id
    );
  }

  const openComplaints = userComplaints.filter((c) => c.status !== 'done');
  const doneComplaints = userComplaints.filter((c) => c.status === 'done');

  const paginatedOpen = openComplaints.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const paginatedDone = doneComplaints.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const roleBadge = { admin: 'bg-purple-100 text-purple-700', maintenance_officer: 'bg-blue-100 text-blue-700', student: 'bg-green-100 text-green-700' };

  return (
    <div className="p-6 lg:p-8">
      <button onClick={() => navigate('/admin/users')}
        className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-800 hover:underline mb-5">
        <IcoBack /> Back to Users
      </button>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {user.firstname?.[0]}{user.lastname?.[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-bold text-slate-800">{user.firstname} {user.lastname}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleBadge[user.role] || 'bg-gray-100 text-gray-600'}`}>{user.role.replace('_', ' ')}</span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">{user.email}</p>
            <div className="flex flex-wrap gap-4 mt-3">
              {user.hallId && (
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Hall</p>
                  <p className="text-sm font-medium text-slate-700">{user.hallId.name}</p>
                </div>
              )}
              {user.roomId && (
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Room</p>
                  <p className="text-sm font-medium text-slate-700">{user.roomId.roomNumber}</p>
                </div>
              )}
              {user.category && (
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Speciality</p>
                  <p className="text-sm font-medium text-slate-700 capitalize">{user.category}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Gender</p>
                <p className="text-sm font-medium text-slate-700 capitalize">{user.gender}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Complaint history */}
      {loadingComplaints ? (
        <div className="bg-white rounded-2xl border border-gray-100 h-32 animate-pulse" />
      ) : isStudent ? (
        <StudentComplaintHistory complaints={userComplaints} page={page} setPage={setPage} />
      ) : isOfficer ? (
        <OfficerComplaintHistory
          openComplaints={openComplaints} doneComplaints={doneComplaints}
          paginatedOpen={paginatedOpen} paginatedDone={paginatedDone}
          page={page} setPage={setPage}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
          <p className="text-slate-400 text-sm">No complaint history for admin accounts.</p>
        </div>
      )}
    </div>
  );
}

function ComplaintRow({ complaint }) {
  return (
    <Link to={`/admin/complaints/${complaint._id}`}
      className="flex items-start justify-between gap-4 px-5 py-4 hover:bg-slate-50/70 transition-colors group">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate group-hover:text-brand-700 transition-colors">{complaint.message}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-slate-400 capitalize bg-slate-100 px-2 py-0.5 rounded-full">{complaint.category}</span>
          {complaint.roomId?.roomNumber && <span className="text-xs text-slate-400">Room {complaint.roomId.roomNumber}</span>}
          <span className="text-xs text-slate-400">{new Date(complaint.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
          complaint.status === 'done' ? 'bg-green-100 text-green-700' :
          complaint.status === 'work_in_progress' ? 'bg-yellow-100 text-yellow-700' :
          complaint.status === 'seen' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
        }`}>{complaint.status.replace('_', ' ')}</span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
          complaint.priority === 'urgent' ? 'bg-red-100 text-red-700' :
          complaint.priority === 'high' ? 'bg-orange-100 text-orange-700' :
          complaint.priority === 'medium' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
        }`}>{complaint.priority}</span>
      </div>
    </Link>
  );
}

function StudentComplaintHistory({ complaints, page, setPage }) {
  const paginated = complaints.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-slate-700">Report History</h3>
        <span className="text-xs text-slate-400">{complaints.length} total</span>
      </div>
      {complaints.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-sm">No complaints filed.</div>
      ) : (
        <>
          <div className="divide-y divide-gray-50">
            {paginated.map((c) => <ComplaintRow key={c._id} complaint={c} />)}
          </div>
          <Pagination page={page} total={complaints.length} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

function OfficerComplaintHistory({ openComplaints, doneComplaints, paginatedOpen, paginatedDone, page, setPage }) {
  const [tab, setTab] = useState('open');
  const list = tab === 'open' ? paginatedOpen : paginatedDone;
  const total = tab === 'open' ? openComplaints.length : doneComplaints.length;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          <button onClick={() => { setTab('open'); setPage(0); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === 'open' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            Active <span className="ml-1 text-slate-400">{openComplaints.length}</span>
          </button>
          <button onClick={() => { setTab('done'); setPage(0); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === 'done' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            Completed <span className="ml-1 text-slate-400">{doneComplaints.length}</span>
          </button>
        </div>
      </div>
      {list.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-sm">No complaints in this category.</div>
      ) : (
        <>
          <div className="divide-y divide-gray-50">
            {list.map((c) => <ComplaintRow key={c._id} complaint={c} />)}
          </div>
          <Pagination page={page} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   HALLS PAGE
════════════════════════════════════════════════════════════ */
const BLANK_HALL = { name: '', campus: '', gender: 'male', floors: 1 };
const BLANK_ROOM = { roomNumber: '' };

export function HallsPage() {
  const qc = useQueryClient();
  const [hallModal, setHallModal] = useState(false);
  const [editingHall, setEditingHall] = useState(null);
  const [hallForm, setHallForm] = useState(BLANK_HALL);
  const [hallError, setHallError] = useState('');
  const [expandedHall, setExpandedHall] = useState(null);
  const [roomForms, setRoomForms] = useState({});
  const { confirm, Dialog: ConfirmDialog } = useConfirm();

  const { data: halls = [], isLoading } = useQuery({
    queryKey: ['halls-admin'],
    queryFn: () => getHalls().then((r) => r.data),
  });
  const { data: allAssets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => getAssets().then((r) => r.data),
  });
  const { data: allComplaints = [] } = useQuery({
    queryKey: ['complaints'],
    queryFn: () => getComplaints().then((r) => r.data),
  });

  const { mutate: saveHall, isPending: savingHall } = useMutation({
    mutationFn: (data) => editingHall ? updateHall(editingHall, data) : createHall(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['halls-admin'] }); closeHallModal(); },
    onError: (err) => setHallError(err.response?.data?.message || 'Save failed'),
  });
  const { mutate: removeHall } = useMutation({
    mutationFn: deleteHall,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['halls-admin'] }),
    onError: (err) => alert(err.response?.data?.message || 'Delete failed'),
  });

  function openNewHall() { setEditingHall(null); setHallForm(BLANK_HALL); setHallError(''); setHallModal(true); }
  function startEditHall(h) { setEditingHall(h._id); setHallForm({ name: h.name, campus: h.campus, gender: h.gender, floors: h.floors }); setHallError(''); setHallModal(true); }
  function closeHallModal() { setHallModal(false); setEditingHall(null); setHallForm(BLANK_HALL); setHallError(''); }
  const setH = (k) => (e) => setHallForm({ ...hallForm, [k]: e.target.value });

  async function handleDeleteHall(h) {
    const ok = await confirm(`Delete hall "${h.name}" and all its rooms?`);
    if (ok) removeHall(h._id);
  }

  function getHallAssetHealth(hallId) {
    const ha = allAssets.filter((a) => (a.hallId?._id || a.hallId)?.toString() === hallId.toString());
    if (!ha.length) return null;
    return Math.round((ha.filter((a) => a.condition !== 'condemned').length / ha.length) * 100);
  }

  const openComplaints = allComplaints.filter((c) => c.status !== 'done');

  return (
    <>
      {ConfirmDialog}
      <PageShell title="Halls & Rooms" action={<button onClick={openNewHall} className="btn-primary flex items-center gap-1.5"><IcoPlus /> Add Hall</button>}>
        {isLoading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-14 animate-pulse" />)}</div>
        ) : halls.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-14 text-center"><p className="text-slate-400 text-sm">No halls yet.</p></div>
        ) : (
          <div className="space-y-2.5">
            {halls.map((hall) => {
              const hallId     = hall._id.toString();
              const assetHealth = getHallAssetHealth(hall._id);
              const hallAssets = allAssets.filter((a) => (a.hallId?._id || a.hallId)?.toString() === hallId);
              return (
                <HallRow
                  key={hall._id}
                  hall={hall}
                  hallAssets={hallAssets}
                  assetHealth={assetHealth}
                  openComplaints={openComplaints}
                  expanded={expandedHall === hall._id}
                  onToggle={() => setExpandedHall(expandedHall === hall._id ? null : hall._id)}
                  onEdit={() => startEditHall(hall)}
                  onDelete={() => handleDeleteHall(hall)}
                  roomFormState={roomForms[hall._id]}
                  setRoomFormState={(s) => setRoomForms((prev) => ({ ...prev, [hall._id]: s }))}
                  qc={qc}
                />
              );
            })}
          </div>
        )}
      </PageShell>

      <Modal open={hallModal} onClose={closeHallModal} title={editingHall ? 'Edit Hall' : 'New Hall'}>
        {hallError && <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{hallError}</div>}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Hall Name"><input className="input" value={hallForm.name} onChange={setH('name')} required /></Field>
          <Field label="Campus"><input className="input" value={hallForm.campus} onChange={setH('campus')} /></Field>
          <Field label="Gender">
            <select className="input" value={hallForm.gender} onChange={setH('gender')}>
              <option value="male">Male</option><option value="female">Female</option>
            </select>
          </Field>
          <Field label="Floors"><input className="input" type="number" min={1} value={hallForm.floors} onChange={setH('floors')} /></Field>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-gray-100">
          <button onClick={closeHallModal} className="btn-secondary">Cancel</button>
          <button onClick={() => saveHall(hallForm)} disabled={savingHall} className="btn-primary">
            {savingHall ? 'Saving…' : editingHall ? 'Update Hall' : 'Create Hall'}
          </button>
        </div>
      </Modal>
    </>
  );
}

function HallRow({ hall, hallAssets = [], assetHealth, openComplaints, expanded, onToggle, onEdit, onDelete, roomFormState, setRoomFormState, qc }) {
  const state = roomFormState || { show: false, editing: null, form: BLANK_ROOM, error: '' };

  const { data: rooms = [], isLoading: loadingRooms } = useQuery({
    queryKey: ['rooms-hall', hall._id],
    queryFn: () => getRooms(hall._id).then((r) => r.data),
    enabled: expanded,
  });

  const { mutate: saveRoom, isPending: savingRoom } = useMutation({
    mutationFn: (data) => state.editing ? updateRoom(hall._id, state.editing, data) : createRoom(hall._id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rooms-hall', hall._id] }); setRoomFormState({ show: false, editing: null, form: BLANK_ROOM, error: '' }); },
    onError: (err) => setRoomFormState({ ...state, error: err.response?.data?.message || 'Save failed' }),
  });
  const { mutate: removeRoom } = useMutation({
    mutationFn: (roomId) => deleteRoom(hall._id, roomId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms-hall', hall._id] }),
    onError: (err) => alert(err.response?.data?.message || 'Delete failed'),
  });

  const [roomDetailId, setRoomDetailId] = useState(null);
  const roomDetailData = rooms.find((r) => r._id === roomDetailId);
  const roomDetailComplaints = roomDetailId
    ? openComplaints.filter((c) => (c.roomId?._id || c.roomId)?.toString() === roomDetailId.toString())
    : [];

  // Room health: count open complaints per room
  const roomIssueMap = {};
  openComplaints.forEach((c) => {
    const rId = c.roomId?._id || c.roomId;
    if (rId) roomIssueMap[rId.toString()] = (roomIssueMap[rId.toString()] || 0) + 1;
  });

  const genderBadge = hall.gender === 'male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700';

  const healthColor = assetHealth === null ? 'text-slate-400' : assetHealth >= 80 ? 'text-emerald-600' : assetHealth >= 50 ? 'text-yellow-600' : 'text-red-600';

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="flex items-center px-5 py-4 gap-3">
          <button onClick={onToggle} className="flex items-center gap-3 flex-1 min-w-0 text-left">
            <span className="text-slate-400"><IcoChevron open={expanded} /></span>
            <span className="font-semibold text-slate-800">{hall.name}</span>
            {hall.campus && <span className="text-slate-400 text-xs hidden sm:inline">{hall.campus}</span>}
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${genderBadge}`}>{hall.gender}</span>
            {hall.floors && <span className="text-slate-400 text-xs">{hall.floors} fl.</span>}
          </button>
          {/* Asset health indicator */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400">Assets</span>
            {assetHealth !== null ? (
              <HealthBar pct={assetHealth} />
            ) : (
              <span className="text-xs text-slate-300">—</span>
            )}
          </div>
          <div className="flex gap-2 shrink-0 ml-2">
            <button onClick={onEdit} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"><IcoPencil /></button>
            <button onClick={onDelete} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"><IcoTrash /></button>
          </div>
        </div>

        {expanded && (
          <div className="border-t border-gray-100 px-5 py-4 bg-slate-50/60">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Rooms {rooms.length > 0 && <span className="text-slate-400">({rooms.length})</span>}
              </span>
              <button onClick={() => setRoomFormState({ show: true, editing: null, form: BLANK_ROOM, error: '' })}
                className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"><IcoPlus /> Add Room</button>
            </div>
            {loadingRooms ? (
              <p className="text-xs text-slate-400">Loading rooms…</p>
            ) : rooms.length === 0 ? (
              <p className="text-xs text-slate-400">No rooms yet.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {rooms.map((r) => {
                  const issues = roomIssueMap[r._id.toString()] || 0;
                  const roomBorderColor = issues === 0 ? 'border-emerald-200 bg-emerald-50/50' : issues === 1 ? 'border-yellow-200 bg-yellow-50/50' : 'border-red-200 bg-red-50/50';
                  return (
                    <div key={r._id}
                      onClick={() => setRoomDetailId(r._id)}
                      className={`flex items-center justify-between border rounded-xl px-2.5 py-2 text-xs shadow-sm group transition-colors cursor-pointer hover:shadow-md ${roomBorderColor}`}>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${issues === 0 ? 'bg-emerald-400' : issues === 1 ? 'bg-yellow-400' : 'bg-red-400'}`} />
                        <span className="font-semibold text-slate-700">{r.roomNumber}</span>
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setRoomFormState({ show: true, editing: r._id, form: { roomNumber: r.roomNumber }, error: '' })}
                          className="text-slate-400 hover:text-brand-600 transition-colors p-0.5"><IcoPencil /></button>
                        <button onClick={() => { if (window.confirm(`Delete room ${r.roomNumber}?`)) removeRoom(r._id); }}
                          className="text-slate-400 hover:text-red-500 transition-colors p-0.5"><IcoTrash /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {/* Legend */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-200/60">
              <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Healthy</span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> 1 issue</span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> 2+ issues</span>
            </div>
          </div>
        )}
      </div>

      {/* Room detail modal — complaints + hall assets */}
      <Modal open={!!roomDetailId} onClose={() => setRoomDetailId(null)}
        title={roomDetailData ? `Room ${roomDetailData.roomNumber} — ${hall.name}` : 'Room'} wide>
        {roomDetailComplaints.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-sm">No open complaints for this room.</div>
        ) : (
          <div className="divide-y divide-gray-100 -mx-6 -mt-1">
            {roomDetailComplaints.map((c) => <ComplaintRow key={c._id} complaint={c} />)}
          </div>
        )}

        {/* Hall assets footer */}
        {hallAssets.length > 0 && (
          <div className="mt-5 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Hall Assets</p>
              <div className="flex items-center gap-3 text-[10px] text-slate-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"/>Good</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block"/>Fair</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block"/>Poor</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"/>Condemned</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {hallAssets.map((a) => <AssetPill key={a._id} item={a} showCondition />)}
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
          <Link to={`/admin/complaints`} onClick={() => setRoomDetailId(null)}
            className="text-xs text-brand-600 hover:underline">View all complaints →</Link>
        </div>
      </Modal>

      {/* Room edit modal */}
      <Modal open={state.show} onClose={() => setRoomFormState({ show: false, editing: null, form: BLANK_ROOM, error: '' })}
        title={state.editing ? 'Edit Room' : `Add Room — ${hall.name}`}>
        {state.error && <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{state.error}</div>}
        <Field label="Room Number">
          <input className="input" value={state.form.roomNumber}
            onChange={(e) => setRoomFormState({ ...state, form: { roomNumber: e.target.value } })} required autoFocus />
        </Field>
        <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-gray-100">
          <button onClick={() => setRoomFormState({ show: false, editing: null, form: BLANK_ROOM, error: '' })} className="btn-secondary">Cancel</button>
          <button onClick={() => saveRoom(state.form)} disabled={savingRoom} className="btn-primary">
            {savingRoom ? 'Saving…' : state.editing ? 'Update Room' : 'Add Room'}
          </button>
        </div>
      </Modal>
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   ASSETS PAGE
════════════════════════════════════════════════════════════ */
const BLANK_ASSET = { name: '', type: 'furniture', hallId: '', quantity: 1, condition: 'good', maintenanceIntervalDays: 180, lastMaintenanceDate: new Date().toISOString().split('T')[0] };

export function AssetsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK_ASSET);
  const { confirm, Dialog: ConfirmDialog } = useConfirm();

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: () => getAssets().then((r) => r.data),
  });
  const { data: dueAssets = [] } = useQuery({
    queryKey: ['assets-due'],
    queryFn: () => getDueAssets().then((r) => r.data),
  });
  const { data: halls = [] } = useQuery({
    queryKey: ['halls-admin'],
    queryFn: () => getHalls().then((r) => r.data),
  });

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data) => editing ? updateAsset(editing, data) : createAsset(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] });
      qc.invalidateQueries({ queryKey: ['assets-due'] });
      closeModal();
    },
  });
  const { mutate: remove } = useMutation({
    mutationFn: deleteAsset,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['assets'] }); qc.invalidateQueries({ queryKey: ['assets-due'] }); },
  });

  function openNew() { setEditing(null); setForm(BLANK_ASSET); setModal(true); }
  function startEdit(item) {
    setEditing(item._id);
    setForm({ name: item.name, type: item.type, hallId: item.hallId?._id || '', quantity: item.quantity, condition: item.condition, maintenanceIntervalDays: item.maintenanceIntervalDays, lastMaintenanceDate: item.lastMaintenanceDate?.split('T')[0] || '' });
    setModal(true);
  }
  function closeModal() { setModal(false); setEditing(null); setForm(BLANK_ASSET); }
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function handleDelete(id) {
    const ok = await confirm('Delete this asset? This cannot be undone.');
    if (ok) remove(id);
  }

  return (
    <>
      {ConfirmDialog}
      <PageShell title="Assets" action={<button onClick={openNew} className="btn-primary flex items-center gap-1.5"><IcoPlus /> Add Asset</button>}>
        {dueAssets.length > 0 && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl bg-red-50 border border-red-200 px-5 py-3.5">
            <span className="text-red-500 flex-shrink-0"><IcoAlert /></span>
            <p className="text-sm text-red-800">
              <span className="font-semibold">{dueAssets.length} asset{dueAssets.length !== 1 ? 's' : ''}</span> overdue for maintenance.
            </p>
          </div>
        )}
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-gray-100 h-48 animate-pulse" />
        ) : (
          <AssetTable assets={assets} onEdit={startEdit} onDelete={handleDelete} />
        )}
      </PageShell>

      <Modal open={modal} onClose={closeModal} title={editing ? 'Edit Asset' : 'New Asset'} wide>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name"><input className="input" value={form.name} onChange={set('name')} required /></Field>
          <Field label="Type">
            <select className="input" value={form.type} onChange={set('type')}>
              <option value="furniture">Furniture</option><option value="equipment">Equipment</option>
            </select>
          </Field>
          <Field label="Hall">
            <select className="input" value={form.hallId} onChange={set('hallId')} required>
              <option value="">Select hall</option>
              {halls.map((h) => <option key={h._id} value={h._id}>{h.name}</option>)}
            </select>
          </Field>
          <Field label="Quantity"><input className="input" type="number" min={1} value={form.quantity} onChange={set('quantity')} /></Field>
          <Field label="Condition">
            <select className="input" value={form.condition} onChange={set('condition')}>
              {['good', 'fair', 'poor', 'condemned'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Maintenance interval (days)"><input className="input" type="number" min={1} value={form.maintenanceIntervalDays} onChange={set('maintenanceIntervalDays')} /></Field>
          <div className="col-span-2">
            <Field label="Last maintenance date"><input className="input" type="date" value={form.lastMaintenanceDate} onChange={set('lastMaintenanceDate')} /></Field>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-gray-100">
          <button onClick={closeModal} className="btn-secondary">Cancel</button>
          <button onClick={() => save(form)} disabled={isPending} className="btn-primary">
            {isPending ? 'Saving…' : editing ? 'Update Asset' : 'Add Asset'}
          </button>
        </div>
      </Modal>
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   AI SETTINGS PAGE
════════════════════════════════════════════════════════════ */
export function AISettingsPage() {
  const [form, setForm] = useState({ apiKey: '', model: 'claude-opus-4-6', isActive: true });
  const [testResult, setTestResult] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState('');

  const { data: config } = useQuery({
    queryKey: ['ai-config'],
    queryFn: () => getAIConfig().then((r) => r.data),
  });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  async function handleSave(e) {
    e.preventDefault(); setError(''); setSaveLoading(true);
    try { await saveAIConfig(form); alert('AI config saved.'); }
    catch (err) { setError(err.response?.data?.message || 'Save failed'); }
    finally { setSaveLoading(false); }
  }

  async function handleTest() {
    setTestResult(''); setTestLoading(true);
    try {
      const { data } = await testAIConfig({ apiKey: form.apiKey, model: form.model });
      setTestResult(data.response || 'Connected successfully.');
    } catch (err) {
      setTestResult('❌ ' + (err.response?.data?.message || 'Test failed'));
    } finally { setTestLoading(false); }
  }

  return (
    <PageShell title="AI Settings">
      <div className="max-w-lg">
        {config && (
          <div className="flex items-center gap-3 mb-6 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className={`w-2.5 h-2.5 rounded-full ${config.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            <div>
              <p className="text-sm font-semibold text-slate-700">{config.isActive ? 'Active' : 'Inactive'}</p>
              <p className="text-xs text-slate-400">Last tested: {config.lastTestedAt ? new Date(config.lastTestedAt).toLocaleString('en-NG') : 'Never'}</p>
            </div>
          </div>
        )}
        {error && <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <Field label="API Key"><input className="input font-mono" type="password" placeholder="sk-ant-…" value={form.apiKey} onChange={set('apiKey')} required /></Field>
          <Field label="Model">
            <select className="input" value={form.model} onChange={set('model')}>
              <option value="claude-opus-4-6">claude-opus-4-6</option>
              <option value="claude-sonnet-4-6">claude-sonnet-4-6</option>
              <option value="claude-haiku-4-5">claude-haiku-4-5</option>
            </select>
          </Field>
          <div className="flex items-center gap-3">
            <input id="isActive" type="checkbox" checked={form.isActive} onChange={set('isActive')} className="rounded border-gray-300 text-brand-600 w-4 h-4" />
            <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Enable AI suggestions</label>
          </div>
          {testResult && <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-700">{testResult}</div>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={handleTest} disabled={testLoading || !form.apiKey} className="btn-secondary">
              {testLoading ? 'Testing…' : 'Test connection'}
            </button>
            <button type="submit" disabled={saveLoading} className="btn-primary">
              {saveLoading ? 'Saving…' : 'Save config'}
            </button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}
