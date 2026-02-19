const DATA_KEY = "tu_travel_data";
const LOG_KEY = "tu_travel_logs";
const STRATUS_LINK = "https://stratus.towson.edu";

let submissions = loadData();
let notificationLog = loadLogs();
let currentStep = 1;
let editID = null;
let currentRole = null;

function loadData() {
  try {
    return JSON.parse(localStorage.getItem(DATA_KEY)) || [];
  } catch (_error) {
    return [];
  }
}

function loadLogs() {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY)) || [];
  } catch (_error) {
    return [];
  }
}

function saveData() {
  localStorage.setItem(DATA_KEY, JSON.stringify(submissions));
}

function saveLogs() {
  localStorage.setItem(LOG_KEY, JSON.stringify(notificationLog));
}

function escapeHTML(value) {
  const text = String(value ?? "");
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function login() {
  const username = document.getElementById("username").value.trim().toLowerCase();
  const password = document.getElementById("password").value;
  const loginError = document.getElementById("loginError");

  if (username === "student" && password === "password") {
    currentRole = "student";
    loginError.classList.add("hidden");
    showScreeningModal(true);
    return;
  }

  if (username === "admin" && password === "password") {
    currentRole = "admin";
    loginError.classList.add("hidden");
    showView("adminPortal");
    renderAdminTable();
    return;
  }

  loginError.classList.remove("hidden");
}

function showScreeningModal(show) {
  const modal = document.getElementById("screeningModal");
  if (show) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.getElementById("loginSection").classList.add("hidden");
  } else {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
}

function redirectToStratus() {
  window.location.href = STRATUS_LINK;
}

function proceedToDashboard() {
  showScreeningModal(false);
  showView("studentDashboard");
  showStudentHome();
}

function logout() {
  currentRole = null;
  currentStep = 1;
  editID = null;
  showScreeningModal(false);
  clearLoginInputs();
  showView("loginSection");
}

function clearLoginInputs() {
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
}

function showView(viewID) {
  ["loginSection", "studentDashboard", "adminPortal"].forEach((id) => {
    const section = document.getElementById(id);
    section.classList.add("hidden");
  });
  document.getElementById(viewID).classList.remove("hidden");

  document.getElementById("logoutBtn").classList.toggle("hidden", viewID === "loginSection");
}

function showStudentHome() {
  document.getElementById("studentHome").classList.remove("hidden");
  document.getElementById("requestFormSection").classList.add("hidden");
  renderStudentRequests();
  renderNotifications();
}

function cancelForm() {
  if (!confirm("Discard current unsaved changes and return to dashboard?")) {
    return;
  }
  showStudentHome();
}

function startNewRequest() {
  editID = null;
  currentStep = 1;
  document.getElementById("requestForm").reset();
  document.getElementById("displayTotal").innerText = "0.00";
  document.getElementById("cost").value = "0";

  document.getElementById("studentHome").classList.add("hidden");
  document.getElementById("requestFormSection").classList.remove("hidden");
  updateStepUI();
}

function calculateTotal() {
  const reg = Number(document.getElementById("expReg").value || 0);
  const air = Number(document.getElementById("expAir").value || 0);
  const lod = Number(document.getElementById("expLodging").value || 0);
  const mel = Number(document.getElementById("expMeals").value || 0);
  const total = reg + air + lod + mel;

  document.getElementById("displayTotal").innerText = total.toFixed(2);
  document.getElementById("cost").value = total.toFixed(2);
}

function changeStep(delta) {
  if (delta > 0 && !validateCurrentStep()) {
    return;
  }

  const nextStep = currentStep + delta;
  if (nextStep < 1 || nextStep > 4) {
    return;
  }

  currentStep = nextStep;
  updateStepUI();
}

function validateCurrentStep() {
  const section = document.getElementById(`step${currentStep}`);
  const requiredInputs = section.querySelectorAll("input[required], textarea[required]");
  let valid = true;

  requiredInputs.forEach((input) => {
    const isCheckbox = input.type === "checkbox";
    const hasValue = isCheckbox ? input.checked : input.value.trim() !== "";

    if (!hasValue) {
      input.classList.add("input-error");
      valid = false;
    } else {
      input.classList.remove("input-error");
    }
  });

  if (valid && currentStep === 2) {
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    if (startDate && endDate && endDate < startDate) {
      valid = false;
      document.getElementById("startDate").classList.add("input-error");
      document.getElementById("endDate").classList.add("input-error");
      alert("End date must be on or after the start date.");
    }
  }

  if (!valid) {
    alert("Please complete required fields before continuing.");
  }

  return valid;
}

function updateStepUI() {
  document.querySelectorAll(".step-content").forEach((item) => item.classList.add("hidden"));
  document.querySelectorAll(".step-tab").forEach((item) => item.classList.remove("step-active"));

  document.getElementById(`step${currentStep}`).classList.remove("hidden");
  document.getElementById(`stepTab${currentStep}`).classList.add("step-active");

  document.getElementById("backBtn").classList.toggle("hidden", currentStep === 1);
  document.getElementById("nextBtn").classList.toggle("hidden", currentStep === 4);
  document.getElementById("submitBtn").classList.toggle("hidden", currentStep !== 4);
}

function collectFormData() {
  return {
    name: document.getElementById("studentName").value.trim(),
    email: document.getElementById("studentEmail").value.trim(),
    tID: document.getElementById("studentID").value.trim(),
    trip: document.getElementById("tripName").value.trim(),
    destination: document.getElementById("destination").value.trim(),
    purpose: document.getElementById("purpose").value.trim(),
    startDate: document.getElementById("startDate").value,
    endDate: document.getElementById("endDate").value,
    expenses: {
      registrationFee: Number(document.getElementById("expReg").value || 0),
      airfare: Number(document.getElementById("expAir").value || 0),
      lodging: Number(document.getElementById("expLodging").value || 0),
      meals: Number(document.getElementById("expMeals").value || 0)
    },
    total: Number(document.getElementById("cost").value || 0),
    documentName: document.getElementById("docUpload").files[0]?.name || "No file uploaded",
    comment: ""
  };
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read selected file."));
    reader.readAsDataURL(file);
  });
}

