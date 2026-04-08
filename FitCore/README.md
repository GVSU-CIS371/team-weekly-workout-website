# FitCore — Fitness Tracking Web App

A full-stack Vue 3 + Firebase web application for tracking body stats, meals, workouts, and sharing progress with a community feed.

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | Vue 3 (Composition API)           |
| Routing    | Vue Router 4                      |
| State      | Pinia                             |
| Database   | Firebase Cloud Firestore          |
| Auth       | Firebase Authentication           |
| Build tool | Vite                              |
| Styling    | Custom CSS (design tokens)        |

---

## Project Structure

```
fitcore/
├── index.html
├── package.json
├── vite.config.js
├── README.md
└── src/
    ├── main.js               # App entry point
    ├── firebase.js           # 🔑 Firebase config (add credentials here)
    ├── App.vue               # Root layout + navbar
    ├── assets/
    │   └── main.css          # Global CSS design tokens
    ├── router/
    │   └── index.js          # Vue Router routes + auth guards
    ├── stores/
    │   └── auth.js           # Pinia auth store
    ├── components/
    │   ├── AppCard.vue       # Reusable card panel
    │   ├── StatPill.vue      # Summary number widget
    │   ├── EmptyState.vue    # Empty list placeholder
    │   └── PageHeader.vue    # Page title + subtitle
    └── views/
        ├── LoginView.vue     # Sign in + Register
        ├── DashboardView.vue # Overview / home
        ├── StatsView.vue     # Body stats (private CRUD)
        ├── MealsView.vue     # Meal log (private CRUD)
        ├── WorkoutsView.vue  # Workout sessions (private CRUD)
        ├── CommunityView.vue # Community feed (shared/public)
        ├── ProfileView.vue   # Edit profile (updates public user doc)
        └── NotFound.vue      # 404 page
```

---

## Setup Instructions

### 1. Install dependencies

```bash
npm install
```

### 2. Add Firebase credentials

Open `src/firebase.js` and replace the placeholder values with your real Firebase project config:

```js
const firebaseConfig = {
  apiKey:            'YOUR_API_KEY',
  authDomain:        'YOUR_AUTH_DOMAIN',
  projectId:         'YOUR_PROJECT_ID',
  storageBucket:     'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId:             'YOUR_APP_ID'
}
```

**Where to find your config:**
1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Open your project → click the gear icon → **Project settings**
3. Scroll to **Your apps** → select your web app
4. Copy the `firebaseConfig` object

### 3. Enable Firebase services

In the Firebase Console:

- **Authentication** → Sign-in method → enable **Email/Password**
- **Firestore Database** → Create database → start in **test mode** for development

### 4. Run the dev server

```bash
npm run dev
```

### 5. Build for production

```bash
npm run build
```

---

## Firestore Collections

| Collection  | Access       | Description                              |
|-------------|--------------|------------------------------------------|
| `users`     | Shared/public | Public user profiles (displayName, bio)  |
| `stats`     | Private       | Body stat entries per user               |
| `meals`     | Private       | Meal log entries per user                |
| `workouts`  | Private       | Workout sessions per user                |
| `community` | Shared/public | Community posts visible to all users     |

Private collections are filtered by `userId == currentUser.uid` in every query.

---

## Recommended Firestore Security Rules

Paste these into **Firestore → Rules** in the Firebase Console:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // PUBLIC: any signed-in user can read user profiles
    match /users/{userId} {
      allow read:  if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // PRIVATE: users can only read/write their own data
    match /stats/{docId} {
      allow read, write: if request.auth != null
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.userId;
    }

    match /meals/{docId} {
      allow read, write: if request.auth != null
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.userId;
    }

    match /workouts/{docId} {
      allow read, write: if request.auth != null
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.userId;
    }

    // SHARED: any signed-in user can read; authors can delete their own posts
    match /community/{docId} {
      allow read:   if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;   // for likes
      allow delete: if request.auth != null
        && request.auth.uid == resource.data.authorId;
    }
  }
}
```

---

## Features Checklist (Assignment Requirements)

- [x] **Complete & realistic features** — Dashboard, Body Stats, Meals, Workouts, Community, Profile
- [x] **User authentication** — Email/password login + register via Firebase Auth
- [x] **Cloud Firestore** — 5 collections (users, stats, meals, workouts, community)
- [x] **Private data** — Stats, meals, workouts scoped to `userId`
- [x] **Shared data** — Community posts and user profiles readable by all
- [x] **CRUD operations** — Create, Read, Update, Delete on all data collections
- [x] **Vue.js framework** — Vue 3 Composition API throughout
- [x] **Modern styling** — Custom CSS design tokens, responsive layout, animations

---

## Git Workflow (for team members)

```bash
# Clone the repo
git clone <your-repo-url>
cd fitcore

# Create a feature branch
git checkout -b feature/my-feature

# Make changes, then commit
git add .
git commit -m "feat: add calorie goal progress bar to dashboard"

# Push and open a PR
git push origin feature/my-feature
```

Commit regularly — the assignment checks Git logs for consistent contributions.
