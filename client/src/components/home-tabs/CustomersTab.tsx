import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { Card, Chip } from 'react-native-paper';
import { FloatingLabelInput } from '../auth/FloatingLabelInput';

type Props = {
  context: any;
};

export function CustomersTab({ context }: Props) {
  const { t } = useTranslation();
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
        <Card.Title title={t('customers.title')} subtitle={t('customers.subtitle')} />
        <Card.Content>
          <FloatingLabelInput
            icon="magnify"
            label={t('customers.searchLabel')}
            helperText={t('customers.searchHelper')}
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
                    <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>
                      {t('common.role')}: {t(`roles.${customer.role.toLowerCase()}`)}
                    </Text>
                  </View>
                  <Chip selected={selected} mode={selected ? 'flat' : 'outlined'}>
                    {selected ? t('customers.selected') : t('customers.select')}
                  </Chip>
                </Pressable>
              );
            })
          ) : (
            <Text style={[styles.emptyText, { color: theme.custom.textSecondary }]}>{t('customers.empty')}</Text>
          )}
        </Card.Content>
      </Card>

      {selectedCustomerWallet ? (
        <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
          <Card.Title title={t('customers.selectedWalletTitle')} subtitle={selectedCustomerWallet.customer.email} />
          <Card.Content>
            <Text style={[styles.listTitle, { color: theme.custom.textPrimary }]}>
              {t('common.balance')}: {selectedCustomerWallet.balance} {t('common.pointsShort')}
            </Text>
            {selectedCustomerWallet.pointsBreakdown.map((item: any) => (
              <Text key={item.pointType} style={[styles.listMeta, { color: theme.custom.textSecondary }]}>
                {t(`pointTypes.${item.pointType.toLowerCase()}`)}: {item.balance}
              </Text>
            ))}
          </Card.Content>
        </Card>
      ) : null}
    </>
  );
}
