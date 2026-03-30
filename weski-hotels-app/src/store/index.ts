export { store } from './store';
export type { RootState, AppDispatch } from './store';
export { useSearchHotelsMutation } from './hotels.api';
export { hotelsActions } from './hotels.slice';

import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
