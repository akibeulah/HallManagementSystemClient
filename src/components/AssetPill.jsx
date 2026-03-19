const CONDITION_STYLES = {
  good:      'bg-emerald-100 text-emerald-700 border-emerald-200',
  fair:      'bg-yellow-100 text-yellow-700 border-yellow-200',
  poor:      'bg-orange-100 text-orange-700 border-orange-200',
  condemned: 'bg-red-100 text-red-700 border-red-200',
};

const CONDITION_DOT = {
  good:      'bg-emerald-500',
  fair:      'bg-yellow-500',
  poor:      'bg-orange-500',
  condemned: 'bg-red-500',
};

const CONDITION_LABELS = {
  good:      'Good',
  fair:      'Fair',
  poor:      'Poor',
  condemned: 'Condemned',
};

export function AssetPill({ item, showCondition = false }) {
  const cStyle = CONDITION_STYLES[item.condition] || 'bg-gray-100 text-gray-600 border-gray-200';
  const dot    = CONDITION_DOT[item.condition]    || 'bg-gray-400';
  return (
    <span
      title={`${item.name} — ${CONDITION_LABELS[item.condition] || item.condition}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cStyle}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
      {item.name}
      {showCondition && (
        <span className="opacity-60 text-[10px] capitalize">· {item.condition}</span>
      )}
    </span>
  );
}

export function AssetPillList({ items = [], showCondition = false, emptyText = 'No items listed' }) {
  if (!items.length) return <p className="text-xs text-slate-400 italic">{emptyText}</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <AssetPill key={item._id} item={item} showCondition={showCondition} />
      ))}
    </div>
  );
}
