import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  getComplaint, updateComplaintStatus, getComplaintHistory, getOfficers,
  addComment, assignComplaint,
} from '../api/index.js';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge.jsx';
import { AssetPillList } from '../components/AssetPill.jsx';
import AISuggestionBox from '../components/AISuggestionBox.jsx';
import Navbar from '../components/Navbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSetBreadcrumb } from '../layouts/AdminLayout.jsx';

/* ─── Status machine ─────────────────────────────── */
const NEXT_STATUS = {
  logged: 'seen',
  seen: 'work_in_progress',
  work_in_progress: 'done',
  blocked: 'work_in_progress',
};

const NEXT_LABELS = {
  seen: 'Mark as In Progress',
  work_in_progress: 'Mark as Done',
  done: 'Done',
  blocked: 'Resume Work',
};

/* ─── Icons ──────────────────────────────────────── */
const Ico = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const IcoBack    = () => <Ico d="M19 12H5M12 19l-7-7 7-7" size={14} />;
const IcoSend    = () => <Ico d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" size={14} />;
const IcoBlock   = () => <Ico d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" size={14} />;
const IcoUser    = () => <Ico d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" size={14} />;

function AdminBreadcrumb({ title }) {
  useSetBreadcrumb(title ? title.slice(0, 50) + (title.length > 50 ? '…' : '') : 'Complaint');
  return null;
}

