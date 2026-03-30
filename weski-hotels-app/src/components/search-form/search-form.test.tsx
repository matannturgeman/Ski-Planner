import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchForm from './search-form';

const mockSearchHotels = vi.fn();

vi.mock('../../store', () => ({
  useSearchHotelsMutation: () => [mockSearchHotels, { isLoading: false }],
}));

// Replace DatePicker with a simple input to avoid jsdom complexity
vi.mock('react-datepicker', () => ({
  default: ({ selected, onChange, placeholderText, inputProps }: {
    selected: Date | null;
    onChange: (d: Date | null) => void;
    placeholderText?: string;
    inputProps?: Record<string, string>;
  }) => (
    <input
      type="date"
      aria-label={inputProps?.['aria-label'] ?? placeholderText}
      data-testid={placeholderText}
      value={selected ? selected.toISOString().split('T')[0] : ''}
      onChange={(e) => onChange(e.target.value ? new Date(e.target.value) : null)}
    />
  ),
}));

beforeEach(() => {
  mockSearchHotels.mockClear();
});

describe('SearchForm', () => {
  it('renders the search form with correct role and label', () => {
    render(<SearchForm />);
    expect(screen.getByRole('search', { name: /search ski hotels/i })).toBeInTheDocument();
  });

  it('renders the search button', () => {
    render(<SearchForm />);
    expect(screen.getByRole('button', { name: /search hotels/i })).toBeInTheDocument();
  });

  it('renders check-in and check-out date inputs', () => {
    render(<SearchForm />);
    expect(screen.getByLabelText(/check-in/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/check-out/i)).toBeInTheDocument();
  });

  it('calls searchHotels when form is submitted with valid defaults', () => {
    render(<SearchForm />);
    fireEvent.submit(screen.getByRole('search'));
    expect(mockSearchHotels).toHaveBeenCalledTimes(1);
  });

  it('passes correctly formatted params to searchHotels', () => {
    render(<SearchForm />);
    fireEvent.submit(screen.getByRole('search'));

    expect(mockSearchHotels).toHaveBeenCalledWith(
      expect.objectContaining({
        ski_site: expect.any(Number),
        group_size: expect.any(Number),
        from_date: expect.stringMatching(/^\d{2}\/\d{2}\/\d{4}$/),
        to_date: expect.stringMatching(/^\d{2}\/\d{2}\/\d{4}$/),
      }),
    );
  });

  it('shows validation error when check-in date is cleared', () => {
    render(<SearchForm />);
    const checkIn = screen.getByLabelText(/check-in/i);
    fireEvent.change(checkIn, { target: { value: '' } });
    fireEvent.submit(screen.getByRole('search'));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(mockSearchHotels).not.toHaveBeenCalled();
  });

  it('shows validation error when check-out date is cleared', () => {
    render(<SearchForm />);
    const checkOut = screen.getByLabelText(/check-out/i);
    fireEvent.change(checkOut, { target: { value: '' } });
    fireEvent.submit(screen.getByRole('search'));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(mockSearchHotels).not.toHaveBeenCalled();
  });

  it('does not show a validation error on initial render', () => {
    render(<SearchForm />);
    const alert = screen.getByRole('alert');
    expect(alert).toBeEmptyDOMElement();
  });
});
