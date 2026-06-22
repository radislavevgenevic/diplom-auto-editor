import { create } from 'zustand'

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

export const useEditorStore = create((set, get) => ({
  // Document metadata
  special: '',
  theme: '',
  group: '',
  name: '',
  name_teacher: '',
  name_nor: '',
  year: new Date().getFullYear().toString(),
  template: 'D',

  // Document content
  introduction: '',
  sections: [],
  conclusion: [],
  reference: [],
  past: [],
  future: [],
  searchOpen: false,

  // UI state
  selectedPath: 'metadata', // 'metadata' | 'introduction' | 'conclusion' | 'reference' | { si, subi? }

  setSelectedPath: (path) => set({ selectedPath: path }),
  setSearchOpen: (val) => set({ searchOpen: val }),
  updateField: (key, value) => set({ [key]: value }),

  // ─── Sections ──────────────────────────────────────────────────────────────
  addSection: () => {
    get().saveHistory()
    set((state) => {
      const idx = state.sections.length + 1
      return {
        sections: [...state.sections, {
          title: { type: 'paragraph1', text: `${idx} Новый раздел` },
          content: [],
          subsections: [],
        }],
      }
    })
  },

  deleteSection: (si) => {
    get().saveHistory()
    set((state) => ({
      sections: state.sections.filter((_, i) => i !== si),
      selectedPath: 'metadata',
    }))
  },

  updateSectionTitle: (si, text) => {
    get().saveHistory()
    set((state) => {
      const sections = deepClone(state.sections)
      sections[si].title.text = text
      return { sections }
    })
  },

  // ─── Subsections ───────────────────────────────────────────────────────────
  addSubsection: (si) => {
    get().saveHistory()
    set((state) => {
      const sections = deepClone(state.sections)
      const subi = sections[si].subsections.length + 1
      sections[si].subsections.push({
        title: { type: 'paragraph2', text: `${si + 1}.${subi} Новый подраздел` },
        content: [],
      })
      return { sections }
    })
  },

  deleteSubsection: (si, subi) => {
    get().saveHistory()
    set((state) => {
      const sections = deepClone(state.sections)
      sections[si].subsections.splice(subi, 1)
      return { sections, selectedPath: { si } }
    })
  },

  updateSubsectionTitle: (si, subi, text) => {
    get().saveHistory()
    set((state) => {
      const sections = deepClone(state.sections)
      sections[si].subsections[subi].title.text = text
      return { sections }
    })
  },

  // ─── Content blocks ────────────────────────────────────────────────────────
  getContent: (path) => {
    const s = get()
    if (!path) return []
    if (path === 'introduction') {
      if (typeof s.introduction === 'string') {
        return s.introduction ? [{ type: 'text', text: s.introduction }] : []
      }
      return s.introduction || []
    }
    if (path === 'conclusion') {
      if (typeof s.conclusion === 'string') {
        return s.conclusion ? [{ type: 'text', text: s.conclusion }] : []
      }
      return s.conclusion || []
    }
    if (path === 'reference') return s.reference
    if (typeof path === 'object') {
      const section = s.sections[path.si]
      if (!section) return []
      if (path.subi !== undefined) return section.subsections[path.subi]?.content || []
      return section.content || []
    }
    return []
  },

  setContent: (path, content, options = {}) => {
    const s = get()
    const prevContent = s.getContent(path)
    // Save history when: block count changes (add/delete) OR explicitly requested (move)
    if (prevContent.length !== content.length || options.saveNow) {
      s.saveHistory()
    }
    set((state) => {
      if (!path) return {}
      if (path === 'introduction') return { introduction: content }
      if (path === 'conclusion') return { conclusion: content }
      if (path === 'reference') return { reference: content }
      if (typeof path === 'object') {
        const sections = deepClone(state.sections)
        if (path.subi !== undefined) {
          sections[path.si].subsections[path.subi].content = content
        } else {
          sections[path.si].content = content
        }
        return { sections }
      }
      return {}
    })
  },

  // ─── Load / Export ─────────────────────────────────────────────────────────
  loadFromJSON: (data) => {
    const normalizeBlocks = (blocks) => {
      if (!Array.isArray(blocks)) return []
      return blocks.map((block) => {
        if (block && block.type === 'formula') {
          return {
            ...block,
            text: block.text || block.formula || '',
          }
        }
        return block
      })
    }

    let intro = data.introduction || []
    if (typeof intro === 'string') {
      intro = intro.trim() ? [{ type: 'text', text: intro }] : []
    } else {
      intro = normalizeBlocks(intro)
    }

    let concl = data.conclusion || []
    if (typeof concl === 'string') {
      concl = concl.trim() ? [{ type: 'text', text: concl }] : []
    } else {
      concl = normalizeBlocks(concl)
    }

    const normalizedSections = (data.sections || []).map((section) => ({
      ...section,
      content: normalizeBlocks(section.content),
      subsections: (section.subsections || []).map((sub) => ({
        ...sub,
        content: normalizeBlocks(sub.content),
      })),
    }))

    return set({
      special: data.special || '',
      theme: data.theme || '',
      group: data.group || '',
      name: data.name || '',
      name_teacher: data.name_teacher || '',
      name_nor: data.name_nor || '',
      year: data.year || '',
      template: data.template || 'D',
      introduction: intro,
      sections: normalizedSections,
      conclusion: concl,
      reference: data.reference || [],
      selectedPath: 'metadata',
    })
  },

  exportJSON: () => {
    const s = get()

    const cleanSection = (section) => ({
      ...section,
      content: section.content,
      subsections: (section.subsections || []).map((sub) => ({
        ...sub,
        content: sub.content,
      })),
    })

    return {
      special: s.special,
      theme: s.theme,
      group: s.group,
      name: s.name,
      name_teacher: s.name_teacher,
      name_nor: s.name_nor,
      year: s.year,
      template: s.template || 'D',
      introduction: s.introduction,
      sections: s.sections.map(cleanSection),
      conclusion: s.conclusion,
      reference: s.reference,
    }
  },

  // Collect all image blocks with _dataURL for saving
  collectImages: () => {
    const s = get()
    const images = []

    const fromBlocks = (blocks) => {
      ;(blocks || []).forEach((block) => {
        if (block.type === 'image' && block._dataURL && block.src) {
          const filename = block.src.split('/').pop()
          images.push({ filename, dataURL: block._dataURL })
        }
      })
    }

    s.sections.forEach((section) => {
      fromBlocks(section.content)
      ;(section.subsections || []).forEach((sub) => fromBlocks(sub.content))
    })
    fromBlocks(s.conclusion)
    return images
  },

  undo: () => set((state) => {
    if (state.past.length === 0) return {}
    const past = [...state.past]
    const previous = past.pop()
    
    const current = {
      special: state.special,
      theme: state.theme,
      group: state.group,
      name: state.name,
      name_teacher: state.name_teacher,
      name_nor: state.name_nor,
      year: state.year,
      template: state.template,
      introduction: deepClone(state.introduction),
      sections: deepClone(state.sections),
      conclusion: deepClone(state.conclusion),
      reference: deepClone(state.reference),
    }
    const future = [current, ...state.future]

    return {
      ...previous,
      past,
      future
    }
  }),

  redo: () => set((state) => {
    if (state.future.length === 0) return {}
    const future = [...state.future]
    const next = future.shift()

    const current = {
      special: state.special,
      theme: state.theme,
      group: state.group,
      name: state.name,
      name_teacher: state.name_teacher,
      name_nor: state.name_nor,
      year: state.year,
      template: state.template,
      introduction: deepClone(state.introduction),
      sections: deepClone(state.sections),
      conclusion: deepClone(state.conclusion),
      reference: deepClone(state.reference),
    }
    const past = [...state.past, current]

    return {
      ...next,
      past,
      future
    }
  }),

  saveHistory: () => {
    const state = get()
    const current = {
      special: state.special,
      theme: state.theme,
      group: state.group,
      name: state.name,
      name_teacher: state.name_teacher,
      name_nor: state.name_nor,
      year: state.year,
      template: state.template,
      introduction: deepClone(state.introduction),
      sections: deepClone(state.sections),
      conclusion: deepClone(state.conclusion),
      reference: deepClone(state.reference),
    }
    const past = [...state.past, current]
    if (past.length > 50) past.shift()
    set({ past, future: [] })
  },

  findAndReplace: (findText, replaceText) => {
    if (!findText) return
    get().saveHistory()
    const s = get()
    
    const replaceInString = (str) => {
      if (typeof str !== 'string') return str
      return str.split(findText).join(replaceText)
    }

    const replaceInBlocks = (blocks) => {
      if (!Array.isArray(blocks)) return []
      return blocks.map(block => {
        if (block.type === 'text') {
          return { ...block, text: replaceInString(block.text) }
        }
        if (block.type === 'bullet_list' || block.type === 'numbered_list') {
          return { ...block, items: (block.items || []).map(replaceInString) }
        }
        if (block.type === 'table') {
          return {
            ...block,
            title: replaceInString(block.title),
            headers: (block.headers || []).map(replaceInString),
            rows: (block.rows || []).map(row => row.map(replaceInString))
          }
        }
        if (block.type === 'formula') {
          return {
            ...block,
            text: replaceInString(block.text),
            variables: (block.variables || []).map(v => ({
              ...v,
              symbol: replaceInString(v.symbol),
              description: replaceInString(v.description)
            }))
          }
        }
        if (block.type === 'image') {
          return { ...block, caption: replaceInString(block.caption) }
        }
        return block
      })
    }

    const special = replaceInString(s.special)
    const theme = replaceInString(s.theme)
    const group = replaceInString(s.group)
    const name = replaceInString(s.name)
    const name_teacher = replaceInString(s.name_teacher)
    const name_nor = replaceInString(s.name_nor)
    const year = replaceInString(s.year)

    const introduction = typeof s.introduction === 'string' 
      ? replaceInString(s.introduction)
      : replaceInBlocks(s.introduction)

    const conclusion = typeof s.conclusion === 'string'
      ? replaceInString(s.conclusion)
      : replaceInBlocks(s.conclusion)

    const reference = (s.reference || []).map(ref => ({
      ...ref,
      text: replaceInString(ref.text),
      url: replaceInString(ref.url)
    }))

    const sections = s.sections.map(section => ({
      ...section,
      title: { ...section.title, text: replaceInString(section.title.text) },
      content: replaceInBlocks(section.content),
      subsections: (section.subsections || []).map(sub => ({
        ...sub,
        title: { ...sub.title, text: replaceInString(sub.title.text) },
        content: replaceInBlocks(sub.content)
      }))
    }))

    set({
      special,
      theme,
      group,
      name,
      name_teacher,
      name_nor,
      year,
      introduction,
      sections,
      conclusion,
      reference
    })
  },

  countMatches: (findText) => {
    if (!findText) return 0
    let count = 0
    const s = get()

    const checkString = (str) => {
      if (typeof str !== 'string') return
      let pos = str.indexOf(findText)
      while (pos !== -1) {
        count++
        pos = str.indexOf(findText, pos + findText.length)
      }
    }

    const checkBlocks = (blocks) => {
      if (!Array.isArray(blocks)) return
      blocks.forEach(block => {
        if (block.type === 'text') {
          checkString(block.text)
        } else if (block.type === 'bullet_list' || block.type === 'numbered_list') {
          (block.items || []).forEach(checkString)
        } else if (block.type === 'table') {
          checkString(block.title)
          ;(block.headers || []).forEach(checkString)
          ;(block.rows || []).forEach(row => row.forEach(checkString))
        } else if (block.type === 'formula') {
          checkString(block.text)
          ;(block.variables || []).forEach(v => {
            checkString(v.symbol)
            checkString(v.description)
          })
        } else if (block.type === 'image') {
          checkString(block.caption)
        }
      })
    }

    checkString(s.special)
    checkString(s.theme)
    checkString(s.group)
    checkString(s.name)
    checkString(s.name_teacher)
    checkString(s.name_nor)
    checkString(s.year)

    if (typeof s.introduction === 'string') {
      checkString(s.introduction)
    } else {
      checkBlocks(s.introduction)
    }

    if (typeof s.conclusion === 'string') {
      checkString(s.conclusion)
    } else {
      checkBlocks(s.conclusion)
    }

    ;(s.reference || []).forEach(ref => {
      checkString(ref.text)
      checkString(ref.url)
    })

    s.sections.forEach(section => {
      checkString(section.title.text)
      checkBlocks(section.content)
      ;(section.subsections || []).forEach(sub => {
        checkString(sub.title.text)
        checkBlocks(sub.content)
      })
    })

    return count
  },
}))
