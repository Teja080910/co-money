import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { ActivityIndicator, Button, Card, Chip } from 'react-native-paper';
import { UserRole } from '../../constants/userRoles';
import { FloatingLabelInput } from '../auth/FloatingLabelInput';
import { SelectField } from '../common/SelectField';
import { PaginationControls } from '../common/PaginationControls';
import { CustomerDirectoryCard } from '../user-directory/CustomerDirectoryCard';
import { MerchantDirectoryCard } from '../user-directory/MerchantDirectoryCard';
import { RepresentativeDirectoryCard } from '../user-directory/RepresentativeDirectoryCard';
import { CustomersTab } from './CustomersTab';

type Props = {
  context: any;
};

function renderScopedFeedback(feedback: any, target: string, styles: any, theme: any) {
  if (feedback?.target !== target) {
    return null;
  }

  if (feedback.error) {
    return (
      <Text style={[styles.message, { color: theme.custom.error }]}>
        {feedback.error}
      </Text>
    );
  }

  if (feedback.success) {
    return (
      <Text style={[styles.message, { color: theme.custom.success }]}>
        {feedback.success}
      </Text>
    );
  }

  return null;
}

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
  const {
    theme,
    styles,
    shopListItems,
    shopListLoading,
    shopListPage,
    shopListPageSize,
    shopListTotalPages,
    shopListTotalItems,
    handleShopListPageChange,
    handleShopListPageSizeChange,
  } = context;
  const safeShops = shopListItems ?? [];

  return (
    <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
      <Card.Title title={t('management.shopDirectory.title')} subtitle={t('management.shopDirectory.subtitle')} />
      <Card.Content>
        {shopListLoading ? (
          <ActivityIndicator animating size="small" style={styles.secondaryAction} />
        ) : safeShops.length ? (
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
        <PaginationControls
          page={shopListPage}
          pageSize={shopListPageSize}
          totalPages={shopListTotalPages}
          totalItems={shopListTotalItems}
          loading={shopListLoading}
          onPageChange={handleShopListPageChange}
          onPageSizeChange={handleShopListPageSizeChange}
        />
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
    shopStatusLoadingId,
    managementFeedback,
    handleSaveShop,
    editingShopId,
    resetShopForm,
    shops,
    shopListItems,
    shopListLoading,
    shopListPage,
    shopListPageSize,
    shopListTotalPages,
    shopListTotalItems,
    handleShopListPageChange,
    handleShopListPageSizeChange,
    merchantNameMap,
    handleEditShop,
    handleToggleShopStatus,
  } = context;
  const safeMerchants = merchants ?? [];
  const safeShops = shopListItems ?? [];

  return (
    <>
      {!editingShopId ? (
        <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
          <Card.Title title={title} subtitle={subtitle} />
          <Card.Content>
            <FloatingLabelInput icon="store-outline" label={t('management.shopForm.nameLabel')} helperText={t('management.shopForm.nameHelper')} value={shopName} onChangeText={setShopName} autoCapitalize="words" />
            <FloatingLabelInput icon="map-marker-outline" label={t('management.shopForm.locationLabel')} helperText={t('management.shopForm.locationHelper')} value={shopLocation} onChangeText={setShopLocation} autoCapitalize="words" />
            <FloatingLabelInput icon="text-box-outline" label={t('management.shopForm.descriptionLabel')} helperText={t('management.shopForm.descriptionHelper')} value={shopDescription} onChangeText={setShopDescription} autoCapitalize="sentences" multiline numberOfLines={3} />
            <SelectField
              label={t('management.shopForm.merchant')}
              value={shopMerchantId}
              onSelect={setShopMerchantId}
              options={safeMerchants.map((merchant: any) => ({
                value: merchant.id,
                label: [merchant.firstName, merchant.lastName].filter(Boolean).join(' ') || merchant.username,
              }))}
            />

            <View style={styles.actionRow}>
              <Button mode="contained" loading={shopSubmitting} onPress={() => void handleSaveShop()} style={styles.inlineActionButton}>
                {t('management.shopForm.add')}
              </Button>
            </View>
            {renderScopedFeedback(managementFeedback, 'shopForm', styles, theme)}
          </Card.Content>
        </Card>
      ) : null}

      <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
        <Card.Title title={t('management.managedShops.title')} subtitle={t('management.managedShops.subtitle')} />
        <Card.Content>
          {shopListLoading ? (
            <ActivityIndicator animating size="small" style={styles.secondaryAction} />
          ) : safeShops.length ? (
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
                  <Button compact mode="outlined" style={styles.rowActionButtonCompact} contentStyle={styles.rowActionButtonContent} labelStyle={styles.rowActionButtonLabel} disabled={shopStatusLoadingId === shop.id} onPress={() => handleEditShop(shop)}>{t('common.edit')}</Button>
                  <Button compact mode="text" style={styles.rowActionButtonWide} contentStyle={styles.rowActionButtonContent} labelStyle={styles.rowActionButtonLabel} loading={shopStatusLoadingId === shop.id} disabled={shopStatusLoadingId === shop.id} textColor={shop.isActive ? theme.custom.error : theme.custom.success} onPress={() => void handleToggleShopStatus(shop)}>
                    {shop.isActive ? t('management.managedShops.deactivate') : t('management.managedShops.activate')}
                  </Button>
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.custom.textSecondary }]}>{t('management.managedShops.empty')}</Text>
          )}
          {renderScopedFeedback(managementFeedback, 'shopList', styles, theme)}
          <PaginationControls
            page={shopListPage}
            pageSize={shopListPageSize}
            totalPages={shopListTotalPages}
            totalItems={shopListTotalItems}
            loading={shopListLoading}
            onPageChange={handleShopListPageChange}
            onPageSizeChange={handleShopListPageSizeChange}
          />
        </Card.Content>
      </Card>
    </>
  );
}

