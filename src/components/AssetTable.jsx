const CONDITION_STYLES = {
  good:      'bg-emerald-100 text-emerald-700',
  fair:      'bg-yellow-100  text-yellow-700',
  poor:      'bg-orange-100  text-orange-700',
  condemned: 'bg-red-100     text-red-700',
};

const EditIco = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const TrashIco = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
  </svg>
);

export default function AssetTable({ assets, onEdit, onDelete }) {
  const today = new Date();

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
      <table className="min-w-full divide-y divide-gray-100 text-sm">
        <thead>
          <tr className="bg-slate-50">
            {['Name', 'Type', 'Hall', 'Qty', 'Condition', 'Next Maintenance', 'Actions'].map((h) => (
              <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 bg-white">
          {assets.map((item) => {
            const due = new Date(item.nextMaintenanceDue);
            const overdue = due <= today;
            return (
              <tr key={item._id} className={`hover:bg-slate-50/70 transition-colors ${overdue ? 'bg-red-50/60' : ''}`}>
                <td className="px-5 py-3.5 font-semibold text-slate-800">{item.name}</td>
                <td className="px-5 py-3.5 capitalize text-slate-500">{item.type}</td>
                <td className="px-5 py-3.5 text-slate-500">{item.hallId?.name || '—'}</td>
                <td className="px-5 py-3.5 text-slate-500">{item.quantity}</td>
                <td className="px-5 py-3.5">
                  <span className={`badge capitalize ${CONDITION_STYLES[item.condition] || ''}`}>{item.condition}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={overdue ? 'text-red-600 font-semibold' : 'text-slate-500'}>
                    {due.toLocaleDateString('en-NG')}{overdue && ' ⚠'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex gap-1">
                    {onEdit && (
                      <button onClick={() => onEdit(item)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors" title="Edit">
                        <EditIco />
                      </button>
                    )}
                    {onDelete && (
                      <button onClick={() => onDelete(item._id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                        <TrashIco />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {assets.length === 0 && (
            <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">No assets found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
