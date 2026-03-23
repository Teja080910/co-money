import React from 'react';
import { Text, View } from 'react-native';
import { Button, Card, Chip } from 'react-native-paper';
import { FloatingLabelInput } from '../auth/FloatingLabelInput';
import { CustomerDirectoryCard } from '../user-directory/CustomerDirectoryCard';
import { MerchantDirectoryCard } from '../user-directory/MerchantDirectoryCard';
import { RepresentativeDirectoryCard } from '../user-directory/RepresentativeDirectoryCard';
import { CustomersTab } from './CustomersTab';

type Props = {
  context: any;
};

export function UserListSection({ context, title, subtitle, users }: Props & { title: string; subtitle: string; users: any[] }) {
  const { theme, styles } = context;
  const safeUsers = users ?? [];

  return (
    <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
      <Card.Title title={title} subtitle={subtitle} />
      <Card.Content>
        {safeUsers.length ? (
          safeUsers.map(user => (
            <View key={user.id} style={styles.listItem}>
              <Text style={[styles.listTitle, { color: theme.custom.textPrimary }]}>
                {[user.firstName, user.lastName].filter(Boolean).join(' ') || user.username}
              </Text>
              <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{user.email}</Text>
              <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>Role: {user.role}</Text>
            </View>
          ))
        ) : (
          <Text style={[styles.emptyText, { color: theme.custom.textSecondary }]}>No records available.</Text>
        )}
      </Card.Content>
    </Card>
  );
}

export function ShopDirectorySection({ context }: Props) {
  const { theme, styles, shops } = context;
  const safeShops = shops ?? [];

  return (
    <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
      <Card.Title title="Shops List" subtitle="Participating local shops" />
      <Card.Content>
        {safeShops.length ? (
          safeShops.map((shop: any) => (
            <View key={shop.id} style={styles.listItem}>
              <Text style={[styles.listTitle, { color: theme.custom.textPrimary }]}>{shop.name}</Text>
              <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{shop.location}</Text>
              {shop.description ? (
                <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{shop.description}</Text>
              ) : null}
            </View>
          ))
        ) : (
          <Text style={[styles.emptyText, { color: theme.custom.textSecondary }]}>No shops are available yet.</Text>
        )}
      </Card.Content>
    </Card>
  );
}

