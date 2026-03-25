<div align="center">
  <h1>💻 VSCode Typing Animator</h1>
  <p>A sleek, web-based tool that perfectly mimics a human typing code inside Visual Studio Code.</p>
</div>

---

## 📖 Overview
**VSCode Typing Animator** is a powerful front-end application built for content creators, educators, and developers. Paste your code snippet, hit play, and watch the editor dynamically type it out character-by-character. It allows deep customization of typing behavior and includes a built-in screen recorder so you can instantly export animations for use in tutorials, social media (TikTok, YouTube Shorts), or presentations.

## ✨ Features
- **Perfect VSCode Mock UI:** Utilizes Monaco Editor (the very core of VSCode) to provide pixel-perfect dark theme aesthetics and accurate syntax highlighting for over 50+ programming languages.
- **Customizable Typing Engine:** Adjust the WPM (Words Per Minute) typing speed on the fly. Pause and resume the animation at any time.
- **🤖 Human Mode:** Toggle "Human Mode" to simulate real-world typing. It intelligently injects randomized typos, instantly backspaces to correct them, and adds micro-delays when typing line breaks or semicolons to perfectly mimic human hesitation.
- **🎥 Built-in Recording:** Native integration with the browser's Screen Capture API to record the typing animation directly to a high-quality `.webm` video file in one click.
- **Dynamic Status Bar:** Live line/column cursor tracking and real-time syntax error/warning detection updates seamlessly in the bottom status bar.

## 🚀 How to Use It
1. **Open the App:** Simply open `index.html` in your web browser. No local development server or compilation required!
2. **Select Language:** Choose your code's specific language from the dropdown menu to load the correct Monaco syntax rules.
3. **Paste Code:** Paste your final desired code block into the **"Enter your code:"** text area at the bottom of the screen.
4. **Configure:** 
   - Set the automated typing **Speed (WPM)**.
   - *(Optional)* Check the **Human Mode** box and adjust the Mistake Rate slider to make the animation feel authentic.
5. **Action:** Click **Record** to select your browser tab for screen capturing, then click **▶ Start Typing** to begin the animation. Click **Stop Rec** when finished to download your video!

## 🛠️ Tech Stack
- **HTML5 & Vanilla CSS3:** For the lightweight VSCode dark-theme mock interface and responsive layout structure.
- **Vanilla JavaScript (ES6+):** For the low-level AST code injection typing engine and animation sequencing loop.
- **Monaco Editor (`vs/editor/editor.main`):** For absolute precision in rendering code logic and syntax highlighting.
- **MediaRecorder API (`getDisplayMedia`):** For capturing fluid video exports natively directly within the browser ecosystem.

## 📄 License
This project is open-source and free to be used for commercial or non-commercial purposes. Feel free to fork, modify, and improve!
