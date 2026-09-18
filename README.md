# Nimiq NFT

### Discover · Create · Trade

A Nimiq-powered NFT marketplace where users can discover digital collectibles, create NFTs, and buy or sell them using **testnet NIM through Nimiq Pay**.

This app is **Nimiq Testnet only**. It never connects to mainnet seed gateways.

Built for the Nimiq ecosystem with a focus on simple wallet-based identity, real blockchain transactions, and an accessible marketplace experience.

---

## ✨ Overview

**Nimiq NFT** is a decentralized-style NFT marketplace built around the Nimiq ecosystem.

Instead of traditional email/password authentication, users connect their **Nimiq wallet** through Nimiq Pay. Their wallet address becomes their identity within the application.

From there, users can:

* 🔐 Connect and authenticate with their Nimiq wallet
* 🎨 Create and mint NFT-style digital collectibles
* 🖼️ Upload and manage NFT artwork
* 🛍️ Browse available NFTs in the marketplace
* 💰 List owned NFTs for sale
* ⚡ Buy NFTs using NIM
* 🎮 Play a reward-based game
* 🏆 Earn NFT rewards through gameplay
* 👛 View wallet information and NIM balance
* 📊 Manage their NFT collection

The application is designed to demonstrate how a marketplace can combine **Nimiq Pay wallet interactions**, blockchain payments, and a modern web application.

---

## 🚀 Features

### 🔐 Wallet-Based Authentication

Users don't need to create a traditional username and password.

The application uses the user's Nimiq wallet as their identity.

```text
Connect Nimiq Wallet
        ↓
Nimiq Pay approval
        ↓
Wallet address
        ↓
Marketplace account
        ↓
Dashboard
```

Private keys remain inside the user's wallet.

---

### 🎨 NFT Creation

Users can create their own digital collectibles by providing:

* NFT name
* Description
* Category
* Image
* Price
* Currency

Supported image formats:

* PNG
* JPEG
* WebP

Maximum image size:

```text
5 MB
```

NFT images are stored using **Supabase Storage**, while NFT metadata is stored in the application's database.

---

### 🛍️ Marketplace

The marketplace allows users to discover NFTs created by other users.

Each listing includes information such as:

* NFT artwork
* Name
* Description
* Creator
* Price
* Currency
* Listing status

Users can list NFTs they own and cancel active listings.

---

### 💰 Testnet NIM Payments

NFT purchases use **testnet NIM** through Nimiq Pay. Mainnet is not used.

The application:

1. Checks the connected wallet.
2. Validates the NFT price.
3. Converts NIM into Luna.
4. Requests a transaction through Nimiq Pay.
5. Waits for wallet approval.
6. Records the completed purchase.

All wallet-sensitive transactions require user approval inside Nimiq Pay.

---

### 🎮 NFT Reward Game

Nimiq NFT also includes a simple reward-based game.

Players can earn rewards by reaching different score levels.

Current reward levels include:

| Level | Reward |
| ----: | ------ |
|   500 | Bronze |
| 2,000 | Silver |
| 5,000 | Gold   |

Rewards are connected to the user's marketplace account so earned collectibles can become part of their collection.

---

## 🌐 Nimiq Integration

The project uses the official Nimiq Mini App SDK:

```text
@nimiq/mini-app-sdk
```

The application uses Nimiq Pay for wallet interactions including:

* Wallet connection
* Account discovery
* Wallet-based authentication
* Transaction approval
* NIM transfers
* Consensus information
* Block information

The application is **Nimiq Testnet only**.

Balance reads use `@nimiq/core` on `testalbatross` with **testnet seed nodes only**. The default `@nimiq/core` mainnet seed list (`aurora.seed.nimiq.com`, `catalyst.seed.nimiq.network`, and the rest) is never used.

Transactions go through Nimiq Pay. Switch the wallet to Testnet first: long-press Settings for 10 seconds, then choose Testnet.

---

## 🧱 Tech Stack

### Frontend

* React
* Vite
* JavaScript
* Tailwind CSS
* Framer Motion
* Lucide React
* React Router

### Blockchain / Wallet

* Nimiq
* Nimiq Mini App SDK
* Nimiq Pay
* Nimiq Core Web

### Backend Services

* Supabase
* Supabase Authentication
* Supabase PostgreSQL
* Supabase Storage
* Supabase Row Level Security

---

## 🏗️ Architecture

