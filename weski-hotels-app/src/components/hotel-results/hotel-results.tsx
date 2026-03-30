import React, { useState, useEffect, useRef } from 'react';
import type { HotelRoom, HotelSearchRequest } from '../../types/hotels.types';
import { useSearchHotelsMutation } from '../../store';
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
  lastSearchParams: HotelSearchRequest | null;
}

const LocationIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const SkiIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 17l4-8 4 4 4-6 4 10"/>
  </svg>
);

function renderStars(count: number) {
  return Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={`star ${i < count ? 'star--filled' : 'star--empty'}`}>★</span>
  ));
}

const HotelCardSkeleton = () => (
  <div className="hotel-card hotel-card--skeleton">
    <div className="hotel-card-image skeleton-box" />
    <div className="hotel-card-body">
      <div className="skeleton-line skeleton-line--title" />
      <div className="skeleton-line skeleton-line--short" />
      <div className="skeleton-line skeleton-line--short" />
    </div>
  </div>
);

const PLACEHOLDER = 'https://placehold.co/215x150?text=No+Image';

const HotelImage: React.FC<{ src: string | undefined; alt: string }> = ({ src, alt }) => {
  const [imgSrc, setImgSrc] = useState<string>(src || PLACEHOLDER);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!src) return;
    timerRef.current = setTimeout(() => setImgSrc(PLACEHOLDER), 3000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [src]);

  const handleLoad = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleError = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setImgSrc(PLACEHOLDER);
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      className="hotel-card-img"
      onLoad={handleLoad}
      onError={handleError}
    />
  );
};

const HotelCard: React.FC<{ room: HotelRoom; resortName: string }> = ({ room, resortName }) => (
  <div className="hotel-card">
    <div className="hotel-card-image">
      <HotelImage src={room.image_url} alt={room.hotel_name} />
    </div>
    <div className="hotel-card-body">
      <div className="hotel-card-top">
        <h3 className="hotel-card-name">{room.hotel_name}</h3>
        {room.stars > 0 && (
          <div className="hotel-card-stars">{renderStars(room.stars)}</div>
        )}
        <div className="hotel-card-location">
          <LocationIcon />
          <span>{resortName}</span>
        </div>
        {room.ski_lift_distance && (
          <div className="hotel-card-ski-lift">
            <SkiIcon />
            <span>{room.ski_lift_distance} to ski lift</span>
          </div>
        )}
      </div>
      <div className="hotel-card-footer">
        <span className="hotel-card-capacity">Sleeps {room.beds}</span>
        <div className="hotel-card-price">
          <span className="hotel-card-price-amount">
            £{room.price.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
          <span className="hotel-card-price-label">/per person</span>
        </div>
      </div>
    </div>
  </div>
);

const HotelResults: React.FC<Props> = ({ results, isStreaming, error, lastSearch, lastSearchParams }) => {
  const [searchHotels, { isLoading }] = useSearchHotelsMutation();

  if (error) {
    return (
      <div className="hotel-results-message hotel-results-error">
        {error}
        {lastSearchParams && (
          <button
            className="hotel-results-retry-btn"
            onClick={() => searchHotels(lastSearchParams)}
            disabled={isLoading}
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  if (!lastSearch) return null;

  const showSkeletons = isStreaming && results.length === 0;

  return (
    <div className="hotel-results">
      <div className="hotel-results-header">
        <h2 className="hotel-results-title">Select your ski trip</h2>
        <p className="hotel-results-subtitle">
          {isStreaming ? (
            <span className="hotel-results-loading">
              {results.length > 0 ? `${results.length} found so far…` : 'Searching…'}
            </span>
          ) : (
            <span>{results.length} ski trip{results.length !== 1 ? 's' : ''} option{results.length !== 1 ? 's' : ''}</span>
          )}
          {' · '}{lastSearch.resortName}
          {' · '}{lastSearch.dateLabel}
          {' · '}{lastSearch.groupSize} {lastSearch.groupSize === 1 ? 'person' : 'people'}
        </p>
      </div>

      {results.length === 0 && !isStreaming && (
        <div className="hotel-results-empty">No hotels found for your search.</div>
      )}

      <div className="hotel-results-list">
        {showSkeletons && (
          <>
            <HotelCardSkeleton />
            <HotelCardSkeleton />
            <HotelCardSkeleton />
          </>
        )}
        {results.map((room) => (
          <HotelCard
            key={`${room.hotel_code}-${room.beds}`}
            room={room}
            resortName={lastSearch.resortName}
          />
        ))}
      </div>
    </div>
  );
};

export default HotelResults;
