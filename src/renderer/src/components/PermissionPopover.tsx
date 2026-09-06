import { useEffect, useRef, useState } from 'react'
import { Switch } from './ui'

type Props = {
  alwaysAuthorize: boolean
  onToggle: () => void | Promise<void>
}

export function PermissionPopover({ alwaysAuthorize, onToggle }: Props): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent): void => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const label = alwaysAuthorize ? '完全访问' : '默认权限'

  return (
    <div className="permission-popover-root" ref={rootRef}>
      <button
        type="button"
        className={`permission-trigger${alwaysAuthorize ? ' is-full' : ''}${open ? ' is-open' : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z" />
          <path d="M9.5 12.2l1.8 1.8 3.4-3.6" />
        </svg>
        <span>{label}</span>
        <svg className="permission-caret" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 14l5-5 5 5" />
        </svg>
      </button>
      {open ? (
        <div className="permission-popover" role="dialog" aria-label="权限设置">
          <p className="permission-popover-copy">
            {alwaysAuthorize
              ? '当前为完全访问：工具确认闸门与工作区路径围栏已放宽，请谨慎操作。'
              : '当前为默认权限，文件操作限制在工作区内，超出范围会拒绝；高危操作仍会请求你的允许。'}
          </p>
          <div className="permission-popover-row">
            <span>允许完全访问</span>
            <Switch
              size="s"
              checked={alwaysAuthorize}
              onChange={() => void onToggle()}
              ariaLabel="允许完全访问"
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