export function ShopManagementSection({ context, title, subtitle }: Props & { title: string; subtitle: string }) {
  const {
    theme,
    styles,
    shopName,
    setShopName,
    shopLocation,
    setShopLocation,
    shopDescription,
    setShopDescription,
    merchants,
    shopMerchantId,
    setShopMerchantId,
    shopSubmitting,
    handleSaveShop,
    editingShopId,
    resetShopForm,
    shops,
    merchantNameMap,
    handleEditShop,
    handleToggleShopStatus,
  } = context;
  const safeMerchants = merchants ?? [];
  const safeShops = shops ?? [];

  return (
    <>
      <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
        <Card.Title title={title} subtitle={subtitle} />
        <Card.Content>
          <FloatingLabelInput icon="store-outline" label="Shop name" helperText="Use the public-facing shop name customers will recognize." value={shopName} onChangeText={setShopName} autoCapitalize="words" />
          <FloatingLabelInput icon="map-marker-outline" label="Location" helperText="Add the branch area or address shown in the shop listing." value={shopLocation} onChangeText={setShopLocation} autoCapitalize="words" />
          <FloatingLabelInput icon="text-box-outline" label="Description" helperText="Write a short summary about what this shop offers." value={shopDescription} onChangeText={setShopDescription} autoCapitalize="sentences" multiline numberOfLines={3} />

          <Text style={[styles.sectionLabel, { color: theme.custom.textSecondary }]}>Merchant</Text>
          <View style={styles.filterRow}>
            {safeMerchants.map((merchant: any) => (
              <Chip key={merchant.id} selected={shopMerchantId === merchant.id} mode={shopMerchantId === merchant.id ? 'flat' : 'outlined'} onPress={() => setShopMerchantId(merchant.id)} style={styles.filterChip}>
                {[merchant.firstName, merchant.lastName].filter(Boolean).join(' ') || merchant.username}
              </Chip>
            ))}
          </View>

          <View style={styles.actionRow}>
            <Button mode="contained" loading={shopSubmitting} onPress={() => void handleSaveShop()} style={styles.inlineActionButton}>
              {editingShopId ? 'Update Shop' : 'Add Shop'}
            </Button>
            {editingShopId ? (
              <Button mode="outlined" onPress={resetShopForm} style={styles.inlineActionButton}>
                Cancel
              </Button>
            ) : null}
          </View>
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
        <Card.Title title="Managed Shops" subtitle="Add, update, activate, or deactivate assigned shops" />
        <Card.Content>
          {safeShops.length ? (
            safeShops.map((shop: any) => (
              <View key={shop.id} style={styles.shopRow}>
                <View style={styles.shopRowBody}>
                  <Text style={[styles.listTitle, { color: theme.custom.textPrimary }]}>{shop.name}</Text>
                  <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{shop.location}</Text>
                  {shop.description ? <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{shop.description}</Text> : null}
                  <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>Merchant: {merchantNameMap[shop.merchantId] || shop.merchantId}</Text>
                  <Text style={[styles.listMeta, { color: shop.isActive ? theme.custom.success : theme.custom.error }]}>Status: {shop.isActive ? 'Active' : 'Inactive'}</Text>
                </View>
                <View style={styles.shopActions}>
                  <Button compact mode="outlined" onPress={() => handleEditShop(shop)}>Edit</Button>
                  <Button compact mode="text" textColor={shop.isActive ? theme.custom.error : theme.custom.success} onPress={() => void handleToggleShopStatus(shop)}>
                    {shop.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.custom.textSecondary }]}>No shops available yet.</Text>
          )}
        </Card.Content>
      </Card>
    </>
  );
}

export function PromotionsSection({ context, editable }: Props & { editable: boolean }) {
  const { theme, styles, promotionTitle, setPromotionTitle, promotionDescription, setPromotionDescription, manageablePromotionShops, promotionShopId, setPromotionShopId, promotionBonusPoints, setPromotionBonusPoints, renderDateField, promotionStartDate, promotionEndDate, promotionSubmitting, handleCreatePromotion, resetPromotionForm, promotions, handleDeletePromotion, formatDate } = context;
  const safePromotionShops = manageablePromotionShops ?? [];
  const safePromotions = promotions ?? [];

  return (
    <>
      {editable ? (
        <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
          <Card.Title title="Promotions" subtitle="Create shop offers and bonus campaigns" />
          <Card.Content>
            <FloatingLabelInput icon="tag-outline" label="Promotion title" helperText="Choose a clear campaign name customers can scan quickly." value={promotionTitle} onChangeText={setPromotionTitle} autoCapitalize="sentences" />
            <FloatingLabelInput icon="text-box-outline" label="Description" helperText="Explain the offer, reward, or eligibility in one short note." value={promotionDescription} onChangeText={setPromotionDescription} autoCapitalize="sentences" multiline numberOfLines={3} />
            <Text style={[styles.sectionLabel, { color: theme.custom.textSecondary }]}>Shop</Text>
            <View style={styles.filterRow}>
              {safePromotionShops.map((shop: any) => (
                <Chip key={shop.id} selected={promotionShopId === shop.id} mode={promotionShopId === shop.id ? 'flat' : 'outlined'} onPress={() => setPromotionShopId(shop.id)} style={styles.filterChip}>
                  {shop.name}
                </Chip>
              ))}
            </View>
            <FloatingLabelInput icon="star-four-points-outline" label="Bonus points" helperText="Enter the extra reward points granted by this promotion." keyboardType="number-pad" value={promotionBonusPoints} onChangeText={setPromotionBonusPoints} />
            {renderDateField('Start date', promotionStartDate, 'promotion-start', 'Choose when this promotion should become active.')}
            {renderDateField('End date', promotionEndDate, 'promotion-end', 'Choose the last day customers can use this promotion.')}
            <View style={styles.actionRow}>
              <Button mode="contained" loading={promotionSubmitting} onPress={() => void handleCreatePromotion()}>Save Promotion</Button>
              <Button mode="outlined" onPress={resetPromotionForm}>Reset</Button>
            </View>
          </Card.Content>
        </Card>
      ) : null}

      <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
        <Card.Title title="Active Promotions" subtitle="Offers available across the network" />
        <Card.Content>
          {safePromotions.length ? (
            safePromotions.map((promotion: any) => (
              <View key={promotion.id} style={styles.shopRow}>
                <View style={styles.shopRowBody}>
                  <Text style={[styles.listTitle, { color: theme.custom.textPrimary }]}>{promotion.title}</Text>
                  <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{promotion.shopName} • {promotion.shopLocation}</Text>
                  {promotion.description ? <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{promotion.description}</Text> : null}
                  <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>Bonus: {promotion.bonusPoints} pts • Max discount: {promotion.maxDiscountPercent}%</Text>
                  <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{formatDate(promotion.startsAt)} to {formatDate(promotion.endsAt)}</Text>
                </View>
                {editable ? (
                  <View style={styles.shopActions}>
                    <Button compact mode="text" textColor={theme.custom.error} onPress={() => void handleDeletePromotion(promotion.id)}>Delete</Button>
                  </View>
                ) : null}
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.custom.textSecondary }]}>No promotions are available right now.</Text>
          )}
        </Card.Content>
      </Card>
    </>
  );
}

