import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { Menu, useTheme } from 'react-native-paper';
import type { AppTheme } from '../../theme/theme';

type SelectOption = {
  label: string;
  value: string;
};

type Props = {
  label: string;
  value: string;
  options: SelectOption[];
  onSelect: (value: string) => void;
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
};

export function SelectField({
  label,
  value,
  options,
  onSelect,
  placeholder,
  helperText,
  disabled = false,
  icon = 'chevron-down',
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const [visible, setVisible] = useState(false);
  const [anchorWidth, setAnchorWidth] = useState(0);
  const resolvedPlaceholder = placeholder ?? t('common.selectOption');

  const selectedLabel = useMemo(
    () => options.find(option => option.value === value)?.label ?? '',
    [options, value],
  );

  const handleOpen = () => {
    if (!disabled && options.length) {
      setVisible(true);
    }
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    setAnchorWidth(event.nativeEvent.layout.width);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.custom.textSecondary }]}>
        {label}
      </Text>
      <Menu
        visible={visible}
        onDismiss={() => setVisible(false)}
        anchor={
          <Pressable
            onLayout={handleLayout}
            onPress={handleOpen}
            disabled={disabled || !options.length}
            style={[
              styles.field,
              {
                backgroundColor: theme.custom.surface,
                borderColor: theme.custom.border,
                opacity: disabled ? 0.65 : 1,
              },
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.value,
                {
                  color: selectedLabel ? theme.custom.textPrimary : theme.custom.textSecondary,
                },
              ]}
            >
              {selectedLabel || resolvedPlaceholder}
            </Text>
            <MaterialCommunityIcons
              name={icon}
              size={20}
              color={theme.custom.textSecondary}
            />
          </Pressable>
        }
        contentStyle={[
          styles.menu,
          {
            width: anchorWidth || undefined,
            backgroundColor: theme.custom.surfaceStrong,
          },
        ]}
      >
        {options.map(option => (
          <Menu.Item
            key={option.value}
            onPress={() => {
              onSelect(option.value);
              setVisible(false);
            }}
            title={option.label}
            titleStyle={{
              color: option.value === value ? theme.custom.brandStrong : theme.custom.textPrimary,
              fontWeight: option.value === value ? '700' : '500',
            }}
          />
        ))}
      </Menu>
      {helperText ? (
        <Text style={[styles.helperText, { color: theme.custom.textSecondary }]}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  field: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  value: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  helperText: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
  },
  menu: {
    borderRadius: 18,
  },
});
