# Seed Login Credentials

These accounts are created by `npm run seed:demo`.

## Role-wise logins

| Role | Name | Login identifier | Default password |
| --- | --- | --- | --- |
| ADMIN | System Admin | `admin@sottocasa.it` | `Admin123!` |
| REPRESENTATIVE | Rita Representative | `representative@sottocasa.it` | `Representative123!` |
| MERCHANT | Marco Merchant | `merchant@sottocasa.it` | `Merchant123!` |
| CUSTOMER | Luca Customer | `customer@sottocasa.it` | `Customer123!` |
| CUSTOMER | Anna Customer | `customer2@sottocasa.it` | `Customer123!` |

## Notes

- You can override any email or password from `.env`.
- Login uses the same `identifier` and `password` fields accepted by `/auth/login`.
- The demo seed also creates wallets, shops, promotions, events, and wallet transactions linked to these users.
- The npm seed commands already enable `ALLOW_ROLE_USER_SEED=true` for you.
