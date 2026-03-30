import React from 'react';
import type { HotelRoom } from '../../types/hotels.types';
import './hotel-results.scss';

interface Props {
  results: HotelRoom[];
  isStreaming: boolean;
  error: string | null;
  hasSearched: boolean;
}

const HotelResults: React.FC<Props> = ({ results, isStreaming, error, hasSearched }) => {
  if (error) {
    return <div className="hotel-results-message hotel-results-error">{error}</div>;
  }

  if (!hasSearched) {
    return null;
  }

  return (
    <div className="hotel-results">
      {isStreaming && (
        <div className="hotel-results-status">
          Searching across providers...{results.length > 0 && ` ${results.length} room${results.length !== 1 ? 's' : ''} found so far`}
        </div>
      )}

      {results.length === 0 && !isStreaming && (
        <div className="hotel-results-message">No rooms found for your search.</div>
      )}

      <div className="hotel-results-grid">
        {results.map((room, index) => (
          <div key={index} className="hotel-card">
            <div className="hotel-card-header">
              <h3 className="hotel-card-name">{room.hotel_name}</h3>
              <span className="hotel-card-capacity">Sleeps {room.adults}</span>
            </div>
            <div className="hotel-card-room">{room.room_name}</div>
            {room.meal && (
              <div className="hotel-card-meal">{room.meal}</div>
            )}
            <div className="hotel-card-price">£{room.price.toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HotelResults;
