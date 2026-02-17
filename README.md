# 🛍️ Shop (Full-Stack E-Commerce)

A modern e-commerce app built with **Laravel (API)** + **React (Vite)** featuring authentication, cart, wishlist, admin panel, and checkout flow.

## ✨ Features
- Auth (Register/Login/Logout)
- Product listing + details
- Cart drawer + stock validation
- Wishlist
- Checkout with server-side validation
- Admin panel: products / orders / users (super admin)

## 🧱 Tech Stack
- Backend: Laravel + Sanctum (API)
- Frontend: React + Vite + TailwindCSS

## 📁 Project Structure


## 🚀 Getting Started

### 1) Backend (Laravel)
```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve

cd frontend
cp .env.example .env
npm install
npm run dev
````
Frontend runs on: http://localhost:5173

Backend runs on: http://127.0.0.1:8000


## 🔐 Environment Variables

- See:

- backend/.env.example

- frontend/.env.example

## ✅ Code Quality

- Reusable UI components (EmptyState, StockBadge, etc.)

- Defensive stock checks (cart + checkout)

- Clean API wrapper with consistent error handling

## 📄 License

---

## 6) (Conventional Commits)
Suggested Commits:

- `feat: add cart drawer with stock validation`
- `feat: implement checkout review and stock checks`
- `ui: unify navbar styles`
- `refactor: extract format helpers`
- `fix: prevent double submit on checkout`
- `chore: add env examples and gitignore`

---

## 7) (Pushing Project)
In Project root:

```bash
git init
git add .
git commit -m "chore: initial commit"
git branch -M main
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```