import { describe, it, expect } from 'vitest';
import reducer, { hotelsActions } from './hotels.slice';
import type { HotelRoom, HotelSearchRequest } from '../types/hotels.types';

const INITIAL_STATE = {
  results: [],
  isStreaming: false,
  error: null,
  lastSearch: null,
  lastSearchParams: null,
};

const SAMPLE_PARAMS: HotelSearchRequest = {
  ski_site: 1,
  from_date: '01/01/2025',
  to_date: '10/01/2025',
  group_size: 2,
};

const SAMPLE_META = {
  resortName: 'Val Thorens',
  dateLabel: 'Jan 1 - Jan 10',
  groupSize: 2,
};

const makeRoom = (overrides: Partial<HotelRoom> = {}): HotelRoom => ({
  hotel_code: 'H1',
  hotel_name: 'Alpine Resort',
  stars: 4,
  beds: 2,
  price: 500,
  ...overrides,
});

describe('hotelsSlice', () => {
  describe('startSearch', () => {
    it('clears results and sets isStreaming to true', () => {
      const state = { ...INITIAL_STATE, results: [makeRoom()], isStreaming: false };
      const next = reducer(state, hotelsActions.startSearch({ meta: SAMPLE_META, params: SAMPLE_PARAMS }));
      expect(next.results).toEqual([]);
      expect(next.isStreaming).toBe(true);
    });

    it('clears any previous error', () => {
      const state = { ...INITIAL_STATE, error: 'previous error' };
      const next = reducer(state, hotelsActions.startSearch({ meta: SAMPLE_META, params: SAMPLE_PARAMS }));
      expect(next.error).toBeNull();
    });

    it('saves lastSearch meta and lastSearchParams', () => {
      const next = reducer(INITIAL_STATE, hotelsActions.startSearch({ meta: SAMPLE_META, params: SAMPLE_PARAMS }));
      expect(next.lastSearch).toEqual(SAMPLE_META);
      expect(next.lastSearchParams).toEqual(SAMPLE_PARAMS);
    });
  });

  describe('addBatch', () => {
    it('appends rooms to results', () => {
      const room1 = makeRoom({ hotel_code: 'H1', price: 300 });
      const room2 = makeRoom({ hotel_code: 'H2', price: 200 });
      const next = reducer(INITIAL_STATE, hotelsActions.addBatch([room1, room2]));
      expect(next.results).toHaveLength(2);
    });

    it('sorts results by price ascending', () => {
      const expensive = makeRoom({ hotel_code: 'H1', price: 800 });
      const cheap = makeRoom({ hotel_code: 'H2', price: 200 });
      const mid = makeRoom({ hotel_code: 'H3', price: 500 });
      const next = reducer(INITIAL_STATE, hotelsActions.addBatch([expensive, cheap, mid]));
      expect(next.results.map((r) => r.price)).toEqual([200, 500, 800]);
    });

    it('merges batches across multiple dispatches and keeps sort order', () => {
      const state1 = reducer(INITIAL_STATE, hotelsActions.addBatch([makeRoom({ hotel_code: 'H1', price: 600 })]));
      const state2 = reducer(state1, hotelsActions.addBatch([makeRoom({ hotel_code: 'H2', price: 100 })]));
      expect(state2.results.map((r) => r.price)).toEqual([100, 600]);
    });
  });

  describe('finishSearch', () => {
    it('sets isStreaming to false', () => {
      const state = { ...INITIAL_STATE, isStreaming: true };
      const next = reducer(state, hotelsActions.finishSearch());
      expect(next.isStreaming).toBe(false);
    });

    it('preserves results and lastSearch', () => {
      const room = makeRoom();
      const state = { ...INITIAL_STATE, isStreaming: true, results: [room], lastSearch: SAMPLE_META };
      const next = reducer(state, hotelsActions.finishSearch());
      expect(next.results).toEqual([room]);
      expect(next.lastSearch).toEqual(SAMPLE_META);
    });
  });

  describe('setError', () => {
    it('sets the error message', () => {
      const next = reducer(INITIAL_STATE, hotelsActions.setError('Network failed'));
      expect(next.error).toBe('Network failed');
    });

    it('sets isStreaming to false', () => {
      const state = { ...INITIAL_STATE, isStreaming: true };
      const next = reducer(state, hotelsActions.setError('Error'));
      expect(next.isStreaming).toBe(false);
    });

    it('does not clear results or lastSearch', () => {
      const room = makeRoom();
      const state = { ...INITIAL_STATE, results: [room], lastSearch: SAMPLE_META };
      const next = reducer(state, hotelsActions.setError('Error'));
      expect(next.results).toEqual([room]);
      expect(next.lastSearch).toEqual(SAMPLE_META);
    });
  });
});
