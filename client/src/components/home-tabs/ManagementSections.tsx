import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Button, Card, Chip } from 'react-native-paper';
import { UserRole } from '../../constants/userRoles';
import { FloatingLabelInput } from '../auth/FloatingLabelInput';
import { CustomerDirectoryCard } from '../user-directory/CustomerDirectoryCard';
import { MerchantDirectoryCard } from '../user-directory/MerchantDirectoryCard';
import { RepresentativeDirectoryCard } from '../user-directory/RepresentativeDirectoryCard';
import { CustomersTab } from './CustomersTab';

type Props = {
  context: any;
};

export function UserListSection({ context, title, subtitle, users }: Props & { title: string; subtitle: string; users: any[] }) {
  const { t } = useTranslation();
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
              <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{t('common.role')}: {t(`roles.${user.role.toLowerCase()}`)}</Text>
            </View>
          ))
        ) : (
          <Text style={[styles.emptyText, { color: theme.custom.textSecondary }]}>{t('common.noRecords')}</Text>
        )}
      </Card.Content>
    </Card>
  );
}

export function ShopDirectorySection({ context }: Props) {
  const { t } = useTranslation();
  const { theme, styles, shops } = context;
  const safeShops = shops ?? [];

  return (
    <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
      <Card.Title title={t('management.shopDirectory.title')} subtitle={t('management.shopDirectory.subtitle')} />
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
          <Text style={[styles.emptyText, { color: theme.custom.textSecondary }]}>{t('management.shopDirectory.empty')}</Text>
        )}
      </Card.Content>
    </Card>
  );
}

export function ShopManagementSection({ context, title, subtitle }: Props & { title: string; subtitle: string }) {
  const { t } = useTranslation();
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
          <FloatingLabelInput icon="store-outline" label={t('management.shopForm.nameLabel')} helperText={t('management.shopForm.nameHelper')} value={shopName} onChangeText={setShopName} autoCapitalize="words" />
          <FloatingLabelInput icon="map-marker-outline" label={t('management.shopForm.locationLabel')} helperText={t('management.shopForm.locationHelper')} value={shopLocation} onChangeText={setShopLocation} autoCapitalize="words" />
          <FloatingLabelInput icon="text-box-outline" label={t('management.shopForm.descriptionLabel')} helperText={t('management.shopForm.descriptionHelper')} value={shopDescription} onChangeText={setShopDescription} autoCapitalize="sentences" multiline numberOfLines={3} />

          <Text style={[styles.sectionLabel, { color: theme.custom.textSecondary }]}>{t('management.shopForm.merchant')}</Text>
          <View style={styles.filterRow}>
            {safeMerchants.map((merchant: any) => (
              <Chip key={merchant.id} selected={shopMerchantId === merchant.id} mode={shopMerchantId === merchant.id ? 'flat' : 'outlined'} onPress={() => setShopMerchantId(merchant.id)} style={styles.filterChip}>
                {[merchant.firstName, merchant.lastName].filter(Boolean).join(' ') || merchant.username}
              </Chip>
            ))}
          </View>

          <View style={styles.actionRow}>
              <Button mode="contained" loading={shopSubmitting} onPress={() => void handleSaveShop()} style={styles.inlineActionButton}>
              {editingShopId ? t('management.shopForm.update') : t('management.shopForm.add')}
            </Button>
            {editingShopId ? (
              <Button mode="outlined" onPress={resetShopForm} style={styles.inlineActionButton}>
                {t('common.cancel')}
              </Button>
            ) : null}
          </View>
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
        <Card.Title title={t('management.managedShops.title')} subtitle={t('management.managedShops.subtitle')} />
        <Card.Content>
          {safeShops.length ? (
            safeShops.map((shop: any) => (
              <View key={shop.id} style={styles.shopRow}>
                <View style={styles.shopRowBody}>
                  <Text style={[styles.listTitle, { color: theme.custom.textPrimary }]}>{shop.name}</Text>
                  <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{shop.location}</Text>
                  {shop.description ? <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{shop.description}</Text> : null}
                  <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{t('management.managedShops.merchant')}: {merchantNameMap[shop.merchantId] || shop.merchantId}</Text>
                  <Text style={[styles.listMeta, { color: shop.isActive ? theme.custom.success : theme.custom.error }]}>{t('management.managedShops.status')}: {shop.isActive ? t('management.managedShops.active') : t('management.managedShops.inactive')}</Text>
                </View>
                <View style={styles.shopActions}>
                  <Button compact mode="outlined" onPress={() => handleEditShop(shop)}>{t('common.edit')}</Button>
                  <Button compact mode="text" textColor={shop.isActive ? theme.custom.error : theme.custom.success} onPress={() => void handleToggleShopStatus(shop)}>
                    {shop.isActive ? t('management.managedShops.deactivate') : t('management.managedShops.activate')}
                  </Button>
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.custom.textSecondary }]}>{t('management.managedShops.empty')}</Text>
          )}
        </Card.Content>
      </Card>
    </>
  );
}

