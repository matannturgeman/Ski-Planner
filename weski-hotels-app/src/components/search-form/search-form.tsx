import React, { useState } from 'react';
import './search-form.scss';
import ResortsSelect from './resorts-select/resorts-select';
import GuestsSelect from './guests-select/guests-select';
import SearchButton from './search-button/search-button';
import DatePicker from 'react-datepicker';
import dayjs from 'dayjs';
import { useSearchHotelsMutation } from '../../store';
import { HotelSearchRequestSchema } from '../../types/hotels.types';

const SearchForm: React.FC = () => {
  const [skiSiteId, setSkiSiteId] = useState<number>(1);
  const [groupSize, setGroupSize] = useState<number>(1);
  const [startDate, setStartDate] = useState<Date | null>(dayjs().toDate());
  const [endDate, setEndDate] = useState<Date | null>(dayjs().add(7, 'days').toDate());
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
    <div className="search-form">
      <ResortsSelect value={skiSiteId} onChange={setSkiSiteId} />
      <GuestsSelect value={groupSize} onChange={setGroupSize} />

      <DatePicker
        className="search-form-date-picker"
        selected={startDate}
        onChange={setStartDate}
        enableTabLoop={false}
        placeholderText="Check-in"
      />
      <DatePicker
        className="search-form-date-picker"
        selected={endDate}
        onChange={setEndDate}
        enableTabLoop={false}
        placeholderText="Check-out"
        minDate={startDate ?? undefined}
      />

      <SearchButton onClick={handleSearch} disabled={isLoading} />

      {validationError && (
        <span className="search-form-error">{validationError}</span>
      )}
    </div>
  );
};

export default SearchForm;
