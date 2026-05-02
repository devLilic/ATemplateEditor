import { useEffect, useMemo, useState } from 'react'
import {
  addTemplate,
  createTemplateLibraryState,
  createAndAddTemplate,
  getSelectedTemplate,
  selectTemplate,
  updateTemplate,
} from '@/features/template-library'
import { exportTemplateToJson, importTemplateFromJson } from '@/features/export-import'
import {
  createTemplateEditorState,
  selectElement,
  selectLayer,
  updateElement,
  type TemplateEditorState,
} from '@/features/template-state'
import { EditableBindingsPanel } from './EditableBindingsPanel'
import { ElementPropertiesPanel } from './ElementPropertiesPanel'
import { OnAirMetadataPanel } from './OnAirMetadataPanel'
import { PreviewDataPanel } from './PreviewDataPanel'
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
  const [exportJson, setExportJson] = useState('')
  const [importJson, setImportJson] = useState('')
  const [importErrors, setImportErrors] = useState<Array<{ path: string; message: string }>>([])

  const selectedTemplate = getSelectedTemplate(libraryState)
  const [editorState, setEditorState] = useState<TemplateEditorState | undefined>(() =>
    selectedTemplate ? createTemplateEditorState(selectedTemplate) : undefined,
  )

  useEffect(() => {
    setEditorState(selectedTemplate ? createTemplateEditorState(selectedTemplate) : undefined)
  }, [selectedTemplate?.id])

  const selectedElement = useMemo(
    () =>
      editorState?.selectedElementId
        ? editorState.template.elements.find((element) => element.id === editorState.selectedElementId)
        : undefined,
    [editorState],
  )

  const handleElementChange = (elementId: string, patch: Parameters<typeof updateElement>[2]) => {
    setEditorState((currentState) => {
      if (!currentState) {
        return currentState
      }

      const nextState = updateElement(currentState, elementId, patch)

      if (nextState === currentState) {
        return currentState
      }

      setLibraryState((currentLibraryState) => {
        const currentTemplate = getSelectedTemplate(currentLibraryState)

        if (!currentTemplate) {
          return currentLibraryState
        }

        return updateTemplate(currentLibraryState, currentTemplate.id, () => nextState.template)
      })

      return nextState
    })
  }

  const handleTemplateChange = (nextTemplate: Parameters<typeof createTemplateEditorState>[0]) => {
    if (!selectedTemplate) {
      return
    }

    setLibraryState((currentLibraryState) =>
      updateTemplate(currentLibraryState, selectedTemplate.id, () => nextTemplate),
    )
    setEditorState((currentEditorState) => {
      if (!currentEditorState) {
        return createTemplateEditorState(nextTemplate)
      }

      return {
        ...currentEditorState,
        template: nextTemplate,
      }
    })
  }

  return (
    <main className='min-h-screen bg-ui-app text-ui-primary'>
      <header className='border-b border-ui-border bg-ui-app/95 px-4 py-4 backdrop-blur sm:px-5'>
        <div className='mx-auto flex min-h-[72px] max-w-[1600px] flex-col items-start justify-between gap-3 lg:flex-row lg:items-center'>
          <div className='min-w-0'>
            <div className='mb-2 flex flex-wrap items-center gap-2'>
              <Badge variant='muted'>Template workspace</Badge>
              <Badge variant='muted'>Basic UI</Badge>
            </div>
            <h1 className='m-0 text-xl font-semibold tracking-normal text-ui-primary sm:text-2xl'>
              ATemplateEditor
            </h1>
            <p className='m-0 mt-1 text-sm text-ui-secondary'>
              Template JSON editor for broadcast graphics
            </p>
          </div>
          <div className='flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto lg:shrink-0'>
            <Button
              className='w-full sm:w-auto'
              onClick={() => {
                if (!selectedTemplate) {
                  setExportJson('No template selected')
                  return
                }

                setExportJson(exportTemplateToJson(selectedTemplate))
              }}
              variant='neutral'
            >
              Export JSON
            </Button>
            <Button
              className='w-full sm:w-auto'
              onClick={() => {
                setLibraryState((currentState) => createAndAddTemplate(currentState))
                setImportErrors([])
              }}
              variant='accent'
            >
              New template
            </Button>
          </div>
        </div>
      </header>

      <div className='mx-auto grid min-h-[calc(100vh-112px)] max-w-[1600px] grid-cols-1 gap-4 p-4 lg:grid-cols-2 xl:grid-cols-[240px_minmax(0,1fr)_340px]'>
        <section className='order-2 flex min-h-0 min-w-0 flex-col gap-4 xl:order-1'>
          <Panel
            aside={
              <div className='flex items-center gap-2'>
                {selectedTemplate ? <Badge variant='selected'>Active template</Badge> : null}
                <Badge variant='muted'>{libraryState.templates.length}</Badge>
              </div>
            }
            className='overflow-hidden'
            eyebrow='Library'
            title='Template Library'
          >
            {libraryState.templates.length > 0 ? (
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
            ) : (
              <EmptyState
                description='Create a template or import JSON to start the workspace.'
                title='No templates'
              />
            )}

            <div className='mt-4 border-t border-ui-border pt-4'>
              <p className='mb-3 text-xs text-ui-secondary'>
                Import accepts raw template JSON and keeps the selected template in sync.
              </p>
              <label className='mb-2 block text-xs font-medium uppercase tracking-wide text-ui-secondary'>
                JSON input
              </label>
              <textarea
                aria-label='Import JSON'
                className='min-h-40 w-full rounded-md border border-ui-border bg-ui-card px-3 py-2 text-sm text-ui-primary outline-none'
                onChange={(event) => {
                  setImportJson(event.target.value)
                }}
                placeholder='Paste template JSON here'
                value={importJson}
              />
              <div className='mt-2 flex items-center gap-2'>
                <Button
                  className='w-full sm:w-auto'
                  onClick={() => {
                    const result = importTemplateFromJson(importJson)

                    if (result.status === 'error') {
                      setImportErrors(result.errors)
                      return
                    }

                    setImportErrors([])
                    setLibraryState((currentState) => {
                      const nextState = addTemplate(currentState, result.template)
                      return selectTemplate(nextState, result.template.id)
                    })
                  }}
                  variant='neutral'
                >
                  Import JSON
                </Button>
              </div>
              {importErrors.length > 0 ? (
                <ul className='mt-3 space-y-1 text-sm text-ui-danger'>
                  {importErrors.map((error, index) => (
                    <li key={`${error.path}-${index}`}>
                      {error.path}: {error.message}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </Panel>

          <Panel
            aside={
              <div className='flex items-center gap-2'>
                {editorState?.selectedLayerId ? <Badge variant='selected'>Active layer</Badge> : null}
                <Badge variant='selected'>{selectedTemplate?.layers.length ?? 0}</Badge>
              </div>
            }
            className='overflow-hidden'
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
                    <div key={layer.id} className='rounded-md border border-ui-border bg-ui-card/35 p-2.5'>
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
                title='No layers'
              />
            )}
          </Panel>
        </section>

        <section className='order-1 min-w-0 lg:col-span-2 xl:order-2 xl:col-span-1'>
          <Panel
            aside={<Badge variant='selected'>16:9</Badge>}
            className='border-ui-accent/30 shadow-[0_0_0_1px_rgba(34,211,238,0.08),0_18px_48px_rgba(0,0,0,0.28)]'
            contentClassName='flex min-h-[340px] items-start justify-start sm:min-h-[420px] sm:justify-center lg:min-h-[560px] xl:min-h-[720px]'
            eyebrow='Workspace'
            title='Preview'
          >
            {selectedTemplate ? (
              <div className='flex w-full flex-col gap-4'>
                <div className='w-full overflow-x-auto rounded-lg border border-ui-border bg-ui-card/25 p-3 sm:p-4'>
                  <PreviewCanvas
                    height={540}
                    template={selectedTemplate}
                    width={960}
                  />
                </div>
                <div className='rounded-lg border border-ui-border bg-ui-card/20 p-3'>
                  <label className='mb-2 block text-xs font-medium uppercase tracking-wide text-ui-secondary'>
                    Exported JSON
                  </label>
                  <textarea
                    aria-label='Exported JSON'
                    className='min-h-40 w-full rounded-md border border-ui-border bg-ui-card px-3 py-2 font-mono text-xs text-ui-primary outline-none'
                    readOnly
                    value={exportJson}
                  />
                </div>
              </div>
            ) : (
              <EmptyState
                description='Create or select a template to render its preview.'
                title='No template selected'
              />
            )}
          </Panel>
        </section>

        <section className='order-3 flex min-h-0 min-w-0 flex-col gap-4 lg:col-span-2 xl:col-span-1'>
          <Panel
            aside={
              selectedElement ? (
                <div className='flex items-center gap-2'>
                  <Badge variant='selected'>Selected element</Badge>
                  <Badge variant='muted'>{selectedElement.kind}</Badge>
                </div>
              ) : undefined
            }
            className='overflow-hidden'
            eyebrow='Inspector'
            title='Properties'
          >
            <ElementPropertiesPanel
              element={selectedElement}
              onElementChange={handleElementChange}
            />
          </Panel>

          <Panel className='overflow-hidden' eyebrow='Data' title='Preview data'>
            {selectedTemplate ? (
              <PreviewDataPanel
                onTemplateChange={handleTemplateChange}
                template={selectedTemplate}
              />
            ) : (
              <EmptyState
                description='Select a template to inspect preview, fallback and resolved values.'
                title='No editable fields yet'
              />
            )}
          </Panel>

          <Panel className='overflow-hidden' eyebrow='Bindings' title='Editable fields & bindings'>
            {selectedTemplate ? (
              <EditableBindingsPanel
                onTemplateChange={handleTemplateChange}
                template={selectedTemplate}
              />
            ) : (
              <EmptyState
                description='Select a template to manage editable labels and field bindings.'
                title='No editable fields yet'
              />
            )}
          </Panel>

          <Panel className='overflow-hidden' eyebrow='OnAir' title='OnAir metadata'>
            {selectedTemplate ? (
              <OnAirMetadataPanel
                onTemplateChange={handleTemplateChange}
                template={selectedTemplate}
              />
            ) : (
              <EmptyState
                description='Select a template to inspect runtime metadata.'
                title='No template selected'
              />
            )}
          </Panel>
        </section>
      </div>
    </main>
  )
}

export default TemplateEditorShell
