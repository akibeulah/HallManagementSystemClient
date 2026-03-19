export default function AISuggestionBox({ suggestion, generatedAt }) {
  if (!suggestion) return null;

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-blue-600 text-lg">🤖</span>
        <h3 className="text-sm font-semibold text-blue-800">AI Suggestion</h3>
        {generatedAt && (
          <span className="text-xs text-blue-500 ml-auto">
            {new Date(generatedAt).toLocaleString('en-NG')}
          </span>
        )}
      </div>
      <p className="text-sm text-blue-900 leading-relaxed">{suggestion}</p>
    </div>
  );
}
