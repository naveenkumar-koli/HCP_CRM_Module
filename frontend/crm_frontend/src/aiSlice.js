import { createSlice } from "@reduxjs/toolkit";

const aiSlice = createSlice({
  name: "ai",
  initialState: {
    messages: [
      {
        role: "ai",
        text: 'Log interaction details here (e.g., "Met Dr. Smith, discussed Product X efficacy, positive sentiment, shared brochure") or ask for help.',
      },
    ],
    loading: false,
    followupSuggestion: null,
    sentimentAnalysis: null,
    summary: null,
    error: null,
  },
  reducers: {
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setFollowupSuggestion: (state, action) => {
      state.followupSuggestion = action.payload;
    },
    setSentimentAnalysis: (state, action) => {
      state.sentimentAnalysis = action.payload;
    },
    setSummary: (state, action) => {
      state.summary = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearMessages: (state) => {
      state.messages = [];
    },
  },
});

export const {
  addMessage,
  setLoading,
  setFollowupSuggestion,
  setSentimentAnalysis,
  setSummary,
  setError,
  clearMessages,
} = aiSlice.actions;

export default aiSlice.reducer;