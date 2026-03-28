import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { FloatingLabelInput } from '../auth/FloatingLabelInput';
import { SelectField } from '../common/SelectField';

type Props = {
  context: any;
};

export function AddPointsTab({ context }: Props) {
  const { t } = useTranslation();
  const {
    theme,
    styles,
    navigation,
    selectedCustomer,
    selectedCustomerId,
    selectedShopId,
    availableShops,
    filteredCustomers,
    pointTypeOptions,
    pointType,
    setPointType,
    setSelectedCustomerId,
    setSelectedShopId,
    points,
    setPoints,
    description,
    setDescription,
    purchaseAmount,
    setPurchaseAmount,
    spendPoints,
    setSpendPoints,
    spendDescription,
    setSpendDescription,
    previewCategories,
    selectedCategoryId,
    setSelectedCategoryId,
    previewLoading,
    settlementPreview,
    error,
    successMessage,
    walletActionFeedback,
    handlePreviewSettlement,
    submitting,
    handleAddPoints,
    handleSpendPoints,
  } = context;

  const resolvedPayableAmount =
    settlementPreview && purchaseAmount.trim()
      ? Number(purchaseAmount) - settlementPreview.usedPoints
      : settlementPreview?.payableAmount ?? 0;
  const recentCustomers = filteredCustomers.slice(0, 3);

  return (
    <>
      <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
        <Card.Title title={t('addPoints.customerCard.title')} subtitle={t('addPoints.customerCard.subtitle')} />
        <Card.Content>
          <Text style={[styles.sectionLabel, { color: theme.custom.textSecondary }]}>{t('addPoints.selectedCustomer')}</Text>
          {selectedCustomer ? (
            <View style={[styles.selectionCard, { borderColor: theme.custom.border }]}>
              <Text style={[styles.selectedValue, { color: theme.custom.textPrimary }]}>
                {[selectedCustomer.firstName, selectedCustomer.lastName].filter(Boolean).join(' ') || selectedCustomer.username}
              </Text>
              <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{selectedCustomer.email}</Text>
            </View>
          ) : (
            <Text style={[styles.selectedValue, { color: theme.custom.textPrimary }]}>
              {t('addPoints.chooseCustomerHint')}
            </Text>
          )}
          <Button mode="outlined" onPress={() => navigation.navigate('MerchantScan')}  style={[styles.secondaryAction, { marginBottom: 2 }]}>
            {t('addPoints.scanQr')}
          </Button>

          <Text style={[styles.sectionLabel, { color: theme.custom.textSecondary, marginTop: 4 }]}>
            {t('addPoints.recentCustomers')}
          </Text>
          <SelectField
            label={t('addPoints.chooseCustomer')}
            value={selectedCustomerId}
            onSelect={setSelectedCustomerId}
            options={recentCustomers.map((customer: any) => ({
              value: customer.id,
              label: [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.username,
            }))}
            placeholder={t('addPoints.chooseCustomerHint')}
          />
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
        <Card.Title title={t('addPoints.earn.title')} subtitle={t('addPoints.earn.subtitle')} />
        <Card.Content>
          <SelectField
            label={t('addPoints.pointType')}
            value={pointType}
            onSelect={setPointType}
            options={pointTypeOptions.map((option: string) => ({
              value: option,
              label: option,
            }))}
          />

          {availableShops.length ? (
            <SelectField
              label={t('addPoints.selectShop')}
              value={selectedShopId}
              onSelect={setSelectedShopId}
              options={availableShops.map((shop: any) => ({
                value: shop.id,
                label: shop.name,
              }))}
            />
          ) : (
            <Text style={[styles.emptyText, { color: theme.custom.textSecondary }]}>
              {t('addPoints.noShops')}
            </Text>
          )}

          {previewCategories?.length ? (
            <SelectField
              label={t('addPoints.category')}
              value={selectedCategoryId}
              onSelect={setSelectedCategoryId}
              options={previewCategories.map((category: any) => ({
                value: category.id,
                label: category.formattedName || category.name,
              }))}
            />
          ) : null}

          <FloatingLabelInput
            icon="plus-circle-outline"
            label={t('addPoints.fields.pointsLabel')}
            helperText={t('addPoints.fields.pointsHelper')}
            keyboardType="number-pad"
            value={points}
            onChangeText={setPoints}
          />
          <FloatingLabelInput
            icon="text-box-outline"
            label={t('addPoints.fields.descriptionLabel')}
            helperText={t('addPoints.fields.descriptionHelper')}
            value={description}
            onChangeText={setDescription}
            autoCapitalize="sentences"
            multiline
            numberOfLines={3}
          />
          <Button
            mode="contained"
            disabled={!selectedCustomerId.trim() || !selectedShopId.trim() || !points.trim()}
            loading={submitting}
            onPress={() => void handleAddPoints()}
          >
            {t('addPoints.earn.submit')}
          </Button>
          {walletActionFeedback === 'earn' && error ? (
            <Text style={[styles.message, { color: theme.custom.error }]}>
              {error}
            </Text>
          ) : null}
          {walletActionFeedback === 'earn' && !error && successMessage ? (
            <Text style={[styles.message, { color: theme.custom.success }]}>
              {successMessage}
            </Text>
          ) : null}
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
        <Card.Title title={t('addPoints.spend.title')} subtitle={t('addPoints.spend.subtitle')} />
        <Card.Content>
          <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>
            {t('addPoints.spend.helper')}
          </Text>
          <FloatingLabelInput
            icon="cash-multiple"
            label={t('addPoints.fields.purchaseAmountLabel')}
            helperText={t('addPoints.fields.purchaseAmountHelper')}
            keyboardType="number-pad"
            value={purchaseAmount}
            onChangeText={setPurchaseAmount}
          />
          <FloatingLabelInput
            icon="ticket-percent-outline"
            label={t('addPoints.fields.redeemPointsLabel')}
            helperText={t('addPoints.fields.redeemPointsHelper')}
            keyboardType="number-pad"
            value={spendPoints}
            onChangeText={setSpendPoints}
          />
          <FloatingLabelInput
            icon="text-box-outline"
            label={t('addPoints.fields.settlementDescriptionLabel')}
            helperText={t('addPoints.fields.settlementDescriptionHelper')}
            value={spendDescription}
            onChangeText={setSpendDescription}
            autoCapitalize="sentences"
            multiline
            numberOfLines={3}
          />
          {(walletActionFeedback === 'spend' || walletActionFeedback === 'preview') && error ? (
            <Text style={[styles.message, { color: theme.custom.error }]}>
              {error}
            </Text>
          ) : null}
          {(walletActionFeedback === 'spend' || walletActionFeedback === 'preview') && !error && successMessage ? (
            <Text style={[styles.message, { color: theme.custom.success }]}>
              {successMessage}
            </Text>
          ) : null}
          <Button
            mode="outlined"
            disabled={!selectedCustomerId.trim() || !selectedShopId.trim() || !purchaseAmount.trim() || !spendPoints.trim()}
            loading={previewLoading}
            onPress={() => void handlePreviewSettlement()}
            style={styles.secondaryAction}
          >
            {t('addPoints.preview.action')}
          </Button>
          {settlementPreview ? (
            <View style={[styles.selectionCard, { borderColor: theme.custom.border }]}>
              <Text style={[styles.listTitle, { color: theme.custom.textPrimary }]}>{t('addPoints.preview.title')}</Text>
              <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>
                {t('wallet.availablePoints')}: {settlementPreview.availablePoints}
              </Text>
              <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>
                {t('addPoints.preview.usedPoints')}: {settlementPreview.usedPoints}
              </Text>
              <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>
                {t('addPoints.preview.maxDiscount')}: {settlementPreview.maxDiscountPoints} ({settlementPreview.maxDiscountPercent}%)
              </Text>
              <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>
                {t('addPoints.preview.discountAmount')}: {settlementPreview.usedPoints}
              </Text>
              <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>
                {t('addPoints.preview.payableAmount')}: {resolvedPayableAmount}
              </Text>
              <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>
                {t('addPoints.preview.earnedPoints')}: {settlementPreview.earnedPoints ?? 0}
              </Text>
              <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>
                {t('addPoints.preview.bonusPoints')}: {settlementPreview.bonusPoints}
              </Text>
              <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>
                {t('addPoints.preview.predictedBalance')}: {settlementPreview.predictedBalance}
              </Text>
              <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>
                {t('addPoints.category')}: {settlementPreview.categoryName || t('addPoints.preview.categoryFallback')}
              </Text>
            </View>
          ) : null}
          <Button
            mode="contained"
            disabled={!selectedCustomerId.trim() || !selectedShopId.trim() || !purchaseAmount.trim() || !spendPoints.trim()}
            loading={submitting}
            onPress={() => void handleSpendPoints()}
          >
            {t('addPoints.spend.submit')}
          </Button>
        </Card.Content>
      </Card>
    </>
  );
}
