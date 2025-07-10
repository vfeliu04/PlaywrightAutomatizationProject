# Automated Padel Court Booking System

This project is an automated system that books padel courts at the Centre Fair-Play. It is designed to run on a schedule, ensuring that desired time slots are reserved as soon as they become available.

---

## For the Coach (Non-Technical Guide)

### What It Does

This system automatically books padel courts for you. You just need to tell it which day and times you want, and it will handle the rest.

### How to Use It

1.  **Open the `slots.json` file.**
2.  **Edit the `day` and `times`** to match your desired schedule for the upcoming week.
    *   The `day` should be the full English name (e.g., "Thursday").
    *   The `times` should be a list of the start times you want to book (e.g., `["10:30", "12:00"]`).
3.  **Save the file.**

That's it! The system will automatically run at 00:01 on Monday morning and attempt to book the slots you've specified.

---

## For the Developer (Technical Details)

### How It Works

The system uses a Node.js script with the Playwright library to automate browser interactions. The process is managed and scheduled by a GitHub Actions workflow.

### Core Components

*   **`scripts/book.js`**: This is the main Playwright script that performs the booking. It launches a browser, navigates to the booking website, logs in, and iterates through available slots to find and reserve the ones specified in `slots.json`. It includes error handling and a safety mechanism to cancel pending reservations if an error occurs.

*   **`slots.json`**: A simple JSON file that acts as the configuration for the booking script. It defines the target `day` of the week and an array of `times` to book.

*   **`.github/workflows/book-padel.yml`**: This GitHub Actions workflow automates the execution of the booking script.
    *   **Trigger:** It is scheduled to run every Monday at 00:01 CEST (`cron: '1 23 * * 0'`). It can also be triggered manually from the repository's "Actions" tab.
    *   **Environment:** It sets up an Ubuntu environment with Node.js 18 and installs all necessary dependencies, including Playwright's browser binaries.
    *   **Execution:** It runs the `node scripts/book.js` command to start the booking process.

### Setup and Dependencies

*   **Node.js**: The runtime environment.
*   **Playwright**: The browser automation and testing library.
*   **Dependencies**: To install the necessary packages, run `npm install`.
