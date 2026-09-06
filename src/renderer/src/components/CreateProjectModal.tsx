import { useEffect, useState } from 'react'
import type { ProjectType } from '../../../shared/ipc'
import { Modal } from './ui'

type Props = {
  open: boolean
  onClose: () => void
  onCreated: (projectId: string) => void
  onProjectsChanged?: () => void
  /** 预填工作目录（打开本地文件夹后再补类型时用） */
  initialPath?: string
}

export function CreateProjectModal({
  open,
  onClose,
  onCreated,
  onProjectsChanged,
  initialPath
}: Props): React.JSX.Element | null {
  const [type, setType] = useState<ProjectType>('code')
  const [rootPath, setRootPath] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setType('code')
    setRootPath(initialPath ?? '')
    setError('')
    setBusy(false)
  }, [open, initialPath])

  if (!open) return null

  const pickDir = async (): Promise<void> => {
    setError('')
    const picked = await window.shy.pickFolder()
    if (!picked.ok) return
    setRootPath(picked.path)
  }

  const onConfirm = async (): Promise<void> => {
    if (!rootPath.trim()) {
      setError('请选择工作目录')
      return
    }
    setBusy(true)
    setError('')
    try {
      const created = await window.shy.createProject({ type, rootPath: rootPath.trim() })
      if (!created.ok) {
        setError(created.error === 'root_path_taken' ? '该目录已有项目' : '创建失败')
        return
      }
      onCreated(created.project.id)
      onProjectsChanged?.()
      setRootPath('')
      setType('code')
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title="新建项目"
      subtitle="选择类型与工作目录"
      onClose={onClose}
      width={420}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose} disabled={busy}>
            取消
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void onConfirm()}
            disabled={busy}
          >
            {busy ? '创建中…' : '创建'}
          </button>
        </>
      }
    >
      <div className="create-project-modal">
        <div className="field">
          <span className="field-label">类型</span>
          <div className="create-project-types" role="group" aria-label="项目类型">
            <button
              type="button"
              className={`seg-btn${type === 'code' ? ' active' : ''}`}
              aria-pressed={type === 'code'}
              onClick={() => setType('code')}
            >
              代码
            </button>
            <button
              type="button"
              className={`seg-btn${type === 'material' ? ' active' : ''}`}
              aria-pressed={type === 'material'}
              onClick={() => setType('material')}
            >
              素材
            </button>
          </div>
        </div>
        <div className="field">
          <span className="field-label">工作目录</span>
          <div className="create-project-path-row">
            <input
              className="field-input"
              readOnly
              value={rootPath}
              placeholder="尚未选择"
              aria-label="工作目录路径"
            />
            <button type="button" className="btn" onClick={() => void pickDir()} disabled={busy}>
              选择…
            </button>
          </div>
        </div>
        {error ? <p className="create-project-error">{error}</p> : null}
      </div>
    </Modal>
  )
}