export function PromotionsSection({ context, editable }: Props & { editable: boolean }) {
  const { t } = useTranslation();
  const { theme, styles, authUser, promotionTitle, setPromotionTitle, promotionDescription, setPromotionDescription, manageablePromotionShops, promotionShopId, setPromotionShopId, promotionBonusPoints, setPromotionBonusPoints, renderDateField, promotionStartDate, promotionEndDate, promotionSubmitting, claimingPromotionId, handleCreatePromotion, resetPromotionForm, promotions, handleDeletePromotion, handleClaimPromotion, formatDate, handleEditPromotion, editingPromotionId, handleTogglePromotionStatus } = context;
  const safePromotionShops = manageablePromotionShops ?? [];
  const safePromotions = promotions ?? [];
  const isCustomerView = authUser?.role === UserRole.CUSTOMER;

  return (
    <>
      {editable ? (
        <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
          <Card.Title title={t('management.promotions.editTitle')} subtitle={t('management.promotions.editSubtitle')} />
          <Card.Content>
            <FloatingLabelInput icon="tag-outline" label={t('management.promotions.titleLabel')} helperText={t('management.promotions.titleHelper')} value={promotionTitle} onChangeText={setPromotionTitle} autoCapitalize="sentences" />
            <FloatingLabelInput icon="text-box-outline" label={t('management.promotions.descriptionLabel')} helperText={t('management.promotions.descriptionHelper')} value={promotionDescription} onChangeText={setPromotionDescription} autoCapitalize="sentences" multiline numberOfLines={3} />
            <Text style={[styles.sectionLabel, { color: theme.custom.textSecondary }]}>{t('management.promotions.shop')}</Text>
            <View style={styles.filterRow}>
              {safePromotionShops.map((shop: any) => (
                <Chip key={shop.id} selected={promotionShopId === shop.id} mode={promotionShopId === shop.id ? 'flat' : 'outlined'} onPress={() => setPromotionShopId(shop.id)} style={styles.filterChip}>
                  {shop.name}
                </Chip>
              ))}
            </View>
            <FloatingLabelInput icon="star-four-points-outline" label={t('management.promotions.bonusLabel')} helperText={t('management.promotions.bonusHelper')} keyboardType="number-pad" value={promotionBonusPoints} onChangeText={setPromotionBonusPoints} />
            {renderDateField(t('common.startDate'), promotionStartDate, 'promotion-start', t('management.promotions.startHelper'))}
            {renderDateField(t('common.endDate'), promotionEndDate, 'promotion-end', t('management.promotions.endHelper'))}
            <View style={styles.actionRow}>
              <Button mode="contained" loading={promotionSubmitting} onPress={() => void handleCreatePromotion()}>
                {editingPromotionId ? t('management.promotions.update') : t('management.promotions.save')}
              </Button>
              <Button mode="outlined" onPress={resetPromotionForm}>{t('common.reset')}</Button>
            </View>
          </Card.Content>
        </Card>
      ) : null}

      <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
        <Card.Title title={t('management.promotions.activeTitle')} subtitle={t('management.promotions.activeSubtitle')} />
        <Card.Content>
          {safePromotions.length ? (
            safePromotions.map((promotion: any) => (
              <View key={promotion.id} style={styles.shopRow}>
                <View style={styles.shopRowBody}>
                  <Text style={[styles.listTitle, { color: theme.custom.textPrimary }]}>{promotion.title}</Text>
                  <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{promotion.shopName} • {promotion.shopLocation}</Text>
                  {promotion.description ? <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{promotion.description}</Text> : null}
                  <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{t('management.promotions.bonus')}: {promotion.bonusPoints} {t('common.pointsShort')} • {t('management.promotions.maxDiscount')}: {promotion.maxDiscountPercent}%</Text>
                  <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{formatDate(promotion.startsAt)} {t('common.to')} {formatDate(promotion.endsAt)}</Text>
                </View>
                {editable ? (
                  <View style={styles.shopActions}>
                    <Button compact mode="outlined" onPress={() => handleEditPromotion(promotion)}>{t('common.edit')}</Button>
                    <Button compact mode="text" onPress={() => void handleTogglePromotionStatus(promotion)}>
                      {promotion.isActive ? t('common.deactivate') : t('common.activate')}
                    </Button>
                    <Button compact mode="text" textColor={theme.custom.error} onPress={() => void handleDeletePromotion(promotion.id)}>{t('common.delete')}</Button>
                  </View>
                ) : isCustomerView ? (
                  <View style={styles.shopActions}>
                    <Button
                      compact
                      mode={promotion.isClaimed ? 'outlined' : 'contained'}
                      disabled={Boolean(promotion.isClaimed) || claimingPromotionId === promotion.id}
                      loading={claimingPromotionId === promotion.id}
                      onPress={() => void handleClaimPromotion(promotion.id)}
                    >
                      {promotion.isClaimed ? t('management.promotions.claimed') : t('management.promotions.claim')}
                    </Button>
                  </View>
                ) : null}
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.custom.textSecondary }]}>{t('management.promotions.empty')}</Text>
          )}
        </Card.Content>
      </Card>
    </>
  );
}

