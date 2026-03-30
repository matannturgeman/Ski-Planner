import React from 'react';
import { Button } from '../../../design-system';

interface Props {
  onClick?: () => void;
  disabled?: boolean;
}

const SearchButton: React.FC<Props> = ({ onClick, disabled }) => {
  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={disabled}>
      {disabled ? 'Searching...' : 'Search'}
    </Button>
  );
};

export default SearchButton;
