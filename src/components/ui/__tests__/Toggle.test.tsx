import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../../context/ThemeContext';
import { Toggle } from '../Toggle';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('Toggle', () => {
  it('renders label', () => {
    const { getByText } = renderWithTheme(<Toggle label="WiFi Only" value={false} onValueChange={() => {}} />);
    expect(getByText('WiFi Only')).toBeTruthy();
  });
  it('calls onValueChange when toggled', () => {
    const onChange = jest.fn();
    const { getByTestId } = renderWithTheme(<Toggle label="WiFi" value={false} onValueChange={onChange} testID="toggle" />);
    fireEvent(getByTestId('toggle'), 'valueChange', true);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
