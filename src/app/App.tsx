import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Panel } from '@/shared/ui/Panel'
import './App.css'

function App() {
  return (
    <main className='App min-h-screen bg-ui-app text-ui-primary'>
      <header className='flex min-h-[72px] flex-col items-start justify-between gap-3 border-b border-ui-border bg-ui-app/95 px-4 py-4 sm:flex-row sm:items-center sm:px-5'>
        <div className='min-w-0'>
          <h1 className='m-0 text-xl font-semibold tracking-normal text-ui-primary'>ATemplateEditor</h1>
          <p className='m-0 mt-1 text-sm text-ui-secondary'>Template JSON editor for broadcast graphics</p>
        </div>
        <div className='flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0'>
          <Badge variant='muted'>Foundation</Badge>
          <Button disabled variant='accent'>New template</Button>
        </div>
      </header>

      <div className='grid min-h-[calc(100vh-112px)] grid-cols-1 gap-3 p-3 md:grid-cols-[minmax(0,1fr)] lg:min-h-[calc(100vh-104px)] lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_280px]'>
        <Panel
          aside={<Badge variant='muted'>0</Badge>}
          className='lg:col-span-2 xl:col-span-1'
          eyebrow='Library'
          title='Template Library'
        >
          <EmptyState
            action={<Button disabled variant='ghost'>Import</Button>}
            description='Saved broadcast graphic templates will be listed here.'
            title='No templates yet'
          />
        </Panel>

        <section className='flex min-w-0 flex-col gap-3'>
          <Panel
            aside={<Badge variant='selected'>16:9</Badge>}
            className='min-h-[420px] border-ui-accent/30'
            contentClassName='flex min-h-[260px] items-center justify-center sm:min-h-[320px] lg:min-h-[356px]'
            eyebrow='Workspace'
            title='Preview Workspace'
          >
            <EmptyState
              description='Template output will render in this workspace once preview infrastructure is added.'
              title='Preview16x9 will appear here'
            />
          </Panel>

          <Panel
            aside={<Badge variant='active'>Ready</Badge>}
            contentClassName='flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3'
          >
            <span className='text-sm text-ui-secondary'>Status</span>
            <span className='text-sm text-ui-disabled'>No template loaded</span>
          </Panel>
        </section>

        <Panel
          aside={<Button disabled variant='ghost'>Reset</Button>}
          eyebrow='Inspector'
          title='Properties'
        >
          <EmptyState
            description='Element settings will appear in this panel.'
            title='Select a template element'
          />
        </Panel>
      </div>
    </main>
  )
}

export default App