export function EventsSection({ context, editable }: Props & { editable: boolean }) {
  const { t } = useTranslation();
  const { theme, styles, eventTitle, setEventTitle, eventDescription, setEventDescription, eventLocation, setEventLocation, renderDateField, eventStartDate, eventEndDate, eventSubmitting, handleCreateEvent, resetEventForm, events, handleDeleteEvent, formatDate, handleEditEvent, editingEventId, handleToggleEventStatus } = context;
  const safeEvents = events ?? [];

  return (
    <>
      {editable ? (
        <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
          <Card.Title title={t('management.events.editTitle')} subtitle={t('management.events.editSubtitle')} />
          <Card.Content>
            <FloatingLabelInput icon="calendar-text-outline" label={t('management.events.titleLabel')} helperText={t('management.events.titleHelper')} value={eventTitle} onChangeText={setEventTitle} autoCapitalize="sentences" />
            <FloatingLabelInput icon="text-box-outline" label={t('management.events.descriptionLabel')} helperText={t('management.events.descriptionHelper')} value={eventDescription} onChangeText={setEventDescription} autoCapitalize="sentences" multiline numberOfLines={3} />
            <FloatingLabelInput icon="map-marker-outline" label={t('management.events.locationLabel')} helperText={t('management.events.locationHelper')} value={eventLocation} onChangeText={setEventLocation} autoCapitalize="words" />
            {renderDateField(t('common.startDate'), eventStartDate, 'event-start', t('management.events.startHelper'))}
            {renderDateField(t('common.endDate'), eventEndDate, 'event-end', t('management.events.endHelper'))}
            <View style={styles.actionRow}>
              <Button mode="contained" loading={eventSubmitting} onPress={() => void handleCreateEvent()}>
                {editingEventId ? t('management.events.update') : t('management.events.save')}
              </Button>
              <Button mode="outlined" onPress={resetEventForm}>{t('common.reset')}</Button>
            </View>
          </Card.Content>
        </Card>
      ) : null}

      <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
        <Card.Title title={t('management.events.listTitle')} subtitle={t('management.events.listSubtitle')} />
        <Card.Content>
          {safeEvents.length ? (
            safeEvents.map((event: any) => (
              <View key={event.id} style={styles.shopRow}>
                <View style={styles.shopRowBody}>
                  <Text style={[styles.listTitle, { color: theme.custom.textPrimary }]}>{event.title}</Text>
                  <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{event.location}</Text>
                  {event.description ? <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{event.description}</Text> : null}
                  <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{formatDate(event.startsAt)} {t('common.to')} {formatDate(event.endsAt)}</Text>
                </View>
                {editable ? (
                  <View style={styles.shopActions}>
                    <Button compact mode="outlined" onPress={() => handleEditEvent(event)}>{t('common.edit')}</Button>
                    <Button compact mode="text" onPress={() => void handleToggleEventStatus(event)}>
                      {event.isActive ? t('common.deactivate') : t('common.activate')}
                    </Button>
                    <Button compact mode="text" textColor={theme.custom.error} onPress={() => void handleDeleteEvent(event.id)}>{t('common.delete')}</Button>
                  </View>
                ) : null}
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.custom.textSecondary }]}>{t('management.events.empty')}</Text>
          )}
        </Card.Content>
      </Card>
    </>
  );
}