/* ─── Timeline entry ─────────────────────────────── */
function TimelineEntry({ entry, isLast }) {
  const isComment = entry.type === 'comment';
  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${isComment ? 'bg-violet-400' : 'bg-brand-400'}`} />
        {!isLast && <div className="w-px flex-1 bg-gray-100 mt-1" />}
      </div>
      <div className="pb-4 text-sm flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-800">
            {entry.changedBy?.firstname} {entry.changedBy?.lastname}
          </span>
          {isComment ? (
            <span className="text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide">
              Comment
            </span>
          ) : (
            <span className="text-slate-400 text-xs">
              {entry.oldStatus?.replace(/_/g, ' ')}
              {' → '}
              <span className="font-medium text-slate-700">{entry.newStatus?.replace(/_/g, ' ')}</span>
            </span>
          )}
        </div>
        {entry.notes && (
          <p className={`mt-1 text-sm ${isComment ? 'text-slate-700' : 'text-slate-400 italic text-xs'}`}>
            {entry.notes}
          </p>
        )}
        <p className="text-[10px] text-slate-400 mt-0.5">
          {new Date(entry.createdAt).toLocaleString('en-NG')}
        </p>
      </div>
    </li>
  );
}

export default function ComplaintDetail() {
  const { id } = useParams();
  const { auth } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [commentText, setCommentText] = useState('');

  const isAdmin  = auth?.user.role === 'admin';
  const isOfficer = auth?.user.role === 'maintenance_officer';

  const { data: complaint, isLoading } = useQuery({
    queryKey: ['complaint', id],
    queryFn: () => getComplaint(id).then((r) => r.data),
  });

  const { data: history = [] } = useQuery({
    queryKey: ['complaint-history', id],
    queryFn: () => getComplaintHistory(id).then((r) => r.data),
    enabled: !!(isAdmin || isOfficer),
  });

  const { data: officers = [] } = useQuery({
    queryKey: ['officers'],
    queryFn: () => getOfficers().then((r) => r.data),
    enabled: isAdmin,
  });

  const { mutate: changeStatus, isPending: changingStatus } = useMutation({
    mutationFn: (data) => updateComplaintStatus(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['complaint', id] });
      qc.invalidateQueries({ queryKey: ['complaint-history', id] });
      qc.invalidateQueries({ queryKey: ['complaints'] });
      setNotes('');
    },
  });

  const { mutate: doAssign, isPending: assigning } = useMutation({
    mutationFn: (data) => assignComplaint(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['complaint', id] });
      qc.invalidateQueries({ queryKey: ['complaint-history', id] });
      qc.invalidateQueries({ queryKey: ['complaints'] });
      setAssignedTo('');
    },
  });

  const { mutate: postComment, isPending: commenting } = useMutation({
    mutationFn: (data) => addComment(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['complaint-history', id] });
      setCommentText('');
    },
  });

  const backPath = isAdmin ? '/admin/complaints' : -1;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Outfit', sans-serif" }}>
        {!isAdmin && <Navbar />}
        <p className="p-8 text-gray-500 text-sm">Loading…</p>
      </div>
    );
  }
  if (!complaint) return null;

  const next = NEXT_STATUS[complaint.status];
  const canAdvance = (isAdmin || isOfficer) && next && complaint.status !== 'done';
  const canBlock   = isOfficer
    && (complaint.status === 'seen' || complaint.status === 'work_in_progress');
  const isMyComplaint = isOfficer && String(complaint.assignedTo?._id || complaint.assignedTo) === String(auth?.user?.id);
  const showOfficerActions = isOfficer && isMyComplaint;

  return (
    <div className="min-h-full bg-gray-50" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {isAdmin && <AdminBreadcrumb title={complaint.message} />}
      {!isAdmin && <Navbar />}

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => typeof backPath === 'number' ? navigate(backPath) : navigate(backPath)}
          className="text-xs text-brand-600 hover:text-brand-800 hover:underline mb-5 flex items-center gap-1.5"
        >
          <IcoBack />
          Back to complaints
        </button>

        {/* ── Main card ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex-1">
              <h1 className="text-base font-semibold text-slate-800 leading-snug">{complaint.message}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-xs text-slate-500 capitalize bg-slate-100 px-2 py-0.5 rounded-full">{complaint.category}</span>
                {complaint.roomId?.roomNumber && (
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Room {complaint.roomId.roomNumber}</span>
                )}
                <span className="text-xs text-slate-400">
                  {new Date(complaint.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <StatusBadge status={complaint.status} />
              <PriorityBadge priority={complaint.priority} />
            </div>
          </div>

          {/* ── People ── */}
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Reported by</p>
              {complaint.userId ? (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">
                    {complaint.userId.firstname?.[0]}{complaint.userId.lastname?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{complaint.userId.firstname} {complaint.userId.lastname}</p>
                    {complaint.userId.email && <p className="text-xs text-slate-400">{complaint.userId.email}</p>}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">Unknown</p>
              )}
            </div>

            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Attending to</p>
              {complaint.assignedTo ? (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                    {complaint.assignedTo.firstname?.[0]}{complaint.assignedTo.lastname?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{complaint.assignedTo.firstname} {complaint.assignedTo.lastname}</p>
                    <p className="text-xs text-slate-400 capitalize">{complaint.assignedTo.category}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">Not yet assigned</p>
              )}
            </div>
          </div>

          {/* ── Affected items ── */}
          {complaint.itemIds?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Affected Items</p>
              <AssetPillList items={complaint.itemIds} showCondition />
            </div>
          )}

          <AISuggestionBox suggestion={complaint.aiSuggestion} generatedAt={complaint.aiGeneratedAt} />
        </div>

        {/* ── Admin: Assign officer panel ── */}
        {isAdmin && officers.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <IcoUser />
              {complaint.assignedTo ? 'Reassign Officer' : 'Assign Officer'}
            </h2>
            <div className="flex gap-3">
              <select
                className="input flex-1"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              >
                <option value="">— select officer —</option>
                {officers.map((o) => (
                  <option key={o._id} value={o._id}>
                    {o.firstname} {o.lastname} ({o.category})
                    {String(o._id) === String(complaint.assignedTo?._id) ? ' ✓ current' : ''}
                  </option>
                ))}
              </select>
              <button
                onClick={() => doAssign({ assignedTo: assignedTo || null })}
                disabled={!assignedTo || assigning}
                className="btn-primary text-sm px-5 whitespace-nowrap"
              >
                {assigning ? 'Assigning…' : 'Assign'}
              </button>
              {complaint.assignedTo && (
                <button
                  onClick={() => doAssign({ assignedTo: null })}
                  disabled={assigning}
                  className="btn-secondary text-sm px-4 whitespace-nowrap text-red-500 hover:bg-red-50"
                >
                  Unassign
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Status update (advance) ── */}
        {(canAdvance || (isAdmin && complaint.status !== 'done')) && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Update Status</h2>
            <textarea
              className="input mb-3"
              rows={2}
              placeholder="Add a note (optional)…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <div className="flex flex-wrap gap-3">
              {/* Advance button */}
              {next && complaint.status !== 'done' && (
                <button
                  onClick={() => changeStatus({ status: next, notes })}
                  disabled={changingStatus}
                  className="btn-primary text-sm"
                >
                  {changingStatus ? 'Updating…' : (NEXT_LABELS[next] || `Mark as ${next.replace(/_/g, ' ')}`)}
                </button>
              )}

              {/* Block button — officer only, from active states */}
              {showOfficerActions && canBlock && (
                <button
                  onClick={() => changeStatus({ status: 'blocked', notes })}
                  disabled={changingStatus}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold
                    bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-colors"
                >
                  <IcoBlock />
                  Move to Blocked
                </button>
              )}

              {/* Unblock button — officer on blocked complaints */}
              {showOfficerActions && complaint.status === 'blocked' && (
                <button
                  onClick={() => changeStatus({ status: 'work_in_progress', notes })}
                  disabled={changingStatus}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold
                    bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 transition-colors"
                >
                  Resume Work
                </button>
              )}

              {/* Admin: unblock */}
              {isAdmin && complaint.status === 'blocked' && (
                <button
                  onClick={() => changeStatus({ status: 'work_in_progress', notes })}
                  disabled={changingStatus}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold
                    bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 transition-colors"
                >
                  Unblock → In Progress
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Comment box — officer/admin ── */}
        {(isAdmin || showOfficerActions) && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Add Comment</h2>
            <textarea
              className="input mb-3"
              rows={3}
              placeholder="Leave a note or update for this complaint…"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button
              onClick={() => postComment({ text: commentText })}
              disabled={!commentText.trim() || commenting}
              className="flex items-center gap-2 btn-primary text-sm"
            >
              <IcoSend />
              {commenting ? 'Posting…' : 'Post Comment'}
            </button>
          </div>
        )}

        {/* ── Activity timeline ── */}
        {history.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Activity</h2>
            <ol className="space-y-0">
              {history.map((h, i) => (
                <TimelineEntry key={h._id} entry={h} isLast={i === history.length - 1} />
              ))}
            </ol>
          </div>
        )}
      </main>
    </div>
  );
}
