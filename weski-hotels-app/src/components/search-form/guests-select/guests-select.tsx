import Select from '../../select/select';
import './guests-select.scss';

interface Props {
  onChange: (groupSize: number) => void;
  value: number;
}

const PersonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, color: '#6b7280' }} aria-hidden="true" focusable="false">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const GuestsSelect: React.FC<Props> = ({ onChange, value }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <PersonIcon />
      <Select
        onChange={(groupSize) => onChange(Number(groupSize))}
        value={value.toString()}
        ariaLabel="Number of guests"
        options={Array.from({ length: 10 }).map((_, index) => ({
          label: `${index + 1} ${index + 1 > 1 ? 'people' : 'person'}`,
          value: (index + 1).toString(),
        }))}
      />
    </div>
  );
};

export default GuestsSelect;
