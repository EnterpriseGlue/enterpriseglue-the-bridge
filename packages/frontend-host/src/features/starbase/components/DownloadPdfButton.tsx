import React from 'react'
import { Button } from '@carbon/react'
import { DocumentPdf } from '@carbon/icons-react'
import {
  canExportDiagram,
  exportDiagramAsPdf,
  toDownloadBaseName,
} from '../utils/exportDiagram'

interface DownloadPdfButtonProps {
  modeler: any | null
  fileName?: string | null
  fileType?: string | null
  /** Kind passed to Carbon Button. Defaults to 'ghost'. */
  kind?: 'ghost' | 'tertiary' | 'secondary' | 'primary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  /** Optional toast handler. Called with a human-readable failure message. */
  onExportError?: (message: string) => void
  /** Inline style passthrough for header layouts. */
  style?: React.CSSProperties
  /**
   * If true, render only the icon (used inside compact toolbars). Defaults
   * to `false` so the header button shows the icon + "PDF" label.
   */
  iconOnly?: boolean
}

/**
 * Shared "Download as PDF" action. Derives the filename from the current
 * Starbase file name via the shared filename helper, disables itself when
 * the active viewer is not exportable (e.g. DMN decision tables), and
 * surfaces a toast on failure when a handler is provided.
 */
export default function DownloadPdfButton({
  modeler,
  fileName,
  fileType,
  kind = 'ghost',
  size = 'sm',
  onExportError,
  style,
  iconOnly = false,
}: DownloadPdfButtonProps) {
  const [exporting, setExporting] = React.useState(false)

  const enabled = canExportDiagram(modeler) && !exporting
  const iconDescription = canExportDiagram(modeler)
    ? 'Download as PDF'
    : 'PDF download is only available for BPMN diagrams and DMN DRDs.'

  const handleClick = React.useCallback(async () => {
    if (!modeler || exporting) return
    setExporting(true)
    try {
      const baseName = toDownloadBaseName(fileName)
      await exportDiagramAsPdf(modeler, { baseName, type: fileType ?? null })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to export diagram as PDF.'
      if (onExportError) {
        onExportError(message)
      } else if (typeof console !== 'undefined' && console?.warn) {
        console.warn('[DownloadPdfButton] PDF export failed:', message)
      }
    } finally {
      setExporting(false)
    }
  }, [modeler, exporting, fileName, fileType, onExportError])

  if (iconOnly) {
    return (
      <Button
        hasIconOnly
        size={size}
        kind={kind}
        renderIcon={DocumentPdf}
        iconDescription={iconDescription}
        onClick={handleClick}
        disabled={!enabled}
        style={style}
      />
    )
  }

  return (
    <Button
      size={size}
      kind={kind}
      renderIcon={DocumentPdf}
      onClick={handleClick}
      disabled={!enabled}
      style={style}
    >
      {exporting ? 'Exporting…' : 'PDF'}
    </Button>
  )
}
