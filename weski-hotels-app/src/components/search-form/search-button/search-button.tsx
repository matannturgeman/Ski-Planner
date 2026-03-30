import React from 'react';
import './search-button.scss';

interface Props {
  onClick?: () => void;
  disabled?: boolean;
}

const SearchButton: React.FC<Props> = ({ onClick, disabled }) => {
  return (
    <button className="search-button" onClick={onClick} disabled={disabled}>
      {disabled ? 'Searching...' : 'Search'}
    </button>
  );
};

export default SearchButton;