export function CategorySettingsSection({ context }: Props) {
  const { t } = useTranslation();
  const {
    theme,
    styles,
    availableShops,
    categoryShopId,
    setCategoryShopId,
    categoryName,
    setCategoryName,
    categoryDiscountPercent,
    setCategoryDiscountPercent,
    categoryIsDefault,
    setCategoryIsDefault,
    categorySubmitting,
    handleSaveCategory,
    resetCategoryForm,
    editingCategoryId,
    categories,
    handleEditCategory,
    handleToggleCategoryStatus,
    handleDeleteCategory,
  } = context;
  const safeShops = availableShops ?? [];
  const safeCategories = categories ?? [];

  return (
    <>
      <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
        <Card.Title title={t('management.categories.title')} subtitle={t('management.categories.subtitle')} />
        <Card.Content>
          <Text style={[styles.sectionLabel, { color: theme.custom.textSecondary }]}>{t('management.categories.shop')}</Text>
          <View style={styles.filterRow}>
            {safeShops.map((shop: any) => (
              <Chip
                key={shop.id}
                selected={categoryShopId === shop.id}
                mode={categoryShopId === shop.id ? 'flat' : 'outlined'}
                onPress={() => setCategoryShopId(shop.id)}
                style={styles.filterChip}
              >
                {shop.name}
              </Chip>
            ))}
          </View>
          <FloatingLabelInput icon="shape-outline" label={t('management.categories.nameLabel')} helperText={t('management.categories.nameHelper')} value={categoryName} onChangeText={setCategoryName} autoCapitalize="words" />
          <FloatingLabelInput icon="percent-outline" label={t('management.categories.discountLabel')} helperText={t('management.categories.discountHelper')} value={categoryDiscountPercent} onChangeText={setCategoryDiscountPercent} keyboardType="number-pad" />
          <View style={styles.filterRow}>
            <Chip selected={categoryIsDefault} mode={categoryIsDefault ? 'flat' : 'outlined'} onPress={() => setCategoryIsDefault((current: boolean) => !current)} style={styles.filterChip}>
              {t('management.categories.defaultLabel')}
            </Chip>
          </View>
          <View style={styles.actionRow}>
            <Button mode="contained" loading={categorySubmitting} onPress={() => void handleSaveCategory()}>
              {editingCategoryId ? t('management.categories.update') : t('management.categories.save')}
            </Button>
            <Button mode="outlined" onPress={resetCategoryForm}>{t('common.reset')}</Button>
          </View>
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
        <Card.Title title={t('management.categories.title')} subtitle={t('management.categories.subtitle')} />
        <Card.Content>
          {safeCategories.length ? (
            safeCategories.map((category: any) => (
              <View key={category.id} style={styles.shopRow}>
                <View style={styles.shopRowBody}>
                  <Text style={[styles.listTitle, { color: theme.custom.textPrimary }]}>{category.formattedName || category.name}</Text>
                  <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{category.shopName}</Text>
                  <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{category.discountPercent}%</Text>
                  <Text style={[styles.listMeta, { color: category.isActive ? theme.custom.success : theme.custom.error }]}>
                    {t('common.status')}: {category.isActive ? t('statuses.active') : t('statuses.inactive')}
                  </Text>
                </View>
                <View style={styles.shopActions}>
                  <Button compact mode="outlined" onPress={() => handleEditCategory(category)}>{t('common.edit')}</Button>
                  <Button compact mode="text" onPress={() => void handleToggleCategoryStatus(category)}>
                    {category.isActive ? t('common.deactivate') : t('common.activate')}
                  </Button>
                  {!category.isDefault ? (
                    <Button compact mode="text" textColor={theme.custom.error} onPress={() => void handleDeleteCategory(category.id)}>
                      {t('common.delete')}
                    </Button>
                  ) : null}
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.custom.textSecondary }]}>{t('management.categories.empty')}</Text>
          )}
        </Card.Content>
      </Card>
    </>
  );
}

