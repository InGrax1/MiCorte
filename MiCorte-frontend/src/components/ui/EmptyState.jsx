export default function EmptyState({ message = 'Sin resultados', description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <svg
        xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ color: '#D6D0C4' }}
      >
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
      </svg>
      <p className="mt-3 text-sm font-medium text-warm-600">{message}</p>
      {description && <p className="mt-1 text-xs text-warm-400">{description}</p>}
    </div>
  )
}
