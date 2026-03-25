class VSCodeTypingAnimation {
  constructor() {
    this.editor = null;
    this.isTyping = false;
    this.isPaused = false;
    this.currentText = '';
    this.targetText = '';
    this.typingPosition = 0;
    this.typingSpeed = 60; // WPM
    this.useHumanMode = false;
    this.mistakeRate = 5;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;

    this.initializeEditor();
    this.setupEventListeners();

    // Disable Start until editor is ready
    const startBtn = document.getElementById('start-btn');
    if (startBtn) startBtn.disabled = true;
  }

  initializeEditor() {
    if (typeof require === 'undefined') {
      console.error('Monaco require not available yet');
      // try again shortly
      setTimeout(() => this.initializeEditor(), 100);
      return;
    }

    require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.34.1/min/vs' } });

    require(['vs/editor/editor.main'], () => {
      this.editor = monaco.editor.create(document.getElementById('monaco-editor'), {
        value: '',
        language: 'javascript',
        theme: 'vs-dark',
        automaticLayout: true,
        fontSize: 14,
        lineHeight: 22,
        fontFamily: 'Cascadia Code, Fira Code, Monaco, Menlo, monospace',
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        lineNumbers: 'on',
        glyphMargin: false,
        folding: false,
        lineDecorationsWidth: 0,
        lineNumbersMinChars: 3,
        renderWhitespace: 'none',
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: true,
      });

      this.setupAutoScroll();
      this.updateLanguage();
      this.updateCursorStatus();

      this.editor.onDidChangeCursorPosition(() => this.updateCursorStatus());
      this.editor.onDidChangeModelContent(() => this.updateCursorStatus());

      const startBtn = document.getElementById('start-btn');
      if (startBtn) startBtn.disabled = false;
    }, (err) => console.error('Failed to load Monaco:', err));
  }

  setupAutoScroll() {
    if (!this.editor) return;
    let t;
    this.editor.onDidChangeModelContent(() => {
      if (!this.isTyping) return;
      clearTimeout(t);
      t = setTimeout(() => {
        const pos = this.editor.getPosition();
        if (pos) this.editor.revealPositionInCenterIfOutsideViewport(pos, 0);
      }, 50);
    });
  }

  setupEventListeners() {
    const byId = (id) => document.getElementById(id);
    byId('start-btn')?.addEventListener('click', () => this.startTyping());
    byId('pause-btn')?.addEventListener('click', () => this.pauseTyping());
    byId('stop-btn')?.addEventListener('click', () => this.stopTyping());
    byId('record-btn')?.addEventListener('click', () => this.toggleRecording());

    byId('language-select')?.addEventListener('change', () => this.updateLanguage());
    byId('speed-input')?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (!Number.isNaN(val)) this.typingSpeed = Math.max(10, Math.min(200, val));
    });

    byId('human-mode')?.addEventListener('change', (e) => {
      this.useHumanMode = e.target.checked;
      const rateGroup = byId('mistake-rate-group');
      if (rateGroup) rateGroup.style.display = this.useHumanMode ? 'flex' : 'none';
    });
    
    byId('mistake-rate')?.addEventListener('input', (e) => {
      this.mistakeRate = parseInt(e.target.value, 10) || 5;
    });

    byId('code-input')?.addEventListener('input', (e) => {
      this.targetText = e.target.value || '';
    });

    // initial value
    const initial = byId('code-input')?.value || '';
    this.targetText = initial;

    // Periodically update error/warning counts
    setInterval(() => this.updateErrorCount(), 1000);
  }

  updateErrorCount() {
    if (typeof monaco === 'undefined' || !this.editor) return;
    const model = this.editor.getModel();
    if (!model) return;
    
    try {
      const markers = monaco.editor.getModelMarkers({ resource: model.uri });
      let errors = 0;
      let warnings = 0;
      
      markers.forEach(marker => {
        if (marker.severity === monaco.MarkerSeverity.Error) errors++;
        else if (marker.severity === monaco.MarkerSeverity.Warning) warnings++;
      });

      const statusItems = document.querySelectorAll('.status-left .status-item');
      if (statusItems.length >= 2) {
        statusItems[1].innerHTML = `<i class="fas fa-times-circle" style="color:#ea4646; ${errors === 0 ? 'opacity:0.6' : ''}"></i> ${errors} &nbsp; <i class="fas fa-exclamation-triangle" style="color:#cca700; ${warnings === 0 ? 'opacity:0.6' : ''}"></i> ${warnings}`;
      }
    } catch (err) {
      console.warn("Failed to get Monaco markers", err);
    }
  }

  updateLanguage() {
    const language = document.getElementById('language-select')?.value || 'javascript';

    if (this.editor) {
      const model = this.editor.getModel();
      if (model) {
        let current = '';
        if (typeof model.getLanguageId === 'function') {
          current = model.getLanguageId();
        } else if (typeof model.getLanguageIdentifier === 'function') {
          current = model.getLanguageIdentifier()?.language;
        }
        if (current && current !== language) {
          monaco.editor.setModelLanguage(model, language);
        }
      }
    }

    const tabIcon = document.querySelector('.tab i');
    const tabText = document.querySelector('.tab span');
    const statusItems = document.querySelectorAll('.status-right .status-item');
    const statusLanguage = statusItems[1]; // [Ln/Col, Language, UTF-8]

    const langMap = {
      javascript: { icon: 'fab fa-js-square', name: 'JavaScript', file: 'main.js', color: '#f7df1e' },
      typescript: { icon: 'fab fa-js-square', name: 'TypeScript', file: 'main.ts', color: '#3178c6' },
      python: { icon: 'fab fa-python', name: 'Python', file: 'main.py', color: '#3776ab' },
      java: { icon: 'fab fa-java', name: 'Java', file: 'Main.java', color: '#ed8b00' },
      html: { icon: 'fab fa-html5', name: 'HTML', file: 'index.html', color: '#e34f26' },
      css: { icon: 'fab fa-css3-alt', name: 'CSS', file: 'styles.css', color: '#1572b6' },
      sql: { icon: 'fas fa-database', name: 'SQL', file: 'queries.sql', color: '#336791' },
      // default for other options to avoid icon flicker
      default: { icon: 'fas fa-code', name: language.toUpperCase(), file: 'file', color: '#cccccc' },
    };

    const cfg = langMap[language] || langMap.default;
    if (tabIcon) { tabIcon.className = cfg.icon; tabIcon.style.color = cfg.color; }
    if (tabText) tabText.textContent = cfg.file;
    if (statusLanguage) statusLanguage.textContent = cfg.name;

    // minimal safe samples
    const samples = {
      javascript: '// JS Example\nfunction add(a,b){return a+b;}\nconsole.log(add(2,3));\n',
      typescript: '// TS Example\ninterface User{ id:string; name:string }\nconst u:User={id:\"1\",name:\"Dev\"};\nconsole.log(u);\n',
      python: '# Python Example\nprint("Hello Python")\n',
      html: '<!doctype html>\n<html><body><h1>Hello</h1></body></html>\n',
      css: '/* CSS Example */\nbody{color:#eee}\n',
      sql: '-- SQL Example\nSELECT 1;\n'
    };

    if (samples[language]) {
      this.targetText = samples[language];
      const input = document.getElementById('code-input');
      if (input) input.value = this.targetText;
    }
  }

  updateCursorStatus() {
    if (!this.editor) return;
    const pos = this.editor.getPosition();
    const statusItems = document.querySelectorAll('.status-right .status-item');
    const statusLnCol = statusItems[0];
    if (pos && statusLnCol) statusLnCol.textContent = `Ln ${pos.lineNumber}, Col ${pos.column}`;
  }

  async toggleRecording() {
    const recordBtn = document.getElementById('record-btn');
    if (!recordBtn) return;

    if (this.isRecording) {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
      this.isRecording = false;
      recordBtn.innerHTML = '<i class="fas fa-record-vinyl"></i> Record';
      recordBtn.classList.remove('recording');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: false
      });
      
      this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.recordedChunks.push(e.data);
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `vscode-typing-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      recordBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Rec';
      recordBtn.classList.add('recording');

      // If user stops sharing from browser UI
      stream.getVideoTracks()[0].onended = () => {
        if (this.isRecording) this.toggleRecording();
      };
      
    } catch (err) {
      console.error("Error starting recording:", err);
      alert("Failed to start recording. Please ensure you grant permission.");
    }
  }

  async startTyping() {
    if (this.isTyping && !this.isPaused) return;
    if (!this.editor) { console.warn('Editor not ready'); return; }

    if (this.isPaused) { this.isPaused = false; return this.typeText(); }

    this.isTyping = true;
    this.isPaused = false;
    this.currentText = '';
    this.typingPosition = 0;

    this.editor.setValue('');
    this.editor.setPosition({ lineNumber: 1, column: 1 });
    this.editor.focus();

    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const stopBtn = document.getElementById('stop-btn');
    if (startBtn) startBtn.disabled = true;
    if (pauseBtn) pauseBtn.disabled = false;
    if (stopBtn) stopBtn.disabled = false;

    await this.typeText();
  }

  pauseTyping() {
    if (this.isTyping && !this.isPaused) {
      this.isPaused = true;
      const startBtn = document.getElementById('start-btn');
      const pauseBtn = document.getElementById('pause-btn');
      if (startBtn) startBtn.disabled = false;
      if (pauseBtn) pauseBtn.disabled = true;
    }
  }

  stopTyping() {
    this.isTyping = false;
    this.isPaused = false;
    this.currentText = '';
    this.typingPosition = 0;
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const stopBtn = document.getElementById('stop-btn');
    if (startBtn) startBtn.disabled = false;
    if (pauseBtn) pauseBtn.disabled = true;
    if (stopBtn) stopBtn.disabled = true;
  }

  async typeText() {
    const delay = Math.max(10, 60000 / (this.typingSpeed * 5));
    const model = this.editor.getModel();

    while (this.typingPosition < this.targetText.length) {
      if (!this.isTyping || this.isPaused) return;

      const char = this.targetText[this.typingPosition];
      
      let makeMistake = false;
      if (this.useHumanMode && char !== '\n' && char !== ' ') {
         if (Math.random() < (this.mistakeRate / 100)) makeMistake = true;
      }
      
      const lastLine = model.getLineCount();
      const lastCol = model.getLineMaxColumn(lastLine);
      const posRange = { startLineNumber: lastLine, startColumn: lastCol, endLineNumber: lastLine, endColumn: lastCol };

      if (makeMistake) {
         const wrongChars = "abcdefghijklmnopqrstuvwxyz";
         const wrongChar = wrongChars[Math.floor(Math.random() * wrongChars.length)];
         
         model.applyEdits([{ range: posRange, text: wrongChar }]);
         const curLine = model.getLineCount();
         const curCol = model.getLineMaxColumn(curLine);
         this.editor.setPosition({ lineNumber: curLine, column: curCol });
         this.editor.revealPosition({ lineNumber: curLine, column: curCol });
         
         await new Promise(r => setTimeout(r, delay * 2 + Math.random() * 100));
         if (!this.isTyping || this.isPaused) return;
         
         const bsRange = { startLineNumber: curLine, startColumn: curCol - 1, endLineNumber: curLine, endColumn: curCol };
         model.applyEdits([{ range: bsRange, text: "" }]);
         this.editor.setPosition({ lineNumber: curLine, column: curCol - 1 });
         
         await new Promise(r => setTimeout(r, delay + Math.random() * 50));
         if (!this.isTyping || this.isPaused) return;
      }

      const insertRange = {
         startLineNumber: model.getLineCount(),
         startColumn: model.getLineMaxColumn(model.getLineCount()),
         endLineNumber: model.getLineCount(),
         endColumn: model.getLineMaxColumn(model.getLineCount())
      };
      
      model.applyEdits([{ range: insertRange, text: char }]);
      this.typingPosition++;
      
      const finalLine = model.getLineCount();
      const finalCol = model.getLineMaxColumn(finalLine);
      this.editor.setPosition({ lineNumber: finalLine, column: finalCol });
      this.editor.revealPosition({ lineNumber: finalLine, column: finalCol });
      
      let currentDelay = delay;
      if (this.useHumanMode) {
          currentDelay = delay + (Math.random() * delay * 0.5);
          if (char === '\n' || char === ';' || char === '{') currentDelay += 150;
      }
      
      await new Promise(r => setTimeout(r, currentDelay));
    }

    if (this.isTyping) this.stopTyping();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Give the loader a moment to be ready
  setTimeout(() => new VSCodeTypingAnimation(), 50);
});