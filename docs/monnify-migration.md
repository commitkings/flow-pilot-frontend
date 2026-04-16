# FlowPilot → Monnify by Moniepoint: Post-Hackathon Migration Plan

> **Scope:** Replace Interswitch-backed wallet infrastructure with Monnify's Reserved Account API, transfer/disbursement endpoints, and identity verification APIs. Payments (payout runs) will flow through Moniepoint.

---

## 1. What We Are Replacing

| Current (Interswitch / Simulated) | Monnify Replacement |
|---|---|
| Virtual account generation (fake numbers) | Monnify Reserved Account (real NUBAN) |
| Wallet top-up detection | Monnify webhook — `SUCCESSFUL_TRANSACTION` on reserved account |
| BVN/NIN lookup (stub/auto-verify) | Monnify BVN/NIN Match API |
| Payout disbursements (simulated) | Monnify Single & Bulk Transfer API |
| Account number lookup | Monnify Account Verification API |
| Bank list | Monnify Banks List API |

---

## 2. Monnify API Credentials

Monnify provides two environments:

| Environment | Base URL |
|---|---|
| Sandbox | `https://sandbox.monnify.com` |
| Production | `https://api.monnify.com` |

**Auth:** All calls require a Bearer token obtained via:

```
POST /api/v1/auth/login
Authorization: Basic base64(apiKey:secretKey)
```

Response includes `accessToken` (valid ~60 min). Cache it and refresh on 401.

**Env vars to add:**
```env
MONNIFY_API_KEY=
MONNIFY_SECRET_KEY=
MONNIFY_CONTRACT_CODE=      # your merchant contract code
MONNIFY_BASE_URL=https://sandbox.monnify.com
```

---

## 3. Wallet System — Reserved Accounts

### 3.1 Create a Reserved Account (on user onboarding)

Replace `_generate_virtual_account_number()` in `business_repository.py`.

```
POST /api/v2/bank-transfer/reserved-accounts
Authorization: Bearer {token}

{
  "accountReference": "fp-{business_id}",   // unique, immutable
  "accountName": "Business Name",
  "currencyCode": "NGN",
  "contractCode": "{MONNIFY_CONTRACT_CODE}",
  "customerEmail": "user@email.com",
  "customerName": "Full Name",
  "bvn": "12345678901",                      // optional but improves limits
  "getAllAvailableBanks": false,
  "preferredBanks": ["035"]                  // Wema Bank (035) for ALAT virtual accounts
}
```

**Response fields to store:**

| Response field | DB column |
|---|---|
| `accounts[0].accountNumber` | `virtual_account_number` |
| `accounts[0].bankName` | `virtual_account_bank` |
| `accounts[0].bankCode` | `virtual_account_bank_code` (add column) |
| `reservedAccountCode` | `virtual_account_reference` (add column) |

### 3.2 Detect Top-ups (Webhook)

Monnify sends `SUCCESSFUL_TRANSACTION` to your webhook URL when someone pays into a reserved account.

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

**What to implement:**
- New route: `POST /api/v1/webhooks/monnify` (unauthenticated, validates Monnify HMAC signature)
- Look up business by `product.reference` → increment `wallet_balance`
- Create `wallet_transaction` record
- Send top-up notification email + in-app notification

**Signature verification:**
```python
import hmac, hashlib
computed = hmac.new(secret.encode(), raw_body, hashlib.sha512).hexdigest()
assert computed == request.headers["monnify-signature"]
```

### 3.3 Check Wallet Balance

No dedicated Monnify call needed — maintain balance in your DB (increment on webhook, decrement on payout). Use Monnify only as the source of truth for reconciliation.

---

## 4. Payout Disbursements

### 4.1 Verify Recipient Bank Account (Before Transfer)

Always verify account name before sending money.

```
GET /api/v1/disbursements/account/validate
  ?accountNumber=0123456789
  &bankCode=058
Authorization: Bearer {token}
```

**Response:** `accountName`, `bankCode`, `accountNumber`

Use this in `POST /runs/{id}/approve` — verify the beneficiary account name before the transfer is initiated, and show the resolved name in the approval UI.

### 4.2 Single Transfer (Per Beneficiary)

```
POST /api/v1/disbursements/single
Authorization: Bearer {token}

{
  "amount": 50000,
  "reference": "fp-txn-{uuid}",         // unique per transaction
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

### 4.3 Bulk Transfer (Entire Run at Once)

For runs with many beneficiaries — more efficient than individual calls.

```
POST /api/v1/disbursements/batch
Authorization: Bearer {token}

