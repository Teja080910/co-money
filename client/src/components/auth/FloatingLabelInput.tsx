import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type ReturnKeyTypeOptions,
  type TextInputProps,
  type TextInput as RNTextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import type { AppTheme } from '../../theme/theme';

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  error?: string;
  helperText?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  secureTextEntry?: boolean;
  onToggleSecureEntry?: () => void;
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
  valid?: boolean;
  accessibleLabel?: string;
  inputRef?: React.RefObject<RNTextInput | null>;
  onFocus?: TextInputProps['onFocus'];
  onBlur?: TextInputProps['onBlur'];
  multiline?: boolean;
  numberOfLines?: number;
  editable?: boolean;
};

export function FloatingLabelInput({
  label,
  value,
  onChangeText,
  icon,
  error,
  helperText,
  keyboardType,
  autoCapitalize = 'none',
  autoComplete,
  textContentType,
  secureTextEntry,
  onToggleSecureEntry,
  returnKeyType,
  onSubmitEditing,
  valid = false,
  accessibleLabel,
  inputRef,
  onFocus,
  onBlur,
  multiline = false,
  numberOfLines,
  editable = true,
}: Props) {
  const theme = useTheme<AppTheme>();
  const [isFocused, setIsFocused] = useState(false);
  const labelProgress = useRef(new Animated.Value(value ? 1 : 0)).current;
  const focusProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(labelProgress, {
      toValue: isFocused || Boolean(value) ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [isFocused, labelProgress, value]);

  useEffect(() => {
    Animated.timing(focusProgress, {
      toValue: isFocused ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [focusProgress, isFocused]);

  const hasError = Boolean(error);
  const borderColor = focusProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.custom.border, hasError ? theme.custom.error : theme.custom.brand],
  });

  const shadowOpacity = focusProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.22],
  });

  const labelStyle = useMemo(
    () => ({
      top: labelProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [18, 8],
      }),
      fontSize: labelProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [15, 12],
      }),
      color: labelProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [theme.custom.textSecondary, hasError ? theme.custom.error : theme.custom.brand],
      }),
    }),
    [hasError, labelProgress, theme.custom.brand, theme.custom.error, theme.custom.textSecondary],
  );

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: theme.custom.input,
            borderColor,
            shadowColor: theme.custom.brand,
            shadowOpacity,
          },
        ]}
      >
        <MaterialCommunityIcons
          accessibilityElementsHidden
          importantForAccessibility="no"
          name={icon}
          size={20}
          color={hasError ? theme.custom.error : isFocused ? theme.custom.brand : theme.custom.textSecondary}
          style={styles.leftIcon}
        />
        <Animated.Text pointerEvents="none" style={[styles.label, labelStyle]}>
          {label}
        </Animated.Text>
        <TextInput
          accessibilityLabel={accessibleLabel ?? label}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          editable={editable}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onBlur={event => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          onChangeText={onChangeText}
          onFocus={event => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onSubmitEditing={onSubmitEditing}
          placeholder={isFocused ? '' : undefined}
          placeholderTextColor={theme.custom.textSecondary}
          returnKeyType={returnKeyType}
          ref={inputRef}
          secureTextEntry={secureTextEntry}
          selectionColor={theme.custom.brand}
          style={[styles.input, multiline ? styles.multilineInput : null, { color: theme.custom.textPrimary }]}
          textContentType={textContentType}
          textAlignVertical={multiline ? 'top' : 'center'}
          value={value}
        />
        {onToggleSecureEntry ? (
          <Pressable
            accessibilityLabel={secureTextEntry ? `Show ${label}` : `Hide ${label}`}
            accessibilityRole="button"
            hitSlop={12}
            onPress={onToggleSecureEntry}
            style={styles.rightAction}
          >
            <MaterialCommunityIcons
              name={secureTextEntry ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={theme.custom.textSecondary}
            />
          </Pressable>
        ) : valid ? (
          <View accessibilityElementsHidden importantForAccessibility="no" style={styles.rightAction}>
            <MaterialCommunityIcons name="check-decagram" size={18} color={theme.custom.success} />
          </View>
        ) : null}
      </Animated.View>
      <View style={styles.helperRow}>
        {hasError ? <Text style={[styles.errorText, { color: theme.custom.error }]}>{error}</Text> : null}
        {!hasError && helperText ? (
          <Text style={[styles.helperText, { color: theme.custom.textSecondary }]}>{helperText}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  container: {
    minHeight: 64,
    borderWidth: 1.2,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 8,
  },
  leftIcon: {
    marginRight: 12,
  },
  label: {
    position: 'absolute',
    left: 48,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingTop: 22,
    paddingBottom: 10,
    minHeight: 62,
  },
  multilineInput: {
    minHeight: 104,
    paddingTop: 28,
  },
  rightAction: {
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  helperRow: {
    minHeight: 20,
    paddingHorizontal: 4,
    paddingTop: 6,
  },
  helperText: {
    fontSize: 12,
    lineHeight: 16,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
});
