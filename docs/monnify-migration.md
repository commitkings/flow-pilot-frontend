# FlowPilot → Monnify by Moniepoint: Migration Plan

> **Scope:** Replace simulated wallet infrastructure with Monnify's Reserved Account API, transfer/disbursement endpoints, and identity verification APIs. Every user — individual or business — gets their own dedicated virtual account in their name.

---

## 1. What We Are Replacing

| Current (Simulated) | Monnify Replacement |
|---|---|
| Virtual account generation (fake numbers) | Monnify Reserved Account (real NUBAN, per user) |
| Wallet top-up detection | Monnify webhook — `SUCCESSFUL_TRANSACTION` on reserved account |
| BVN/NIN lookup (stub/auto-verify) | Monnify BVN/NIN Match API |
| Payout disbursements (simulated) | Monnify Single & Bulk Transfer API |
| Account number lookup | Monnify Account Verification API |
| Bank list | Monnify Banks List API |

---

## 2. Monnify API Credentials

| Environment | Base URL |
|---|---|
| Sandbox | `https://sandbox.monnify.com` |
| Production | `https://api.monnify.com` |

**Auth:** All calls require a Bearer token:

```
POST /api/v1/auth/login
Authorization: Basic base64(apiKey:secretKey)
```

Response includes `accessToken` (valid ~60 min). Cache it and refresh on 401.

**Env vars:**
```env
MONNIFY_API_KEY=
MONNIFY_SECRET_KEY=
MONNIFY_CONTRACT_CODE=
MONNIFY_BASE_URL=https://sandbox.monnify.com
```

---

## 3. Virtual Accounts — One Per User

Every user gets their own dedicated reserved account at the end of onboarding. The account name reflects who they are:

- **Individual** → account name = user's full name (e.g. `"Chidera Ozigbo"`)
- **Business** → account name = business name (e.g. `"Acme Corp"`)

### 3.1 Create Reserved Account (on onboarding complete)

Call this immediately after `POST /onboarding/complete` succeeds.

```
POST /api/v2/bank-transfer/reserved-accounts
Authorization: Bearer {token}

{
  "accountReference": "fp-{business_id}",
  "accountName": "{user full name OR business name}",
  "currencyCode": "NGN",
  "contractCode": "{MONNIFY_CONTRACT_CODE}",
  "customerEmail": "{user email}",
  "customerName": "{user full name OR business name}",
  "getAllAvailableBanks": false,
  "preferredBanks": ["035"]
}
```

> `accountReference` must be unique and immutable — use `business_id` (UUID).  
> Do **not** include `bvn` here — it is attached later when the user completes KYC Level 1.

**Response fields to store:**

| Response field | DB column |
|---|---|
| `accounts[0].accountNumber` | `virtual_account_number` |
| `accounts[0].bankName` | `virtual_account_bank` |
| `accounts[0].bankCode` | `virtual_account_bank_code` (add column) |
| `reservedAccountCode` | `virtual_account_reference` (add column) |

### 3.2 Update Reserved Account with BVN After KYC Level 1

Once an individual user verifies their BVN/NIN (KYC Level 1), attach it to their reserved account to increase transaction limits:

```
PUT /api/v2/bank-transfer/reserved-accounts/update-payment-source-filter/{accountReference}
Authorization: Bearer {token}

{
  "bvn": "{verified bvn}"
}
```

### 3.3 Detect Top-ups (Webhook)

Monnify sends `SUCCESSFUL_TRANSACTION` when someone pays into a reserved account.

**Webhook payload (simplified):**
```json
{
  "eventType": "SUCCESSFUL_TRANSACTION",
  "eventData": {
    "product": { "reference": "fp-{business_id}" },
    "amountPaid": 5000.00,
    "paymentReference": "MNFY|...",
    "paidOn": "2026-04-16 14:30:00"
  }
}
```

**Implement:**
- Route: `POST /api/v1/webhooks/monnify` (unauthenticated, validates Monnify HMAC signature)
- Look up business by `product.reference` → increment `wallet_balance`
- Create `wallet_transaction` record
- Send top-up notification (email + in-app)

**Signature verification:**
```python
import hmac, hashlib
computed = hmac.new(secret.encode(), raw_body, hashlib.sha512).hexdigest()
assert computed == request.headers["monnify-signature"]
```

---

## 4. Payout Disbursements

### 4.1 Verify Recipient Account (Before Transfer)

