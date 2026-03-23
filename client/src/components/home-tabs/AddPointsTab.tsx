import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Button, Card, Chip } from 'react-native-paper';
import { FloatingLabelInput } from '../auth/FloatingLabelInput';

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
    submitting,
    handleAddPoints,
    handleSpendPoints,
  } = context;

  return (
    <>
      <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
        <Card.Title title={t('addPoints.earn.title')} subtitle={t('addPoints.earn.subtitle')} />
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
          <Button mode="outlined" onPress={() => navigation.navigate('MerchantScan')} style={styles.secondaryAction}>
            {t('addPoints.scanQr')}
          </Button>

          <Text style={[styles.sectionLabel, { color: theme.custom.textSecondary }]}>{t('addPoints.chooseCustomer')}</Text>
          <View style={styles.filterRow}>
            {filteredCustomers.slice(0, 8).map((customer: any) => (
              <Chip
                key={customer.id}
                selected={selectedCustomerId === customer.id}
                mode={selectedCustomerId === customer.id ? 'flat' : 'outlined'}
                onPress={() => setSelectedCustomerId(customer.id)}
                style={styles.filterChip}
              >
                {[customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.username}
              </Chip>
            ))}
          </View>

          <Text style={[styles.sectionLabel, { color: theme.custom.textSecondary }]}>{t('addPoints.pointType')}</Text>
          <View style={styles.filterRow}>
            {pointTypeOptions.map((option: string) => (
              <Chip
                key={option}
                selected={pointType === option}
                mode={pointType === option ? 'flat' : 'outlined'}
                onPress={() => setPointType(option)}
                style={styles.filterChip}
              >
                {option}
              </Chip>
            ))}
          </View>

          <Text style={[styles.sectionLabel, { color: theme.custom.textSecondary }]}>{t('addPoints.selectShop')}</Text>
          {availableShops.length ? (
            <View style={styles.filterRow}>
              {availableShops.map((shop: any) => (
                <Chip
                  key={shop.id}
                  selected={selectedShopId === shop.id}
                  mode={selectedShopId === shop.id ? 'flat' : 'outlined'}
                  onPress={() => setSelectedShopId(shop.id)}
                  style={styles.filterChip}
                >
                  {shop.name}
                </Chip>
              ))}
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: theme.custom.textSecondary }]}>
              {t('addPoints.noShops')}
            </Text>
          )}

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
