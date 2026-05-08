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
  duplicateLayer,
  removeLayer,
  selectElement,
  selectLayer,
  updateLayer,
  updateElement,
  type TemplateEditorState,
} from '@/features/template-state'
import { EditableBindingsPanel } from './EditableBindingsPanel'
import { ElementPropertiesPanel } from './ElementPropertiesPanel'
import { AssetsPanel } from './AssetsPanel'
import { LayersPanel } from './LayersPanel'
import { OnAirMetadataPanel } from './OnAirMetadataPanel'
import { PreviewDataPanel } from './PreviewDataPanel'
import { TemplateSettingsPanel } from './TemplateSettingsPanel'
import { PreviewCanvas } from '@/shared/preview16x9'
import { createDefaultTemplate } from '@/shared/template-contract/templateDefaults'
import { validateTemplate } from '@/shared/validation/templateValidation'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Panel } from '@/shared/ui/Panel'
import { FormSection, FormSelect } from './TemplateEditorFormPrimitives'

type InspectorTabId = 'inspector' | 'data' | 'bindings' | 'onair'
type LeftSidebarTabId = 'template' | 'assets' | 'library' | 'layers'

const inspectorTabs: Array<{ id: InspectorTabId; label: string }> = [
  { id: 'inspector', label: 'Inspector' },
  { id: 'data', label: 'Data' },
  { id: 'bindings', label: 'Bindings' },
  { id: 'onair', label: 'OnAir' },
]

const leftSidebarTabs: Array<{ id: LeftSidebarTabId; label: string }> = [
  { id: 'template', label: 'Template' },
  { id: 'assets', label: 'Assets' },
  { id: 'library', label: 'Library' },
  { id: 'layers', label: 'Layers' },
]

