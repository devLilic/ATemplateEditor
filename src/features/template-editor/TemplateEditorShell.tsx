import { useEffect, useMemo, useState } from 'react'
import {
  createTemplateLibraryState,
  createAndAddTemplate,
  getSelectedTemplate,
  selectTemplate,
} from '@/features/template-library'
import {
  createTemplateEditorState,
  selectElement,
  selectLayer,
  type TemplateEditorState,
} from '@/features/template-state'
import { PreviewCanvas } from '@/shared/preview16x9'
import { createDefaultTemplate } from '@/shared/template-contract/templateDefaults'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Panel } from '@/shared/ui/Panel'

export function TemplateEditorShell() {
  const [libraryState, setLibraryState] = useState(() =>
    createTemplateLibraryState({
      templates: [createDefaultTemplate()],
    }),
  )

  const selectedTemplate = getSelectedTemplate(libraryState)
  const [editorState, setEditorState] = useState<TemplateEditorState | undefined>(() =>
    selectedTemplate ? createTemplateEditorState(selectedTemplate) : undefined,
  )

  useEffect(() => {
    setEditorState(selectedTemplate ? createTemplateEditorState(selectedTemplate) : undefined)
  }, [selectedTemplate])

  const selectedElement = useMemo(
    () =>
      editorState?.selectedElementId
        ? editorState.template.elements.find((element) => element.id === editorState.selectedElementId)
        : undefined,
    [editorState],
  )

  return (
    <main className='min-h-screen bg-ui-app text-ui-primary'>
      <header className='flex min-h-[72px] flex-col items-start justify-between gap-3 border-b border-ui-border bg-ui-app/95 px-4 py-4 sm:flex-row sm:items-center sm:px-5'>
        <div className='min-w-0'>
          <h1 className='m-0 text-xl font-semibold tracking-normal text-ui-primary'>ATemplateEditor</h1>
          <p className='m-0 mt-1 text-sm text-ui-secondary'>Template JSON editor for broadcast graphics</p>
        </div>
        <div className='flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0'>
          <Badge variant='muted'>Basic UI</Badge>
          <Button
            onClick={() => {
              setLibraryState((currentState) => createAndAddTemplate(currentState))
            }}
            variant='accent'
          >
            New template
          </Button>
        </div>
      </header>

      <div className='grid min-h-[calc(100vh-112px)] grid-cols-1 gap-3 p-3 lg:grid-cols-[240px_minmax(0,1fr)_240px] xl:grid-cols-[260px_minmax(0,1fr)_280px]'>
        <Panel
          aside={<Badge variant='muted'>{libraryState.templates.length}</Badge>}
          eyebrow='Library'
          title='Template Library'
        >
          <div className='flex flex-col gap-2' role='listbox' aria-label='Template Library'>
            {libraryState.templates.map((template) => {
              const isSelected = template.id === libraryState.selectedTemplateId

              return (
                <Button
                  data-selected={isSelected ? 'true' : undefined}
                  key={template.id}
                  aria-selected={isSelected}
                  className='w-full justify-start'
                  onClick={() => {
                    setLibraryState((currentState) => selectTemplate(currentState, template.id))
                  }}
                  variant={isSelected ? 'selected' : 'neutral'}
                >
                  {template.name}
                </Button>
              )
            })}
          </div>
        </Panel>

        <section className='grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-[220px_minmax(0,1fr)]'>
          <Panel
            aside={<Badge variant='selected'>{selectedTemplate?.layers.length ?? 0}</Badge>}
            eyebrow='Structure'
            title='Layers'
          >
            {editorState && editorState.template.layers.length > 0 ? (
              <div className='flex flex-col gap-2' role='listbox' aria-label='Layers'>
                {editorState.template.layers.map((layer) => {
                  const isSelected = layer.id === editorState.selectedLayerId
                  const layerElements = editorState.template.elements.filter(
                    (element) => element.layerId === layer.id,
                  )

                  return (
                    <div key={layer.id} className='rounded-md border border-ui-border bg-ui-card/35 p-2'>
                      <Button
                        data-selected={isSelected ? 'true' : undefined}
                        aria-selected={isSelected}
                        className='w-full justify-start'
                        onClick={() => {
                          setEditorState((currentState) =>
                            currentState ? selectLayer(currentState, layer.id) : currentState,
                          )
                        }}
                        variant={isSelected ? 'selected' : 'neutral'}
                      >
                        {layer.name}
                      </Button>

                      <div className='mt-2 flex flex-col gap-1 pl-3' role='list' aria-label={`${layer.name} elements`}>
                        {layerElements.length > 0 ? (
                          layerElements.map((element) => {
                            const isElementSelected = element.id === editorState.selectedElementId

                            return (
                              <Button
                                key={element.id}
                                data-selected={isElementSelected ? 'true' : undefined}
                                aria-selected={isElementSelected}
                                className='w-full justify-start'
                                onClick={() => {
                                  setEditorState((currentState) =>
                                    currentState ? selectElement(currentState, element.id) : currentState,
                                  )
                                }}
                                variant={isElementSelected ? 'selected' : 'ghost'}
                              >
                                {element.name}
                              </Button>
                            )
                          })
                        ) : (
                          <span className='px-3 py-1 text-sm text-ui-disabled'>No elements</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <EmptyState
                description='Layers for the active template will appear here.'
                title='No layers yet'
              />
            )}
          </Panel>

          <Panel
            aside={<Badge variant='selected'>16:9</Badge>}
            className='border-ui-accent/30'
            contentClassName='flex min-h-[320px] items-center justify-center'
            eyebrow='Workspace'
            title='Preview'
          >
            {selectedTemplate ? (
              <PreviewCanvas
                height={540}
                template={selectedTemplate}
                width={960}
              />
            ) : (
              <EmptyState
                description='Create or select a template to render its preview.'
                title='No template selected'
              />
            )}
          </Panel>
        </section>

        <Panel
          aside={selectedElement ? <Badge variant='selected'>Selected</Badge> : undefined}
          eyebrow='Inspector'
          title='Properties'
        >
          {selectedElement ? (
            <div className='flex flex-col gap-2'>
              <span className='text-xs font-semibold uppercase text-ui-accent'>Selected element</span>
              <span className='text-sm text-ui-primary'>{selectedElement.name}</span>
              <span className='text-sm text-ui-secondary'>{selectedElement.kind}</span>
            </div>
          ) : (
            <EmptyState title='Select an element to edit properties' />
          )}
        </Panel>
      </div>
    </main>
  )
}

export default TemplateEditorShell
