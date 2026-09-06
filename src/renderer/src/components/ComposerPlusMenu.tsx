import { useEffect, useMemo, useRef, useState } from 'react'
import type { SkillSummary } from '../../../shared/ipc'

type SkillPick = { id: string; name: string }

type Props = {
  skills: SkillSummary[]
  onPickSkill: (skill: SkillPick) => void
  onPickFiles: (paths: string[]) => void
  disabled?: boolean
}

type Panel = 'root' | 'skills'

export function ComposerPlusMenu({
  skills,
  onPickSkill,
  onPickFiles,
  disabled = false
}: Props): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [panel, setPanel] = useState<Panel>('root')
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setPanel('root')
    setQuery('')
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

  useEffect(() => {
    if (!open || panel !== 'skills') return
    const t = window.setTimeout(() => searchRef.current?.focus(), 0)
    return () => window.clearTimeout(t)
  }, [open, panel])

  const enabledSkills = useMemo(() => {
    const q = query.trim().toLowerCase()
    return skills
      .filter((s) => s.enabled !== false)
      .filter(
        (s) => !q || `${s.name} ${s.description} ${s.id}`.toLowerCase().includes(q)
      )
  }, [skills, query])

  const pickFiles = async (): Promise<void> => {
    setOpen(false)
    const r = await window.shy.pickFiles()
    if (!r.ok || r.paths.length === 0) return
    onPickFiles(r.paths)
  }

  return (
    <div className={`composer-plus-root${open ? ' is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className={`composer-plus${open ? ' is-open' : ''}`}
        aria-label="添加"
        title="添加"
        aria-expanded={open}
        aria-haspopup="menu"
        disabled={disabled}
        onClick={() => {
          if (disabled) return
          setOpen((v) => !v)
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {open ? (
        <div className="composer-plus-menu" role="menu" aria-label="添加菜单">
          {panel === 'root' ? (
            <>
              <button
                type="button"
                role="menuitem"
                className="composer-plus-item"
                onClick={() => setPanel('skills')}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 3l2.2 4.5L19 8.2l-3.5 3.4.8 4.9L12 14.2 7.7 16.5l.8-4.9L5 8.2l4.8-.7L12 3z" />
                </svg>
                <span>添加技能</span>
              </button>
              <button
                type="button"
                role="menuitem"
                className="composer-plus-item"
                onClick={() => void pickFiles()}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6z" />
                  <path d="M14 3v6h6" />
                </svg>
                <span>添加文件</span>
              </button>
            </>
          ) : (
            <>
              <div className="composer-plus-skills-head">
                <button
                  type="button"
                  className="composer-plus-back"
                  aria-label="返回"
                  onClick={() => setPanel('root')}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M15 6l-6 6 6 6" />
                  </svg>
                </button>
                <span>添加技能</span>
              </div>
              <label className="composer-plus-search">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="11" cy="11" r="6.5" />
                  <path d="M16 16l4 4" />
                </svg>
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="搜索技能"
                  aria-label="搜索技能"
                />
              </label>
              <div className="composer-plus-skill-list">
                {enabledSkills.length === 0 ? (
                  <div className="composer-plus-empty">无匹配技能</div>
                ) : (
                  enabledSkills.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      role="menuitem"
                      className="composer-plus-item"
                      onClick={() => {
                        onPickSkill({ id: s.id, name: s.name })
                        setOpen(false)
                      }}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 3l2.2 4.5L19 8.2l-3.5 3.4.8 4.9L12 14.2 7.7 16.5l.8-4.9L5 8.2l4.8-.7L12 3z" />
                      </svg>
                      <span className="composer-plus-item-label">
                        <span>{s.name}</span>
                        {s.description ? (
                          <span className="composer-plus-item-desc">{s.description}</span>
                        ) : null}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}
