import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Project } from '../../../shared/ipc'
import { CreateProjectModal } from './CreateProjectModal'

type Props = {
  value: string | null
  disabled: boolean
  onChange: (projectId: string | null) => void
  onProjectsChanged?: () => void
  emptyLabel?: string
}

export function ProjectPicker({
  value,
  disabled,
  onChange,
  onProjectsChanged,
  emptyLabel = '选择工作空间'
}: Props): React.JSX.Element {
  const [projects, setProjects] = useState<Project[]>([])
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalPath, setModalPath] = useState<string | undefined>()
  const [error, setError] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const refresh = useCallback(async (): Promise<Project[]> => {
    const list = await window.shy.listProjects()
    setProjects(list)
    return list
  }, [])

  useEffect(() => {
    void refresh().catch(() => {})
  }, [refresh])

  useEffect(() => {
    if (!open) return
    setQuery('')
    setError('')
    const t = window.setTimeout(() => searchRef.current?.focus(), 0)
    const onDoc = (e: MouseEvent): void => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t)
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return projects
    return projects.filter(
      (p) => p.name.toLowerCase().includes(q) || p.rootPath.toLowerCase().includes(q)
    )
  }, [projects, query])

  const selected = projects.find((p) => p.id === value)
  const label = selected?.name ?? emptyLabel

  const pickAndCreate = async (): Promise<void> => {
    setError('')
    const picked = await window.shy.pickFolder()
    if (!picked.ok) return
    const existing = projects.find((p) => p.rootPath === picked.path)
    if (existing) {
      onChange(existing.id)
      setOpen(false)
      return
    }
    const created = await window.shy.createProject({ type: 'code', rootPath: picked.path })
    if (!created.ok) {
      if (created.error === 'root_path_taken') {
        setError('该目录已有项目')
        await refresh()
        return
      }
      setError('创建失败')
      return
    }
    await refresh()
    onChange(created.project.id)
    onProjectsChanged?.()
    setOpen(false)
  }

  return (
    <div className={`project-picker${open ? ' is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="project-picker-trigger"
        aria-label="工作空间"
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => {
          if (disabled) return
          setOpen((v) => !v)
        }}
      >
        <span className="project-picker-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9z" />
          </svg>
        </span>
        <span className="project-picker-label">{label}</span>
        <svg className="project-picker-caret" viewBox="0 0 24 24" aria-hidden="true">
          <path d={open ? 'M7 14l5-5 5 5' : 'M7 10l5 5 5-5'} />
        </svg>
      </button>

      {open ? (
        <div className="project-picker-menu" role="listbox" aria-label="工作空间列表">
          <label className="project-picker-search">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" />
              <path d="M16 16l4 4" />
            </svg>
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索工作空间"
              aria-label="搜索工作空间"
            />
          </label>

          <div className="project-picker-list">
            {filtered.length === 0 ? (
              <div className="project-picker-empty">无匹配工作空间</div>
            ) : (
              filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="option"
                  aria-selected={p.id === value}
                  className={`project-picker-item${p.id === value ? ' is-active' : ''}`}
                  onClick={() => {
                    onChange(p.id)
                    setOpen(false)
                  }}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9z" />
                  </svg>
                  <span>{p.name}</span>
                </button>
              ))
            )}
          </div>

          <div className="project-picker-actions">
            <button
              type="button"
              className="project-picker-action"
              onClick={() => {
                setModalPath(undefined)
                setModalOpen(true)
                setOpen(false)
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              新建工作空间
            </button>
            <button
              type="button"
              className="project-picker-action"
              onClick={() => void pickAndCreate()}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9z" />
              </svg>
              打开本地文件夹
            </button>
          </div>
          {error ? <div className="project-picker-error">{error}</div> : null}
        </div>
      ) : null}

      <CreateProjectModal
        open={modalOpen}
        initialPath={modalPath}
        onClose={() => {
          setModalOpen(false)
          setModalPath(undefined)
        }}
        onCreated={(id) => onChange(id)}
        onProjectsChanged={onProjectsChanged}
      />
    </div>
  )
}