{
  "title": "FlowPilot Run #123",
  "batchReference": "fp-run-{run_id}",
  "narration": "Batch payout",
  "sourceAccountNumber": "{merchant_wallet_account}",
  "onValidationFailure": "CONTINUE",     // don't abort entire batch on one failure
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
    // ...
  ]
}
```

**Webhook for batch completion:** `SUCCESSFUL_DISBURSEMENT` / `FAILED_DISBURSEMENT`

### 4.4 Check Transfer Status

```
GET /api/v1/disbursements/single/summary
  ?reference=fp-txn-{uuid}
Authorization: Bearer {token}
```

Use this in the existing `GET /runs/{id}` poll loop to update per-beneficiary status.

---

## 5. Identity Verification (KYC)

Replace the current auto-verify stub with real Monnify BVN/NIN lookups.

### 5.1 BVN Match

```
POST /api/v1/kyc/bvn/match
Authorization: Bearer {token}

{
  "bvn": "12345678901",
  "name": "John Doe",
  "dateOfBirth": "1990-01-15",   // YYYY-MM-DD
  "mobileNo": "08012345678"
}
```

**Response:** `matchStatus` (`EXACT_MATCH`, `PARTIAL_MATCH`, `NO_MATCH`)

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

### 5.3 Integrate with Individual KYC Level 1

Replace `asyncio.create_task(_auto_verify_individual_kyc(...))` in `POST /kyc/individual/level1`:

```python
async def _verify_with_monnify(business_id, user_id, id_type, id_value, user_name, dob):
    token = await monnify_auth.get_token()
    if id_type == "bvn":
        result = await monnify.bvn_match(token, id_value, user_name, dob)
        passed = result["matchStatus"] in ("EXACT_MATCH", "PARTIAL_MATCH")
    else:  # nin
        result = await monnify.nin_lookup(token, id_value, dob)
        passed = result.get("nin") == id_value

    new_status = "verified" if passed else "rejected"
    # update IndividualKycSubmissionModel.level_1_status
    # update BusinessModel.kyc_level, kyc_status
    # send notification + email
```

---

## 6. Banks List

Cache this in Redis (refresh daily — it rarely changes).

```
GET /api/v1/sdk/transactions/banks
Authorization: Bearer {token}
```

Replace the current hardcoded `NIGERIAN_BANKS` list in the codebase.

---

## 7. Merchant Wallet Balance

Check your FlowPilot merchant wallet balance on Monnify (used before approving runs).

```
GET /api/v1/disbursements/wallet/balance
  ?accountNumber={merchant_wallet_account}
Authorization: Bearer {token}
```

Use this in `POST /runs/{id}/approve` to confirm sufficient merchant float before initiating the batch.

---

## 8. Implementation Order

| Phase | Task | Complexity |
|---|---|---|
| 1 | Monnify auth helper (`get_token`, auto-refresh) | Low |
| 2 | Reserved account creation on onboarding | Low |
| 3 | Top-up webhook + wallet balance update | Medium |
| 4 | Account verification before payout approval | Low |
| 5 | Single transfer in payout run executor | Medium |
| 6 | Bulk transfer + webhook for batch status | High |
| 7 | BVN/NIN real verification in KYC Level 1 | Medium |
| 8 | Banks list endpoint + Redis cache | Low |
| 9 | Remove all Interswitch/simulated code | Low |

---

## 9. New DB Columns Needed

| Table | Column | Type | Purpose |
|---|---|---|---|
| `business` | `virtual_account_bank_code` | VARCHAR(10) | Bank code for reserved account |
| `business` | `virtual_account_reference` | VARCHAR(100) | Monnify `reservedAccountCode` |
| `business` | `monnify_customer_email` | VARCHAR(255) | Email used to create reserved account |
| `payout_transaction` | `monnify_reference` | VARCHAR(100) | Monnify disbursement reference |
| `payout_transaction` | `monnify_status` | VARCHAR(20) | `SUCCESS` / `FAILED` / `PENDING` |

---

## 10. Monnify Webhook Events Reference

| Event | Trigger | Our action |
|---|---|---|
| `SUCCESSFUL_TRANSACTION` | Payment received into reserved account | Credit wallet, notify user |
| `SUCCESSFUL_DISBURSEMENT` | Transfer succeeded | Mark beneficiary `success` |
| `FAILED_DISBURSEMENT` | Transfer failed | Mark beneficiary `failed`, refund wallet |
| `REVERSED_TRANSACTION` | Payment reversed by bank | Debit wallet, notify user |

All webhooks must respond with `200 OK` within 30 seconds or Monnify will retry.

---

## 11. Sandbox Test Values

| Field | Value |
|---|---|
| Test BVN | `22222222222` |
| Test account | `0000000000` (any bank) |
| Simulated top-up | POST to sandbox reserved account via Monnify dashboard |

---

*Last updated: 2026-04-16 — Post-hackathon migration planning document.*
