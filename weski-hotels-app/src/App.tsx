import React, { useEffect } from 'react';
import NavBar from './components/navbar/nav-bar';
import HotelResults from './components/hotel-results/hotel-results';
import { useAppSelector } from './store';
import './App.css';

const App: React.FC = () => {
  const { results, isStreaming, error, lastSearch, lastSearchParams } = useAppSelector(
    (state) => state.hotels,
  );

  useEffect(() => {
    if (lastSearch) {
      document.title = `${lastSearch.resortName} — WeSki Ski Hotels`;
    } else {
      document.title = 'WeSki — Find Your Perfect Ski Hotel';
    }
  }, [lastSearch]);

  return (
    <div className="app">
      <NavBar />
      <main id="main-content" className="app-main" tabIndex={-1}>
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
