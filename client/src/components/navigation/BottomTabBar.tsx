import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import type { AppTabRoute } from '../../navigation/types';
import type { AppTheme } from '../../theme/theme';

type Props = {
  routes: AppTabRoute[];
  routeIndex: number;
  onSelectRoute: (index: number) => void;
  bottomInset: number;
};

export function BottomTabBar({ routes, routeIndex, onSelectRoute, bottomInset }: Props) {
  const theme = useTheme<AppTheme>();
  const { width } = useWindowDimensions();
  const isCompactLayout = routes.length <= 4;
  const isDesktopWeb = Platform.OS === 'web' && width >= 1120;

  if (!routes.length) {
    return null;
  }

  if (isDesktopWeb) {
    return (
      <View style={styles.desktopShell}>
        <Text style={[styles.desktopTitle, { color: theme.custom.textPrimary }]}>Workspace</Text>
        <Text style={[styles.desktopSubtitle, { color: theme.custom.textSecondary }]}>
          Move between your app tools without the mobile tab bar.
        </Text>
        <View style={[styles.desktopBar, { backgroundColor: theme.custom.surfaceStrong, borderColor: theme.custom.border }]}>
          {routes.map((route, index) => {
            const focused = index === routeIndex;

            return (
              <Pressable
                key={route.key}
                onPress={() => onSelectRoute(index)}
                style={[
                  styles.desktopTab,
                  focused ? [styles.desktopTabActive, { backgroundColor: 'rgba(47,107,255,0.1)', borderColor: 'rgba(47,107,255,0.18)' }] : null,
                ]}
              >
                <View style={[styles.desktopIconWrap, focused ? styles.iconWrapActive : null]}>
                  <MaterialCommunityIcons
                    name={(focused ? route.focusedIcon : route.unfocusedIcon) as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
                    size={20}
                    color={focused ? '#FFFFFF' : theme.custom.textSecondary}
                  />
                </View>
                <View style={styles.desktopLabelWrap}>
                  <Text style={[styles.desktopLabel, { color: focused ? theme.custom.brandStrong : theme.custom.textPrimary }]}>
                    {route.title}
                  </Text>
                  <Text style={[styles.desktopMeta, { color: theme.custom.textSecondary }]}>
                    {focused ? 'Current section' : 'Open section'}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        {isCompactLayout ? (
          <View style={[styles.row, { paddingBottom: Math.max(bottomInset, 10) }]}>
            {routes.map((route, index) => {
              const focused = index === routeIndex;

              return (
                <Pressable
                  key={route.key}
                  onPress={() => onSelectRoute(index)}
                  style={[styles.tab, styles.tabFill, focused ? styles.tabActive : null]}
                >
                  <View style={[styles.iconWrap, focused ? styles.iconWrapActive : null]}>
                    <MaterialCommunityIcons
                      name={(focused ? route.focusedIcon : route.unfocusedIcon) as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
                      size={20}
                      color={focused ? '#FFFFFF' : theme.custom.textSecondary}
                    />
                  </View>
                  <Text style={[styles.label, { color: focused ? theme.custom.brandStrong : theme.custom.textSecondary }]}>
                    {route.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(bottomInset, 10) }]}
          >
            {routes.map((route, index) => {
              const focused = index === routeIndex;

              return (
                <Pressable
                  key={route.key}
                  onPress={() => onSelectRoute(index)}
                  style={[styles.tab, focused ? styles.tabActive : null]}
                >
                  <View style={[styles.iconWrap, focused ? styles.iconWrapActive : null]}>
                    <MaterialCommunityIcons
                      name={(focused ? route.focusedIcon : route.unfocusedIcon) as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
                      size={20}
                      color={focused ? '#FFFFFF' : theme.custom.textSecondary}
                    />
                  </View>
                  <Text style={[styles.label, { color: focused ? theme.custom.brandStrong : theme.custom.textSecondary }]}>
                    {route.title}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    marginTop: 0,
  },
  desktopShell: {
    width: '100%',
    gap: 14,
  },
  desktopTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  desktopSubtitle: {
    fontSize: 14,
    lineHeight: 21,
  },
  desktopBar: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 12,
    gap: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.1,
    shadowRadius: 22,
    elevation: 10,
  },
  bar: {
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.08)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 10,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: 10,
    paddingTop: 8,
    gap: 8,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingTop: 8,
    alignItems: 'center',
    gap: 8,
  },
  tab: {
    minWidth: 74,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabFill: {
    flex: 1,
    minWidth: 0,
  },
  tabActive: {
    backgroundColor: 'rgba(47,107,255,0.1)',
  },
  desktopTab: {
    minHeight: 64,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  desktopTabActive: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(148,163,184,0.12)',
  },
  iconWrapActive: {
    backgroundColor: '#F36F21',
  },
  desktopIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(148,163,184,0.12)',
  },
  desktopLabelWrap: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
  desktopLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  desktopMeta: {
    fontSize: 12,
    fontWeight: '600',
  },
});
