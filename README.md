# FF TOPUP — Setup Guide

## প্রজেক্ট স্ট্রাকচার
```
ff-topup-site/
├─ web/            → Next.js (React) ফ্রন্টএন্ড — storefront UI, এখানেই future UI update হবে
├─ functions/       → Firebase Cloud Functions — সব secret/API key এখানে থাকে (browser-এ যায় না)
├─ firestore.rules  → ডাটাবেস সিকিউরিটি রুলস
└─ firebase.json    → Firebase Hosting + Fun ctions wiring
```

## ১. Firebase প্রজেক্ট বানানো
1. console.firebase.google.com → নতুন প্রজেক্ট বানান
2. Authentication → Email/Password এনাবল করুন
3. Firestore Database → তৈরি করুন (production mode)
4. Project Settings → General → "Add app" → Web app → এখান থেকে `firebaseConfig` কপি করুন
5. সেটা বসিয়ে দিন এই দুই জায়গায়:
   - `web/lib/firebase.ts`
   - (admin.html বানালে সেখানেও)

## ২. Free Fire প্রোভাইডার API যোগ করা
1. Smile.one / UniPin / আপনার লোকাল সাপ্লায়ারের কাছে reseller/API account করুন
2. তাদের ডকুমেন্টেশন থেকে জেনে নিন: endpoint URL, auth পদ্ধতি, request/response format
3. `functions/index.js`-এর `processTopupOrder` ফাংশনে থাকা `fetch(apiUrl, ...)` অংশটা তাদের exact format অনুযায়ী মেলাতে হবে (field নাম, headers ইত্যাদি) — আমাকে তাদের API doc দিলে আমি এটা মিলিয়ে দিতে পারি
4. Secret সেট করুন:
   ```
   firebase functions:secrets:set FF_PROVIDER_API_KEY
   ```
5. Admin panel/Firestore-এর `settings/general` ডকুমেন্টে `autoTopUpApiUrl` বসান

## ৩. পেমেন্ট (bKash/Nagad) সেটআপ

**Option A — Official bKash PGW** (recommended, legit): developer.bka.sh → Merchant Integration Portal-এ সাইনআপ, ব্যবসার ডকুমেন্ট লাগবে, অ্যাপ্রুভ হলে token-based Checkout API ইন্টিগ্রেট করা যায়। এটা বললে আমি আলাদা `bkashPGW` Cloud Function বানিয়ে দেব।

**Option B — SMS-forwarder পদ্ধতি** (এখনকার scaffold-এ যেটা বসানো আছে): আপনার bKash/Nagad নাম্বার যে ফোনে আছে, সেই ফোনে একটা SMS-forwarding app (যেমন "SMS Forwarder to URL" টাইপের ওপেন সোর্স app) বসিয়ে, প্রতিটা "cash in" SMS আসলে সেটা parse করে এই endpoint-এ POST করবে:
```
POST /api/receivePayment
{ "secret": "...", "trxId": "...", "amount": 100, "sender": "...", "method": "bkash" }
```
Secret সেট করুন:
```
firebase functions:secrets:set SMS_FORWARDER_SECRET
```
⚠️ এই পদ্ধতি বেশিরভাগ ছোট সাইট ব্যবহার করে, কিন্তু personal bKash নাম্বার দিয়ে ব্যবসায়িক লেনদেন bKash-এর ToS অনুযায়ী নিষিদ্ধ — অ্যাকাউন্ট ব্লকের ঝুঁকি থাকে। ব্যবসা বড় হলে Option A-তে যাওয়াই নিরাপদ।

## ৪. Firestore-এ প্রোডাক্ট যোগ করা
`services/freefire/products/` কালেকশনে ডকুমেন্ট বানান, প্রতিটাতে:
```
{ name: "100 Diamond", price: 90 }
```

## ৫. ডেভেলপমেন্ট চালানো
```bash
cd web
npm install
npm run dev        # http://localhost:3000
```

