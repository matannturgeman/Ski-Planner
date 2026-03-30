import React, { useState, useEffect, useCallback } from 'react';
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

function readUrlParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    skiSiteId: p.has('resort') ? Number(p.get('resort')) : null,
    groupSize: p.has('guests') ? Number(p.get('guests')) : null,
    startDate: p.has('from') ? dayjs(p.get('from')).toDate() : null,
    endDate: p.has('to') ? dayjs(p.get('to')).toDate() : null,
  };
}

function syncUrlParams(skiSiteId: number, groupSize: number, startDate: Date | null, endDate: Date | null) {
  const p = new URLSearchParams();
  p.set('resort', String(skiSiteId));
  p.set('guests', String(groupSize));
  if (startDate) p.set('from', dayjs(startDate).format('YYYY-MM-DD'));
  if (endDate) p.set('to', dayjs(endDate).format('YYYY-MM-DD'));
  history.replaceState(null, '', `?${p.toString()}`);
}

const SearchForm: React.FC = () => {
  const initial = readUrlParams();
  const [skiSiteId, setSkiSiteId] = useState<number>(initial.skiSiteId ?? 1);
  const [groupSize, setGroupSize] = useState<number>(initial.groupSize ?? 1);
  const [startDate, setStartDate] = useState<Date | null>(initial.startDate ?? dayjs().toDate());
  const [endDate, setEndDate] = useState<Date | null>(initial.endDate ?? dayjs().add(10, 'day').toDate());
  const [validationError, setValidationError] = useState<string | null>(null);

  const [searchHotels, { isLoading }] = useSearchHotelsMutation();

  // Keep URL in sync whenever filters change
  useEffect(() => {
    syncUrlParams(skiSiteId, groupSize, startDate, endDate);
  }, [skiSiteId, groupSize, startDate, endDate]);

  const handleSearch = useCallback(() => {
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
  }, [skiSiteId, groupSize, startDate, endDate, searchHotels]);

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
