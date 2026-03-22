export function PageWrapper({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex-1 overflow-auto bg-slate-950">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white mb-6">{title}</h1>
        {children}
      </div>
    </div>
  )
}
