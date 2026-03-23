import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { FloatingLabelInput } from '../auth/FloatingLabelInput';

type Props = {
  context: any;
};

export function ProfileTab({ context }: Props) {
  const { t } = useTranslation();
  const {
    theme,
    styles,
    displayName,
    authUser,
    onLogout,
    currentPasswordError,
    newPasswordError,
    confirmPasswordError,
    passwordVisibility,
    setPasswordVisibility,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    setPasswordTouched,
    passwordSubmitting,
    handleChangePassword,
    resetPasswordForm,
  } = context;

  return (
    <>
      <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
        <Card.Title title={t('profile.title')} subtitle={t('profile.subtitle')} />
        <Card.Content>
          <Text style={[styles.listTitle, { color: theme.custom.textPrimary }]}>{displayName}</Text>
          <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{authUser?.email}</Text>
          <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{t('common.role')}: {authUser?.role ? t(`roles.${authUser.role.toLowerCase()}`) : ''}</Text>
          <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{t('profile.username')}: {authUser?.username}</Text>
          <Button mode="outlined" onPress={() => void onLogout()} style={styles.logoutButton}>
            {t('dashboard.logout')}
          </Button>
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
        <Card.Title title={t('profile.password.title')} subtitle={t('profile.password.subtitle')} />
        <Card.Content>
          <FloatingLabelInput
            icon="lock-outline"
            label={t('profile.password.currentLabel')}
            error={currentPasswordError}
            helperText={!currentPasswordError ? t('profile.password.currentHelper') : undefined}
            onToggleSecureEntry={() => setPasswordVisibility((current: any) => ({ ...current, current: !current.current }))}
            secureTextEntry={!passwordVisibility.current}
            value={currentPassword}
            onChangeText={(text) => {
              setCurrentPassword(text);
              setPasswordTouched((current: any) => ({ ...current, current: true }));
            }}
          />
          <FloatingLabelInput
            icon="lock-reset"
            label={t('profile.password.newLabel')}
            error={newPasswordError}
            helperText={!newPasswordError ? t('profile.password.newHelper') : undefined}
            onToggleSecureEntry={() => setPasswordVisibility((current: any) => ({ ...current, next: !current.next }))}
            secureTextEntry={!passwordVisibility.next}
            valid={newPassword.trim().length >= 8}
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              setPasswordTouched((current: any) => ({ ...current, next: true }));
            }}
          />
          <FloatingLabelInput
            icon="shield-check-outline"
            label={t('profile.password.confirmLabel')}
            error={confirmPasswordError}
            helperText={!confirmPasswordError ? t('profile.password.confirmHelper') : undefined}
            onToggleSecureEntry={() => setPasswordVisibility((current: any) => ({ ...current, confirm: !current.confirm }))}
            secureTextEntry={!passwordVisibility.confirm}
            valid={Boolean(confirmPassword.trim()) && confirmPassword === newPassword}
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setPasswordTouched((current: any) => ({ ...current, confirm: true }));
            }}
          />
          <View style={styles.actionRow}>
            <Button mode="contained" loading={passwordSubmitting} onPress={() => void handleChangePassword()}>
              {t('profile.password.submit')}
            </Button>
            <Button mode="outlined" onPress={resetPasswordForm}>
              {t('common.reset')}
            </Button>
          </View>
        </Card.Content>
      </Card>
    </>
  );
}
