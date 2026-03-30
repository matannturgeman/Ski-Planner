import React from 'react';
import NavBar from './components/navbar/nav-bar';
import HotelResults from './components/hotel-results/hotel-results';
import { useAppSelector } from './store';
import './App.css';

const App: React.FC = () => {
  const { results, isStreaming, error, lastSearch } = useAppSelector(
    (state) => state.hotels,
  );

  return (
    <div className="app">
      <NavBar />
      <main className="app-main">
        <HotelResults
          results={results}
          isStreaming={isStreaming}
          error={error}
          lastSearch={lastSearch}
        />
      </main>
    </div>
  );
};

export default App;