export function SystemConfigurationSection({ context }: Props) {
  const { t } = useTranslation();
  const {
    theme,
    styles,
    configWelcomeBonusPoints,
    setConfigWelcomeBonusPoints,
    configPointExpirationDays,
    setConfigPointExpirationDays,
    configMaxPointsPerTransaction,
    setConfigMaxPointsPerTransaction,
    configDefaultMaxDiscountPercent,
    setConfigDefaultMaxDiscountPercent,
    configChangeReason,
    setConfigChangeReason,
    configSubmitting,
    handleSaveConfiguration,
    systemConfigHistory,
  } = context;
  const safeHistory = systemConfigHistory ?? [];

  return (
    <>
      <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
        <Card.Title title={t('management.configuration.title')} subtitle={t('management.configuration.subtitle')} />
        <Card.Content>
          <FloatingLabelInput icon="gift-outline" label={t('management.configuration.welcomeBonusLabel')} helperText={t('management.configuration.welcomeBonusHelper')} value={configWelcomeBonusPoints} onChangeText={setConfigWelcomeBonusPoints} keyboardType="number-pad" />
          <FloatingLabelInput icon="calendar-clock-outline" label={t('management.configuration.expirationLabel')} helperText={t('management.configuration.expirationHelper')} value={configPointExpirationDays} onChangeText={setConfigPointExpirationDays} keyboardType="number-pad" />
          <FloatingLabelInput icon="counter" label={t('management.configuration.maxPointsLabel')} helperText={t('management.configuration.maxPointsHelper')} value={configMaxPointsPerTransaction} onChangeText={setConfigMaxPointsPerTransaction} keyboardType="number-pad" />
          <FloatingLabelInput icon="percent-outline" label={t('management.configuration.defaultDiscountLabel')} helperText={t('management.configuration.defaultDiscountHelper')} value={configDefaultMaxDiscountPercent} onChangeText={setConfigDefaultMaxDiscountPercent} keyboardType="number-pad" />
          <FloatingLabelInput icon="text-box-outline" label={t('management.configuration.reasonLabel')} helperText={t('management.configuration.reasonHelper')} value={configChangeReason} onChangeText={setConfigChangeReason} autoCapitalize="sentences" multiline numberOfLines={3} />
          <Button mode="contained" loading={configSubmitting} onPress={() => void handleSaveConfiguration()}>
            {t('management.configuration.save')}
          </Button>
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
        <Card.Title title={t('management.configuration.historyTitle')} />
        <Card.Content>
          {safeHistory.length ? (
            safeHistory.map((entry: any) => (
              <View key={entry.id || entry.version} style={styles.listItem}>
                <Text style={[styles.listTitle, { color: theme.custom.textPrimary }]}>v{entry.version}</Text>
                <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>
                  {entry.welcomeBonusPoints} / {entry.pointExpirationDays} / {entry.maxPointsPerTransaction} / {entry.defaultMaxDiscountPercent}%
                </Text>
                {entry.changeReason ? (
                  <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{entry.changeReason}</Text>
                ) : null}
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.custom.textSecondary }]}>{t('management.configuration.historyEmpty')}</Text>
          )}
        </Card.Content>
      </Card>
    </>
  );
}

