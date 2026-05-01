import './App.css'

function App() {
  return (
    <main className='App min-h-screen bg-slate-950 text-slate-100'>
      <header className='border-b border-slate-800 bg-slate-950/95 px-5 py-4'>
        <h1 className='m-0 text-xl font-semibold tracking-normal text-white'>ATemplateEditor</h1>
        <p className='m-0 mt-1 text-sm text-slate-400'>Template JSON editor for broadcast graphics</p>
      </header>

      <div className='grid min-h-[calc(100vh-73px)] grid-cols-1 gap-3 p-3 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_280px]'>
        <aside className='rounded-md border border-slate-800 bg-slate-900/80 p-4 lg:col-span-2 xl:col-span-1'>
          <div className='mb-3 text-xs font-semibold uppercase text-cyan-300'>Library</div>
          <h2 className='m-0 text-base font-semibold text-white'>Template Library</h2>
          <p className='mt-2 text-sm text-slate-500'>Placeholder panel</p>
        </aside>

        <section className='flex min-w-0 flex-col gap-3'>
          <div className='min-h-[380px] rounded-md border border-cyan-500/30 bg-slate-900 p-4 shadow-[0_0_0_1px_rgba(34,211,238,0.04)]'>
            <div className='mb-3 text-xs font-semibold uppercase text-cyan-300'>Workspace</div>
            <h2 className='m-0 text-base font-semibold text-white'>Template workspace</h2>
            <p className='mt-2 text-sm text-slate-500'>Static shell placeholder</p>
          </div>

          <div className='rounded-md border border-slate-800 bg-slate-900/80 p-4'>
            <div className='mb-3 text-xs font-semibold uppercase text-cyan-300'>Output</div>
            <h2 className='m-0 text-base font-semibold text-white'>Preview</h2>
            <div className='mt-3 aspect-video rounded border border-slate-800 bg-slate-950' />
          </div>
        </section>

        <aside className='rounded-md border border-slate-800 bg-slate-900/80 p-4'>
          <div className='mb-3 text-xs font-semibold uppercase text-cyan-300'>Inspector</div>
          <h2 className='m-0 text-base font-semibold text-white'>Properties</h2>
          <p className='mt-2 text-sm text-slate-500'>Placeholder panel</p>
        </aside>
      </div>

    </main>
  )
}

export default App
