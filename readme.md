# Advisor Journal 🧠

An intelligent journaling application that provides a personal board of AI advisors to help you reflect, set goals, and gain insight into your own patterns. Built with React, TypeScript, Firebase, and powered by the OpenRouter AI gateway.


![Demo](./demo.gif)


## ✨ Key Features

*   **AI-Powered Feedback**: Get instant, nuanced feedback on your journal entries from three distinct AI personas:
    *   **Plitt (Tough Love)**: A direct, action-oriented coach to push you forward.
    *   **Hudson (Introspective Guide)**: A gentle, curious guide to explore your feelings.
    *   **Your Future Self (Wise Elder)**: A calm, 85-year-old version of you for big-picture perspective.
*   **Dynamic Goal Tracking**: Create weekly goals, track your progress with a visual daily tracker, and see your achievements on a dynamic progress bar. Supports both flexible ("3 times a week") and scheduled ("every Monday, Wednesday, Friday") goals.
*   **Personal Blueprint**: The AI identifies recurring personality traits and patterns from your entries over time. You can view and manage this "personal blueprint" to better understand yourself.
*   **Advisor Summit**: Dive deeper into any journal entry by starting a follow-up conversation with all three advisors in a real-time chat interface.
*   **Intelligent Goal Suggestions**: The AI automatically detects if a journal entry relates to one of your active goals and suggests marking it as complete.
*   **Deadline Tracking**: A simple, effective module to add and track upcoming deadlines with relative time formatting (e.g., "due in 3 days").
*   **Secure User Authentication**: Full authentication powered by Firebase, supporting both Email/Password and Google Sign-In.
*   **Customizable AI Models**: Use the settings page to choose from a list of top-tier AI models from OpenRouter, allowing you to balance cost, speed, and intelligence.

## 🛠️ Tech Stack

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Firebase](https://img.shields.io/badge/firebase-%23039BE5.svg?style=for-the-badge&logo=firebase)
![Zustand](https://img.shields.io/badge/zustand-%23000000.svg?style=for-the-badge&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)

-   **Frontend**: React, TypeScript
-   **Styling**: Tailwind CSS
-   **Backend & Database**: Firebase (Authentication & Firestore)
-   **State Management**: Zustand
-   **Routing**: React Router
-   **AI Integration**: OpenRouter API
-   **Utilities**: `date-fns`, `heroicons`

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

-   Node.js (v18 or later recommended)
-   npm or yarn
-   A Firebase project
-   An OpenRouter API key

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/advisor-journal.git
    cd advisor-journal
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up Firebase:**
    *   Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
    *   Enable **Authentication** (with Email/Password and Google providers).
    *   Create a **Firestore Database** in production mode.
    *   In your Project Settings, add a new Web App. Firebase will give you a `firebaseConfig` object. You will need these keys for the next step.

4.  **Set up Environment Variables:**
    *   Create a file named firebase.config.js in src/services/ paste the firebase object keys into it

    **`firebase.config.js `:**
    ```
    # Firebase Configuration
    VITE_FIREBASE_API_KEY="AIza..."
    VITE_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
    VITE_FIREBASE_PROJECT_ID="your-project-id"
    VITE_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
    VITE_FIREBASE_MESSAGING_SENDER_ID="123..."
    VITE_FIREBASE_APP_ID="1:123...:web:..."
    VITE_FIREBASE_MEASUREMENT_ID="G-..."

    ```


5.  **Run the application:**
    ```sh
    npm run start
    ```

6. **Enter OpenRouter Key:**
    * go to settings and paste your open router key

7. **Have Fun!**


## 🏛️ Architectural Highlights

-   **Component-Based Architecture**: The project follows a clean, feature-sliced structure (`src/features`) to keep code organized and maintainable.
-   **Global State Management**: Zustand is used for lightweight and boilerplate-free global state management (`useAuthStore`, `useSettingsStore`), making it easy to access user and settings data from anywhere in the app.
-   **Real-time Database**: Firestore's `onSnapshot` listener is used extensively to provide a real-time, reactive user experience. Changes in the database are instantly reflected in the UI without needing manual re-fetching.
-   **Decoupled Services**: Logic for interacting with Firebase (`firestoreService.ts`) and the AI models (`llmService.ts`) is abstracted into separate services. This separation of concerns makes the code easier to test and allows for swapping out services in the future (e.g., moving from Firebase to another BaaS or from OpenRouter to a specific provider).
-   **UI in Chat**: In the "Advisor Summit" feature, user messages are immediately added to the local state for a snappy, responsive feel while the AI response is being generated in the background.

## License

This project is licensed under the MIT License