export function EventsSection({ context, editable }: Props & { editable: boolean }) {
  const { theme, styles, eventTitle, setEventTitle, eventDescription, setEventDescription, eventLocation, setEventLocation, renderDateField, eventStartDate, eventEndDate, eventSubmitting, handleCreateEvent, resetEventForm, events, handleDeleteEvent, formatDate } = context;
  const safeEvents = events ?? [];

  return (
    <>
      {editable ? (
        <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
          <Card.Title title="Events" subtitle="Plan community events and announcements" />
          <Card.Content>
            <FloatingLabelInput icon="calendar-text-outline" label="Event title" helperText="Use the event name that should appear in announcements." value={eventTitle} onChangeText={setEventTitle} autoCapitalize="sentences" />
            <FloatingLabelInput icon="text-box-outline" label="Description" helperText="Add a short agenda, purpose, or event summary." value={eventDescription} onChangeText={setEventDescription} autoCapitalize="sentences" multiline numberOfLines={3} />
            <FloatingLabelInput icon="map-marker-outline" label="Location" helperText="Mention the venue, branch, or meetup point." value={eventLocation} onChangeText={setEventLocation} autoCapitalize="words" />
            {renderDateField('Start date', eventStartDate, 'event-start', 'Pick the first day this event will be visible as active.')}
            {renderDateField('End date', eventEndDate, 'event-end', 'Pick the final day for this event schedule.')}
            <View style={styles.actionRow}>
              <Button mode="contained" loading={eventSubmitting} onPress={() => void handleCreateEvent()}>Save Event</Button>
              <Button mode="outlined" onPress={resetEventForm}>Reset</Button>
            </View>
          </Card.Content>
        </Card>
      ) : null}

      <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
        <Card.Title title="Events" subtitle="Upcoming network activity" />
        <Card.Content>
          {safeEvents.length ? (
            safeEvents.map((event: any) => (
              <View key={event.id} style={styles.shopRow}>
                <View style={styles.shopRowBody}>
                  <Text style={[styles.listTitle, { color: theme.custom.textPrimary }]}>{event.title}</Text>
                  <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{event.location}</Text>
                  {event.description ? <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{event.description}</Text> : null}
                  <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{formatDate(event.startsAt)} to {formatDate(event.endsAt)}</Text>
                </View>
                {editable ? (
                  <View style={styles.shopActions}>
                    <Button compact mode="text" textColor={theme.custom.error} onPress={() => void handleDeleteEvent(event.id)}>Delete</Button>
                  </View>
                ) : null}
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.custom.textSecondary }]}>No events are scheduled yet.</Text>
          )}
        </Card.Content>
      </Card>
    </>
  );
}

