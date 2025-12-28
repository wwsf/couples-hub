# 💕 Couples Hub

A beautiful, real-time productivity web app designed for couples to manage their shared life together. Built with React, Supabase, and deployed on Vercel.

![React](https://img.shields.io/badge/React-19.2-blue)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green)
![Vite](https://img.shields.io/badge/Vite-Build-purple)

## ✨ Features

- 📅 **Shared Calendar** - Plan dates, appointments, and events together with dual view (calendar grid + sheet view)
- ✅ **Todo Lists** - Track shared tasks and responsibilities
- 🛒 **Grocery Lists** - Collaborative shopping with categories and real-time sync
- 💳 **Bills Tracker** - Manage utility bills, due dates, and payment status
- 🔄 **Real-time Sync** - Changes appear instantly across all devices
- 👥 **Partner System** - Secure invitation-based couple linking
- 📱 **Mobile Responsive** - Works beautifully on phones, tablets, and desktops
- 🎨 **Clean Design** - Modern, distraction-free interface

## 🚀 Tech Stack

- **Frontend**: React 19 with Vite
- **Backend**: Supabase (PostgreSQL + Real-time)
- **Authentication**: Supabase Auth
- **Security**: Row Level Security (RLS) policies
- **Hosting**: Vercel
- **Styling**: Modern CSS3 with responsive design

## 🏗️ Architecture

```
├── src/
│   ├── components/       # UI components
│   │   ├── Calendar.jsx       # Multi-view calendar
│   │   ├── TodoList.jsx       # Task management
│   │   ├── GroceryList.jsx    # Shopping lists
│   │   └── BillsTracker.jsx   # Bill management
│   ├── context/          # React Context providers
│   │   ├── AuthContext.jsx    # Authentication & invites
│   │   └── CoupleContext.jsx  # Couple relationship state
│   ├── pages/            # Page components
│   │   ├── HomePage.jsx       # Main app interface
│   │   ├── LoginPage.jsx      # Auth page
│   │   └── SignupPage.jsx     # Registration
│   └── utils/            # Utilities
│       └── supabase.js        # Supabase client config
└── supabase/
    └── migrations/       # Database schema
        ├── 001_initial_schema.sql
        └── 002_create_bills_and_grocery.sql
```

## 📦 Database Schema

- **couple_relationships** - Links partners together with invitation system
- **events** - Shared calendar events with categories and colors
- **todos** - Shared task lists
- **grocery_items** - Categorized shopping lists
- **bills** - Bill tracking with recurring payments support

All tables are protected with Row Level Security (RLS) policies ensuring couples only see their own data.

## 🎯 Key Features Explained

### Partner Invitation System
- One partner creates an account and sends an email invitation
- Other partner signs up and automatically gets linked
- All data is private to the couple

### Real-time Collaboration
- Uses Supabase real-time subscriptions
- Changes sync within milliseconds
- No page refresh needed

### Bills Tracker
- Track 9 types of bills (electricity, water, gas, internet, rent, phone, insurance, subscription, other)
- Recurring billing support (weekly, monthly, quarterly, yearly)
- Payment status tracking with overdue warnings
- Amount summaries and filtering

### Grocery List
- 9 categories with icons (produce, dairy, meat, pantry, frozen, beverages, snacks, household, other)
- Check off items as you shop
- Filter by category
- Clear completed items

## 🛠️ Local Development

### Prerequisites
- Node.js 18+ installed
- Supabase account
- Git

### Setup

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd couples-hub
npm install
```

2. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the migration scripts in SQL Editor:
     - `supabase/migrations/001_initial_schema.sql`
     - `supabase/migrations/002_create_bills_and_grocery.sql`
   - Enable Realtime for tables: `events`, `todos`, `grocery_items`, `bills`
     (Database → Replication → supabase_realtime publication)

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. **Run the development server**
```bash
npm run dev
```

Visit `http://localhost:5173` to see the app.

## 🚢 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

1. Push your code to GitHub
2. Import the repository to Vercel
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

## 🔒 Security

- All database access protected by Row Level Security (RLS)
- Authentication handled by Supabase Auth
- Environment variables for sensitive credentials
- Couples can only access their own data
- Invitation system prevents unauthorized access

## 🎨 Customization

The app uses a greyish-blue gradient theme. To customize:

- **Colors**: Edit CSS variables in `src/App.css`
- **Gradient**: Modify `background: linear-gradient(135deg, #485563 0%, #29323c 100%)`
- **Button styles**: Update `.btn-primary` classes

## 📱 Mobile Support

The app is fully responsive and tested on:
- iOS Safari
- Android Chrome
- Desktop browsers (Chrome, Firefox, Safari, Edge)

## 🐛 Troubleshooting

**"Could not find the table" error**
- Run the database migrations in Supabase SQL Editor
- Check that tables were created: `SELECT * FROM information_schema.tables WHERE table_schema = 'public'`

**Real-time not working**
- Enable Realtime for all tables in Database → Replication
- Check browser console for subscription errors

**Login issues**
- Verify Supabase URL and anon key in `.env`
- Check email confirmation settings in Supabase Auth

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## 📄 License

MIT License - feel free to use this project for your own couples hub!

## 💡 Future Ideas

- [ ] Meal planning feature
- [ ] Photo sharing gallery
- [ ] Expense splitting calculator
- [ ] Date night idea generator
- [ ] Shared notes/journal
- [ ] Push notifications for bills/events
- [ ] Dark mode support
- [ ] Export data functionality

---

**Built with ❤️ for couples who plan together, stay together**
