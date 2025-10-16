# My Interactive Developer Portfolio

Welcome to the repository for my personal developer portfolio! This project is a dynamic, single-page application designed to showcase my skills and projects in a visually engaging way. It features a live particle-based background, a modern "frosted glass" UI, and dynamically loads project data from a JSON file.

### ✨ [View the Live Demo Here!](https://lookupmyportfolio.netlify.app/)



---

## Features

* **Dynamic Live Background:** Built with **Particles.js** to create an interactive and engaging user experience.
* **Modern UI/UX:** A sleek, responsive design featuring a "glassmorphism" (frosted glass) effect for a clean and professional look.
* **Project Showcase:** Project data is loaded dynamically from an external `database.json` file, making it incredibly easy to update and manage my work.
* **Smooth Animations:** Subtle fade-in and on-scroll animations to guide the user's focus and enhance the visual appeal.
* **Responsive Design:** The layout is fully responsive and optimized for a seamless experience on all devices, from mobile phones to desktops.
* **Project Management Tool:** Includes a dedicated `add-project.html` page to easily generate the required JSON structure for new projects, complete with a live preview.

---

## 🛠️ Tech Stack

This portfolio was built from the ground up using a combination of core web technologies:

* **HTML5:** For the main structure and content of the application.
* **CSS3:** For all styling, including the color palette, layout (Flexbox & Grid), animations, and responsive design.
* **JavaScript (ES6+):** For all the dynamic functionality, including:
    * Fetching and rendering project data from `database.json`.
    * Implementing the scroll-reveal animations.
    * Handling the logic for the `add-project` utility page.
* **Particles.js:** An open-source library used to create the stunning live particle animation in the background.

---

## 🚀 Getting Started

To run this project on your local machine, follow these simple steps:

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/IshaanMauss/my-portfolio.git](https://github.com/IshaanMauss/my-portfolio.git)
    ```
2.  **Navigate to the project directory:**
    ```sh
    cd my-portfolio
    ```
3.  **Open `index.html`:**
    Simply open the `index.html` file in your favorite web browser to see the portfolio in action. No complex build steps are required!

---

## How It Works

The portfolio's project section is powered by the `database.json` file. The `app.js` script fetches this file, reads the list of projects, and dynamically creates a project card for each entry.

To add a new project, you can either manually edit the `database.json` file or use the included `add-project.html` page, which provides a user-friendly form and generates the correctly formatted JSON for you.