## ৬. ডিপ্লয় করা — Vercel দিয়ে UI, Firebase দিয়ে Backend

**গুরুত্বপূর্ণ:** শুধু GitHub-এ পুশ করে Vercel-এ "Deploy" চাপলেই পুরো সিস্টেম চলবে না — কারণ **Vercel শুধু `web/` ফোল্ডারটা (Next.js UI) হোস্ট করতে পারবে। ব্যাকএন্ড (`functions/` — Cloud Functions, Firestore, Auth) Vercel-এ চলে না, ওটা আলাদাভাবে Firebase-এ ডিপ্লয় করতে হবে।** তাই নিচের ৩টা ছোট ধাপ করতে হবে — এগুলো ছাড়া deposit/order কিছুই কাজ করবে না:

### ধাপ ১ — Backend প্রথমে Firebase-এ ডিপ্লয় করুন
```bash
firebase login
firebase init          # শুধু Functions + Firestore বেছে নিন, existing project select করুন
firebase functions:secrets:set FF_PROVIDER_API_KEY
firebase functions:secrets:set SMS_FORWARDER_SECRET
firebase deploy --only functions,firestore:rules
```
ডিপ্লয় শেষে টার্মিনালে প্রতিটা function-এর URL দেখাবে, যেমন:
```
https://us-central1-your-project.cloudfunctions.net/claimDeposit
```

### ধাপ ২ — `web/lib/firebase.ts`-এ Firebase config বসান
Firebase Console থেকে কপি করা `firebaseConfig` বসান (আগেই বলা হয়েছে)।

### ধাপ ৩ — Vercel-এ deploy করার সময় Environment Variable যোগ করুন
Vercel প্রজেক্ট Settings → Environment Variables:
```
NEXT_PUBLIC_FUNCTIONS_BASE_URL = https://us-central1-your-project.cloudfunctions.net
```
(এটা ছাড়া ডিপোজিট ভেরিফিকেশন কল কোথায় পাঠাবে জানবে না)। এরপর Vercel-এ GitHub repo কানেক্ট করে **Root Directory = `web`** সেট করে দিলেই বাকিটা Vercel নিজে বিল্ড করে নেবে (`next.config.js`-এ কোনো এক্সপোর্ট মোড লাগবে না, Vercel Next.js নেটিভলি রান করে)।

### বিকল্প: সবকিছু শুধু Firebase দিয়েই হোস্ট করতে চাইলে
Vercel বাদ দিয়ে পুরো প্রজেক্ট Firebase Hosting-এ রাখা যায় — তাহলে `next.config.js`-এ `output: "export"` আনকমেন্ট করে দিন, `NEXT_PUBLIC_FUNCTIONS_BASE_URL` লাগবে না (আগের মতো relative `/claimDeposit` কাজ করবে `firebase.json`-এর rewrite দিয়ে), এবং:
```bash
cd web && npm run build
cd .. && firebase deploy
```

**সংক্ষেপে আপনার প্রশ্নের উত্তর:** শুধু GitHub push + Vercel deploy **যথেষ্ট না** — Backend আলাদা করে একবার Firebase-এ deploy করতে হবে, আর Vercel-এ একটা env variable বসাতে হবে। বাকি কোড/লজিক-এ কোনো এডিট লাগবে না, এটা এক-বারের সেটআপ ধাপ।

## ৭. UI পরে আপডেট করা
`web/components/` এর ভেতরের প্রতিটা ফাইল আলাদা আলাদা অংশ (Header, ProductList, DepositModal, AuthModal) — যেকোনোটা independently বদলানো যাবে বাকিটা না ভেঙে। ডিজাইন/রং/লেআউট বদলাতে চাইলে `tailwind.config.js`-এর `brand`/`surface`/`card` কালার আর প্রতিটা কম্পোনেন্টের className adjust করলেই হবে।