export function InternalUserManagementSection({ context }: Props) {
  const { theme, styles, allowedInternalRoles, internalRole, setInternalRole, internalFirstName, setInternalFirstName, internalLastName, setInternalLastName, trimmedInternalUsername, internalUsername, setInternalUsername, setInternalTouched, internalEmailError, trimmedInternalEmail, internalEmail, setInternalEmail, internalPasswordError, internalPasswordVisible, setInternalPasswordVisible, internalPassword, setInternalPassword, userSubmitting, handleCreateInternalUser, resetInternalUserForm } = context;
  const safeAllowedRoles = allowedInternalRoles ?? [];

  if (!safeAllowedRoles.length) {
    return null;
  }

  return (
    <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
      <Card.Title title="User Management" subtitle="Create internal and managed accounts" />
      <Card.Content>
        <Text style={[styles.sectionLabel, { color: theme.custom.textSecondary }]}>Role</Text>
        <View style={styles.filterRow}>
          {safeAllowedRoles.map((role: string) => (
            <Chip key={role} selected={internalRole === role} mode={internalRole === role ? 'flat' : 'outlined'} onPress={() => setInternalRole(role)} style={styles.filterChip}>
              {role}
            </Chip>
          ))}
        </View>
        <FloatingLabelInput icon="account-outline" label="First name" helperText="Enter the user’s given name for their profile." value={internalFirstName} onChangeText={setInternalFirstName} autoCapitalize="words" />
        <FloatingLabelInput icon="badge-account-outline" label="Last name" helperText="Enter the surname used for reporting and account records." value={internalLastName} onChangeText={setInternalLastName} autoCapitalize="words" />
        <FloatingLabelInput icon="account-circle-outline" label="Username" helperText="Use a unique sign-in name without spaces." valid={Boolean(trimmedInternalUsername)} value={internalUsername} onChangeText={text => { setInternalUsername(text); setInternalTouched((current: any) => ({ ...current, username: true })); }} autoCapitalize="none" />
        <FloatingLabelInput icon="email-outline" label="Email" error={internalEmailError} helperText={!internalEmailError ? 'Add the email address used for login and notifications.' : undefined} valid={Boolean(trimmedInternalEmail) && !internalEmailError} value={internalEmail} onChangeText={text => { setInternalEmail(text); setInternalTouched((current: any) => ({ ...current, email: true })); }} autoCapitalize="none" keyboardType="email-address" />
        <FloatingLabelInput icon="lock-outline" label="Password" error={internalPasswordError} helperText={!internalPasswordError ? 'Set a temporary password with at least 8 characters.' : undefined} onToggleSecureEntry={() => setInternalPasswordVisible((current: boolean) => !current)} secureTextEntry={!internalPasswordVisible} valid={internalPassword.length >= 8} value={internalPassword} onChangeText={text => { setInternalPassword(text); setInternalTouched((current: any) => ({ ...current, password: true })); }} />
        <View style={styles.actionRow}>
          <Button mode="contained" loading={userSubmitting} onPress={() => void handleCreateInternalUser()}>Create User</Button>
          <Button mode="outlined" onPress={resetInternalUserForm}>Reset</Button>
        </View>
      </Card.Content>
    </Card>
  );
}

export function AdminUserManagementSection({ context }: Props) {
  const { representatives, merchants, customers } = context;

  return (
    <>
      <InternalUserManagementSection context={context} />
      <RepresentativeDirectoryCard users={representatives} />
      <MerchantDirectoryCard users={merchants} />
      <CustomerDirectoryCard users={customers} />
    </>
  );
}

export function RepresentativeUserManagementSection({ context }: Props) {
  const { merchants, customers } = context;

  return (
    <>
      <InternalUserManagementSection context={context} />
      <MerchantDirectoryCard users={merchants} />
      <CustomerDirectoryCard users={customers} />
      <CustomersTab context={context} />
    </>
  );
}
