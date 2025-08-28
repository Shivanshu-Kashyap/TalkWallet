

# TalkWallet



<div align="center"> <h3>💬 Just chat. We'll do the math.</h3> <p>The intelligent bill-splitting app that understands your conversations and handles the complex calculations for you.</p> <img src="https://img.shields.io/badge/React-18.2.0-blue" alt="React"> <img src="https://img.shields.io/badge/Node.js-18+-green" alt="Node.js"> <img src="https://img.shields.io/badge/AI-Google%20Gemini-orange" alt="AI"> <img src="https://img.shields.io/badge/OCR-Google%20Vision-purple" alt="OCR"> <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License"> </div>

-----

## 🌟 What is TalkWallet?

TalkWallet is a revolutionary bill-splitting application that eliminates the tedium of manual expense tracking. Simply chat naturally with your friends about orders, upload receipts, and let our AI handle the complex mathematics of who owes whom.

-----

## 🎯 The Problem We Solve

Traditional bill-splitting apps are:

  - **Time-consuming** - Manual entry of every item and price
  - **Error-prone** - Miscalculations and forgotten items
  - **Complex** - Confusing payment chains (A→B→C→A)
  - **Disconnected** - No integration with actual ordering conversations

-----

## ✨ Our Solution

TalkWallet transforms casual conversations into structured financial data:

**👥 Group Chat:**

```text
"mujhe 2 cheese sandwich chahiye medium spicy"
"ek biryani large please" 
"coffee order karte hain"
```

**🤖 AI Magic:**

```text
✓ 2x Cheese Sandwich (medium spicy) - ₹240
✓ 1x Biryani (large) - ₹320  
✓ 1x Coffee - ₹80
```

**💰 Smart Settlement:**

```text
Rahul pays Priya: ₹160
Amit pays Priya: ₹80
```

-----

## 🚀 Key Features

### 🤖 AI-Powered Conversation Analysis

  - Natural Language Processing using Google Gemini AI
  - Multi-language Support - English, Hindi, Hinglish
  - Context Understanding - Distinguishes orders from casual chat
  - Real-time Extraction - Orders appear instantly as you type

### 📸 Smart Receipt Intelligence

  - OCR Processing with Google Cloud Vision API
  - Automated Price Extraction from receipt images
  - AI-Powered Mapping - Matches receipt items to chat orders
  - Manual Override - Confirm or adjust AI suggestions

### ⚡ Real-Time Synchronization

  - Live Chat - Socket.IO powered group messaging
  - Instant Updates - All participants see changes immediately
  - Cross-Device Sync - Seamless experience across mobile and web


### 🧮 Intelligent Settlement Engine

  - Minimum Cash Flow Algorithm - Reduces payment complexity
  - Optimized Transactions - Fewer payments between group members
  - Fair Distribution - Mathematical precision in cost allocation
  - Payment Tracking - Complete audit trail of all settlements

### 💸 Integrated Payment Solutions

  - UPI Deep Links - One-tap payments via any UPI app
  - Payment Confirmation - Mark payments as received
  - Settlement Status - Track pending and completed transactions
  - Payment History - Comprehensive transaction records

### 📊 Personal Finance Dashboard

  - Spending Analytics - Monthly and category-wise breakdowns
  - Outstanding Balances - What you owe and what you're owed
  - Transaction History - Searchable and filterable records
  - Group Insights - Per-group spending patterns

-----

## 🎭 How It Works

**Step 1: Create & Chat**

```bash
🏗️ Create a group → Add friends → Start chatting naturally
```

**Step 2: AI Extraction**

```bash
🤖 AI listens → Detects orders → Populates Smart Panel in real-time
```

**Step 3: Smart Pricing**

```bash
📸 Upload receipt → AI matches items → Confirms prices automatically
```

**Step 4: Optimal Settlement**

```bash
🧮 Calculate settlement → Minimize transactions → Generate payment links
```

-----

## 🛠️ Technical Architecture

### Backend Stack

```javascript
🟢 Node.js + Express      // RESTful API server
🟢 MongoDB + Mongoose      // Document database
🟢 Socket.IO               // Real-time communication  
🟢 JWT Authentication      // Secure token-based auth
🟢 Google Gemini AI        // Natural language processing
🟢 Google Cloud Vision     // OCR for receipts
🟢 Cloudinary              // Image storage & processing
```

### Frontend Stack

```javascript
⚛️ React 18                // Component-based UI
🔄 Redux Toolkit           // State management
🎨 Tailwind CSS            // Utility-first styling
🛣️ React Router            // Client-side routing
🔔 React Hot Toast         // User notifications
📱 Progressive Web App     // Mobile-first experience
```

