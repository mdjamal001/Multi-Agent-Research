document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("researchForm");
  const queryInput = document.getElementById("queryInput");
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("fileInput");
  const fileListContainer = document.getElementById("fileListContainer");
  const submitBtn = document.getElementById("submitBtn");

  // Database Panel elements
  const dbModeRadios = document.querySelectorAll('input[name="dbMode"]');
  const cloudDbPanel = document.getElementById("cloudDbPanel");
  const customDbPanel = document.getElementById("customDbPanel");
  const dbUrlInput = document.getElementById("dbUrlInput");
  const dbHostInput = document.getElementById("dbHostInput");
  const dbPortInput = document.getElementById("dbPortInput");
  const dbUserInput = document.getElementById("dbUserInput");
  const dbPasswordInput = document.getElementById("dbPasswordInput");
  const dbNameInput = document.getElementById("dbNameInput");
  const dbSslCheckbox = document.getElementById("dbSslCheckbox");

  const activeJobCard = document.getElementById("activeJobCard");
  const currentJobIdDisplay = document.getElementById("currentJobIdDisplay");
  const progressBarFill = document.getElementById("progressBarFill");
  const progressPercent = document.getElementById("progressPercent");
  const terminal = document.getElementById("terminal");
  const reportAction = document.getElementById("reportAction");
  const downloadReportBtn = document.getElementById("downloadReportBtn");
  const systemStatusDot = document.getElementById("systemStatusDot");
  const clearQueueBtn = document.getElementById("clearQueueBtn");

  let uploadedFilePaths = [];
  let eventSource = null;

  if (clearQueueBtn) {
    clearQueueBtn.addEventListener("click", async () => {
      if (!confirm("Are you sure you want to clear all queued research tasks?")) return;

      logToTerminal("Clearing research queue...", "highlight");
      try {
        const res = await fetch("/research/queue/clear", { method: "POST" });
        const data = await res.json();
        if (res.ok) {
          logToTerminal("Queue cleared successfully!", "success");
          updateProgress(0, "Queue cleared.");
          currentJobIdDisplay.textContent = "No Active Job";
          if (eventSource) eventSource.close();
          checkHealth();
        } else {
          logToTerminal(`Failed to clear queue: ${data.error}`, "error");
        }
      } catch (err) {
        logToTerminal(`Error clearing queue: ${err.message}`, "error");
      }
    });
  }

  // DB Mode Radio Toggle
  dbModeRadios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      const mode = e.target.value;
      if (mode === "cloud") {
        cloudDbPanel.style.display = "block";
        customDbPanel.style.display = "none";
      } else if (mode === "custom") {
        cloudDbPanel.style.display = "none";
        customDbPanel.style.display = "block";
      } else {
        cloudDbPanel.style.display = "none";
        customDbPanel.style.display = "none";
      }
    });
  });

  // 1. Health check poll
  async function checkHealth() {
    try {
      const res = await fetch("/health");
      const data = await res.json();
      if (data.status === "healthy") {
        systemStatusDot.classList.remove("offline");
        const activeWorkers = data.queue?.counts?.active || 0;
        const waitingJobs = data.queue?.counts?.waiting || 0;
        systemStatusText.textContent = `System Ready (${waitingJobs} queued, ${activeWorkers} active)`;
      } else {
        systemStatusDot.classList.add("offline");
        systemStatusText.textContent = "System Degradation Detected";
      }
    } catch {
      systemStatusDot.classList.add("offline");
      systemStatusText.textContent = "Backend Offline";
    }
  }

  checkHealth();
  setInterval(checkHealth, 10000);

  // 2. Drag & Drop File Upload Handling
  dropzone.addEventListener("click", () => fileInput.click());

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dragover");
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  });

  async function handleFiles(files) {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("documents", files[i]);
    }

    logToTerminal("Uploading document attachments...", "highlight");

    try {
      const res = await fetch("/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.files) {
        data.files.forEach((file) => {
          if (!uploadedFilePaths.includes(file.path)) {
            uploadedFilePaths.push(file.path);
          }
          addFileUI(file.originalName, file.size);
        });
        logToTerminal(`Uploaded ${data.files.length} document(s) successfully.`, "success");
      } else {
        logToTerminal(`Upload failed: ${data.error || "Unknown error"}`, "error");
      }
    } catch (err) {
      logToTerminal(`Upload network error: ${err.message}`, "error");
    }
  }

  function addFileUI(name, size) {
    const item = document.createElement("div");
    item.className = "file-item";
    const kb = (size / 1024).toFixed(1);
    item.innerHTML = `<span class="file-name">📄 ${name}</span><span>${kb} KB</span>`;
    fileListContainer.appendChild(item);
  }

  // Helper to extract DB config based on selected mode
  function getSelectedDbConfig() {
    const selectedMode = document.querySelector('input[name="dbMode"]:checked')?.value;

    if (selectedMode === "cloud") {
      const url = dbUrlInput.value.trim();
      if (url) {
        return { url, ssl: true };
      }
    } else if (selectedMode === "custom") {
      const host = dbHostInput.value.trim();
      const port = parseInt(dbPortInput.value, 10) || 5432;
      const username = dbUserInput.value.trim();
      const password = dbPasswordInput.value;
      const database = dbNameInput.value.trim();
      const ssl = dbSslCheckbox.checked;

      if (host && username && database) {
        return { host, port, username, password, database, ssl };
      }
    }
    return undefined;
  }

  // 3. Submit Research Form
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const query = queryInput.value.trim();
    if (!query) return;

    const dbConfig = getSelectedDbConfig();

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Agents Executing...</span>`;
    reportAction.style.display = "none";
    terminal.innerHTML = "";
    updateProgress(5, "Submitting task to BullMQ queue...");

    try {
      const res = await fetch("/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          filePaths: uploadedFilePaths,
          dbConfig,
        }),
      });

      const data = await res.json();
      if (res.ok && data.jobId) {
        currentJobIdDisplay.textContent = `Job ID: ${data.jobId}`;
        logToTerminal(`Enqueued Job: ${data.jobId}`, "highlight");
        if (dbConfig) {
          logToTerminal(`Custom DB configured (${dbConfig.url ? "Cloud Connection String" : "PostgreSQL Host: " + dbConfig.host})`, "highlight");
        }
        startSSEStream(data.jobId);
      } else {
        logToTerminal(`Job submission error: ${data.error}`, "error");
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>🚀 Launch Research Agent</span>`;
      }
    } catch (err) {
      logToTerminal(`Network error: ${err.message}`, "error");
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>🚀 Launch Research Agent</span>`;
    }
  });

  // 4. SSE Stream Connection
  function startSSEStream(jobId) {
    if (eventSource) {
      eventSource.close();
    }

    eventSource = new EventSource(`/research/${jobId}/stream`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        updateUIFromEvent(data);
      } catch (e) {
        console.error("SSE parse error:", e);
      }
    };

    eventSource.onerror = (err) => {
      console.warn("SSE connection error:", err);
    };
  }

  function updateUIFromEvent(data) {
    const { status, progress, message, reportUrl, error } = data;

    updateProgress(progress, message);
    updateStepper(status);

    if (message) {
      const type = status === "completed" ? "success" : status === "failed" ? "error" : "normal";
      logToTerminal(message, type);
    }

    if (status === "completed") {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>🚀 Launch Research Agent</span>`;
      if (reportUrl) {
        downloadReportBtn.href = reportUrl;
        reportAction.style.display = "block";
      }
      if (eventSource) eventSource.close();
    } else if (status === "failed") {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>🚀 Launch Research Agent</span>`;
      logToTerminal(`Execution Error: ${error || "Job failed"}`, "error");
      if (eventSource) eventSource.close();
    }
  }

  function updateProgress(percent, text) {
    const val = Math.min(100, Math.max(0, percent));
    progressBarFill.style.width = `${val}%`;
    progressPercent.textContent = `${val}%`;
  }

  function updateStepper(status) {
    const steps = ["indexing_documents", "running_planner", "retrieving_data", "analyzing", "generating_report", "completed"];
    const currIndex = steps.indexOf(status);

    steps.forEach((stepName, idx) => {
      const el = document.getElementById(`step-${stepName}`);
      if (!el) return;

      el.classList.remove("active", "completed");
      if (idx < currIndex || status === "completed") {
        el.classList.add("completed");
      } else if (idx === currIndex) {
        el.classList.add("active");
      }
    });
  }

  function logToTerminal(msg, type = "normal") {
    const time = new Date().toLocaleTimeString();
    const entry = document.createElement("div");
    entry.className = "log-entry";
    entry.innerHTML = `<span class="log-time">[${time}]</span><span class="log-msg ${type}">${msg}</span>`;
    terminal.appendChild(entry);
    terminal.scrollTop = terminal.scrollHeight;
  }
});