async function attachDocumentData(payload, existingRequest = null) {
  const fileInput = document.getElementById("docUpload");
  const file = fileInput.files?.[0];

  if (file) {
    const dataURL = await readFileAsDataURL(file);
    payload.documentName = file.name;
    payload.documentType = file.type || "application/octet-stream";
    payload.documentDataURL = dataURL;
    return payload;
  }

  if (existingRequest?.documentDataURL) {
    payload.documentName = existingRequest.documentName || "Uploaded document";
    payload.documentType = existingRequest.documentType || "application/octet-stream";
    payload.documentDataURL = existingRequest.documentDataURL;
  }

  return payload;
}

function addNotification(message) {
  const now = new Date();
  notificationLog.push({
    id: now.getTime(),
    time: now.toLocaleString(),
    message
  });
  saveLogs();
}

async function saveDraft() {
  try {
    const payload = collectFormData();
    payload.status = "Draft";

    if (editID) {
      const idx = submissions.findIndex((item) => item.id === editID);
      if (idx >= 0) {
        await attachDocumentData(payload, submissions[idx]);
        submissions[idx] = { ...submissions[idx], ...payload, id: editID };
      }
    } else {
      await attachDocumentData(payload);
      payload.id = Date.now();
      submissions.push(payload);
      editID = payload.id;
    }

    saveData();
    addNotification(`Draft saved for ${payload.trip || "Untitled Trip"}.`);
    showStudentHome();
  } catch (_error) {
    alert("Could not save the selected file. Please try again.");
  }
}

async function submitRequest() {
  const originalStep = currentStep;
  for (let step = 1; step <= 4; step += 1) {
    currentStep = step;
    updateStepUI();
    if (!validateCurrentStep()) {
      return;
    }
  }

  currentStep = originalStep;
  updateStepUI();

  try {
    const payload = collectFormData();
    payload.status = "Under Review";

    if (editID) {
      const idx = submissions.findIndex((item) => item.id === editID);
      if (idx >= 0) {
        await attachDocumentData(payload, submissions[idx]);
        payload.comment = submissions[idx].comment || "";
        submissions[idx] = { ...submissions[idx], ...payload, id: editID };
      }
    } else {
      await attachDocumentData(payload);
      payload.id = Date.now();
      submissions.push(payload);
    }

    saveData();
    addNotification(`Request submitted: ${payload.trip}.`);
    editID = null;
    showStudentHome();
  } catch (_error) {
    alert("Could not submit because the file could not be processed. Please try again.");
  }
}

