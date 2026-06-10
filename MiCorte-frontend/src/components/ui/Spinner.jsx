export default function Spinner({ size = 'md', className = '' }) {
  const sz = {
    sm: 'w-4 h-4 border-[1.5px]',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-[3px]',
  }[size]
  return (
    <div
      className={`${sz} ${className} animate-spin rounded-full`}
      style={{ borderColor: '#EBE8E0', borderTopColor: '#C9A84C' }}
    />
  )
}