export function PromotionsSection({ context, editable }: Props & { editable: boolean }) {
  const { t } = useTranslation();
  const {
    theme,
    styles,
    authUser,
    managementFeedback,
    promotionTitle,
    setPromotionTitle,
    promotionDescription,
    setPromotionDescription,
    manageablePromotionShops,
    promotionShopId,
    setPromotionShopId,
    promotionBonusPoints,
    setPromotionBonusPoints,
    renderDateField,
    promotionStartDate,
    promotionEndDate,
    promotionSubmitting,
    promotionActionLoadingState,
    handleCreatePromotion,
    resetPromotionForm,
    editingPromotionId,
    promotionListItems,
    promotionListLoading,
    promotionListPage,
    promotionListPageSize,
    promotionListTotalPages,
    promotionListTotalItems,
    handlePromotionListPageChange,
    handlePromotionListPageSizeChange,
    claimingPromotionId,
    handleDeletePromotion,
    handleClaimPromotion,
    formatDate,
    handleEditPromotion,
    handleTogglePromotionStatus,
  } = context;
  const safePromotionShops = manageablePromotionShops ?? [];
  const safePromotions = promotionListItems ?? [];
  const isCustomerView = authUser?.role === UserRole.CUSTOMER;

  return (
    <>
      {editable && !editingPromotionId ? (
        <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
          <Card.Title title={t('management.promotions.editTitle')} subtitle={t('management.promotions.editSubtitle')} />
          <Card.Content>
            <FloatingLabelInput
              icon="tag-outline"
              label={t('management.promotions.titleLabel')}
              helperText={t('management.promotions.titleHelper')}
              value={promotionTitle}
              onChangeText={setPromotionTitle}
              autoCapitalize="sentences"
            />
            <FloatingLabelInput
              icon="text-box-outline"
              label={t('management.promotions.descriptionLabel')}
              helperText={t('management.promotions.descriptionHelper')}
              value={promotionDescription}
              onChangeText={setPromotionDescription}
              autoCapitalize="sentences"
              multiline
              numberOfLines={3}
            />
            <SelectField
              label={t('management.promotions.shop')}
              value={promotionShopId}
              onSelect={setPromotionShopId}
              options={safePromotionShops.map((shop: any) => ({
                value: shop.id,
                label: shop.name,
              }))}
            />
            <FloatingLabelInput
              icon="star-four-points-outline"
              label={t('management.promotions.bonusLabel')}
              helperText={t('management.promotions.bonusHelper')}
              keyboardType="number-pad"
              value={promotionBonusPoints}
              onChangeText={setPromotionBonusPoints}
            />
            {renderDateField(t('common.startDate'), promotionStartDate, 'promotion-start', t('management.promotions.startHelper'))}
            {renderDateField(t('common.endDate'), promotionEndDate, 'promotion-end', t('management.promotions.endHelper'))}
            <View style={styles.actionRow}>
              <Button mode="contained" loading={promotionSubmitting} onPress={() => void handleCreatePromotion()}>
                {t('management.promotions.save')}
              </Button>
              <Button mode="outlined" onPress={resetPromotionForm}>{t('common.reset')}</Button>
            </View>
            {renderScopedFeedback(managementFeedback, 'promotionForm', styles, theme)}
          </Card.Content>
        </Card>
      ) : null}

      <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
        <Card.Title title={t('management.promotions.activeTitle')} subtitle={t('management.promotions.activeSubtitle')} />
        <Card.Content>
          {promotionListLoading ? (
            <ActivityIndicator animating size="small" style={styles.secondaryAction} />
          ) : safePromotions.length ? (
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
                    <Button compact mode="outlined" style={styles.rowActionButtonCompact} contentStyle={styles.rowActionButtonContent} labelStyle={styles.rowActionButtonLabel} disabled={promotionActionLoadingState?.id === promotion.id} onPress={() => handleEditPromotion(promotion)}>{t('common.edit')}</Button>
                    <Button compact mode="text" style={styles.rowActionButtonWide} contentStyle={styles.rowActionButtonContent} labelStyle={styles.rowActionButtonLabel} loading={promotionActionLoadingState?.id === promotion.id && promotionActionLoadingState.action === 'status'} disabled={promotionActionLoadingState?.id === promotion.id} onPress={() => void handleTogglePromotionStatus(promotion)}>
                      {promotion.isActive ? t('common.deactivate') : t('common.activate')}
                    </Button>
                    <Button compact mode="text" style={styles.rowActionButtonCompact} contentStyle={styles.rowActionButtonContent} labelStyle={styles.rowActionButtonLabel} textColor={theme.custom.error} loading={promotionActionLoadingState?.id === promotion.id && promotionActionLoadingState.action === 'delete'} disabled={promotionActionLoadingState?.id === promotion.id} onPress={() => void handleDeletePromotion(promotion.id)}>{t('common.delete')}</Button>
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
          {renderScopedFeedback(managementFeedback, 'promotionList', styles, theme)}
          <PaginationControls
            page={promotionListPage}
            pageSize={promotionListPageSize}
            totalPages={promotionListTotalPages}
            totalItems={promotionListTotalItems}
            loading={promotionListLoading}
            onPageChange={handlePromotionListPageChange}
            onPageSizeChange={handlePromotionListPageSizeChange}
          />
        </Card.Content>
      </Card>
    </>
  );
}

export function EventsSection({ context, editable }: Props & { editable: boolean }) {
  const { t } = useTranslation();
  const {
    theme,
    styles,
    eventTitle,
    setEventTitle,
    eventDescription,
    setEventDescription,
    eventLocation,
    setEventLocation,
    renderDateField,
    eventStartDate,
    eventEndDate,
    eventSubmitting,
    eventActionLoadingState,
    managementFeedback,
    handleCreateEvent,
    resetEventForm,
    eventListItems,
    eventListLoading,
    eventListPage,
    eventListPageSize,
    eventListTotalPages,
    eventListTotalItems,
    handleEventListPageChange,
    handleEventListPageSizeChange,
    handleDeleteEvent,
    formatDate,
    handleEditEvent,
    editingEventId,
    handleToggleEventStatus,
  } = context;
  const safeEvents = eventListItems ?? [];

  return (
    <>
      {editable && !editingEventId ? (
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
                {t('management.events.save')}
              </Button>
              <Button mode="outlined" onPress={resetEventForm}>{t('common.reset')}</Button>
            </View>
            {renderScopedFeedback(managementFeedback, 'eventForm', styles, theme)}
          </Card.Content>
        </Card>
      ) : null}

      <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
        <Card.Title title={t('management.events.listTitle')} subtitle={t('management.events.listSubtitle')} />
        <Card.Content>
          {eventListLoading ? (
            <ActivityIndicator animating size="small" style={styles.secondaryAction} />
          ) : safeEvents.length ? (
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
                    <Button compact mode="outlined" style={styles.rowActionButtonCompact} contentStyle={styles.rowActionButtonContent} labelStyle={styles.rowActionButtonLabel} disabled={eventActionLoadingState?.id === event.id} onPress={() => handleEditEvent(event)}>{t('common.edit')}</Button>
                    <Button compact mode="text" style={styles.rowActionButtonWide} contentStyle={styles.rowActionButtonContent} labelStyle={styles.rowActionButtonLabel} loading={eventActionLoadingState?.id === event.id && eventActionLoadingState.action === 'status'} disabled={eventActionLoadingState?.id === event.id} onPress={() => void handleToggleEventStatus(event)}>
                      {event.isActive ? t('common.deactivate') : t('common.activate')}
                    </Button>
                    <Button compact mode="text" style={styles.rowActionButtonCompact} contentStyle={styles.rowActionButtonContent} labelStyle={styles.rowActionButtonLabel} textColor={theme.custom.error} loading={eventActionLoadingState?.id === event.id && eventActionLoadingState.action === 'delete'} disabled={eventActionLoadingState?.id === event.id} onPress={() => void handleDeleteEvent(event.id)}>{t('common.delete')}</Button>
                  </View>
                ) : null}
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.custom.textSecondary }]}>{t('management.events.empty')}</Text>
          )}
          {renderScopedFeedback(managementFeedback, 'eventList', styles, theme)}
          <PaginationControls
            page={eventListPage}
            pageSize={eventListPageSize}
            totalPages={eventListTotalPages}
            totalItems={eventListTotalItems}
            loading={eventListLoading}
            onPageChange={handleEventListPageChange}
            onPageSizeChange={handleEventListPageSizeChange}
          />
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
    categoryActionLoadingState,
    managementFeedback,
    handleSaveCategory,
    resetCategoryForm,
    editingCategoryId,
    categoryListItems,
    categoryListLoading,
    categoryListPage,
    categoryListPageSize,
    categoryListTotalPages,
    categoryListTotalItems,
    handleCategoryListPageChange,
    handleCategoryListPageSizeChange,
    handleEditCategory,
    handleToggleCategoryStatus,
    handleDeleteCategory,
  } = context;
  const safeShops = availableShops ?? [];
  const safeCategories = categoryListItems ?? [];

  return (
    <>
      {!editingCategoryId ? (
        <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
          <Card.Title title={t('management.categories.title')} subtitle={t('management.categories.subtitle')} />
          <Card.Content>
            <SelectField
              label={t('management.categories.shop')}
              value={categoryShopId}
              onSelect={setCategoryShopId}
              options={safeShops.map((shop: any) => ({
                value: shop.id,
                label: shop.name,
              }))}
            />
            <FloatingLabelInput icon="shape-outline" label={t('management.categories.nameLabel')} helperText={t('management.categories.nameHelper')} value={categoryName} onChangeText={setCategoryName} autoCapitalize="words" />
            <FloatingLabelInput icon="percent-outline" label={t('management.categories.discountLabel')} helperText={t('management.categories.discountHelper')} value={categoryDiscountPercent} onChangeText={setCategoryDiscountPercent} keyboardType="number-pad" />
            <View style={styles.filterRow}>
              <Chip selected={categoryIsDefault} mode={categoryIsDefault ? 'flat' : 'outlined'} onPress={() => setCategoryIsDefault((current: boolean) => !current)} style={styles.filterChip}>
                {t('management.categories.defaultLabel')}
              </Chip>
            </View>
            <View style={styles.actionRow}>
              <Button mode="contained" loading={categorySubmitting} onPress={() => void handleSaveCategory()}>
                {t('management.categories.save')}
              </Button>
              <Button mode="outlined" onPress={resetCategoryForm}>{t('common.reset')}</Button>
            </View>
            {renderScopedFeedback(managementFeedback, 'categoryForm', styles, theme)}
          </Card.Content>
        </Card>
      ) : null}

      <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
        <Card.Title title={t('management.categories.title')} subtitle={t('management.categories.subtitle')} />
        <Card.Content>
          {categoryListLoading ? (
            <ActivityIndicator animating size="small" style={styles.secondaryAction} />
          ) : safeCategories.length ? (
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
                  <Button compact mode="outlined" style={styles.rowActionButtonCompact} contentStyle={styles.rowActionButtonContent} labelStyle={styles.rowActionButtonLabel} disabled={categoryActionLoadingState?.id === category.id} onPress={() => handleEditCategory(category)}>{t('common.edit')}</Button>
                  <Button compact mode="text" style={styles.rowActionButtonWide} contentStyle={styles.rowActionButtonContent} labelStyle={styles.rowActionButtonLabel} loading={categoryActionLoadingState?.id === category.id && categoryActionLoadingState.action === 'status'} disabled={categoryActionLoadingState?.id === category.id} onPress={() => void handleToggleCategoryStatus(category)}>
                    {category.isActive ? t('common.deactivate') : t('common.activate')}
                  </Button>
                  {!category.isDefault ? (
                    <Button compact mode="text" style={styles.rowActionButtonCompact} contentStyle={styles.rowActionButtonContent} labelStyle={styles.rowActionButtonLabel} textColor={theme.custom.error} loading={categoryActionLoadingState?.id === category.id && categoryActionLoadingState.action === 'delete'} disabled={categoryActionLoadingState?.id === category.id} onPress={() => void handleDeleteCategory(category.id)}>
                      {t('common.delete')}
                    </Button>
                  ) : null}
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.custom.textSecondary }]}>{t('management.categories.empty')}</Text>
          )}
          {renderScopedFeedback(managementFeedback, 'categoryList', styles, theme)}
          <PaginationControls
            page={categoryListPage}
            pageSize={categoryListPageSize}
            totalPages={categoryListTotalPages}
            totalItems={categoryListTotalItems}
            loading={categoryListLoading}
            onPageChange={handleCategoryListPageChange}
            onPageSizeChange={handleCategoryListPageSizeChange}
          />
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
    managementFeedback,
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
    configHistoryActionLoadingState,
    handleSaveConfiguration,
    systemConfigHistoryItems,
    systemConfigHistoryLoading,
    systemConfigHistoryPage,
    systemConfigHistoryPageSize,
    systemConfigHistoryTotalPages,
    systemConfigHistoryTotalItems,
    handleSystemConfigHistoryPageChange,
    handleSystemConfigHistoryPageSizeChange,
    handleEditConfiguration,
    handleDeleteConfiguration,
    formatDate,
  } = context;
  const safeHistory = systemConfigHistoryItems ?? [];

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
          {renderScopedFeedback(managementFeedback, 'configurationForm', styles, theme)}
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
        <Card.Title title={t('management.configuration.historyTitle')} />
        <Card.Content>
          {systemConfigHistoryLoading ? (
            <ActivityIndicator animating size="small" style={styles.secondaryAction} />
          ) : safeHistory.length ? (
            safeHistory.map((entry: any) => (
              <View key={entry.id || entry.version} style={styles.shopRow}>
                <View style={styles.shopRowBody}>
                  <Text style={[styles.listTitle, { color: theme.custom.textPrimary }]}>v{entry.version}</Text>
                  <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>
                    {entry.welcomeBonusPoints} / {entry.pointExpirationDays} / {entry.maxPointsPerTransaction} / {entry.defaultMaxDiscountPercent}%
                  </Text>
                  {entry.changeReason ? (
                    <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{entry.changeReason}</Text>
                  ) : null}
                  {entry.createdAt ? (
                    <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>
                      {formatDate(entry.createdAt)}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.shopActions}>
                  <Button compact mode="outlined" style={styles.rowActionButtonCompact} contentStyle={styles.rowActionButtonContent} labelStyle={styles.rowActionButtonLabel} disabled={configHistoryActionLoadingState?.id === entry.id} onPress={() => handleEditConfiguration(entry)}>
                    {t('common.edit')}
                  </Button>
                  <Button compact mode="text" style={styles.rowActionButtonCompact} contentStyle={styles.rowActionButtonContent} labelStyle={styles.rowActionButtonLabel} textColor={theme.custom.error} loading={configHistoryActionLoadingState?.id === entry.id && configHistoryActionLoadingState.action === 'delete'} disabled={configHistoryActionLoadingState?.id === entry.id} onPress={() => void handleDeleteConfiguration(entry.id)}>
                    {t('common.delete')}
                  </Button>
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.custom.textSecondary }]}>{t('management.configuration.historyEmpty')}</Text>
          )}
          {renderScopedFeedback(managementFeedback, 'configurationList', styles, theme)}
          <PaginationControls
            page={systemConfigHistoryPage}
            pageSize={systemConfigHistoryPageSize}
            totalPages={systemConfigHistoryTotalPages}
            totalItems={systemConfigHistoryTotalItems}
            loading={systemConfigHistoryLoading}
            onPageChange={handleSystemConfigHistoryPageChange}
            onPageSizeChange={handleSystemConfigHistoryPageSizeChange}
          />
        </Card.Content>
      </Card>
    </>
  );
}

