# Couples Hub - Productivity Web App

A beautiful, mobile-responsive web app for couples to manage their shared calendar and todo lists. Built with React, Supabase, and deployable to Vercel.

## Features

- **Shared Calendar**: Add, view, and manage events together
- **Todo List**: Create and track shared tasks
- **Real-time Sync**: Changes sync instantly across devices (with Supabase)
- **Mobile-Responsive**: Works perfectly on phones, tablets, and desktops
- **Beautiful Design**: Modern gradient UI with smooth animations

## Tech Stack

- **Frontend**: React + Vite (fast development)
- **Backend**: Supabase (database + real-time sync)
- **Styling**: CSS3 (mobile-first responsive design)
- **Hosting**: Vercel (free hosting)

## Getting Started

### Step 1: Run Locally

The app is already set up! To run it on your computer:

```bash
npm run dev
```

Then open your browser to `http://localhost:5173`

You'll see the app working with local storage (no database yet). You can add events and todos, but they'll only be saved in your browser.

### Step 2: Set Up Supabase (For Real-time Sync)

To enable real-time syncing between devices, you'll need to set up Supabase:

1. **Create a Supabase account**:
   - Go to [supabase.com](https://supabase.com)
   - Sign up for free

2. **Create a new project**:
   - Click "New Project"
   - Give it a name (e.g., "couples-hub")
   - Set a database password (save this!)
   - Wait for the project to set up (takes ~2 minutes)

3. **Create database tables**:
   - In your Supabase dashboard, go to "SQL Editor"
   - Click "New Query"
   - Copy and paste this SQL code:

```sql
-- Create events table
CREATE TABLE events (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create todos table
CREATE TABLE todos (
  id BIGSERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable real-time for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE todos;
```

   - Click "Run" to create the tables

4. **Get your API credentials**:
   - Go to Project Settings (gear icon) → API
   - Copy your "Project URL"
   - Copy your "anon public" key

5. **Add credentials to your app**:
   - Create a file called `.env` in your project folder
   - Copy the contents from `.env.example` and fill in your values:

```
VITE_SUPABASE_URL=your-project-url-here
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

6. **Restart your dev server**:
   - Stop the server (Ctrl+C)
   - Run `npm run dev` again

Now your app is connected to Supabase and will sync in real-time!

### Step 3: Deploy to Vercel (Free Hosting)

To make your app accessible from anywhere:

1. **Push code to GitHub**:
   - Create a new repository on GitHub
   - Run these commands:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin your-github-repo-url
   git push -u origin main
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub
   - Click "New Project"
   - Import your GitHub repository
   - Add your environment variables:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
   - Click "Deploy"

Your app will be live in ~2 minutes at a URL like `your-app.vercel.app`!

## Project Structure

Here's what each file does:

```
couples-hub/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Calendar.jsx     # Calendar component (add/view/delete events)
│   │   └── TodoList.jsx     # Todo list component (add/complete/delete todos)
│   │
│   ├── styles/              # CSS styling files
│   │   ├── Calendar.css     # Styles for calendar component
│   │   └── TodoList.css     # Styles for todo list component
│   │
│   ├── utils/               # Utility functions
│   │   └── supabase.js      # Supabase client configuration
│   │
│   ├── App.jsx              # Main app component (navigation, layout)
│   ├── App.css              # Global app styles
│   └── main.jsx             # App entry point
│
├── .env.example             # Example environment variables file
├── package.json             # Project dependencies
└── vite.config.js           # Vite configuration
```

### Key Files Explained:

- **App.jsx**: The main component that holds everything together. It manages which tab (Calendar or Todos) is shown and provides the overall layout.

- **Calendar.jsx**: Handles all calendar functionality - adding events, displaying them, and deleting them. Connects to Supabase to save data.

- **TodoList.jsx**: Manages the todo list - adding tasks, marking them complete, and deleting them. Also connects to Supabase.

- **supabase.js**: Sets up the connection to your Supabase database using your API credentials.

- **CSS files**: Make everything look beautiful and work on mobile devices.

## How It Works

### Adding Events/Todos:
1. User types in the form
2. Clicks "Add" button
3. App saves to Supabase database
4. Component updates to show new item
5. Other devices get updated automatically (real-time sync!)

### Data Flow:
```
User Input → React Component → Supabase Database → Real-time Sync → All Devices
```

## Customization Ideas

Want to personalize your app? Try these:

1. **Change colors**: Edit the gradient in `src/App.css` (line 13)
2. **Add categories**: Add a category field to events/todos
3. **Add photos**: Allow uploading event photos
4. **Add reminders**: Set up email notifications
5. **Add notes**: Create a shared notes section

## Troubleshooting

**App won't start?**
- Make sure you ran `npm install` first
- Check that Node.js is installed: `node --version`

**Data not saving?**
- Check your `.env` file has the correct Supabase credentials
- Make sure you created the database tables
- Check the browser console for errors (F12)

**Not syncing between devices?**
- Verify real-time is enabled in Supabase
- Both devices need to be connected to internet

## Next Steps

Once you're comfortable with the basics, you can:

1. Add user authentication (so each couple has their own data)
2. Add more features (shopping lists, meal planner, etc.)
3. Customize the design to your taste
4. Add notifications and reminders
5. Create a mobile app version with React Native

## Need Help?

- **React docs**: [react.dev](https://react.dev)
- **Supabase docs**: [supabase.com/docs](https://supabase.com/docs)
- **Vite docs**: [vitejs.dev](https://vitejs.dev)

## License

Free to use and modify as you wish!
