import React from 'react';
import { Text, View } from 'react-native';
import { Button, Card, Chip } from 'react-native-paper';
import { FloatingLabelInput } from '../auth/FloatingLabelInput';

type Props = {
  context: any;
};

export function AddPointsTab({ context }: Props) {
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
        <Card.Title title="Add Points" subtitle="Merchant earn transaction for a customer" />
        <Card.Content>
          <Text style={[styles.sectionLabel, { color: theme.custom.textSecondary }]}>Selected Customer</Text>
          {selectedCustomer ? (
            <View style={[styles.selectionCard, { borderColor: theme.custom.border }]}>
              <Text style={[styles.selectedValue, { color: theme.custom.textPrimary }]}>
                {[selectedCustomer.firstName, selectedCustomer.lastName].filter(Boolean).join(' ') || selectedCustomer.username}
              </Text>
              <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{selectedCustomer.email}</Text>
            </View>
          ) : (
            <Text style={[styles.selectedValue, { color: theme.custom.textPrimary }]}>
              Choose a customer below or from the Customers tab.
            </Text>
          )}
          <Button mode="outlined" onPress={() => navigation.navigate('MerchantScan')} style={styles.secondaryAction}>
            Scan Customer QR
          </Button>

          <Text style={[styles.sectionLabel, { color: theme.custom.textSecondary }]}>Choose Customer</Text>
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

          <Text style={[styles.sectionLabel, { color: theme.custom.textSecondary }]}>Point Type</Text>
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

          <Text style={[styles.sectionLabel, { color: theme.custom.textSecondary }]}>Select Shop</Text>
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
              No merchant shop is available for point assignment.
            </Text>
          )}

          <FloatingLabelInput
            icon="plus-circle-outline"
            label="Points"
            helperText="Enter how many points should be added to the customer wallet."
            keyboardType="number-pad"
            value={points}
            onChangeText={setPoints}
          />
          <FloatingLabelInput
            icon="text-box-outline"
            label="Description"
            helperText="Add an optional note explaining why these points were issued."
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
            Submit Earn Transaction
          </Button>
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
        <Card.Title title="Accept Points" subtitle="Settle a purchase with discount, payable amount, and new points" />
        <Card.Content>
          <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>
            Same-shop restriction is enforced automatically and discounts are capped at 30% of the purchase.
          </Text>
          <FloatingLabelInput
            icon="cash-multiple"
            label="Purchase amount"
            helperText="Enter the bill total before discounts are applied."
            keyboardType="number-pad"
            value={purchaseAmount}
            onChangeText={setPurchaseAmount}
          />
          <FloatingLabelInput
            icon="ticket-percent-outline"
            label="Requested points to use"
            helperText="Enter how many customer points should be redeemed."
            keyboardType="number-pad"
            value={spendPoints}
            onChangeText={setSpendPoints}
          />
          <FloatingLabelInput
            icon="text-box-outline"
            label="Settlement description"
            helperText="Add an optional note for the purchase or redemption context."
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
            Submit Purchase Settlement
          </Button>
        </Card.Content>
      </Card>
    </>
  );
}
