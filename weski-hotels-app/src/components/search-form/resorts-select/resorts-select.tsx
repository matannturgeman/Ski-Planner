import Select from '../../select/select';

interface Props {
    onChange: (resortId: number) => void;
    value: number;
}

const resorts = [
    {
      id: 1,
      name: 'Val Thorens'
    },
    {
      id: 2,
      name: 'Courchevel'
    },
    {
      id: 3,
      name: 'Tignes'
    },
    {
      id: 4,
      name: 'La Plagne'
    },
    {
      id: 5,
      name: 'Chamonix'
    }
  ]
  

const ResortsSelect: React.FC<Props> = ({onChange, value}) => {
    return (
        <Select
            onChange={resortId => onChange(Number(resortId))} 
            value={value.toString()} 
            options={resorts.map(resort => ({label: resort.name, value: resort.id.toString()}))} 
        />
    )
}

export default ResortsSelect;