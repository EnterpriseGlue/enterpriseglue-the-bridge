import React from 'react'
import { Breadcrumb } from '@carbon/react'
import styles from './BreadcrumbBar.module.css'

interface BreadcrumbBarProps {
  children: React.ReactNode
}

/**
 * Shared breadcrumb bar component with consistent Carbon g10 styling.
 * Wraps Carbon's Breadcrumb component in a styled container.
 */
export function BreadcrumbBar({ children }: BreadcrumbBarProps) {
  const safeChildren = React.Children.toArray(children).filter((c) => React.isValidElement(c))
  return (
    <div className={styles.breadcrumbBar}>
      <Breadcrumb noTrailingSlash>
        {safeChildren}
      </Breadcrumb>
    </div>
  )
}

export default BreadcrumbBar
