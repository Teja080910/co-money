import React from 'react';
import { Text, View } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { FloatingLabelInput } from '../auth/FloatingLabelInput';

type Props = {
  context: any;
};

export function ProfileTab({ context }: Props) {
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
        <Card.Title title="Profile" subtitle="Current authenticated account" />
        <Card.Content>
          <Text style={[styles.listTitle, { color: theme.custom.textPrimary }]}>{displayName}</Text>
          <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{authUser?.email}</Text>
          <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>Role: {authUser?.role}</Text>
          <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>Username: {authUser?.username}</Text>
          <Button mode="outlined" onPress={() => void onLogout()} style={styles.logoutButton}>
            Logout
          </Button>
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
        <Card.Title title="Change Password" subtitle="Update your sign-in password from the profile section" />
        <Card.Content>
          <FloatingLabelInput
            icon="lock-outline"
            label="Current password"
            error={currentPasswordError}
            helperText={!currentPasswordError ? 'Enter your existing password before choosing a new one.' : undefined}
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
            label="New password"
            error={newPasswordError}
            helperText={!newPasswordError ? 'Use at least 8 characters for the new password.' : undefined}
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
            label="Confirm new password"
            error={confirmPasswordError}
            helperText={!confirmPasswordError ? 'Re-enter the new password to confirm the change.' : undefined}
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
              Update Password
            </Button>
            <Button mode="outlined" onPress={resetPasswordForm}>
              Reset
            </Button>
          </View>
        </Card.Content>
      </Card>
    </>
  );
}
