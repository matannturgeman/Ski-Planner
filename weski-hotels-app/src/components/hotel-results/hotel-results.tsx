import React from 'react';
import type { HotelRoom } from '../../types/hotels.types';
import './hotel-results.scss';

interface LastSearchMeta {
  resortName: string;
  dateLabel: string;
  groupSize: number;
}

interface Props {
  results: HotelRoom[];
  isStreaming: boolean;
  error: string | null;
  lastSearch: LastSearchMeta | null;
}

const LocationIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? '#f59e0b' : 'none'} stroke="#f59e0b" strokeWidth="1.5">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

function renderStars(count: number) {
  return Array.from({ length: 5 }, (_, i) => (
    <StarIcon key={i} filled={i < count} />
  ));
}

const HotelCard: React.FC<{ room: HotelRoom; resortName: string }> = ({ room, resortName }) => (
  <div className="hotel-card">
    <div className="hotel-card-image">
      <div className="hotel-card-image-placeholder" />
    </div>
    <div className="hotel-card-body">
      <div className="hotel-card-top">
        <h3 className="hotel-card-name">{room.hotel_name}</h3>
        {room.stars != null && (
          <div className="hotel-card-stars">{renderStars(room.stars)}</div>
        )}
        <div className="hotel-card-location">
          <LocationIcon />
          <span>{resortName}</span>
        </div>
        {room.room_name && (
          <div className="hotel-card-room">{room.room_name}{room.meal ? ` · ${room.meal}` : ''}</div>
        )}
      </div>
      <div className="hotel-card-footer">
        <span className="hotel-card-capacity">Sleeps {room.adults}</span>
        <div className="hotel-card-price">
          <span className="hotel-card-price-amount">£{room.price.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
          <span className="hotel-card-price-label">/per person</span>
        </div>
      </div>
    </div>
  </div>
);

const HotelResults: React.FC<Props> = ({ results, isStreaming, error, lastSearch }) => {
  if (error) {
    return <div className="hotel-results-message hotel-results-error">{error}</div>;
  }

  if (!lastSearch) return null;

  return (
    <div className="hotel-results">
      <div className="hotel-results-header">
        <h2 className="hotel-results-title">Select your ski trip</h2>
        <p className="hotel-results-subtitle">
          {isStreaming ? (
            <span className="hotel-results-loading">Searching...</span>
          ) : (
            <span>{results.length} ski trip{results.length !== 1 ? 's' : ''} option{results.length !== 1 ? 's' : ''}</span>
          )}
          {' '}·{' '}{lastSearch.resortName}{' '}·{' '}{lastSearch.dateLabel}{' '}·{' '}{lastSearch.groupSize} {lastSearch.groupSize === 1 ? 'person' : 'people'}
        </p>
      </div>

      {results.length === 0 && !isStreaming && (
        <div className="hotel-results-empty">No hotels found for your search.</div>
      )}

      <div className="hotel-results-list">
        {results.map((room, index) => (
          <HotelCard
            key={`${room.hotel_name}-${room.room_name}-${index}`}
            room={room}
            resortName={lastSearch.resortName}
          />
        ))}
      </div>
    </div>
  );
};

export default HotelResults;
