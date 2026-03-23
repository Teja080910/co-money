import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Card, Chip } from 'react-native-paper';
import { FloatingLabelInput } from '../auth/FloatingLabelInput';

type Props = {
  context: any;
};

export function CustomersTab({ context }: Props) {
  const {
    theme,
    styles,
    customerSearch,
    setCustomerSearch,
    filteredCustomers,
    selectedCustomerId,
    setSelectedCustomerId,
    selectedCustomerWallet,
  } = context;

  return (
    <>
      <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
        <Card.Title title="Customers" subtitle="Customer-role accounts available for point assignment" />
        <Card.Content>
          <FloatingLabelInput
            icon="magnify"
            label="Search by name, username, or email"
            helperText="Filter the customer list to find the right wallet faster."
            value={customerSearch}
            onChangeText={setCustomerSearch}
            autoCapitalize="none"
          />
          {filteredCustomers.length ? (
            filteredCustomers.map((customer: any) => {
              const selected = selectedCustomerId === customer.id;
              const customerName = [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.username;

              return (
                <Pressable
                  key={customer.id}
                  onPress={() => setSelectedCustomerId(customer.id)}
                  style={[
                    styles.customerRow,
                    {
                      backgroundColor: selected ? 'rgba(47,107,255,0.08)' : theme.custom.surfaceStrong,
                      borderColor: selected ? theme.custom.brand : theme.custom.border,
                    },
                  ]}
                >
                  <View style={styles.customerRowBody}>
                    <Text style={[styles.listTitle, { color: theme.custom.textPrimary }]}>{customerName}</Text>
                    <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{customer.email}</Text>
                    <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>Role: {customer.role}</Text>
                  </View>
                  <Chip selected={selected} mode={selected ? 'flat' : 'outlined'}>
                    {selected ? 'Selected' : 'Select'}
                  </Chip>
                </Pressable>
              );
            })
          ) : (
            <Text style={[styles.emptyText, { color: theme.custom.textSecondary }]}>No customer-role users match your search.</Text>
          )}
        </Card.Content>
      </Card>

      {selectedCustomerWallet ? (
        <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
          <Card.Title title="Selected Customer Wallet" subtitle={selectedCustomerWallet.customer.email} />
          <Card.Content>
            <Text style={[styles.listTitle, { color: theme.custom.textPrimary }]}>
              Balance: {selectedCustomerWallet.balance} pts
            </Text>
            {selectedCustomerWallet.pointsBreakdown.map((item: any) => (
              <Text key={item.pointType} style={[styles.listMeta, { color: theme.custom.textSecondary }]}>
                {item.pointType}: {item.balance}
              </Text>
            ))}
          </Card.Content>
        </Card>
      ) : null}
    </>
  );
}
