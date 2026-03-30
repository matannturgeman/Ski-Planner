import React from "react";
import * as SelectRaddix from '@radix-ui/react-select';

import "./select.scss";

interface Props {
    onChange: (value: string) => void;
    value: string;
    options: {label: string; value: string}[];
    ariaLabel?: string;
}

const Select: React.FC<Props> = ({onChange, value, options, ariaLabel}) => {
    return (
        <SelectRaddix.Root onValueChange={value => onChange(value)} value={value}>
            <SelectRaddix.Trigger className="select-trigger" aria-label={ariaLabel}>
                <SelectRaddix.Value />
            </SelectRaddix.Trigger>

            <SelectRaddix.Portal>
                <SelectRaddix.Content position="popper" className="select-content">
                    <SelectRaddix.Viewport className="select-viewport">
                        <SelectRaddix.Group>
                            {options.map(option => (
                                <SelectRaddix.Item key={option.value} className="select-item" value={option.value}>
                                    <SelectRaddix.ItemText>{option.label}</SelectRaddix.ItemText>
                                </SelectRaddix.Item>
                            ))}
                        </SelectRaddix.Group>
                    </SelectRaddix.Viewport>
                </SelectRaddix.Content>
            </SelectRaddix.Portal>
        </SelectRaddix.Root>
    );
}

export default Select;