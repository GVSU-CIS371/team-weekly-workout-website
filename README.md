[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/5L4AYPa2)
# **Term Project**  

**Hello, Students!** 👋 

Your **Term Project** is an essential part of the course. Please review the instructions carefully to ensure a smooth and successful experience.  

- [**Project Instructions**](https://gvsu-cis371.github.io/projects/term.html)  

### **Getting Started:**  
1. **Read** the full instructions carefully.  
2. **Understand** all requirements before starting.  
3. **Ask questions** if anything is unclear.  

### **Tips for Success:**  
- Follow guidelines closely.  
- Plan your work and stay on schedule.  
- Test your project regularly.  

Best of luck! 🚀  

# Weekly Workout Website — Fitness Tracking Web App

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
weekly-workout-website/
├── index.html
├── package.json
├── vite.config.js
├── README.md
└── src/
    ├── main.js               # App entry point
    ├── firebase.js           # Firebase config
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


## Features Checklist (Assignment Requirements)

- [x] **Complete & realistic features** — Dashboard, Body Stats, Meals, Workouts, Community, Profile
- [x] **User authentication** — Email/password login + register via Firebase Auth
- [x] **Cloud Firestore** — 5 collections (users, stats, meals, workouts, community)
- [x] **Private data** — Stats, meals, workouts scoped to `userId`
- [x] **Shared data** — Community posts and user profiles readable by all
- [x] **CRUD operations** — Create, Read, Update, Delete on all data collections
- [x] **Vue.js framework** — Vue 3 Composition API throughout
- [x] **Modern styling** — Custom CSS design tokens, responsive layout, animations
