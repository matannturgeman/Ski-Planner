import React, { useState } from 'react';
import './search-form.scss';
import ResortsSelect from './resorts-select/resorts-select';
import GuestsSelect from './guests-select/guests-select';
import DatePicker from 'react-datepicker';
import dayjs from 'dayjs';
import { useSearchHotelsMutation } from '../../store';
import { HotelSearchRequestSchema } from '../../types/hotels.types';
import { Button } from '../../design-system';

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const SearchForm: React.FC = () => {
  const [skiSiteId, setSkiSiteId] = useState<number>(1);
  const [groupSize, setGroupSize] = useState<number>(1);
  const [startDate, setStartDate] = useState<Date | null>(dayjs().toDate());
  const [endDate, setEndDate] = useState<Date | null>(dayjs().add(10, 'day').toDate());
  const [validationError, setValidationError] = useState<string | null>(null);

  const [searchHotels, { isLoading }] = useSearchHotelsMutation();

  const handleSearch = () => {
    setValidationError(null);

    const params = {
      ski_site: skiSiteId,
      group_size: groupSize,
      from_date: startDate ? dayjs(startDate).format('DD/MM/YYYY') : '',
      to_date: endDate ? dayjs(endDate).format('DD/MM/YYYY') : '',
    };

    const parsed = HotelSearchRequestSchema.safeParse(params);
    if (!parsed.success) {
      setValidationError(parsed.error.errors[0]?.message ?? 'Invalid input');
      return;
    }

    searchHotels(parsed.data);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div className="search-form">
        {/* Destination */}
        <div className="search-form-segment">
          <ResortsSelect value={skiSiteId} onChange={setSkiSiteId} />
        </div>

        {/* Group size */}
        <div className="search-form-segment">
          <GuestsSelect value={groupSize} onChange={setGroupSize} />
        </div>

        {/* Date range */}
        <div className="search-form-date-range">
          <CalendarIcon />
          <DatePicker
            className="search-form-date-picker"
            selected={startDate}
            onChange={setStartDate}
            enableTabLoop={false}
            placeholderText="Check-in"
            dateFormat="MMM d"
          />
          <span className="date-separator">–</span>
          <DatePicker
            className="search-form-date-picker"
            selected={endDate}
            onChange={setEndDate}
            enableTabLoop={false}
            placeholderText="Check-out"
            minDate={startDate ?? undefined}
            dateFormat="MMM d"
          />
        </div>

        {/* Search button */}
        <Button
          variant="primary"
          className="search-form-search-btn"
          onClick={handleSearch}
          disabled={isLoading}
        >
          <SearchIcon />
          {isLoading ? 'Searching...' : 'Search'}
        </Button>
      </div>

      {validationError && (
        <span className="search-form-error">{validationError}</span>
      )}
    </div>
  );
};

export default SearchForm;