### AI & Algorithms

```javascript
🧠 Minimum Cash Flow Algorithm
🤖 Natural Language Order Extraction  
📄 OCR + AI Receipt Processing
💰 Real-time Balance Calculations
```

-----

## 🚀 Quick Start

### Prerequisites

  - Node.js 18+
  - MongoDB 6.0+
  - Google Cloud Project (Vision API enabled)
  - Gemini API Key
  - Cloudinary Account

### Installation

```bash
# Clone the repository
git clone https://github.com/Shivanshu-Kashyap/TalkWallet.git
cd TalkWallet

# Backend setup
cd backend
npm install
cp .env.example .env
# Configure your API keys in .env
npm run dev

# Frontend setup (new terminal)
cd ../frontend  
npm install
npm run dev
```

### Environment Configuration

```text
# Database
MONGO_URI=mongodb://localhost:27017/talkwallet

# AI Services
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json

# Image Storage
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
```

-----

## 📱 Usage Examples

### Natural Order Recognition

```javascript
Input: "mujhe 2 cheese sandwich chahiye medium spicy"
Output: ✓ 2x Cheese Sandwich (medium spicy)

Input: "ek plate momos aur 1 lassi"  
Output: ✓ 1x Momos (plate) ✓ 1x Lassi

Input: "hello everyone, how's the weather?"
Output: (ignored - not an order)
```

### Receipt Processing

```javascript
📸 Upload receipt photo
🔍 OCR extracts: "VEG SANDWICH ........ ₹130.00"  
🤖 AI matches: "cheese sandwich" → "VEG SANDWICH"
✅ Price confirmed: ₹130.00
```

### Smart Settlement

```javascript
// Before optimization:
A owes B: ₹100
B owes C: ₹150  
C owes A: ₹50

// After TalkWallet optimization:
A owes C: ₹100
B owes C: ₹50
// 67% fewer transactions!
```

-----

## 🧪 Testing

### Run Test Scenarios

```bash
cd backend
node test-scenarios.js
```

### Test User Accounts

  - **Shivanshu**: +919********* (Admin)
  - **Priya**: +919*********
  - **Amit**: +919*********

### AI Testing Messages

```bash
✅ "2 cheese sandwich medium spicy"      # Should extract order
✅ "mera ek pizza large"                 # Should extract order  
❌ "hello everyone"                      # Should ignore
❌ "what time is it?"                    # Should ignore
```

-----


## 📄 API Documentation

### Authentication

```javascript
POST /api/auth/otp/start
POST /api/auth/otp/verify
GET  /api/auth/profile
```

### Groups & Chat

```javascript
POST /api/groups              // Create group
GET  /api/groups              // List user groups  
POST /api/groups/:id/members  // Add member
```

### Smart Panel

```javascript
POST /api/groups/:id/headings     // Start bill session
GET  /api/headings/:id/orders     // Get extracted orders
POST /api/items/:id/price         // Add manual price
POST /api/headings/:id/receipts   // Upload receipt
```

### Settlement

```javascript
POST /api/headings/:id/settle        // Calculate settlement
GET  /api/headings/:id/settlement    // Get payment plan
POST /api/settlements/:id/confirm    // Confirm payment
```

-----


## 🙏 Acknowledgments



  - **Google AI Team** - For Gemini API access
  - **MongoDB Atlas** - Database hosting partnership
  - **Vercel** - Deployment and hosting platform
  - **Open Source Community** - Countless libraries and inspiration

### Technology Partners

  - **Google Cloud Platform** - AI and OCR services
  - **Cloudinary** - Image processing
  - **Socket.IO** - Real-time communication
  - **Tailwind CSS** - Design system

-----


**Built with ❤️ by Shivanshu Kashyap**

*Making bill-splitting as natural as having a conversation*

[🌟 Star this repo](https://www.google.com/search?q=https://github.com/Shivanshu-Kashyap/TalkWallet) | [🐛 Report Bug](https://www.google.com/search?q=https://github.com/Shivanshu-Kashyap/TalkWallet/issues/new%3Fassignees%3D%26labels%3Dbug%26template%3Dbug_report.md) | [💡 Request Feature](https://www.google.com/search?q=https://github.com/Shivanshu-Kashyap/TalkWallet/issues/new%3Fassignees%3D%26labels%3Denhancement%26template%3Dfeature_request.md)

**TalkWallet - Just chat. We'll do the math. - 🚀**
