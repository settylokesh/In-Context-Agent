# In-Context Agent

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=flat&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)

**In-Context Agent** is a sophisticated, AI-driven browser assistant engineered to augment your web browsing workflow. Seamlessly integrated into the Chrome Side Panel, it leverages the **Groq API** to deliver instant, context-aware intelligence without disrupting your browsing session.

---

## 🚀 Key Features

| Feature | Description |
| :--- | :--- |
| **🤖 High-Performance AI** | Powered by **Groq API** for ultra-low latency inference using state-of-the-art models. |
| **👁️ Context Awareness** | Intelligently analyzes active tab content to provide relevant summaries, insights, and answers. Controlled via a dedicated **Context Toggle**. |
| **💬 Advanced Chat UI** | A polished interface featuring Markdown rendering, LaTeX math support, and syntax highlighting for code blocks. |
| **🎨 Premium Design** | Aesthetically pleasing, light-themed UI designed for clarity and ease of use within the side panel. |
| **🔒 Privacy-First** | Your API key is stored securely in your browser's local storage. No data is sent to third parties other than the AI provider. |

## 📖 Usage Guide

### 1. Accessing the Agent
Click the extension icon in the Chrome toolbar and select **"Open Side Panel"**. Alternatively, use the browser's side panel menu to switch to "In-Context Agent".

### 2. Configuration
Upon first launch, you will be prompted to enter your **Groq API Key**. This key is essential for the agent's operation and is stored locally on your device.

### 3. Context Toggle
The **Context Toggle** gives you full control over when the AI reads your current page:

*   **🟢 ON (Active)**: The AI reads and analyzes the active tab's content.
    *   *Best for:* Summaries, data extraction, and specific questions about the page.
*   **⚪ OFF (Inactive)**: The AI operates in standalone mode.
    *   *Best for:* General queries, coding assistance, or when browsing sensitive/irrelevant content.

## 🛠️ Installation

### Prerequisites
*   **Node.js** (v16+)
*   **npm** or **yarn**
*   **Groq API Key** (Available at [console.groq.com](https://console.groq.com))

### Setup Instructions

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/settylokesh/In-Context-Agent.git
    cd In-Context-Agent
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Build the Extension**
    ```bash
    npm run build
    ```
    *This generates a production-ready `dist` directory.*

4.  **Load into Chrome**
    1.  Navigate to `chrome://extensions/`.
    2.  Enable **Developer mode** (top right).
    3.  Click **Load unpacked**.
    4.  Select the `dist` folder from the project directory.

## 🔒 Privacy & Security

*   **Local Storage**: Your Groq API key is stored exclusively in your browser's `chrome.storage.local`. It is never transmitted to any server other than Groq's API endpoints for authentication.
*   **Data Transmission**: Page content is only sent to the Groq API when the **Context Toggle** is **ON** and you send a message.
*   **No Tracking**: This extension does not include any analytics or user tracking scripts.

## ❓ Troubleshooting

| Issue | Possible Solution |
| :--- | :--- |
| **API Key Not Working** | Verify your key at [console.groq.com](https://console.groq.com). Ensure you have sufficient credits/usage limits. |
| **Context Not Loading** | Ensure the **Context Toggle** is ON. Refresh the page. Some complex web apps (like Google Docs) may block content extraction. |
| **Extension Error** | Check `chrome://extensions` for error logs. Try reloading the extension and refreshing the page. |

## 💻 Development

**Start Development Server:**
```bash
npm run dev
```
*Note: Changes to UI components will HMR (Hot Module Replace), but changes to background scripts or manifest require a full extension reload.*

**Lint Code:**
```bash
npm run lint
```

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
