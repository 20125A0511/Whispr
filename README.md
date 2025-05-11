# <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Food/Bubble%20Tea.png" alt="Bubble Tea" width="40" height="40" /> texttemp - Your Modern Messaging Hub

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/) [![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.io/)

**texttemp** is a sleek, iMessage-inspired web application for seamless and secure messaging. Built with a modern tech stack, it features passwordless authentication using One-Time Passwords (OTP) via email, ensuring a smooth and safe user experience.

<!-- Optional: Add a GIF or screenshot here -->
<!-- e.g., <p align="center"><img src="link_to_your_screenshot.png" width="700"></p> -->

## ✨ Key Features

*   **💬 iMessage-like Interface:** Clean, intuitive, and familiar chat UI.
*   **🔐 Passwordless Authentication:** Secure sign-up and login using email OTPs.
*   **🚀 Modern Tech Stack:** Leveraging Next.js for server-side rendering and static site generation, TypeScript for type safety, and Tailwind CSS for utility-first styling.
*   **☁️ Supabase Backend:** Utilizing Supabase for database, authentication, and real-time capabilities.
*   **📱 Responsive Design:** Looks and works great on all devices – desktops, tablets, and mobiles.
*   **🎨 Customizable UI Components:** Reusable and stylish UI elements.
*   **🎥 Engaging Landing Page:** Featuring a background video and animated cue cards to showcase features.

## 🛠️ Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) (App Router)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Backend & Auth:** [Supabase](https://supabase.io/)
*   **UI Icons:** [React Icons](https://react-icons.github.io/react-icons/)
*   **Linting:** ESLint

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

*   Node.js (v18 or later recommended)
*   npm or yarn or pnpm
*   A Supabase account (free tier is sufficient)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/20125A0511/texttemp.git
    cd texttemp
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Set up Environment Variables:**
    Create a `.env.local` file in the root of your project and add your Supabase project URL and anon public key:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    ```
    You can find these in your Supabase project dashboard under `Project Settings` > `API`.

4.  **Supabase Email Template Configuration:**
    For OTP to work correctly (sending the token instead of a magic link), ensure your Supabase email templates are configured properly:
    *   Go to your Supabase Dashboard -> `Authentication` -> `Email Templates`.
    *   Edit the "Magic Link" or "OTP" template.
    *   Make sure the email body contains `{{ .Token }}` where you want the OTP to appear, **not** `{{ .ConfirmationURL }}`.
    *   Example: `Your verification code is: {{ .Token }}`
    *   (Optional) Configure OTP expiry in Supabase Dashboard -> `Authentication` -> `Settings` -> `OTP Expiry`. We discussed setting this to 100 seconds.

5.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

The main application code resides in the `src` directory:

```
src/
├── app/                # Next.js App Router pages and layouts
│   ├── (auth)/         # Authentication related pages/routes (if any)
│   ├── dashboard/      # Dashboard page (protected)
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home/Landing page
├── components/         # Reusable UI components
│   ├── auth/           # Authentication-specific components (e.g., OtpAuthFlow)
│   └── ui/             # Generic UI elements (Button, Input, CueCard)
├── context/            # React Context providers (e.g., AuthProvider)
├── utils/              # Utility functions (cn for classnames, Supabase client)
└── styles/             # Global styles (if any, though Tailwind is primary)
```

## 🤝 Contributing (Optional)

Contributions are welcome! If you have suggestions or want to improve the app, feel free to:
1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'')
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📜 License (Optional)

This project is licensed under the MIT License - see the `LICENSE.md` file for details (if you choose to add one).

---

<p align="center">Happy Texting with texttemp! ✨</p>