function editRequest(id) {
  const request = submissions.find((item) => item.id === id);
  if (!request) {
    return;
  }

  editID = id;
  currentStep = 1;

  document.getElementById("studentName").value = request.name || "";
  document.getElementById("studentEmail").value = request.email || "";
  document.getElementById("studentID").value = request.tID || "";
  document.getElementById("tripName").value = request.trip || "";
  document.getElementById("destination").value = request.destination || "";
  document.getElementById("purpose").value = request.purpose || "";
  document.getElementById("startDate").value = request.startDate || "";
  document.getElementById("endDate").value = request.endDate || "";
  document.getElementById("expReg").value = request.expenses?.registrationFee ?? "";
  document.getElementById("expAir").value = request.expenses?.airfare ?? "";
  document.getElementById("expLodging").value = request.expenses?.lodging ?? "";
  document.getElementById("expMeals").value = request.expenses?.meals ?? "";
  document.getElementById("cost").value = Number(request.total || 0).toFixed(2);
  document.getElementById("displayTotal").innerText = Number(request.total || 0).toFixed(2);
  document.getElementById("docUpload").value = "";
  document.getElementById("confirm").checked = false;

  document.getElementById("studentHome").classList.add("hidden");
  document.getElementById("requestFormSection").classList.remove("hidden");
  updateStepUI();
}

