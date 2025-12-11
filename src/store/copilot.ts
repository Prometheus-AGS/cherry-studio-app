import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

export interface CopilotState {
  defaultHeaders: Record<string, string>
}

export const initialState: CopilotState = {
  defaultHeaders: {}
}

const copilotSlice = createSlice({
  name: 'copilot',
  initialState,
  reducers: {
    setDefaultHeaders: (state, action: PayloadAction<Record<string, string>>) => {
      state.defaultHeaders = action.payload
    },
    updateDefaultHeaders: (state, action: PayloadAction<Record<string, string>>) => {
      state.defaultHeaders = { ...state.defaultHeaders, ...action.payload }
    }
  }
})

export const { setDefaultHeaders, updateDefaultHeaders } = copilotSlice.actions

export default copilotSlice.reducer
