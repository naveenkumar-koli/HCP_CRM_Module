import { createSlice } from "@reduxjs/toolkit";

const empty = {
  hcp_name: "",
  interaction_type: "Meeting",
  date: "",
  time: "",
  attendees: [],
  topics_discussed: "",
  sentiment: "Neutral",
  materials_shared: [],
  samples_distributed: [],
  outcomes: "",
  follow_up: "",
};

const interactionSlice = createSlice({
  name: "interaction",
  initialState: {
    form: empty,
    savedInteractions: [],
    saving: false,
    saveError: null,
    saveSuccess: false,
  },
  reducers: {
    setField: (state, action) => {
      const { key, value } = action.payload;
      state.form[key] = value;
    },
    setForm: (state, action) => {
      state.form = { ...state.form, ...action.payload };
    },
    resetForm: (state) => {
      state.form = empty;
      state.saveSuccess = false;
      state.saveError = null;
    },
    setSaving: (state, action) => {
      state.saving = action.payload;
    },
    setSaveSuccess: (state, action) => {
      state.saveSuccess = action.payload;
    },
    setSaveError: (state, action) => {
      state.saveError = action.payload;
    },
    addSavedInteraction: (state, action) => {
      state.savedInteractions.push(action.payload);
    },
  },
});

export const {
  setField,
  setForm,
  resetForm,
  setSaving,
  setSaveSuccess,
  setSaveError,
  addSavedInteraction,
} = interactionSlice.actions;

export default interactionSlice.reducer;