```text
                         ┌──────────────────┐
                         │    Nimiq Pay     │
                         │                  │
                         │ Wallet + Signing │
                         └────────┬─────────┘
                                  │
                                  │
                                  ▼
┌─────────────────────────────────────────────────┐
│                  Nimiq NFT                      │
│                                                 │
│  React + Vite + Tailwind + Framer Motion        │
│                                                 │
│  ┌──────────┐  ┌───────────┐  ┌─────────────┐ │
│  │Dashboard │  │Marketplace│  │ NFT Creation│ │
│  └──────────┘  └───────────┘  └─────────────┘ │
│                                                 │
│  ┌──────────┐  ┌───────────┐  ┌─────────────┐ │
│  │  Wallet  │  │   Game    │  │ My NFTs     │ │
│  └──────────┘  └───────────┘  └─────────────┘ │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
              ┌──────────────────┐
              │     Supabase     │
              │                  │
              │ PostgreSQL       │
              │ Authentication   │
              │ Storage          │
              │ RLS              │
              └──────────────────┘
```

---

## 📁 Project Structure

```text
src/
├── components/
│
├── context/
│   └── walletContext.jsx
│
├── lib/
│   ├── nimiq.js
│   └── supabase.js
│
├── pages/
│   ├── Account.jsx
│   ├── Auth.jsx
│   ├── CreateNFT.jsx
│   ├── Dashboard.jsx
│   ├── Game.jsx
│   ├── Marketplace.jsx
│   ├── NFTDetails.jsx
│   └── Wallet.jsx
│
├── services/
│   ├── auth.js
│   ├── marketplaceService.js
│   └── nftService.js
│
├── App.jsx
└── main.jsx
```

---

## 🔑 Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Do not commit your `.env` file.

Add it to `.gitignore`:

```gitignore
.env
.env.local
```

---

## ⚙️ Installation

Clone the repository:

```bash
git clone https://github.com/Nobody-983/nft-platform.git
```

Move into the project:

```bash
cd nft-platform
```

Install dependencies:

```bash
npm install
```

Create your environment file:

```bash
touch .env
```

Add the required Supabase variables.

Then start the development server:

```bash
npm run dev
```

---

## 🧪 Testing

The application is primarily designed to be tested through **Nimiq Pay**.

For wallet functionality:

1. Open the application inside Nimiq Pay.
2. Long-press Settings for 10 seconds and switch to **Testnet**.
3. Connect your wallet.
4. Approve the wallet connection.
5. Explore the marketplace.
6. Create or list an NFT.
7. Send or buy with **testnet NIM** only.
8. Verify the resulting marketplace state.

Do not send mainnet NIM to marketplace addresses.

---

## 🔒 Security

The application uses several protections around user and wallet data.

### Wallet Security

Private keys are never handled by the application.

Transactions are requested through Nimiq Pay and require explicit wallet approval.

### Supabase Row Level Security

Database access is protected using Supabase RLS policies.

Examples include restrictions around:

* NFT ownership
* Marketplace listings
* User profiles
* NFT creation
* Purchases

### Image Validation

Uploaded NFT images are validated by:

* File type
* File extension
* Maximum file size

Only PNG, JPEG, and WebP images up to 5 MB are accepted.

---

## 🗺️ Roadmap

Potential future improvements include:

* [ ] Richer NFT metadata
* [ ] NFT collections
* [ ] Improved marketplace discovery
* [ ] Transaction history
* [ ] More game rewards
* [ ] Creator profiles
* [ ] Marketplace analytics
* [ ] Enhanced NFT ownership history
* [ ] Additional Nimiq ecosystem integrations

---

## 🎯 Why Nimiq NFT?

Traditional NFT platforms can introduce unnecessary complexity for new users.

Nimiq NFT focuses on a simpler experience:

```text
Connect Wallet
      ↓
Explore
      ↓
Create
      ↓
Trade
```

Using Nimiq Pay means users can interact with the marketplace through their existing Nimiq wallet instead of managing another account and private key system.

---

## 🏆 Hackathon

This project was built as part of the **Nimiq ecosystem hackathon**.

The project focuses on demonstrating practical Nimiq Pay integration through:

* Wallet-based authentication
* Real NIM transactions
* NFT marketplace functionality
* User-generated NFTs
* Reward-based gameplay
* Testnet interaction

---

## 👨‍💻 Built By

**Ahmed Ibrahim**

Computer Science student and software developer focused on building full-stack applications and exploring blockchain-powered products.

GitHub: [Nobody-983](https://github.com/Nobody-983)

---

## 📄 License

This project is available for educational and hackathon purposes.

---

<p align="center">
  Built with ❤️ using React, Supabase and Nimiq
</p>
