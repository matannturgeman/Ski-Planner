import Select from '../../select/select';
import { RESORTS } from '../../../data/resorts';

interface Props {
  onChange: (resortId: number) => void;
  value: number;
}

const MountainIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, color: '#6b7280' }}>
    <polygon points="3 20 21 20 12 4"/>
    <polyline points="8 14 12 10 16 14"/>
  </svg>
);

const ResortsSelect: React.FC<Props> = ({ onChange, value }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <MountainIcon />
      <Select
        onChange={(resortId) => onChange(Number(resortId))}
        value={value.toString()}
        options={RESORTS.map((resort) => ({
          label: resort.name,
          value: resort.id.toString(),
        }))}
      />
    </div>
  );
};

export default ResortsSelect;