export function InternalUserManagementSection({ context }: Props) {
  const { t } = useTranslation();
  const { theme, styles, allowedInternalRoles, internalRole, setInternalRole, internalFirstName, setInternalFirstName, internalLastName, setInternalLastName, trimmedInternalUsername, internalUsername, setInternalUsername, setInternalTouched, internalEmailError, trimmedInternalEmail, internalEmail, setInternalEmail, internalPasswordError, internalPasswordVisible, setInternalPasswordVisible, internalPassword, setInternalPassword, userSubmitting, handleCreateInternalUser, resetInternalUserForm } = context;
  const safeAllowedRoles = allowedInternalRoles ?? [];

  if (!safeAllowedRoles.length) {
    return null;
  }

  return (
    <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
      <Card.Title title={t('management.users.title')} subtitle={t('management.users.subtitle')} />
      <Card.Content>
        <Text style={[styles.sectionLabel, { color: theme.custom.textSecondary }]}>{t('common.role')}</Text>
        <View style={styles.filterRow}>
          {safeAllowedRoles.map((role: string) => (
            <Chip key={role} selected={internalRole === role} mode={internalRole === role ? 'flat' : 'outlined'} onPress={() => setInternalRole(role)} style={styles.filterChip}>
              {t(`roles.${role.toLowerCase()}`)}
            </Chip>
          ))}
        </View>
        <FloatingLabelInput icon="account-outline" label={t('management.users.firstNameLabel')} helperText={t('management.users.firstNameHelper')} value={internalFirstName} onChangeText={setInternalFirstName} autoCapitalize="words" />
        <FloatingLabelInput icon="badge-account-outline" label={t('management.users.lastNameLabel')} helperText={t('management.users.lastNameHelper')} value={internalLastName} onChangeText={setInternalLastName} autoCapitalize="words" />
        <FloatingLabelInput icon="account-circle-outline" label={t('management.users.usernameLabel')} helperText={t('management.users.usernameHelper')} valid={Boolean(trimmedInternalUsername)} value={internalUsername} onChangeText={text => { setInternalUsername(text); setInternalTouched((current: any) => ({ ...current, username: true })); }} autoCapitalize="none" />
        <FloatingLabelInput icon="email-outline" label={t('management.users.emailLabel')} error={internalEmailError} helperText={!internalEmailError ? t('management.users.emailHelper') : undefined} valid={Boolean(trimmedInternalEmail) && !internalEmailError} value={internalEmail} onChangeText={text => { setInternalEmail(text); setInternalTouched((current: any) => ({ ...current, email: true })); }} autoCapitalize="none" keyboardType="email-address" />
        <FloatingLabelInput icon="lock-outline" label={t('management.users.passwordLabel')} error={internalPasswordError} helperText={!internalPasswordError ? t('management.users.passwordHelper') : undefined} onToggleSecureEntry={() => setInternalPasswordVisible((current: boolean) => !current)} secureTextEntry={!internalPasswordVisible} valid={internalPassword.length >= 8} value={internalPassword} onChangeText={text => { setInternalPassword(text); setInternalTouched((current: any) => ({ ...current, password: true })); }} />
        <View style={styles.actionRow}>
          <Button mode="contained" loading={userSubmitting} onPress={() => void handleCreateInternalUser()}>{t('management.users.create')}</Button>
          <Button mode="outlined" onPress={resetInternalUserForm}>{t('common.reset')}</Button>
        </View>
      </Card.Content>
    </Card>
  );
}

export function AdminUserManagementSection({ context }: Props) {
  const { representatives, merchants, customers, handleActivateUser, handleDeactivateUser, handleDeleteUser, userActionLoadingState } = context;

  return (
    <>
      <InternalUserManagementSection context={context} />
      <RepresentativeDirectoryCard users={representatives} showStatus onActivate={handleActivateUser} onDeactivate={handleDeactivateUser} onDelete={handleDeleteUser} actionLoadingState={userActionLoadingState} />
      <MerchantDirectoryCard users={merchants} showStatus onActivate={handleActivateUser} onDeactivate={handleDeactivateUser} onDelete={handleDeleteUser} actionLoadingState={userActionLoadingState} />
      <CustomerDirectoryCard users={customers} showStatus onActivate={handleActivateUser} onDeactivate={handleDeactivateUser} onDelete={handleDeleteUser} actionLoadingState={userActionLoadingState} />
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
