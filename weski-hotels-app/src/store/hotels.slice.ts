import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { HotelRoom } from '../types/hotels.types';

interface HotelsState {
  results: HotelRoom[];
  isStreaming: boolean;
  error: string | null;
  hasSearched: boolean;
}

const initialState: HotelsState = {
  results: [],
  isStreaming: false,
  error: null,
  hasSearched: false,
};

const hotelsSlice = createSlice({
  name: 'hotels',
  initialState,
  reducers: {
    startSearch(state) {
      state.results = [];
      state.isStreaming = true;
      state.error = null;
      state.hasSearched = true;
    },
    addBatch(state, action: PayloadAction<HotelRoom[]>) {
      state.results = [...state.results, ...action.payload].sort(
        (a, b) => a.price - b.price,
      );
    },
    finishSearch(state) {
      state.isStreaming = false;
    },
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.isStreaming = false;
    },
  },
});

export const hotelsActions = hotelsSlice.actions;
export default hotelsSlice.reducer;
