# Vett — Real Feedback on Dating Profiles

**Vett** is a full-stack MVP web app where men upload their dating profiles (bios or screenshots from Hinge, Tinder, etc.), and verified women offer honest, actionable feedback — whether it’s a roast or constructive advice.

The goal is to help users improve their online presence through thoughtful critique from a trusted reviewer community.

---

## Live Demo

**Coming soon on Vercel**

---

## Features

### Submitters (Men)
- Upload dating profile screenshots and written bios
- Receive real-time feedback from verified reviewers
- View a personal feedback dashboard

### Reviewers (Women)
- Submit a selfie or apply for admin approval to verify
- Review submitted profiles and leave feedback
- Access a streamlined interface to browse pending submissions

---

## Pages

| Route           | Description                                |
|----------------|--------------------------------------------|
| `/signup`       | User authentication (sign up and log in)  |
| `/submit`       | Upload screenshots and bios                |
| `/review`       | Review queue for verified users            |
| `/verify`       | Verification process for reviewers         |
| `/profile/[id]` | Individual profile page and feedback view  |

---

## Tech Stack

| Layer     | Technology                       |
|-----------|----------------------------------|
| Frontend  | Next.js, React, Tailwind CSS     |
| Backend   | Supabase (Auth, Storage, DB)     |
| Hosting   | Vercel                           |

---

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/vett.git
   cd vett
