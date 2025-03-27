# Vett - Dating Profile Reviews

Vett is a platform where users can submit their dating profiles for review and provide feedback on others' profiles. It's built with Next.js, TypeScript, TailwindCSS, and Supabase.

## Features

### For Profile Submitters
- Submit dating profiles with photos and text for review
- Receive honest feedback from multiple reviewers
- View analytics on your profile's performance
- Get detailed reviews with ratings and constructive feedback
- Receive notifications when new reviews arrive

### For Reviewers
- Review dating profiles with an intuitive interface
- Provide ratings and detailed feedback
- See a stream of profiles to review
- Filter out profiles you've already reviewed

## Tech Stack

- **Frontend**: Next.js 13 (App Router), TypeScript, TailwindCSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Authentication**: Email/Password, Social Logins
- **Hosting**: Vercel

## Setup Instructions

### Prerequisites
- Node.js 16+
- npm or yarn
- Supabase account

### Local Development

1. Clone the repository
```bash
git clone https://github.com/yourusername/vett.git
cd vett
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up environment variables
Create a `.env.local` file in the root directory with the following variables:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Set up the database
Run the SQL scripts in the `src/db` directory to set up your Supabase database:
- `notification-schema.sql` - Creates the notifications table and related functions
- Make sure to also set up the RLS policies as described in `src/rls-instructions.md`

5. Start the development server
```bash
npm run dev
# or
yarn dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Folder Structure

```
/src
  /app                   # Next.js 13 App Router pages
    /api                 # API routes
    /dashboard           # Dashboard page
    /login               # Login page
    /settings            # Settings pages
    /review              # Review page
    /submit              # Profile submission page
    /my-reviews          # User's received reviews page
  /components            # Reusable components
  /contexts              # React contexts (Auth, Notifications)
  /lib                   # Utility functions and libraries
  /db                    # Database scripts and schemas
```

## Components

The application includes several reusable components:

- `ProfileCard` - Displays a user's dating profile
- `ReviewCard` - Shows individual reviews
- `FeedbackForm` - Form for submitting reviews
- `RatingScale` - Interactive rating component
- `ReviewAnalytics` - Shows analytics for profile reviews
- `NotificationsDropdown` - Displays user notifications
- `Header` - Main navigation header

## Authentication

Authentication is handled through Supabase Auth with the following options:
- Email/Password
- Google OAuth
- Microsoft OAuth

## Data Models

### Users
- Basic user information and authentication
- Role (submitter or reviewer)

### Profiles
- User's dating profile information
- Images, bio, interests, etc.

### Reviews
- Ratings and feedback on profiles
- Linked to both reviewer and submitter

### Notifications
- System notifications for users
- New review notifications, etc.

## Row Level Security (RLS)

The application uses Supabase RLS policies to ensure data security:
- Users can only access their own data
- Reviewers can only see profiles they haven't reviewed yet
- Submitters can only see reviews of their own profile

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Live Demo

**Coming soon on Vercel**

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

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/vett.git
   cd vett
