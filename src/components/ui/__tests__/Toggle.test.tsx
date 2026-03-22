import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Toggle } from '../Toggle';

describe('Toggle', () => {
  it('renders label', () => {
    const { getByText } = render(<Toggle label="WiFi Only" value={false} onValueChange={() => {}} />);
    expect(getByText('WiFi Only')).toBeTruthy();
  });
  it('calls onValueChange when toggled', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(<Toggle label="WiFi" value={false} onValueChange={onChange} testID="toggle" />);
    fireEvent(getByTestId('toggle'), 'valueChange', true);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
