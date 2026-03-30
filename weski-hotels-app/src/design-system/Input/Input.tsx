import React from 'react';
import './Input.scss';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input: React.FC<InputProps> = ({ className, ...rest }) => {
  const classes = ['ds-input', className].filter(Boolean).join(' ');
  return <input className={classes} {...rest} />;
};

export default Input;
