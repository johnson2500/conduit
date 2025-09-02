# Let's Build a Ledger

At Conduit, every engineering candidate completes a short take-home exercise before the technical interview.
This gives you a chance to show us how you think about code design, problem solving, and clarity.

During your interview, you’ll be asked to discuss and extend the code you wrote here,
so please make sure your solution is easy to run and modify.

## Background

A ledger is one of the fundamental building blocks of financial applications.
It powers accounting systems, blockchains, and anything that tracks money movement.

We’ll be building a double-entry accounting ledger.
In this system, every transaction is recorded as a set of entries, one or more debits and one or more credits, whose total value always balances to zero.
Debiting (withdrawing) funds from one account requires crediting (depositing) the same amount to another.
This structure makes it easy to detect common accounting errors; if the sum of all debits and credits across all transactions isn’t zero, a mistake has occurred.

A basic transaction representing the withdrawal of $100.00 from a "Discretionary
Funds" account as cash to be placed in the owner's wallet might be represented
in a double-entry ledger system like this:

| Discretionary Funds | Cash      |
| ------------------- | --------- |
| - 100.00            | + $100.00 |

Our ledger system also includes the notion of account directions - some accounts
represent primarily liabilities or the movement of funds out of our ownership,
while others track assets or incoming funds. This means we'll need to pay
careful attention to the relative direction of each entry: An entry representing
the removal of funds from our system is generally a debit, but when applied to
a debit account it should be expressed as a credit!

### Accounts

An **account** represents what a traditional account would in a double-entry
accounting system. It can be used to represent an asset, liability, expense or
anything else that we want. Some important properties that accounts have:

- Accounts have a direction, either “debit” or “credit”.
- Account balances can never be modified directly, they can only be modified
  by creating transactions.

### Transactions

A **transaction** represents an action which modifies the balances of the
accounts. It can be used to represent a purchase, paying a bill, paying
interest, moving money between accounts, etc. Transactions have a list of
entries, each of which represents modifications to the balance of an account.

Some important properties that transactions have:

- The entries have to balance. This means the sum of all the debits must equal
  the sum of all the credits.

### Entries

An **entry** denotes a change in the balance of an account.

Here's the schema for an entry:

| Field     | Description                                         |
| --------- | --------------------------------------------------- |
| id        | If not provided it is generated on object creation. |
| direction | Required. Must be either "debit" or "credit".       |
| amount    | Represents the amount of the entry in USD.          |

## Rules

When users interact with the ledger we need to preserve some rules.

### Applying a Transaction

When a transaction is applied to the ledger, all the affected accounts should
be updated with the corresponding ledger entry amounts.

### Applying a Ledger Entry

When an entry is applied to an account, the balance is updated based on the relationship between the account’s direction and the entry’s direction:

- If the directions are the same, the balance is increased by the entry amount (added).
- If the directions differ, the balance is decreased by the entry amount (subtracted).

#### Example

Here are some example entries and their impact on the accounts they're applied
to:

| Starting Account Balance | Account Direction | Entry Direction | Entry Amount | Ending Account Balance |
| ------------------------ | ----------------- | --------------- | ------------ | ---------------------- |
| 0                        | debit             | debit           | 100          | 100                    |
| 0                        | credit            | credit          | 100          | 100                    |
| 100                      | debit             | credit          | 100          | 0                      |
| 100                      | credit            | debit           | 100          | 0                      |

## API Guide

Users will need to interact with the ledger in order to see their balances and
create transactions. They'll do so using the HTTP/JSON API defined here.

### POST /accounts

| Field     | Description                                         |
| --------- | --------------------------------------------------- |
| id        | If not provided it is generated on object creation. |
| name      | Optional label for the account.                     |
| balance   | Represents the account’s initial balance in USD.    |
| direction | Required. Must be either "debit" or "credit".       |

**Example Request:**

```bash
curl --request POST \
     --url https://localhost:5000/accounts \
     --header 'Accept: application/json' \
     --header 'Content-Type: application/json' \
     --data '
{
  "name": "test3",
  "direction": "debit",
  "id": "71cde2aa-b9bc-496a-a6f1-34964d05e6fd"
}
'
```

**Example Response:**

```json
{
  "balance": 0,
  "direction": "debit",
  "id": "71cde2aa-b9bc-496a-a6f1-34964d05e6fd",
  "name": "test3"
}
```

### GET /accounts/:id

```bash
curl --location --request GET 'localhost:5000/accounts/fa967ec9-5be2-4c26-a874-7eeeabfc6da8'
```

**Example Response:**

```json
{
  "balance": 0,
  "direction": "debit",
  "id": "71cde2aa-b9bc-496a-a6f1-34964d05e6fd",
  "name": "test3"
}
```

### POST /transactions

| Field   | Description                                         |
| ------- | --------------------------------------------------- |
| id      | If not provided it is generated on object creation. |
| name    | Optional label for the account.                     |
| entries | an array of ledger entry objects                    |

**Example Request:**

```bash
curl --location --request POST 'localhost:5000/transactions' \
     --header 'Content-Type: application/json' \
     --data-raw '
{
  "name": "test",
    "id": "3256dc3c-7b18-4a21-95c6-146747cf2971",
  "entries": [
    {
      "direction": "debit",
      "account_id": "fa967ec9-5be2-4c26-a874-7eeeabfc6da8",
      "amount": 100
    },
     {
      "direction": "credit",
      "account_id": "dbf17d00-8701-4c4e-9fc5-6ae33c324309",
      "amount": 100
    }
  ]
}'
```

**Example Response:**

```json
{
  "id": "3256dc3c-7b18-4a21-95c6-146747cf2971",
  "name": "test",
  "entries": [
    {
      "account_id": "fa967ec9-5be2-4c26-a874-7eeeabfc6da8",
      "amount": 100,
      "direction": "debit",
      "id": "9f694f8c-9c4c-44cf-9ca9-0cb1a318f0a7"
    },
    {
      "account_id": "dbf17d00-8701-4c4e-9fc5-6ae33c324309",
      "amount": 100,
      "direction": "credit",
      "id": "a5c1b7f0-e52e-4ab6-8f31-c380c2223efa"
    }
  ]
}
```

## Instructions

Implement the ledger described above.
Your ledger should provide the API described, accessible via HTTP.
You can use any programming language or framework you like.
Focus on correctly handling accounts, transactions, and entries; we want to see your business logic and API design.
You do not need set up any database infrastructure; you may just use an in-memory storage or similar.

Note: Ledgers can seem deceptively simple. We encourage you to write tests to
verify that you've covered all of the edge cases!

Once you’ve finished implementing the ledger, create a GitHub repository containing your work.
Include a README.md with clear instructions on how to run your code, as well as any dependencies or environmental requirements.

If you run into trouble, or have any questions, please don't hesitate to reach
out to our team for help. You can reach us by replying to the email that you
received the exercise from, or by reaching out to carreers@conduit.financial.
