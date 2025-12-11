import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

import type { Message } from '@/types/message'

export interface RuntimeState {
  htmlPreviewContent: string | null
  htmlPreviewSizeBytes: number
  editingMessage: Message | null
  /** Topic IDs that are currently being renamed */
  renamingTopics: string[]
  /** Topic IDs that are newly renamed (for UI animation feedback) */
  newlyRenamedTopics: string[]
}

const initialState: RuntimeState = {
  htmlPreviewContent: null,
  htmlPreviewSizeBytes: 0,
  editingMessage: null,
  renamingTopics: [],
  newlyRenamedTopics: []
}

const runtimeSlice = createSlice({
  name: 'runtime',
  initialState,
  reducers: {
    setHtmlPreviewContent(state, action: PayloadAction<{ content: string | null; sizeBytes: number }>) {
      state.htmlPreviewContent = action.payload.content
      state.htmlPreviewSizeBytes = action.payload.sizeBytes
    },
    setEditingMessage(state, action: PayloadAction<Message | null>) {
      state.editingMessage = action.payload
    },
    setRenamingTopics(state, action: PayloadAction<string[]>) {
      state.renamingTopics = action.payload
    },
    setNewlyRenamedTopics(state, action: PayloadAction<string[]>) {
      state.newlyRenamedTopics = action.payload
    }
  }
})

export const { setHtmlPreviewContent, setEditingMessage, setRenamingTopics, setNewlyRenamedTopics } =
  runtimeSlice.actions

export default runtimeSlice.reducer