export function InternalUserManagementSection({ context }: Props) {
  const { t } = useTranslation();
  const { theme, styles, managementFeedback, allowedInternalRoles, internalRole, setInternalRole, internalFirstName, setInternalFirstName, internalLastName, setInternalLastName, trimmedInternalUsername, internalUsername, setInternalUsername, setInternalTouched, internalEmailError, trimmedInternalEmail, internalEmail, setInternalEmail, internalPasswordError, internalPasswordVisible, setInternalPasswordVisible, internalPassword, setInternalPassword, userSubmitting, handleCreateInternalUser, resetInternalUserForm } = context;
  const safeAllowedRoles = allowedInternalRoles ?? [];

  if (!safeAllowedRoles.length) {
    return null;
  }

  return (
      <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
        <Card.Title title={t('management.users.title')} subtitle={t('management.users.subtitle')} />
        <Card.Content>
        <SelectField
          label={t('common.role')}
          value={internalRole}
          onSelect={setInternalRole}
          options={safeAllowedRoles.map((role: string) => ({
            value: role,
            label: t(`roles.${role.toLowerCase()}`),
          }))}
        />
        <FloatingLabelInput icon="account-outline" label={t('management.users.firstNameLabel')} helperText={t('management.users.firstNameHelper')} value={internalFirstName} onChangeText={setInternalFirstName} autoCapitalize="words" />
        <FloatingLabelInput icon="badge-account-outline" label={t('management.users.lastNameLabel')} helperText={t('management.users.lastNameHelper')} value={internalLastName} onChangeText={setInternalLastName} autoCapitalize="words" />
        <FloatingLabelInput icon="account-circle-outline" label={t('management.users.usernameLabel')} helperText={t('management.users.usernameHelper')} valid={Boolean(trimmedInternalUsername)} value={internalUsername} onChangeText={text => { setInternalUsername(text); setInternalTouched((current: any) => ({ ...current, username: true })); }} autoCapitalize="none" />
        <FloatingLabelInput icon="email-outline" label={t('management.users.emailLabel')} error={internalEmailError} helperText={!internalEmailError ? t('management.users.emailHelper') : undefined} valid={Boolean(trimmedInternalEmail) && !internalEmailError} value={internalEmail} onChangeText={text => { setInternalEmail(text); setInternalTouched((current: any) => ({ ...current, email: true })); }} autoCapitalize="none" keyboardType="email-address" />
        <FloatingLabelInput icon="lock-outline" label={t('management.users.passwordLabel')} error={internalPasswordError} helperText={!internalPasswordError ? t('management.users.passwordHelper') : undefined} onToggleSecureEntry={() => setInternalPasswordVisible((current: boolean) => !current)} secureTextEntry={!internalPasswordVisible} valid={internalPassword.length >= 8} value={internalPassword} onChangeText={text => { setInternalPassword(text); setInternalTouched((current: any) => ({ ...current, password: true })); }} />
        <View style={styles.actionRow}>
          <Button mode="contained" loading={userSubmitting} onPress={() => void handleCreateInternalUser()}>{t('management.users.create')}</Button>
          <Button mode="outlined" onPress={resetInternalUserForm}>{t('common.reset')}</Button>
        </View>
        {renderScopedFeedback(managementFeedback, 'internalUserForm', styles, theme)}
      </Card.Content>
    </Card>
  );
}

