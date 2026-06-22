'use client'

import { useEditorStore } from '../store/editorStore'
import MetadataPanel from './MetadataPanel'
import AiImportPanel from './AiImportPanel'
import BlockList from './BlockList'
import ReferencePanel from './ReferencePanel'

export default function BlockEditor() {
  const { selectedPath, sections } = useEditorStore()

  if (!selectedPath) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-3)', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 48 }}>📂</div>
        <div>Выберите раздел в боковой панели</div>
      </div>
    )
  }

  if (selectedPath === 'metadata') return <MetadataPanel />
  if (selectedPath === 'ai_import') return <AiImportPanel />
  if (selectedPath === 'introduction') return <BlockList path="introduction" title="📖 Введение" />
  if (selectedPath === 'conclusion') return <BlockList path="conclusion" title="🏁 Заключение" />
  if (selectedPath === 'reference') return <ReferencePanel />

  if (typeof selectedPath === 'object') {
    const { si, subi } = selectedPath
    const section = sections[si]
    if (!section) return <div style={{ color: 'var(--text-3)' }}>Раздел не найден</div>

    if (subi !== undefined) {
      const sub = section.subsections[subi]
      if (!sub) return <div style={{ color: 'var(--text-3)' }}>Подраздел не найден</div>
      return (
        <BlockList
          path={selectedPath}
          title={sub.title.text}
          onTitleChange={(text) => useEditorStore.getState().updateSubsectionTitle(si, subi, text)}
          level={2}
        />
      )
    }

    return (
      <BlockList
        path={selectedPath}
        title={section.title.text}
        onTitleChange={(text) => useEditorStore.getState().updateSectionTitle(si, text)}
        level={1}
      />
    )
  }

  return null
}
