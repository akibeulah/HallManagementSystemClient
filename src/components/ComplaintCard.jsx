import { Link } from 'react-router-dom';
import { StatusBadge, PriorityBadge } from './StatusBadge.jsx';

const IcoUser = () => (
  <svg width={11} height={11} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
  </svg>
);
const IcoAlert = () => (
  <svg width={11} height={11} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />
  </svg>
);

export default function ComplaintCard({ complaint, to, onAssign }) {
  const isBlocked = complaint.status === 'blocked';

  return (
    <div className={`card hover:shadow-md transition-shadow relative ${isBlocked ? 'border-rose-200 bg-rose-50/30' : ''}`}>
      <Link to={to || `/complaints/${complaint._id}`} className="block">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{complaint.message}</p>
            <p className="text-xs text-gray-500 mt-1">
              {complaint.category}
              {complaint.roomId?.roomNumber && ` · Room ${complaint.roomId.roomNumber}`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
          </div>
        </div>

        {/* Assignee row */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {new Date(complaint.createdAt).toLocaleDateString('en-NG', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </span>
          {complaint.assignedTo ? (
            <span className="flex items-center gap-1 text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
              <IcoUser />
              {complaint.assignedTo.firstname} {complaint.assignedTo.lastname}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
              <IcoAlert />
              Unassigned
            </span>
          )}
        </div>
      </Link>

      {/* Quick-assign button for unassigned complaints (admin only) */}
      {onAssign && (
        <button
          onClick={(e) => { e.preventDefault(); onAssign(); }}
          className="mt-2 w-full text-center text-xs font-semibold text-brand-600 hover:text-brand-800
            border border-brand-200 hover:border-brand-400 hover:bg-brand-50 rounded-xl py-1.5 transition-colors"
        >
          + Assign Officer
        </button>
      )}
    </div>
  );
}