export function AdminUserManagementSection({ context }: Props) {
  const {
    managementFeedback,
    representativeListItems,
    representativeListLoading,
    representativeListPage,
    representativeListPageSize,
    representativeListTotalPages,
    representativeListTotalItems,
    handleRepresentativeListPageChange,
    handleRepresentativeListPageSizeChange,
    merchantListItems,
    merchantListLoading,
    merchantListPage,
    merchantListPageSize,
    merchantListTotalPages,
    merchantListTotalItems,
    handleMerchantListPageChange,
    handleMerchantListPageSizeChange,
    directoryCustomerListItems,
    directoryCustomerListLoading,
    directoryCustomerListPage,
    directoryCustomerListPageSize,
    directoryCustomerListTotalPages,
    directoryCustomerListTotalItems,
    handleDirectoryCustomerListPageChange,
    handleDirectoryCustomerListPageSizeChange,
    handleActivateUser,
    handleDeactivateUser,
    handleDeleteUser,
  } = context;

  const representativeError = managementFeedback?.target === 'representativesList' ? managementFeedback.error : undefined;
  const representativeSuccess = managementFeedback?.target === 'representativesList' ? managementFeedback.success : undefined;
  const merchantError = managementFeedback?.target === 'merchantsList' ? managementFeedback.error : undefined;
  const merchantSuccess = managementFeedback?.target === 'merchantsList' ? managementFeedback.success : undefined;
  const customerError = managementFeedback?.target === 'customersList' ? managementFeedback.error : undefined;
  const customerSuccess = managementFeedback?.target === 'customersList' ? managementFeedback.success : undefined;

  return (
    <>
      <InternalUserManagementSection context={context} />
      <RepresentativeDirectoryCard
        users={representativeListItems}
        showStatus
        onActivate={handleActivateUser}
        onDeactivate={handleDeactivateUser}
        onDelete={handleDeleteUser}
        loading={representativeListLoading}
        page={representativeListPage}
        pageSize={representativeListPageSize}
        totalPages={representativeListTotalPages}
        totalItems={representativeListTotalItems}
        onPageChange={handleRepresentativeListPageChange}
        onPageSizeChange={handleRepresentativeListPageSizeChange}
        errorMessage={representativeError}
        successMessage={representativeSuccess}
      />
      <MerchantDirectoryCard
        users={merchantListItems}
        showStatus
        onActivate={handleActivateUser}
        onDeactivate={handleDeactivateUser}
        onDelete={handleDeleteUser}
        loading={merchantListLoading}
        page={merchantListPage}
        pageSize={merchantListPageSize}
        totalPages={merchantListTotalPages}
        totalItems={merchantListTotalItems}
        onPageChange={handleMerchantListPageChange}
        onPageSizeChange={handleMerchantListPageSizeChange}
        errorMessage={merchantError}
        successMessage={merchantSuccess}
      />
      <CustomerDirectoryCard
        users={directoryCustomerListItems}
        showStatus
        onActivate={handleActivateUser}
        onDeactivate={handleDeactivateUser}
        onDelete={handleDeleteUser}
        loading={directoryCustomerListLoading}
        page={directoryCustomerListPage}
        pageSize={directoryCustomerListPageSize}
        totalPages={directoryCustomerListTotalPages}
        totalItems={directoryCustomerListTotalItems}
        onPageChange={handleDirectoryCustomerListPageChange}
        onPageSizeChange={handleDirectoryCustomerListPageSizeChange}
        errorMessage={customerError}
        successMessage={customerSuccess}
      />
    </>
  );
}

