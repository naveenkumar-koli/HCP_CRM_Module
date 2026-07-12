import { configureStore } from "@reduxjs/toolkit";
import interactionReducer from "./interactionSlice";
import aiReducer from "./aiSlice";

export const store = configureStore({
  reducer: {
    interaction: interactionReducer,
    ai: aiReducer,
  },
});