```
GET /api/v1/disbursements/account/validate
  ?accountNumber=0123456789
  &bankCode=058
Authorization: Bearer {token}
```

Show the resolved `accountName` in the approval UI before initiating a transfer.

### 4.2 Single Transfer

```
POST /api/v1/disbursements/single
Authorization: Bearer {token}

{
  "amount": 50000,
  "reference": "fp-txn-{uuid}",
  "narration": "FlowPilot Payout — Run #123",
  "destinationBankCode": "058",
  "destinationAccountNumber": "0123456789",
  "currency": "NGN",
  "sourceAccountNumber": "{merchant_wallet_account}"
}
```

**Response fields to store:**

| Field | Purpose |
|---|---|
| `responseBody.reference` | your reference for status lookup |
| `responseBody.status` | `SUCCESS`, `FAILED`, `PENDING` |
| `responseBody.disbursementReference` | Monnify's reference |

### 4.3 Bulk Transfer (Entire Run)

```
POST /api/v1/disbursements/batch
Authorization: Bearer {token}

{
  "title": "FlowPilot Run #123",
  "batchReference": "fp-run-{run_id}",
  "narration": "Batch payout",
  "sourceAccountNumber": "{merchant_wallet_account}",
  "onValidationFailure": "CONTINUE",
  "notificationInterval": 25,
  "transactionList": [
    {
      "amount": 50000,
      "reference": "fp-txn-{uuid}",
      "narration": "Salary — John",
      "destinationBankCode": "058",
      "destinationAccountNumber": "0123456789",
      "currency": "NGN"
    }
  ]
}
```

**Batch result webhooks:** `SUCCESSFUL_DISBURSEMENT` / `FAILED_DISBURSEMENT`

### 4.4 Check Transfer Status

```
GET /api/v1/disbursements/single/summary
  ?reference=fp-txn-{uuid}
Authorization: Bearer {token}
```

---

## 5. Identity Verification (KYC)

### 5.1 BVN Match

```
POST /api/v1/kyc/bvn/match
Authorization: Bearer {token}

{
  "bvn": "12345678901",
  "name": "John Doe",
  "dateOfBirth": "1990-01-15",
  "mobileNo": "08012345678"
}
```

**Response:** `matchStatus` — `EXACT_MATCH`, `PARTIAL_MATCH`, or `NO_MATCH`

Treat `EXACT_MATCH` and `PARTIAL_MATCH` as passing. Log `NO_MATCH` for manual review.

### 5.2 NIN Lookup

```
POST /api/v1/kyc/nin
Authorization: Bearer {token}

{
  "nin": "12345678901",
  "dateOfBirth": "1990-01-15"
}
```

**Response:** `firstName`, `lastName`, `dateOfBirth`, `gender`, `photo` (base64)

### 5.3 Wire into Individual KYC Level 1

Replace `asyncio.create_task(_auto_verify_individual_kyc(...))` in `POST /kyc/individual/level1`:

```python
async def _verify_with_monnify(business_id, user_id, id_type, id_value, user_name, dob):
    token = await monnify_auth.get_token()
    if id_type == "bvn":
        result = await monnify.bvn_match(token, id_value, user_name, dob)
        passed = result["matchStatus"] in ("EXACT_MATCH", "PARTIAL_MATCH")
    else:
        result = await monnify.nin_lookup(token, id_value, dob)
        passed = result.get("nin") == id_value

    new_status = "verified" if passed else "rejected"
    # update IndividualKycSubmissionModel.level_1_status
    # update BusinessModel.kyc_level, kyc_status
    # if passed: attach bvn to reserved account (see Section 3.2)
    # send notification + email
```

---

## 6. Banks List

Cache in Redis and refresh daily.

```
GET /api/v1/sdk/transactions/banks
Authorization: Bearer {token}
```

Replace the hardcoded `NIGERIAN_BANKS` list.

---

## 7. Merchant Wallet Balance (Pre-Payout Check)

Check available float before approving any run:

```
GET /api/v1/disbursements/wallet/balance
  ?accountNumber={merchant_wallet_account}
Authorization: Bearer {token}
```

Validate sufficient balance in `POST /runs/{id}/approve` before initiating the batch.

---

## 8. Implementation Order