export function RepresentativeUserManagementSection({ context }: Props) {
  const {
    managementFeedback,
    merchantListItems,
    merchantListLoading,
    merchantListPage,
    merchantListPageSize,
    merchantListTotalPages,
    merchantListTotalItems,
    handleMerchantListPageChange,
    handleMerchantListPageSizeChange,
    directoryCustomerListItems,
    directoryCustomerListLoading,
    directoryCustomerListPage,
    directoryCustomerListPageSize,
    directoryCustomerListTotalPages,
    directoryCustomerListTotalItems,
    handleDirectoryCustomerListPageChange,
    handleDirectoryCustomerListPageSizeChange,
  } = context;

  const merchantError = managementFeedback?.target === 'merchantsList' ? managementFeedback.error : undefined;
  const merchantSuccess = managementFeedback?.target === 'merchantsList' ? managementFeedback.success : undefined;
  const customerError = managementFeedback?.target === 'customersList' ? managementFeedback.error : undefined;
  const customerSuccess = managementFeedback?.target === 'customersList' ? managementFeedback.success : undefined;

  return (
    <>
      <InternalUserManagementSection context={context} />
      <MerchantDirectoryCard
        users={merchantListItems}
        loading={merchantListLoading}
        page={merchantListPage}
        pageSize={merchantListPageSize}
        totalPages={merchantListTotalPages}
        totalItems={merchantListTotalItems}
        onPageChange={handleMerchantListPageChange}
        onPageSizeChange={handleMerchantListPageSizeChange}
        errorMessage={merchantError}
        successMessage={merchantSuccess}
      />
      <CustomerDirectoryCard
        users={directoryCustomerListItems}
        loading={directoryCustomerListLoading}
        page={directoryCustomerListPage}
        pageSize={directoryCustomerListPageSize}
        totalPages={directoryCustomerListTotalPages}
        totalItems={directoryCustomerListTotalItems}
        onPageChange={handleDirectoryCustomerListPageChange}
        onPageSizeChange={handleDirectoryCustomerListPageSizeChange}
        errorMessage={customerError}
        successMessage={customerSuccess}
      />
      <CustomersTab context={context} />
    </>
  );
}