function renderStudentRequests() {
  const searchTerm = document.getElementById("studentSearch").value.trim().toLowerCase();
  const tableBody = document.getElementById("studentStatusTable");
  const alerts = document.getElementById("statusAlerts");

  const filtered = submissions.filter((request) => {
    const trip = (request.trip || "").toLowerCase();
    const destination = (request.destination || "").toLowerCase();
    const purpose = (request.purpose || "").toLowerCase();
    return trip.includes(searchTerm) || destination.includes(searchTerm) || purpose.includes(searchTerm);
  });

  alerts.innerHTML = "";
  tableBody.innerHTML = "";

  const revisionItems = filtered.filter((item) => item.status === "Revision Needed");
  revisionItems.forEach((item) => {
    alerts.innerHTML += `<div class="alert-badge"><strong>Revision Needed:</strong> ${escapeHTML(item.trip)}${item.comment ? ` | Note: ${escapeHTML(item.comment)}` : ""}</div>`;
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = '<tr><td class="p-4 text-stone-500 italic" colspan="5">No requests found.</td></tr>';
    return;
  }

  filtered
    .sort((a, b) => b.id - a.id)
    .forEach((item) => {
      const statusClass = `status-${item.status.toLowerCase().replaceAll(" ", "-")}`;
      const row = document.createElement("tr");
      row.className = "border-t";
      row.innerHTML = `
        <td class="p-3 font-semibold">${escapeHTML(item.trip || "Untitled")}</td>
        <td class="p-3">${escapeHTML(item.destination || "-")}</td>
        <td class="p-3 text-sm text-stone-600">${escapeHTML(item.startDate || "-")} to ${escapeHTML(item.endDate || "-")}</td>
        <td class="p-3"><span class="status-pill ${statusClass}">${escapeHTML(item.status)}</span></td>
        <td class="p-3 text-right">
          <button class="text-sm text-blue-700 font-semibold hover:underline" onclick="editRequest(${item.id})">Edit</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
}

function renderNotifications() {
  const container = document.getElementById("notificationLog");
  container.innerHTML = "";

  if (notificationLog.length === 0) {
    container.innerHTML = '<div class="note-item text-stone-500 italic">No notifications yet.</div>';
    return;
  }

  notificationLog
    .slice()
    .reverse()
    .forEach((entry) => {
      container.innerHTML += `<div class="note-item"><div class="text-xs text-stone-500">${escapeHTML(entry.time)}</div><div>${escapeHTML(entry.message)}</div></div>`;
    });
}

function renderAdminTable() {
  const searchTerm = document.getElementById("adminSearch").value.trim().toLowerCase();
  const tbody = document.getElementById("adminTableBody");

  const filtered = submissions.filter((item) => {
    if (item.status === "Draft") {
      return false;
    }
    const blob = `${item.name} ${item.email} ${item.tID} ${item.trip} ${item.destination} ${item.purpose}`.toLowerCase();
    return blob.includes(searchTerm);
  });

  tbody.innerHTML = "";

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td class="p-4 text-stone-500 italic" colspan="8">No submissions match your search.</td></tr>';
    return;
  }

  filtered
    .sort((a, b) => b.id - a.id)
    .forEach((item) => {
      const statusClass = `status-${item.status.toLowerCase().replaceAll(" ", "-")}`;
      const row = document.createElement("tr");
      row.className = "border-t";
      row.innerHTML = `
        <td class="p-3">
          <div class="font-semibold">${escapeHTML(item.name)}</div>
          <div class="text-xs text-stone-500">${escapeHTML(item.email)}</div>
          <div class="text-xs text-stone-500">${escapeHTML(item.tID)}</div>
        </td>
        <td class="p-3">
          <div class="font-semibold">${escapeHTML(item.trip)}</div>
          <div class="text-xs text-stone-500">${escapeHTML(item.destination)}</div>
        </td>
        <td class="p-3 text-sm text-stone-700 max-w-[280px]">
          <div class="line-clamp-4">${escapeHTML(item.purpose || "No reason provided")}</div>
        </td>
        <td class="p-3 text-sm text-stone-600">${escapeHTML(item.startDate)} to ${escapeHTML(item.endDate)}</td>
        <td class="p-3 font-semibold">$${Number(item.total || 0).toFixed(2)}</td>
        <td class="p-3 text-sm">
          <div>${escapeHTML(item.documentName || "No file uploaded")}</div>
          <button onclick="openFileViewer(${item.id})" class="mt-1 text-xs text-blue-700 hover:underline ${item.documentDataURL ? "" : "opacity-40 cursor-not-allowed"}" ${item.documentDataURL ? "" : "disabled"}>View File</button>
        </td>
        <td class="p-3"><span class="status-pill ${statusClass}">${escapeHTML(item.status)}</span></td>
        <td class="p-3 text-right space-x-2">
          <button onclick="updateStatus(${item.id}, 'Approved')" class="text-xs font-semibold text-green-700 hover:underline">Approve</button>
          <button onclick="updateStatus(${item.id}, 'Revision Needed')" class="text-xs font-semibold text-red-700 hover:underline">Request Revision</button>
        </td>
      `;
      tbody.appendChild(row);
    });
}

function openFileViewer(id) {
  const request = submissions.find((item) => item.id === id);
  if (!request || !request.documentDataURL) {
    alert("No uploaded file found for this request.");
    return;
  }

  const modal = document.getElementById("fileViewerModal");
  const body = document.getElementById("fileViewerBody");
  const title = document.getElementById("fileViewerTitle");
  const mimeType = request.documentType || "";

  title.innerText = `Submitted File: ${request.documentName || "Document"}`;

  if (mimeType.startsWith("image/")) {
    body.innerHTML = `<img src="${request.documentDataURL}" alt="${escapeHTML(request.documentName || "Submitted file")}" class="max-w-full h-auto rounded border">`;
  } else if (mimeType === "application/pdf") {
    body.innerHTML = `<iframe src="${request.documentDataURL}" title="PDF Preview" class="w-full h-[65vh] border rounded"></iframe>`;
  } else {
    body.innerHTML = `
      <p class="text-sm text-stone-700 mb-3">Preview is not available for this file type.</p>
      <a class="text-blue-700 underline" href="${request.documentDataURL}" download="${escapeHTML(request.documentName || "submitted-file")}">Download file</a>
    `;
  }

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeFileViewer() {
  const modal = document.getElementById("fileViewerModal");
  const body = document.getElementById("fileViewerBody");
  body.innerHTML = "";
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

function updateStatus(id, nextStatus) {
  const request = submissions.find((item) => item.id === id);
  if (!request) {
    return;
  }

  if (nextStatus === "Revision Needed") {
    const feedback = prompt("Enter revision comments for the student:", request.comment || "");
    if (feedback === null) {
      return;
    }
    request.comment = feedback.trim();
  } else {
    request.comment = "";
  }

  request.status = nextStatus;
  saveData();
  addNotification(`Admin updated ${request.trip} to ${nextStatus}.`);
  renderAdminTable();
}

function clearAllData() {
  if (!confirm("This will permanently clear all local portal data on this browser. Continue?")) {
    return;
  }

  localStorage.removeItem(DATA_KEY);
  localStorage.removeItem(LOG_KEY);
  submissions = [];
  notificationLog = [];

  if (currentRole === "admin") {
    renderAdminTable();
  }
  if (currentRole === "student") {
    renderStudentRequests();
    renderNotifications();
  }

  alert("All local data has been cleared.");
}

window.addEventListener("DOMContentLoaded", () => {
  showView("loginSection");
  updateStepUI();
});
