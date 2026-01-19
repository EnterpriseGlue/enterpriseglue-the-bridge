import React from 'react'
import DmnViewer from 'dmn-js/lib/Viewer'
import ZoomScrollModule from 'diagram-js/lib/navigation/zoomscroll'
import MoveCanvasModule from 'diagram-js/lib/navigation/movecanvas'
import { Button } from '@carbon/react'
import { FitToScreen, Add, Subtract } from '@carbon/icons-react'
import 'camunda-dmn-js/dist/assets/camunda-platform-modeler.css'

type DMNDrdMiniProps = {
  xml: string
  preferDecisionTable?: boolean
  decisionId?: string
  decisionName?: string
  /** Optional list of decision rule IDs to highlight in the decision table view (rows hit by evaluation). */
  hitRuleIds?: string[]
}

export default function DMNDrdMini({ xml, preferDecisionTable, decisionId, decisionName, hitRuleIds }: DMNDrdMiniProps) {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const viewerRef = React.useRef<any | null>(null)
  const [hasCanvas, setHasCanvas] = React.useState(false)

  React.useEffect(() => {
    if (!ref.current) return
    const v = new DmnViewer({
      container: ref.current,
      drd: {
        additionalModules: [ZoomScrollModule, MoveCanvasModule],
      },
    })
    viewerRef.current = v
    return () => { try { v.destroy() } catch {} viewerRef.current = null }
  }, [])

  React.useEffect(() => {
    const v = viewerRef.current
    if (!v || !xml) return
    v.importXML(xml).then(() => {
      try {
        const views = v.getViews()
        let target: any = null

        if (preferDecisionTable) {
          const candidates = views.filter((vw: any) => vw.type === 'decisionTable')
          if (decisionId) target = candidates.find((vw: any) => vw?.element?.id === decisionId)
          if (!target && decisionName) target = candidates.find((vw: any) => vw?.element?.name === decisionName)
          if (!target) target = candidates[0] || null
        }
        if (!target) {
          // fallback to DRD or first view
          target = views.find((vw: any) => vw.type === 'drd') || views[0] || null
        }
        if (target) {
          // Show zoom controls only for DRD view; decision tables just scroll
          setHasCanvas(target.type === 'drd')

          v.open(target)
            .then(() => {
              if (target.type !== 'drd') return
              try {
                const canvas = v.getActiveViewer().get('canvas')
                if (!canvas) return
                // Center and fit to viewport
                canvas.zoom('fit-viewport')
                // Small delay to ensure layout is complete, then re-center
                setTimeout(() => {
                  try {
                    canvas.zoom('fit-viewport')
                  } catch {}
                }, 50)
              } catch {}
            })
            .catch(() => {
              // keep hasCanvas state as previously set; zoom controls will just no-op
            })
        } else {
          setHasCanvas(false)
        }
      } catch {}
    }).catch(() => {})
  }, [xml, preferDecisionTable, decisionId, decisionName])

  // Helper function to style the View DRD/View Table button
  const styleViewButton = React.useCallback(() => {
    const container = ref.current
    if (!container) return
    
    setTimeout(() => {
      try {
        const allButtons = container.querySelectorAll('button')
        allButtons.forEach((btn) => {
          if (btn.textContent?.includes('View DRD') || btn.textContent?.includes('View Table')) {
            const parent = btn.parentElement as HTMLElement
            if (parent) {
              parent.style.position = 'absolute'
              parent.style.top = '25px'
              parent.style.right = '25px'
              parent.style.left = 'auto'
              parent.style.zIndex = '100'
            }
            const button = btn as HTMLElement
            button.style.height = '54px'
            button.style.padding = '0 20px'
            button.style.backgroundColor = 'var(--cds-button-secondary, #393939)'
            button.style.color = '#fff'
            button.style.border = 'none'
            button.style.borderRadius = '0'
            button.style.fontSize = '14px'
            button.style.fontWeight = '400'
            button.style.cursor = 'pointer'
          }
        })
      } catch {}
    }, 100)
  }, [])

  // Keep hasCanvas in sync with active view (DRD vs decisionTable) when user switches via toolbar
  React.useEffect(() => {
    const v = viewerRef.current
    if (!v) return

    const update = () => {
      try {
        const active: any = (v as any).getActiveView && (v as any).getActiveView()
        setHasCanvas(!!active && active.type === 'drd')
        // Re-style the button when view changes
        styleViewButton()

        // When switching into DRD view, fit the diagram to the available viewport
        if (active && active.type === 'drd') {
          try {
            const canvas = (v as any).getActiveViewer && (v as any).getActiveViewer().get('canvas')
            if (canvas) {
              canvas.zoom('fit-viewport')
              setTimeout(() => {
                try {
                  canvas.zoom('fit-viewport')
                } catch {}
              }, 50)
            }
          } catch {}
        }
      } catch {}
    }

    update()

    try {
      ;(v as any).on && (v as any).on('views.changed', update)
    } catch {}

    return () => {
      try {
        ;(v as any).off && (v as any).off('views.changed', update)
      } catch {}
    }
  }, [styleViewButton])

  const withCanvas = React.useCallback((fn: (canvas: any) => void) => {
    const v = viewerRef.current
    if (!v) return
    try {
      const canvas = v.getActiveViewer().get('canvas')
      if (canvas) fn(canvas)
    } catch {}
  }, [])

  const handleFit = React.useCallback(() => {
    withCanvas((canvas) => {
      canvas.zoom('fit-viewport')
    })
  }, [withCanvas])

  const handleZoomIn = React.useCallback(() => {
    withCanvas((canvas) => {
      const z = canvas.zoom()
      const next = typeof z === 'number' && isFinite(z) ? z * 1.2 : 1.2
      canvas.zoom(Math.min(2, next))
    })
  }, [withCanvas])

  const handleZoomOut = React.useCallback(() => {
    withCanvas((canvas) => {
      const z = canvas.zoom()
      const next = typeof z === 'number' && isFinite(z) ? z * 0.8 : 0.8
      canvas.zoom(Math.max(0.2, next))
    })
  }, [withCanvas])

  const ruleHighlightCss = React.useMemo(() => {
    if (!hitRuleIds || hitRuleIds.length === 0) return ''
    // Highlight each matching rule with a soft blue background. In our DOM, the
    // rule id is on the rule-index <td> as data-element-id and as data-row-id
    // on every cell in that row.
    return hitRuleIds
      .filter((id) => !!id)
      .map((id) => {
        const base = `.dmn-decision-table-container .tjs-table tbody`
        return [
          // rule-index cell
          `${base} td.rule-index[data-element-id="${id}"]`,
          `${base} td.rule-index[data-row-id="${id}"]`,
          // any cell in the row via data-row-id
          `${base} td[data-row-id="${id}"]`,
        ]
          .map((selector) => `${selector} { background-color: #edf5ff !important; }`)
          .join('\n')
      })
      .join('\n')
  }, [hitRuleIds])

  return (
    <div
      ref={ref}
      style={{ 
        height: '100%', 
        position: 'relative', 
        overflow: 'auto',
        backgroundColor: '#ffffff'
      }}
    >
      <style>{`
        .dmn-decision-table-container { 
          padding: 25px !important; 
          box-sizing: border-box; 
          width: 100% !important;
          height: 100% !important;
        }
        .dmn-decision-table-container > .tjs-container {
          width: 100% !important;
          height: 100% !important;
        }
        .dmn-decision-table-container .tjs-table {
          width: 100% !important;
          table-layout: fixed;
          font-size: 14px;
        }
        .dmn-decision-table-container .tjs-table th,
        .dmn-decision-table-container .tjs-table td {
          padding: 16px 20px;
          font-size: 15px;
          line-height: 1.6;
        }
        .dmn-decision-table-container .tjs-table thead th {
          padding: 20px 20px;
          font-size: 14px;
        }
        /* Make columns distribute evenly */
        .dmn-decision-table-container .tjs-table colgroup col {
          width: auto !important;
        }
        .dmn-literal-expression-container { 
          padding: 0 !important; 
          box-sizing: border-box;
          width: 100% !important;
          height: 100% !important;
        }
        /* Align decision table row styling with Camunda Operate (no zebra striping) */
        .dmn-decision-table-container .tjs-table tbody tr:nth-child(odd),
        .dmn-decision-table-container .tjs-table tbody tr:nth-child(even) {
          background-color: #ffffff !important;
        }
        ${ruleHighlightCss}
      `}</style>
      {/* Zoom controls only when a canvas (DRD) is present; DMN tables just scroll */}
      {hasCanvas && (
        <div
          style={{
            position: 'absolute',
            right: 'var(--spacing-3)',
            top: 'var(--spacing-3)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-2)',
            zIndex: 10,
          }}
        >
          <Button
            hasIconOnly
            size="sm"
            kind="ghost"
            renderIcon={FitToScreen}
            iconDescription="Fit"
            onClick={handleFit}
          />
          <Button
            hasIconOnly
            size="sm"
            kind="ghost"
            renderIcon={Add}
            iconDescription="Zoom in"
            onClick={handleZoomIn}
          />
          <Button
            hasIconOnly
            size="sm"
            kind="ghost"
            renderIcon={Subtract}
            iconDescription="Zoom out"
            onClick={handleZoomOut}
          />
        </div>
      )}
    </div>
  )
}
