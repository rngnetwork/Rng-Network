export function Topbar() {
  return (
    <header className="h-16 flex items-center justify-between px-8 border-b border-border bg-black/40 backdrop-blur-md sticky top-0 z-40">
      <div className="flex items-center gap-2 text-sm text-white/60">
        <span>Workspace</span>
        <span className="text-white/20">/</span>
        <span className="text-white font-medium">Dashboard</span>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-border text-xs">
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
          <span className="text-white/80 font-medium">Systems Operational</span>
        </div>
      </div>
    </header>
  );
}
