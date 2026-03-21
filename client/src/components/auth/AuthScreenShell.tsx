import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import type { AppTheme } from '../../theme/theme';

type Props = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  badge?: React.ReactNode;
  cardStyle?: StyleProp<ViewStyle>;
  centerHeader?: boolean;
};

export function AuthScreenShell({
  title,
  subtitle,
  children,
  footer,
  badge,
  cardStyle,
  centerHeader = false,
}: Props) {
  const theme = useTheme<AppTheme>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(entrance, {
      toValue: 1,
      useNativeDriver: true,
      damping: 18,
      stiffness: 160,
      mass: 0.9,
    }).start();
  }, [entrance]);

  const isCompact = width < 380;
  const cardMaxWidth = Math.min(width - 24, 520);
  const heroTranslateY = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 0],
  });

  const backgroundLayers = useMemo(
    () => [
      {
        backgroundColor: colorScheme === 'dark' ? 'rgba(122,162,255,0.16)' : 'rgba(47,107,255,0.18)',
        height: 260,
        width: 260,
        top: -40,
        right: -40,
      },
      {
        backgroundColor: colorScheme === 'dark' ? 'rgba(52,211,153,0.12)' : 'rgba(14,165,233,0.12)',
        height: 220,
        width: 220,
        bottom: 120,
        left: -70,
      },
      {
        backgroundColor: colorScheme === 'dark' ? 'rgba(244,114,182,0.1)' : 'rgba(251,191,36,0.14)',
        height: 180,
        width: 180,
        bottom: -20,
        right: 40,
      },
    ],
    [colorScheme],
  );

  return (
    <Pressable style={[styles.root, { backgroundColor: theme.custom.background }]} onPress={Keyboard.dismiss}>
      {backgroundLayers.map(layer => (
        <View key={`${layer.height}-${layer.width}-${layer.top ?? layer.bottom}`} style={[styles.blob, layer]} />
      ))}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top + 16, 32),
              paddingBottom: Math.max(insets.bottom + 24, 32),
              paddingHorizontal: isCompact ? 16 : 24,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.card,
              {
                maxWidth: cardMaxWidth,
                backgroundColor: theme.custom.surface,
                borderColor: theme.custom.border,
                shadowColor: theme.custom.shadow,
                opacity: entrance,
                transform: [{ translateY: heroTranslateY }, { scale: entrance.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.98, 1],
                }) }],
              },
              cardStyle,
            ]}
          >
            {badge ? <View style={styles.badgeWrap}>{badge}</View> : null}
            <View style={[styles.header, centerHeader ? styles.headerCentered : null]}>
              <Text style={[styles.title, centerHeader ? styles.textCentered : null, { color: theme.custom.textPrimary }]}>
                {title}
              </Text>
              <Text style={[styles.subtitle, centerHeader ? styles.textCentered : null, { color: theme.custom.textSecondary }]}>
                {subtitle}
              </Text>
            </View>
            {children}
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 1,
    shadowRadius: 42,
    elevation: 12,
    overflow: 'hidden',
  },
  badgeWrap: {
    alignItems: 'center',
    marginBottom: 18,
  },
  header: {
    marginBottom: 28,
    gap: 8,
  },
  headerCentered: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  textCentered: {
    textAlign: 'center',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
});
