import React, { useEffect } from 'react';
import NavBar from './components/navbar/nav-bar';
import HotelResults from './components/hotel-results/hotel-results';
import { useAppSelector, useSearchHotelsMutation } from './store';
import './App.css';

const App: React.FC = () => {
  const { results, isStreaming, error, lastSearch, lastSearchParams } = useAppSelector(
    (state) => state.hotels,
  );
  const [searchHotels] = useSearchHotelsMutation();

  useEffect(() => {
    const timer = setTimeout(() => {
      searchHotels({ ski_site: 1, group_size: 1, from_date: '03/04/2025', to_date: '11/04/2025' });
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="app">
      <NavBar />
      <main className="app-main">
        <HotelResults
          results={results}
          isStreaming={isStreaming}
          error={error}
          lastSearch={lastSearch}
          lastSearchParams={lastSearchParams}
        />
      </main>
    </div>
  );
};

export default App;
