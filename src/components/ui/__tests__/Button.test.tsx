import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('renders label text', () => {
    const { getByText } = render(<Button label="Tap me" onPress={() => {}} />);
    expect(getByText('Tap me')).toBeTruthy();
  });
  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="Tap me" onPress={onPress} />);
    fireEvent.press(getByText('Tap me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="Tap me" onPress={onPress} disabled />);
    fireEvent.press(getByText('Tap me'));
    expect(onPress).not.toHaveBeenCalled();
  });
  it('renders secondary variant', () => {
    const { getByTestId } = render(<Button label="Secondary" onPress={() => {}} variant="secondary" testID="btn" />);
    expect(getByTestId('btn')).toBeTruthy();
  });
});
