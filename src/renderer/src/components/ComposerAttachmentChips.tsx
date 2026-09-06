import { useState } from 'react'
import {
  attachmentPreviewSrc,
  type ComposerAttachmentChip,
  type ComposerSkillChip
} from '../lib/composerAttachments'

type Props = {
  skills: ComposerSkillChip[]
  attachments: ComposerAttachmentChip[]
  onRemoveSkill?: (id: string) => void
  onRemoveAttachment?: (path: string) => void
  /** 消息气泡内只读展示（无 ×） */
  readOnly?: boolean
}

function SkillChip({
  skill,
  onRemove
}: {
  skill: ComposerSkillChip
  onRemove?: () => void
}): React.JSX.Element {
  return (
    <span className="composer-chip composer-chip-skill" title={skill.name}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3l2.2 4.5L19 8.2l-3.5 3.4.8 4.9L12 14.2 7.7 16.5l.8-4.9L5 8.2l4.8-.7L12 3z" />
      </svg>
      <span className="composer-chip-label">{skill.name}</span>
      {onRemove ? (
        <button
          type="button"
          className="composer-chip-remove"
          aria-label={`移除技能 ${skill.name}`}
          onClick={onRemove}
        >
          ×
        </button>
      ) : null}
    </span>
  )
}

function FileChip({
  attachment,
  onRemove
}: {
  attachment: ComposerAttachmentChip
  onRemove?: () => void
}): React.JSX.Element {
  const [hover, setHover] = useState(false)
  const isImage = attachment.kind === 'image'

  return (
    <span
      className={`composer-chip composer-chip-file${isImage ? ' is-image' : ''}`}
      title={attachment.path}
      onMouseEnter={() => {
        if (isImage) setHover(true)
      }}
      onMouseLeave={() => setHover(false)}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {isImage ? (
          <>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="9" cy="10" r="1.6" />
            <path d="M5 17l4.5-4.5L13 16l2.5-2.5L19 17" />
          </>
        ) : (
          <>
            <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6z" />
            <path d="M14 3v6h6" />
          </>
        )}
      </svg>
      <span className="composer-chip-label">{attachment.name}</span>
      {onRemove ? (
        <button
          type="button"
          className="composer-chip-remove"
          aria-label={`移除文件 ${attachment.name}`}
          onClick={onRemove}
        >
          ×
        </button>
      ) : null}
      {isImage && hover ? (
        <div className="composer-chip-preview" role="dialog" aria-label={`${attachment.name} 预览`}>
          <img src={attachmentPreviewSrc(attachment.path)} alt={attachment.name} />
        </div>
      ) : null}
    </span>
  )
}

export function ComposerAttachmentChips({
  skills,
  attachments,
  onRemoveSkill,
  onRemoveAttachment,
  readOnly = false
}: Props): React.JSX.Element | null {
  if (skills.length === 0 && attachments.length === 0) return null
  return (
    <div className={`composer-chips${readOnly ? ' is-readonly' : ''}`} aria-label="本轮附件">
      {skills.map((s) => (
        <SkillChip
          key={s.id}
          skill={s}
          onRemove={readOnly || !onRemoveSkill ? undefined : () => onRemoveSkill(s.id)}
        />
      ))}
      {attachments.map((a) => (
        <FileChip
          key={a.path}
          attachment={a}
          onRemove={readOnly || !onRemoveAttachment ? undefined : () => onRemoveAttachment(a.path)}
        />
      ))}
    </div>
  )
}
