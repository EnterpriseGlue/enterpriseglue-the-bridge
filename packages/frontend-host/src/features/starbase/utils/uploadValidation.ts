import { QueryClient } from '@tanstack/react-query'
import { apiClient } from '../../../shared/api/client'
import { parseApiError } from '../../../shared/api/apiErrorUtils'

function toXmlText(xml: Document | string): string {
  if (typeof xml === 'string') return xml
  return new XMLSerializer().serializeToString(xml)
}

function extractRootTagName(xmlText: string): string | null {
  const withoutComments = xmlText.replace(/<!--[\s\S]*?-->/g, '')
  const withoutDeclaration = withoutComments.replace(/^\s*<\?xml[\s\S]*?\?>\s*/i, '')
  const openTag = withoutDeclaration.match(/^<([A-Za-z_][\w.-]*(?::[A-Za-z_][\w.-]*)?)(\s[^>]*)?(\/?)>/)
  if (!openTag) return null

  const rootTag = openTag[1]
  const isSelfClosing = openTag[3] === '/'
  if (isSelfClosing) return rootTag.toLowerCase()

  const escapedRootTag = rootTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const closeTagPattern = new RegExp(`<\\s*\\/\\s*${escapedRootTag}\\s*>`, 'i')
  return closeTagPattern.test(withoutDeclaration) ? rootTag.toLowerCase() : null
}

export function detectCamundaEngine(xml: Document | string) {
  const xmlText = toXmlText(xml)
  const hasZeebeNs = /xmlns(?::[A-Za-z_][\w.-]*)?\s*=\s*['"][^'"]*zeebe[^'"]*['"]/i.test(xmlText)
  const hasZeebeElements = /<\s*(?:[A-Za-z_][\w.-]*:)?(?:taskDefinition|ioMapping)\b/i.test(xmlText)
  const hasZeebePrefix = /<\s*zeebe:(?:taskDefinition|ioMapping)\b/i.test(xmlText)
  const isCamunda8 = hasZeebeNs || hasZeebeElements || hasZeebePrefix
  const isCamunda7 = !isCamunda8
  return { isCamunda7, isCamunda8 }
}

export async function validateAndUploadFile(params: {
  file: File
  projectId: string
  folderId: string | null
  queryClient: QueryClient
  showToast: (t: { kind: 'success' | 'error'; title: string; subtitle?: string }) => void
}): Promise<void> {
  const { file, projectId, folderId, queryClient, showToast } = params
  if (!projectId) return

  const name = file.name.toLowerCase()
  if (!name.endsWith('.bpmn') && !name.endsWith('.dmn')) {
    showToast({ kind: 'error', title: 'Upload failed', subtitle: 'Only .bpmn and .dmn files are supported.' })
    return
  }

  let text: string
  try {
    text = await file.text()
  } catch {
    showToast({ kind: 'error', title: 'Upload failed', subtitle: 'Could not read file contents.' })
    return
  }

  const rootTag = extractRootTagName(text)
  if (!rootTag) {
    showToast({ kind: 'error', title: 'Upload failed', subtitle: 'File is not valid XML.' })
    return
  }

  const isDefinitionsRoot = rootTag.endsWith('definitions')
  const isBpmn = isDefinitionsRoot && (text.includes('spec/BPMN') || text.includes('bpmn:definitions'))
  const isDmn = isDefinitionsRoot && (text.includes('spec/DMN') || text.includes('dmn:definitions'))
  if (!isBpmn && !isDmn) {
    showToast({ kind: 'error', title: 'Upload failed', subtitle: 'File is not a BPMN or DMN definition.' })
    return
  }

  const engine = detectCamundaEngine(text)
  if (engine.isCamunda8) {
    showToast({ kind: 'error', title: 'Upload failed', subtitle: 'Camunda 8 / Zeebe diagrams are not supported. Please upload a Camunda 7 BPMN/DMN file.' })
    return
  }

  try {
    const payload = {
      type: isDmn ? 'dmn' : 'bpmn',
      name: file.name,
      folderId,
      xml: text,
    }
    try {
      await apiClient.post(`/starbase-api/projects/${encodeURIComponent(projectId)}/files`, payload)
    } catch (error) {
      const parsed = parseApiError(error, 'Upload failed')
      if (parsed.status === 409) {
        showToast({ kind: 'error', title: 'Upload failed', subtitle: 'A file with this name already exists in this folder.' })
        return
      }
      throw error
    }
    queryClient.invalidateQueries({ queryKey: ['contents', projectId, folderId] })
    showToast({ kind: 'success', title: 'File uploaded', subtitle: file.name })
  } catch {
    showToast({ kind: 'error', title: 'Upload failed', subtitle: 'Could not upload file. Please try again.' })
  }
}
