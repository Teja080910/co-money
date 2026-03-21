import React, { useEffect, useRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import type { AppTheme } from '../../theme/theme';

type Props = {
  value: string;
  length?: number;
  onChange: (value: string) => void;
};

export function OtpInput({ value, length = 6, onChange }: Props) {
  const theme = useTheme<AppTheme>();
  const refs = useRef<Array<TextInput | null>>([]);
  const digits = Array.from({ length }, (_, index) => value[index] ?? '');

  useEffect(() => {
    const nextIndex = Math.min(value.length, length - 1);
    refs.current[nextIndex]?.focus();
  }, [length, value.length]);

  const updateDigit = (text: string, index: number) => {
    const cleaned = text.replace(/\D/g, '');

    if (cleaned.length > 1) {
      onChange(cleaned.slice(0, length));
      refs.current[Math.min(cleaned.length, length) - 1]?.focus();
      return;
    }

    const nextDigits = [...digits];
    nextDigits[index] = cleaned;
    const joined = nextDigits.join('').slice(0, length);
    onChange(joined);

    if (cleaned && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key !== 'Backspace') {
      return;
    }

    if (digits[index]) {
      const nextDigits = [...digits];
      nextDigits[index] = '';
      onChange(nextDigits.join(''));
      return;
    }

    if (index > 0) {
      const nextDigits = [...digits];
      nextDigits[index - 1] = '';
      onChange(nextDigits.join(''));
      refs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      {digits.map((digit, index) => {
        const isFilled = Boolean(digit);

        return (
          <TextInput
            key={index}
            ref={ref => {
              refs.current[index] = ref;
            }}
            accessibilityLabel={`OTP digit ${index + 1}`}
            autoComplete={index === 0 ? 'sms-otp' : 'off'}
            keyboardType="number-pad"
            maxLength={length}
            onChangeText={text => updateDigit(text, index)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
            selectionColor={theme.custom.brand}
            style={[
              styles.input,
              {
                backgroundColor: theme.custom.input,
                borderColor: isFilled ? theme.custom.brand : theme.custom.border,
                color: theme.custom.textPrimary,
                shadowColor: isFilled ? theme.custom.brand : theme.custom.shadow,
              },
            ]}
            textAlign="center"
            textContentType="oneTimeCode"
            value={digit}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 62,
    borderRadius: 18,
    borderWidth: 1.2,
    fontSize: 24,
    fontWeight: '800',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
});
