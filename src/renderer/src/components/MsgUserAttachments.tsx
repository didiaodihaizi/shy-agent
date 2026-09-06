import { attachmentPreviewSrc, type ComposerAttachmentChip, type ComposerSkillChip } from '../lib/composerAttachments'
import { ComposerAttachmentChips } from './ComposerAttachmentChips'

type Props = {
  skills?: ComposerSkillChip[]
  attachments?: ComposerAttachmentChip[]
}

/** 用户消息气泡内的技能 chip + 图片缩略图 / 文件 chip */
export function MsgUserAttachments({ skills, attachments }: Props): React.JSX.Element | null {
  const skillList = skills ?? []
  const files = attachments ?? []
  if (skillList.length === 0 && files.length === 0) return null

  const images = files.filter((a) => a.kind === 'image')
  const others = files.filter((a) => a.kind !== 'image')

  return (
    <div className="msg-attachments">
      {skillList.length > 0 || others.length > 0 ? (
        <ComposerAttachmentChips skills={skillList} attachments={others} readOnly />
      ) : null}
      {images.length > 0 ? (
        <div className="msg-attachment-images">
          {images.map((img) => (
            <a
              key={img.path}
              className="msg-attachment-image"
              href={attachmentPreviewSrc(img.path)}
              title={img.name}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.preventDefault()}
            >
              <img src={attachmentPreviewSrc(img.path)} alt={img.name} />
              <span className="msg-attachment-image-name">{img.name}</span>
            </a>
          ))}
        </div>
      ) : null}
    </div>
  )
}