| Phase | Task | Complexity |
|---|---|---|
| 1 | Monnify auth helper (`get_token`, auto-refresh) | Low |
| 2 | Reserved account creation per user on onboarding | Low |
| 3 | Top-up webhook + wallet balance update | Medium |
| 4 | Account verification before payout approval | Low |
| 5 | Single transfer in payout run executor | Medium |
| 6 | Bulk transfer + webhook for batch status | High |
| 7 | BVN/NIN real verification in KYC Level 1 + BVN attach | Medium |
| 8 | Banks list endpoint + Redis cache | Low |
| 9 | Remove all simulated/stub code | Low |

---

## 9. New DB Columns Needed

| Table | Column | Type | Purpose |
|---|---|---|---|
| `business` | `virtual_account_bank_code` | VARCHAR(10) | Bank code for reserved account |
| `business` | `virtual_account_reference` | VARCHAR(100) | Monnify `reservedAccountCode` |
| `payout_transaction` | `monnify_reference` | VARCHAR(100) | Monnify disbursement reference |
| `payout_transaction` | `monnify_status` | VARCHAR(20) | `SUCCESS` / `FAILED` / `PENDING` |

---

## 10. Webhook Events Reference

| Event | Trigger | Action |
|---|---|---|
| `SUCCESSFUL_TRANSACTION` | Payment received into reserved account | Credit wallet, notify user |
| `SUCCESSFUL_DISBURSEMENT` | Transfer succeeded | Mark beneficiary `success` |
| `FAILED_DISBURSEMENT` | Transfer failed | Mark beneficiary `failed`, refund wallet |
| `REVERSED_TRANSACTION` | Payment reversed by bank | Debit wallet, notify user |

All webhooks must respond `200 OK` within 30 seconds or Monnify will retry.

---

## 11. Sandbox Test Values

| Field | Value |
|---|---|
| Test BVN | `22222222222` |
| Test account | `0000000000` (any bank) |
| Simulated top-up | POST to sandbox reserved account via Monnify dashboard |

---

---

## 12. Monnify API Endpoints Reference

Full base URL: `https://sandbox.monnify.com` (sandbox) or `https://api.monnify.com` (production).  
All calls except `/api/v1/auth/login` require `Authorization: Bearer {accessToken}`.

### Authentication

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Get access token · `Authorization: Basic base64(apiKey:secretKey)` |

### Reserved Accounts (Virtual Accounts)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v2/bank-transfer/reserved-accounts` | Create a dedicated virtual account for a customer |
| `GET`  | `/api/v2/bank-transfer/reserved-accounts/{accountReference}` | Fetch reserved account details |
| `PUT`  | `/api/v2/bank-transfer/reserved-accounts/update-payment-source-filter/{accountReference}` | Attach BVN to reserved account after KYC |
| `DELETE` | `/api/v1/bank-transfer/reserved-accounts/reference/{accountReference}` | Deallocate a reserved account |

### Disbursements (Payouts)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/disbursements/single` | Initiate a single transfer |
| `POST` | `/api/v1/disbursements/batch` | Initiate a batch transfer |
| `GET`  | `/api/v1/disbursements/single/summary?reference={ref}` | Check single transfer status |
| `GET`  | `/api/v1/disbursements/batch/summary?reference={ref}` | Check batch transfer status |
| `GET`  | `/api/v1/disbursements/account/validate?accountNumber={}&bankCode={}` | Verify recipient account (get account name) |
| `GET`  | `/api/v1/disbursements/wallet/balance?accountNumber={merchantAccount}` | Check merchant wallet balance |

### Identity Verification (KYC)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/kyc/bvn/match` | Match BVN against name + DOB |
| `POST` | `/api/v1/kyc/nin` | Look up NIN details |

### Banks & Reference Data

| Method | Path | Description |
|---|---|---|
| `GET`  | `/api/v1/sdk/transactions/banks` | List all supported banks with codes |

### Inbound Webhooks (Monnify → your server)

| Event | Trigger |
|---|---|
| `SUCCESSFUL_TRANSACTION` | Payment received into a reserved account |
| `SUCCESSFUL_DISBURSEMENT` | Transfer to a beneficiary succeeded |
| `FAILED_DISBURSEMENT` | Transfer to a beneficiary failed |
| `REVERSED_TRANSACTION` | Incoming payment was reversed by the bank |

All webhook payloads are signed — verify with:
```python
hmac.new(MONNIFY_SECRET_KEY.encode(), raw_body, hashlib.sha512).hexdigest()
# compare to request.headers["monnify-signature"]
```

---

*Last updated: 2026-04-17*
