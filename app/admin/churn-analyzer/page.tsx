export default function ComingSoonPage() {
    return (
      <main className="min-h-screen bg-[#FAFAFA] px-6 py-8">
        <div className="max-w-5xl mx-auto">
  
          <section className="bg-white border border-slate-200 rounded-3xl p-10 flex flex-col items-center justify-center text-center min-h-[70vh]">
  
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-6">
              <div className="w-6 h-6 rounded-full bg-slate-900" />
            </div>
  
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">
              Nexus Finance
            </p>
  
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
              Coming Soon
            </h1>
  
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-500">
              This module is currently under development and will be available in
              an upcoming release.
            </p>
  
            <div className="mt-10 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-300 animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-slate-300 animate-pulse delay-150" />
              <div className="w-2 h-2 rounded-full bg-slate-300 animate-pulse delay-300" />
            </div>
  
          </section>
  
        </div>
      </main>
    );
  }