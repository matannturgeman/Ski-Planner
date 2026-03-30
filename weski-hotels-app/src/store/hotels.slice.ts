import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { HotelRoom, HotelSearchRequest } from '../types/hotels.types';

interface LastSearchMeta {
  resortName: string;
  dateLabel: string;
  groupSize: number;
}

interface HotelsState {
  results: HotelRoom[];
  isStreaming: boolean;
  error: string | null;
  lastSearch: LastSearchMeta | null;
  lastSearchParams: HotelSearchRequest | null;
}

const initialState: HotelsState = {
  results: [],
  isStreaming: false,
  error: null,
  lastSearch: null,
  lastSearchParams: null,
};

const hotelsSlice = createSlice({
  name: 'hotels',
  initialState,
  reducers: {
    startSearch(state, action: PayloadAction<{ meta: LastSearchMeta; params: HotelSearchRequest }>) {
      state.results = [];
      state.isStreaming = true;
      state.error = null;
      state.lastSearch = action.payload.meta;
      state.lastSearchParams = action.payload.params;
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
