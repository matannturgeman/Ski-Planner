import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HotelResults from './hotel-results';
import type { HotelRoom, HotelSearchRequest } from '../../types/hotels.types';

const mockSearchHotels = vi.fn();

vi.mock('../../store', () => ({
  useSearchHotelsMutation: () => [mockSearchHotels, { isLoading: false }],
}));

vi.mock('@tanstack/react-virtual', () => ({
  useWindowVirtualizer: ({ count }: { count: number }) => ({
    getVirtualItems: () =>
      Array.from({ length: count }, (_, i) => ({
        key: i,
        index: i,
        start: i * 166,
      })),
    getTotalSize: () => count * 166,
    measureElement: () => {},
    options: { scrollMargin: 0 },
  }),
}));

const LAST_SEARCH = {
  resortName: 'Val Thorens',
  dateLabel: 'Jan 1 - Jan 10',
  groupSize: 2,
};

const LAST_SEARCH_PARAMS: HotelSearchRequest = {
  ski_site: 1,
  from_date: '01/01/2025',
  to_date: '10/01/2025',
  group_size: 2,
};

const makeRoom = (overrides: Partial<HotelRoom> = {}): HotelRoom => ({
  hotel_code: 'H1',
  hotel_name: 'Alpine Resort',
  stars: 4,
  beds: 2,
  price: 500,
  ...overrides,
});

const defaultProps = {
  results: [] as HotelRoom[],
  isStreaming: false,
  error: null,
  lastSearch: null,
  lastSearchParams: null,
};

beforeEach(() => {
  mockSearchHotels.mockClear();
});

describe('HotelResults', () => {
  it('renders nothing when no lastSearch and no error', () => {
    const { container } = render(<HotelResults {...defaultProps} />);
    expect(container).toBeEmptyDOMElement();
  });

  describe('error state', () => {
    it('displays the error message in an alert', () => {
      render(<HotelResults {...defaultProps} error="Network error" />);
      expect(screen.getByRole('alert')).toHaveTextContent('Network error');
    });

    it('does not show a retry button when lastSearchParams is null', () => {
      render(<HotelResults {...defaultProps} error="Error" lastSearchParams={null} />);
      expect(screen.queryByRole('button', { name: /try the search again/i })).not.toBeInTheDocument();
    });

    it('shows a retry button when lastSearchParams is provided', () => {
      render(<HotelResults {...defaultProps} error="Error" lastSearchParams={LAST_SEARCH_PARAMS} />);
      expect(screen.getByRole('button', { name: /try the search again/i })).toBeInTheDocument();
    });

    it('calls searchHotels with lastSearchParams when retry is clicked', () => {
      render(<HotelResults {...defaultProps} error="Error" lastSearchParams={LAST_SEARCH_PARAMS} />);
      fireEvent.click(screen.getByRole('button', { name: /try the search again/i }));
      expect(mockSearchHotels).toHaveBeenCalledWith(LAST_SEARCH_PARAMS);
    });
  });

  describe('streaming state', () => {
    it('shows skeletons when streaming with no results yet', () => {
      render(<HotelResults {...defaultProps} isStreaming={true} lastSearch={LAST_SEARCH} />);
      const skeletons = document.querySelectorAll('.hotel-card--skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('shows "found so far" count when streaming with results', () => {
      const results = [makeRoom({ hotel_code: 'H1' }), makeRoom({ hotel_code: 'H2', price: 300 })];
      render(<HotelResults {...defaultProps} results={results} isStreaming={true} lastSearch={LAST_SEARCH} />);
      expect(screen.getByText(/2 found so far/i)).toBeInTheDocument();
    });

    it('marks section as busy when streaming', () => {
      render(<HotelResults {...defaultProps} isStreaming={true} lastSearch={LAST_SEARCH} />);
      expect(screen.getByRole('region')).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('results state', () => {
    it('renders a card for each hotel result', () => {
      const results = [
        makeRoom({ hotel_code: 'H1', hotel_name: 'Alpine Resort' }),
        makeRoom({ hotel_code: 'H2', hotel_name: 'Mountain Lodge', price: 300 }),
      ];
      render(<HotelResults {...defaultProps} results={results} lastSearch={LAST_SEARCH} />);
      expect(screen.getByText('Alpine Resort')).toBeInTheDocument();
      expect(screen.getByText('Mountain Lodge')).toBeInTheDocument();
    });

    it('displays price formatted as GBP', () => {
      const results = [makeRoom({ price: 1234 })];
      render(<HotelResults {...defaultProps} results={results} lastSearch={LAST_SEARCH} />);
      expect(screen.getByLabelText(/£1,234 per person/i)).toBeInTheDocument();
    });

    it('shows beds capacity', () => {
      const results = [makeRoom({ beds: 4 })];
      render(<HotelResults {...defaultProps} results={results} lastSearch={LAST_SEARCH} />);
      expect(screen.getByText('Sleeps 4')).toBeInTheDocument();
    });

    it('shows ski lift distance when provided', () => {
      const results = [makeRoom({ ski_lift_distance: '200m' })];
      render(<HotelResults {...defaultProps} results={results} lastSearch={LAST_SEARCH} />);
      expect(screen.getByText('200m to ski lift')).toBeInTheDocument();
    });

    it('shows resort name from lastSearch', () => {
      const results = [makeRoom()];
      render(<HotelResults {...defaultProps} results={results} lastSearch={LAST_SEARCH} />);
      expect(screen.getAllByText('Val Thorens').length).toBeGreaterThan(0);
    });

    it('shows the star rating label', () => {
      const results = [makeRoom({ stars: 4 })];
      render(<HotelResults {...defaultProps} results={results} lastSearch={LAST_SEARCH} />);
      expect(screen.getByLabelText('4 out of 5 stars')).toBeInTheDocument();
    });

    it('does not render stars section when stars = 0', () => {
      const results = [makeRoom({ stars: 0 })];
      render(<HotelResults {...defaultProps} results={results} lastSearch={LAST_SEARCH} />);
      expect(screen.queryByLabelText(/out of 5 stars/i)).not.toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('shows empty message when search finished with no results', () => {
      render(<HotelResults {...defaultProps} isStreaming={false} lastSearch={LAST_SEARCH} />);
      expect(screen.getByText(/no hotels found/i)).toBeInTheDocument();
    });

    it('shows result count when search is complete', () => {
      const results = [makeRoom()];
      render(<HotelResults {...defaultProps} results={results} isStreaming={false} lastSearch={LAST_SEARCH} />);
      expect(screen.getByText(/1 ski trip option/i)).toBeInTheDocument();
    });

    it('uses plural form for multiple results', () => {
      const results = [makeRoom({ hotel_code: 'H1' }), makeRoom({ hotel_code: 'H2', price: 300 })];
      render(<HotelResults {...defaultProps} results={results} isStreaming={false} lastSearch={LAST_SEARCH} />);
      expect(screen.getByText(/2 ski trips options/i)).toBeInTheDocument();
    });
  });
});
