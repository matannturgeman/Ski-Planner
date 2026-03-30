import { configureStore } from '@reduxjs/toolkit';
import { hotelsApi } from './hotels.api';
import hotelsReducer from './hotels.slice';

export const store = configureStore({
  reducer: {
    hotels: hotelsReducer,
    [hotelsApi.reducerPath]: hotelsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(hotelsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