export function TemplateEditorShell() {
  const [libraryState, setLibraryState] = useState(() =>
    createTemplateLibraryState({
      templates: [createDefaultTemplate()],
    }),
  )
  const [activeInspectorTab, setActiveInspectorTab] = useState<InspectorTabId>('inspector')
  const [activeLeftSidebarTab, setActiveLeftSidebarTab] = useState<LeftSidebarTabId>('library')
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
  const selectedLayer = useMemo(
    () =>
      editorState?.selectedLayerId
        ? editorState.template.layers.find((layer) => layer.id === editorState.selectedLayerId)
        : undefined,
    [editorState],
  )
  const activeTemplate = editorState?.template ?? selectedTemplate
  const draftValidation = useMemo(
    () => (activeTemplate ? validateTemplate(activeTemplate, { mode: 'draft' }) : undefined),
    [activeTemplate],
  )
  const finalExportValidation = useMemo(
    () => (activeTemplate ? validateTemplate(activeTemplate, { mode: 'finalExport' }) : undefined),
    [activeTemplate],
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
    <main
      className='h-screen w-screen overflow-hidden bg-ui-app text-ui-primary'
      data-testid='template-workspace'
    >
      <div className='grid h-full w-full grid-cols-1 gap-4 p-4 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_360px]'>
        <section className='order-2 flex min-h-0 min-w-0 flex-col gap-4 lg:order-1'>
          <Panel
            aside={<Badge className='w-fit' variant='muted'>Template workspace</Badge>}
            className='overflow-hidden'
            eyebrow='Workspace'
            title='Left panel'
          >
            <div className='mb-4 flex flex-wrap gap-2 border-b border-ui-border pb-4'>
              {leftSidebarTabs.map((tab) => (
                <Button
                  key={tab.id}
                  aria-selected={activeLeftSidebarTab === tab.id}
                  data-selected={activeLeftSidebarTab === tab.id ? 'true' : undefined}
                  onClick={() => {
                    setActiveLeftSidebarTab(tab.id)
                  }}
                  variant={activeLeftSidebarTab === tab.id ? 'selected' : 'ghost'}
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            {selectedLayer ? (
              <div className='mb-4'>
                <Button
                  aria-selected='true'
                  className='w-full justify-start'
                  data-selected='true'
                  onClick={() => {
                    setActiveLeftSidebarTab('layers')
                  }}
                  variant='selected'
                >
                  {selectedLayer.name}
                </Button>
              </div>
            ) : null}

            {activeLeftSidebarTab === 'template' ? (
              selectedTemplate ? (
                <TemplateSettingsPanel
                  onTemplateChange={handleTemplateChange}
                  template={selectedTemplate}
                />
              ) : (
                <EmptyState
                  description='Select a template to edit its identity and metadata.'
                  title='No template selected'
                />
              )
            ) : null}

            {activeLeftSidebarTab === 'assets' ? (
              selectedTemplate ? (
                <AssetsPanel
                  onTemplateChange={handleTemplateChange}
                  selectedElementId={editorState?.selectedElementId}
                  template={selectedTemplate}
                />
              ) : (
                <EmptyState
                  description='Select a template to upload and assign image assets.'
                  title='No template selected'
                />
              )
            ) : null}

            {activeLeftSidebarTab === 'library' ? (
              <>
                <div className='mb-4 text-sm font-semibold text-ui-primary'>Template Library</div>
                <div className='mb-4 flex flex-col gap-2 border-b border-ui-border pb-4'>
                  <div className='flex items-center gap-2'>
                    {selectedTemplate ? <Badge variant='selected'>Active template</Badge> : null}
                    <Badge variant='muted'>{libraryState.templates.length}</Badge>
                  </div>
                  <div className='flex flex-col gap-2'>
                    <Button
                      onClick={() => {
                        setLibraryState((currentState) => createAndAddTemplate(currentState))
                        setImportErrors([])
                      }}
                      variant='accent'
                    >
                      Create template
                    </Button>
                    <Button
                      disabled={Boolean(finalExportValidation && finalExportValidation.errors.length > 0)}
                      onClick={() => {
                        if (!activeTemplate) {
                          setExportJson('No template selected')
                          return
                        }

                        if (finalExportValidation && finalExportValidation.errors.length > 0) {
                          setExportJson('Export blocked by final export validation errors.')
                          return
                        }

                        setExportJson(exportTemplateToJson(activeTemplate))
                      }}
                      variant='neutral'
                    >
                      Export JSON
                    </Button>
                  </div>
                </div>

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
              </>
            ) : null}

            {activeLeftSidebarTab === 'layers' ? (
              <>
                <div className='mb-4 flex items-center gap-2'>
                  {editorState?.selectedLayerId ? <Badge variant='selected'>Active layer</Badge> : null}
                  <Badge variant='selected'>{selectedTemplate?.layers.length ?? 0}</Badge>
                </div>

                {editorState && editorState.template.layers.length > 0 ? (
                  <div className='flex flex-col gap-4'>
                    <LayersPanel
                      onDuplicateLayer={(layerId) => {
                        setEditorState((currentState) => {
                          if (!currentState) {
                            return currentState
                          }

                          const nextTemplate = duplicateLayer(currentState.template, layerId)

                          if (nextTemplate === currentState.template) {
                            return currentState
                          }

                          const nextState = {
                            ...currentState,
                            template: nextTemplate,
                          }

                          setLibraryState((currentLibraryState) => {
                            const currentTemplate = getSelectedTemplate(currentLibraryState)

                            if (!currentTemplate) {
                              return currentLibraryState
                            }

                            return updateTemplate(
                              currentLibraryState,
                              currentTemplate.id,
                              () => nextTemplate,
                            )
                          })

                          return nextState
                        })
                      }}
                      onDeleteLayer={(layerId) => {
                        setEditorState((currentState) => {
                          if (!currentState) {
                            return currentState
                          }

                          const nextState = removeLayer(currentState, layerId)

                          if (nextState === currentState) {
                            return currentState
                          }

                          setLibraryState((currentLibraryState) => {
                            const currentTemplate = getSelectedTemplate(currentLibraryState)

                            if (!currentTemplate) {
                              return currentLibraryState
                            }

                            return updateTemplate(
                              currentLibraryState,
                              currentTemplate.id,
                              () => nextState.template,
                            )
                          })

                          return nextState
                        })
                      }}
                      onSelectLayer={(layerId) => {
                        setEditorState((currentState) =>
                          currentState ? selectLayer(currentState, layerId) : currentState,
                        )
                      }}
                      onTemplateChange={handleTemplateChange}
                      selectedLayerId={editorState.selectedLayerId}
                      template={editorState.template}
                    />

                    <div className='rounded-md border border-ui-border bg-ui-card/20 p-3'>
                      <div className='mb-2 text-[11px] font-semibold uppercase tracking-normal text-ui-disabled'>
                        Elements
                      </div>
                      <div className='flex flex-col gap-2'>
                        {editorState.template.layers
                          .slice()
                          .sort((left, right) => right.zIndex - left.zIndex)
                          .map((layer) => {
                            const layerElements = editorState.template.elements.filter(
                              (element) => element.layerId === layer.id,
                            )

                            return (
                              <div key={layer.id}>
                                <div className='mb-1 text-xs font-medium text-ui-secondary'>{layer.name}</div>
                                <div className='flex flex-col gap-1 pl-3' role='list' aria-label={`${layer.name} elements`}>
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
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    description='Layers for the active template will appear here.'
                    title='No layers'
                  />
                )}
              </>
            ) : null}
          </Panel>
        </section>

        <section className='order-1 min-w-0 lg:order-2 xl:order-2'>
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
                    template={activeTemplate ?? selectedTemplate}
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
                {draftValidation ? (
                  <div className='rounded-lg border border-ui-border bg-ui-card/20 p-3' data-testid='validation-panel'>
                    <div className='mb-3 flex flex-wrap items-center gap-2'>
                      <span className='text-xs font-medium uppercase tracking-wide text-ui-secondary'>
                        Draft validation
                      </span>
                      <Badge variant={draftValidation.errors.length > 0 ? 'danger' : 'active'}>
                        {draftValidation.errors.length} errors
                      </Badge>
                      <Badge variant={draftValidation.warnings.length > 0 ? 'warning' : 'muted'}>
                        {draftValidation.warnings.length} warnings
                      </Badge>
                      {finalExportValidation?.errors.length ? (
                        <Badge variant='danger'>Final export blocked</Badge>
                      ) : (
                        <Badge variant='active'>Final export ready</Badge>
                      )}
                    </div>

                    {draftValidation.errors.length === 0 && draftValidation.warnings.length === 0 ? (
                      <p className='text-sm text-ui-secondary'>No draft validation issues.</p>
                    ) : (
                      <div className='space-y-3'>
                        {draftValidation.errors.length > 0 ? (
                          <div>
                            <div className='mb-1 text-[11px] font-semibold uppercase tracking-wide text-ui-danger'>
                              Errors
                            </div>
                            <ul className='space-y-1 text-sm text-ui-danger'>
                              {draftValidation.errors.map((issue, index) => (
                                <li key={`draft-error-${issue.path}-${index}`}>
                                  <span className='font-mono'>{issue.path}</span>: {issue.message}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {draftValidation.warnings.length > 0 ? (
                          <div>
                            <div className='mb-1 text-[11px] font-semibold uppercase tracking-wide text-ui-warning'>
                              Warnings
                            </div>
                            <ul className='space-y-1 text-sm text-ui-warning'>
                              {draftValidation.warnings.map((issue, index) => (
                                <li key={`draft-warning-${issue.path}-${index}`}>
                                  <span className='font-mono'>{issue.path}</span>: {issue.message}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            ) : (
              <EmptyState
                description='Create or select a template to render its preview.'
                title='No template selected'
              />
            )}
          </Panel>
        </section>

        <section className='order-3 flex min-h-0 min-w-0 flex-col gap-4 lg:col-span-2 xl:col-span-1 xl:order-3'>
          <Panel
            aside={
              activeInspectorTab === 'inspector' && selectedElement ? (
                <div className='flex items-center gap-2'>
                  <Badge variant='selected'>Selected element</Badge>
                  <Badge variant='muted'>{selectedElement.kind}</Badge>
                </div>
              ) : activeInspectorTab === 'onair' ? (
                <Badge variant='muted'>Metadata</Badge>
              ) : undefined
            }
            className='overflow-hidden'
            eyebrow='Workspace'
            title='Inspector'
          >
            <div className='mb-4 flex flex-wrap gap-2 border-b border-ui-border pb-4'>
              {inspectorTabs.map((tab) => (
                <Button
                  key={tab.id}
                  aria-selected={activeInspectorTab === tab.id}
                  data-selected={activeInspectorTab === tab.id ? 'true' : undefined}
                  onClick={() => {
                    setActiveInspectorTab(tab.id)
                  }}
                  variant={activeInspectorTab === tab.id ? 'selected' : 'ghost'}
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            {activeInspectorTab === 'inspector' ? (
              <div className='flex flex-col gap-4'>
                {selectedLayer ? (
                  <FormSection
                    description='Rule-based layer visibility for previewed data.'
                    title='Layer visibility'
                  >
                    <FormSelect
                      label='visibility mode'
                      onChange={(event) => {
                        if (!editorState) {
                          return
                        }

                        const mode = event.currentTarget.value as typeof selectedLayer.visibility.mode
                        const nextState = updateLayer(editorState, selectedLayer.id, {
                          visibility: {
                            ...selectedLayer.visibility,
                            mode,
                            fieldId: mode === 'always' ? undefined : selectedLayer.visibility.fieldId,
                          },
                        })

                        setEditorState(nextState)
                        setLibraryState((currentLibraryState) => {
                          const currentTemplate = getSelectedTemplate(currentLibraryState)

                          if (!currentTemplate) {
                            return currentLibraryState
                          }

                          return updateTemplate(
                            currentLibraryState,
                            currentTemplate.id,
                            () => nextState.template,
                          )
                        })
                      }}
                      value={selectedLayer.visibility.mode}
                    >
                      <option value='always'>always</option>
                      <option value='whenFieldHasValue'>whenFieldHasValue</option>
                    </FormSelect>

                    <FormSelect
                      label='field'
                      onChange={(event) => {
                        if (!editorState || selectedLayer.visibility.mode !== 'whenFieldHasValue') {
                          return
                        }

                        const nextState = updateLayer(editorState, selectedLayer.id, {
                          visibility: {
                            ...selectedLayer.visibility,
                            fieldId: event.currentTarget.value || undefined,
                          },
                        })

                        setEditorState(nextState)
                        setLibraryState((currentLibraryState) => {
                          const currentTemplate = getSelectedTemplate(currentLibraryState)

                          if (!currentTemplate) {
                            return currentLibraryState
                          }

                          return updateTemplate(
                            currentLibraryState,
                            currentTemplate.id,
                            () => nextState.template,
                          )
                        })
                      }}
                      value={selectedLayer.visibility.fieldId ?? ''}
                    >
                      <option value=''>No field</option>
                      {editorState?.template.fields.map((field) => (
                        <option key={field.id} value={field.id}>
                          {field.label}
                        </option>
                      ))}
                    </FormSelect>
                  </FormSection>
                ) : null}

                <ElementPropertiesPanel
                  element={selectedElement}
                  onElementChange={handleElementChange}
                />
              </div>
            ) : null}

            {activeInspectorTab === 'data' ? (
              selectedTemplate ? (
                <PreviewDataPanel
                  onTemplateChange={handleTemplateChange}
                  template={selectedTemplate}
                />
              ) : (
                <EmptyState
                  description='Select a template to inspect preview, fallback and resolved values.'
                  title='No editable fields yet'
                />
              )
            ) : null}

            {activeInspectorTab === 'bindings' ? (
              selectedTemplate ? (
                <EditableBindingsPanel
                  onTemplateChange={handleTemplateChange}
                  template={selectedTemplate}
                />
              ) : (
                <EmptyState
                  description='Select a template to manage editable labels and field bindings.'
                  title='No editable fields yet'
                />
              )
            ) : null}

            {activeInspectorTab === 'onair' ? (
              selectedTemplate ? (
                <OnAirMetadataPanel
                  onTemplateChange={handleTemplateChange}
                  template={selectedTemplate}
                />
              ) : (
                <EmptyState
                  description='Select a template to inspect runtime metadata.'
                  title='No template selected'
                />
              )
            ) : null}
          </Panel>
        </section>
      </div>
    </main>
  )
}

export default TemplateEditorShell
