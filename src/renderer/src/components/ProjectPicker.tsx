import { useCallback, useEffect, useState } from 'react'
import type { Project } from '../../../shared/ipc'
import { CreateProjectModal } from './CreateProjectModal'

const NONE = ''
const ADD = '__add__'

type Props = {
  value: string | null
  disabled: boolean
  onChange: (projectId: string | null) => void
  onProjectsChanged?: () => void
  /** 空状态底栏文案 */
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
  const [modalOpen, setModalOpen] = useState(false)

  const refresh = useCallback(async (): Promise<Project[]> => {
    const list = await window.shy.listProjects()
    setProjects(list)
    return list
  }, [])

  useEffect(() => {
    void refresh().catch(() => {})
  }, [refresh])

  const onSelect = (raw: string): void => {
    if (raw === ADD) {
      setModalOpen(true)
      return
    }
    onChange(raw === NONE ? null : raw)
  }

  const selected = projects.find((p) => p.id === value)
  const display =
    selected != null
      ? `${selected.name}${selected.type === 'code' ? ' · 代码' : ' · 素材'}`
      : emptyLabel

  return (
    <div className="project-picker">
      <select
        className="project-picker-select"
        aria-label="工作空间"
        value={value ?? NONE}
        disabled={disabled}
        onChange={(e) => onSelect(e.target.value)}
        title={display}
      >
        <option value={NONE}>{emptyLabel}</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
            {p.type === 'code' ? ' · 代码' : ' · 素材'}
          </option>
        ))}
        <option value={ADD} disabled={disabled}>
          添加项目…
        </option>
      </select>
      <CreateProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(id) => onChange(id)}
        onProjectsChanged={onProjectsChanged}
      />
    </div>
  )
}
