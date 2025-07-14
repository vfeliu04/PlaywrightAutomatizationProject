# Automated Padel Court Booking System

This project is an automated system that books padel courts at the Centre Fair-Play. It is designed to run on a schedule, ensuring that desired time slots are reserved as soon as they become available.

---

## For the Coach (Non-Technical Guide)

### What It Does

This system automatically books one or more padel courts for you. You just need to tell it which day and times you want, and it will handle the rest.

### How to Use It

1.  **Open the `slots.json` file.**
2.  **Edit the `day` and `times`** to match your desired schedule for the upcoming week.
    *   The `day` should be the full English name (e.g., "Thursday").
    *   The `times` should be a list of all the start times you want to book (e.g., `["12:00", "13:30"]`).
3.  **Save the file.**

That's it! The system will automatically run every day at 00:00 CEST and attempt to book all the slots you've specified.

---

## System Guide

### How the Automation Works on GitHub

**1. Scheduled Trigger:**
Yes, the script will run automatically at the exact time we specified. We've configured a `cron` schedule in the `.github/workflows/book-padel.yml` file. This is a universal standard for scheduling tasks. GitHub's servers are constantly checking these schedules, and when the clock hits **00:00 CEST**, it will automatically kick off your workflow.

**2. The "Actions" Tab: Your Control Center**
You can see everything that happens in the **Actions** tab of your GitHub repository.

*   **How to find it:** Go to your repository page on GitHub. Along the top, next to "Code" and "Issues", you will see a tab called **"Actions"**.

*   **What you'll see:** This tab is your console. It will show a list of every single time the "Book Padel Courts" workflow has run. Each run will have a status next to it:
    *   A **green checkmark (✓)** means the script ran successfully.
    *   A **red X (✗)** means the script failed for some reason.
    *   A **yellow circle** means it's currently in progress.

**3. Viewing the Console Output:**
To see exactly what happened during a run, you can click on it in the Actions list. This will take you to a detailed view where you can see the logs for each step. You can click on the "Run booking script" step to see all the `console.log` messages from our `scripts/book.js` file, like "Found 13 available slots," "Checking slot at 9:00...", and most importantly, "Successfully booked slot for 12:00!".

This is how you will know for sure if a booking was successful without having to check the website yourself.

### How to Change the Schedule from Any Computer

This is the best part – you don't need any code editor or local setup to change the booking schedule. You can do it directly from the GitHub website on any computer.

**Here’s how:**

1.  **Navigate to your repository** on GitHub.
2.  You will see a list of your files. Find and click on the **`slots.json`** file.
3.  On the page that shows the file's content, look for a **pencil icon (✎)** in the top-right corner. Click it to edit the file.
4.  Change the `"day"` and `"times"` to whatever you want for the next booking.
5.  Scroll to the bottom of the page and click the green **"Commit changes"** button.

That's it! The next time the workflow runs, it will automatically use your newly saved schedule. This makes it incredibly easy to manage your bookings from anywhere.

---

## For the Developer (Technical Details)

### How It Works

The system uses a Node.js script with the Playwright library to automate browser interactions. The process is managed and scheduled by a GitHub Actions workflow. It is capable of booking multiple time slots in a single run and handles sensitive data securely.

### Core Components

*   **`scripts/book.js`**: This is the main Playwright script that performs the booking. It launches a browser, navigates to the booking website, logs in, and iterates through available slots to find and reserve all the ones specified in `slots.json`. It includes error handling, a safety mechanism to cancel pending reservations, and logic to handle locked slots.

*   **`slots.json`**: A simple JSON file that acts as the configuration for the booking script. It defines the target `day` of the week and an array of `times` to book.

*   **`.github/workflows/book-padel.yml`**: This GitHub Actions workflow automates the execution of the booking script.
    *   **Trigger:** It is scheduled to run every day at 00:00 CEST (`cron: '0 22 * * *'`). It can also be triggered manually from the repository's "Actions" tab.
    *   **Environment:** It sets up an Ubuntu environment with Node.js 18 and installs all necessary dependencies, including Playwright's browser binaries.
    *   **Execution:** It runs the `node scripts/book.js` command to start the booking process.
    *   **Secrets:** It securely injects credentials (player number, password, credit card details) into the script using GitHub Secrets.

### Setup and Dependencies

*   **Node.js**: The runtime environment.
*   **Playwright**: The browser automation and testing library.
*   **`dotenv`**: A package to manage local environment variables for testing.
*   **Dependencies**: To install the necessary packages, run `npm install`.
*   **Local Environment:** For local testing, create a `.env` file (by copying `.env.example`) and fill in the required credentials. This file is ignored by Git to keep your secrets safe.
