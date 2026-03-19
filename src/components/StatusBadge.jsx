const STATUS_STYLES = {
  logged:           'bg-gray-100 text-gray-700',
  seen:             'bg-blue-100 text-blue-700',
  work_in_progress: 'bg-yellow-100 text-yellow-700',
  blocked:          'bg-rose-100 text-rose-700',
  needs_review:     'bg-violet-100 text-violet-700',
  done:             'bg-green-100 text-green-700',
};

const PRIORITY_STYLES = {
  low:    'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high:   'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const LABELS = {
  logged:           'Logged',
  seen:             'Seen',
  work_in_progress: 'In Progress',
  blocked:          'Blocked',
  needs_review:     'Needs Review',
  done:             'Done',
};

export function StatusBadge({ status }) {
  return (
    <span className={`badge ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'}`}>
      {LABELS[status] || status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  return (
    <span className={`badge ${PRIORITY_STYLES[priority] || 'bg-gray-100 text-gray-600'}`}>
      {priority?.toUpperCase()}
    </span>
  );
}
