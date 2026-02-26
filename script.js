const DATA_KEY = "tu_travel_data";

let submissions = loadSubmissions();
let currentStep = 1;
let editID = null;

function byId(id) {
  return document.getElementById(id);
}

function loadSubmissions() {
  try {
    const parsed = JSON.parse(localStorage.getItem(DATA_KEY));
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map((item) => ({
      id: item.id,
      name: item.name || "",
      address: item.address || item.studentAddress || "",
      tuid: item.tuid || item.tID || item.studentID || "",
      email: item.email || item.studentEmail || "",
      department: item.department || item.homeDept || "",
      trip: item.trip || item.tripName || "",
      destination: item.destination || item.dest || "",
      purpose: item.purpose || "",
      startDate: item.startDate || "",
      endDate: item.endDate || "",
      intl: item.intl || "No",
      expenses: {
        reg: Number(item.expenses?.reg ?? item.expReg ?? 0),
        lodging: Number(item.expenses?.lodging ?? item.expLodging ?? 0),
        air: Number(item.expenses?.air ?? item.expAir ?? 0),
        transit: Number(item.expenses?.transit ?? item.expTransit ?? 0),
        meals: Number(item.expenses?.meals ?? item.expMeals ?? 0),
        parking: Number(item.expenses?.parking ?? item.expParking ?? 0),
        mileage: Number(item.expenses?.mileage ?? item.mileage ?? 0)
      },
      total: Number(item.total || 0),
      sponsor: item.sponsor || item.facultySponsor || "",
      funding: item.funding || "No",
      fundingAmount: Number(item.fundingAmount || 0),
      docs: Array.isArray(item.docs)
        ? item.docs
        : item.doc
          ? [item.doc]
          : item.documentName
            ? [item.documentName]
            : [],
      status: item.status || "Under Review"
    }));
  } catch (_error) {
    return [];
  }
}

function persistSubmissions() {
  localStorage.setItem(DATA_KEY, JSON.stringify(submissions));
}

function getCheckedValue(name) {
  const checked = document.querySelector(`input[name="${name}"]:checked`);
  return checked ? checked.value : "";
}

function setCheckedValue(name, value) {
  const radios = document.querySelectorAll(`input[name="${name}"]`);
  radios.forEach((radio) => {
    radio.checked = radio.value === value;
  });
}

function login() {
  const user = byId("username").value.trim().toLowerCase();
  const pass = byId("password").value;
  const error = byId("loginError");

  if (user === "student" && pass === "password") {
    error.classList.add("hidden");
    byId("loginSection").classList.add("hidden");
    byId("screeningModal").classList.remove("hidden");
    byId("screeningModal").classList.add("flex");
    return;
  }

  if (user === "admin" && pass === "password") {
    error.classList.add("hidden");
    showView("adminPortal");
    renderAdminTable();
    return;
  }

  error.classList.remove("hidden");
}

function proceedToDashboard() {
  byId("screeningModal").classList.add("hidden");
  byId("screeningModal").classList.remove("flex");
  showView("studentDashboard");
  showStudentHome();
}

function showView(id) {
  ["loginSection", "studentDashboard", "adminPortal"].forEach((viewId) => {
    byId(viewId).classList.add("hidden");
  });

  byId(id).classList.remove("hidden");
  byId("logoutBtn").classList.toggle("hidden", id === "loginSection");
}

function showStudentHome() {
  byId("requestFormSection").classList.add("hidden");
  byId("studentHome").classList.remove("hidden");
  renderStudentRequests();
}

function startNewRequest() {
  editID = null;
  currentStep = 1;
  byId("requestForm").reset();
  setCheckedValue("intl", "No");
  setCheckedValue("funding", "No");
  toggleIntlNote(false);
  toggleFunding(false);
  byId("mileageCost").innerText = "$0.00";
  byId("displayTotal").innerText = "0.00";
  byId("cost").value = "0";

  byId("studentHome").classList.add("hidden");
  byId("requestFormSection").classList.remove("hidden");
  updateStepUI();
}

function cancelForm() {
  showStudentHome();
}

function toggleIntlNote(show) {
  byId("intlNote").classList.toggle("hidden", !show);
}

function toggleFunding(show) {
  byId("fundingSection").classList.toggle("hidden", !show);
}

function calculateTotal() {
  const reg = Number(byId("expReg").value || 0);
  const lodging = Number(byId("expLodging").value || 0);
  const air = Number(byId("expAir").value || 0);
  const transit = Number(byId("expTransit").value || 0);
  const meals = Number(byId("expMeals").value || 0);
  const parking = Number(byId("expParking").value || 0);
  const miles = Number(byId("mileage").value || 0);

  const mileageCost = miles * 0.7;
  byId("mileageCost").innerText = `$${mileageCost.toFixed(2)}`;

  const total = reg + lodging + air + transit + meals + parking + mileageCost;
  byId("displayTotal").innerText = total.toFixed(2);
  byId("cost").value = total.toFixed(2);
}

function validateStep() {
  const section = byId(`step${currentStep}`);
  const required = section.querySelectorAll("input[required], textarea[required], select[required]");
  let valid = true;

  required.forEach((field) => {
    let hasValue = false;

    if (field.type === "checkbox") {
      hasValue = field.checked;
    } else {
      hasValue = field.value.trim() !== "";
    }

    if (!hasValue) {
      field.classList.add("input-error");
      valid = false;
    } else {
      field.classList.remove("input-error");
    }
  });

  if (currentStep === 2) {
    const start = byId("startDate").value;
    const end = byId("endDate").value;
    if (start && end && end < start) {
      byId("startDate").classList.add("input-error");
      byId("endDate").classList.add("input-error");
      valid = false;
    }
  }

  if (!valid) {
    alert("Please complete required fields before continuing.");
  }

  return valid;
}

function changeStep(delta) {
  const next = currentStep + delta;
  if (next < 1 || next > 4) {
    return;
  }

  if (delta > 0 && !validateStep()) {
    return;
  }

  currentStep = next;
  updateStepUI();
}

function updateStudentProgress() {
  const fill = byId("studentProgressFill");
  if (!fill) {
    return;
  }
  const progress = 8 + Math.round(((currentStep - 1) / 3) * 92);
  fill.style.width = `${progress}%`;
}

function updateStepUI() {
  document.querySelectorAll(".step-content").forEach((section) => section.classList.add("hidden"));
  document.querySelectorAll(".step-tab").forEach((tab) => tab.classList.remove("step-active"));

  byId(`step${currentStep}`).classList.remove("hidden");
  byId(`stepTab${currentStep}`).classList.add("step-active");

  byId("backBtn").classList.toggle("hidden", currentStep === 1);
  byId("nextBtn").classList.toggle("hidden", currentStep === 4);
  byId("submitBtn").classList.toggle("hidden", currentStep !== 4);

  updateStudentProgress();
}

function captureFormData(status) {
  const selectedDocs = Array.from(byId("docUpload").files || []).map((file) => file.name);
  const existing = submissions.find((item) => item.id === editID);

  return {
    id: editID || Date.now(),
    name: byId("studentName").value.trim(),
    address: byId("studentAddress").value.trim(),
    tuid: byId("studentID").value.trim(),
    email: byId("studentEmail").value.trim(),
    department: byId("homeDept").value.trim(),
    trip: byId("tripName").value.trim(),
    destination: byId("destination").value.trim(),
    purpose: byId("purpose").value.trim(),
    startDate: byId("startDate").value,
    endDate: byId("endDate").value,
    intl: getCheckedValue("intl") || "No",
    expenses: {
      reg: Number(byId("expReg").value || 0),
      lodging: Number(byId("expLodging").value || 0),
      air: Number(byId("expAir").value || 0),
      transit: Number(byId("expTransit").value || 0),
      meals: Number(byId("expMeals").value || 0),
      parking: Number(byId("expParking").value || 0),
      mileage: Number(byId("mileage").value || 0)
    },
    total: Number(byId("cost").value || 0),
    sponsor: byId("facultySponsor").value.trim(),
    funding: getCheckedValue("funding") || "No",
    fundingAmount: Number(byId("fundingAmount").value || 0),
    docs: selectedDocs.length ? selectedDocs : existing?.docs || [],
    status
  };
}

function upsertSubmission(payload) {
  if (editID) {
    const idx = submissions.findIndex((item) => item.id === editID);
    if (idx >= 0) {
      submissions[idx] = payload;
    }
  } else {
    submissions.push(payload);
  }
  persistSubmissions();
}

function saveDraft() {
  const payload = captureFormData("Draft");
  upsertSubmission(payload);
  editID = null;
  showStudentHome();
}

function submitRequest() {
  const startStep = currentStep;
  for (let step = 1; step <= 4; step += 1) {
    currentStep = step;
    updateStepUI();
    if (!validateStep()) {
      return;
    }
  }

  currentStep = startStep;
  updateStepUI();

  const payload = captureFormData("Under Review");
  upsertSubmission(payload);
  editID = null;
  showStudentHome();
}

function editRequest(id) {
  const request = submissions.find((item) => item.id === id);
  if (!request) {
    return;
  }

  editID = id;
  currentStep = 1;

  byId("studentName").value = request.name || "";
  byId("studentAddress").value = request.address || "";
  byId("studentID").value = request.tuid || "";
  byId("studentEmail").value = request.email || "";
  byId("homeDept").value = request.department || "";

  byId("tripName").value = request.trip || "";
  byId("destination").value = request.destination || "";
  byId("purpose").value = request.purpose || "";
  byId("startDate").value = request.startDate || "";
  byId("endDate").value = request.endDate || "";

  setCheckedValue("intl", request.intl || "No");
  toggleIntlNote((request.intl || "No") === "Yes");

  byId("expReg").value = request.expenses?.reg || "";
  byId("expLodging").value = request.expenses?.lodging || "";
  byId("expAir").value = request.expenses?.air || "";
  byId("expTransit").value = request.expenses?.transit || "";
  byId("expMeals").value = request.expenses?.meals || "";
  byId("expParking").value = request.expenses?.parking || "";
  byId("mileage").value = request.expenses?.mileage || "";

  byId("facultySponsor").value = request.sponsor || "";
  setCheckedValue("funding", request.funding || "No");
  toggleFunding((request.funding || "No") === "Yes");
  byId("fundingAmount").value = request.fundingAmount || "";
  byId("confirm").checked = false;

  calculateTotal();
  byId("studentHome").classList.add("hidden");
  byId("requestFormSection").classList.remove("hidden");
  updateStepUI();
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatCurrency(value) {
  return Number(value || 0).toFixed(2);
}

function normalizeDocs(docs) {
  return Array.isArray(docs) ? docs : [];
}

function statusBadge(status) {
  const s = status || "Under Review";
  if (s === "Approved") {
    return "bg-green-100 text-green-800";
  }
  if (s === "Revision Needed") {
    return "bg-red-100 text-red-700";
  }
  if (s === "Draft") {
    return "bg-stone-200 text-stone-700";
  }
  return "bg-amber-100 text-amber-800";
}

function renderStudentRequests() {
  const tbody = byId("studentStatusTable");
  if (!submissions.length) {
    tbody.innerHTML = '<tr class="border-t"><td class="p-3 text-sm text-stone-500 italic" colspan="4">No requests yet.</td></tr>';
    return;
  }

  tbody.innerHTML = submissions
    .slice()
    .sort((a, b) => b.id - a.id)
    .map(
      (s) => `
    <tr class="border-t">
      <td class="p-3 font-bold">${escapeHTML(s.trip || "Untitled Trip")}</td>
      <td class="p-3">${escapeHTML(s.destination || "-")}</td>
      <td class="p-3"><span class="px-2 py-1 rounded-full text-xs ${statusBadge(s.status)}">${escapeHTML(s.status || "Under Review")}</span></td>
      <td class="p-3 text-right"><button onclick="editRequest(${s.id})" class="text-blue-600 underline">Edit</button></td>
    </tr>
  `
    )
    .join("");
}

function updateStatus(id, nextStatus) {
  const row = submissions.find((item) => item.id === id);
  if (!row) {
    return;
  }

  row.status = nextStatus;
  persistSubmissions();
  renderAdminTable();
  renderStudentRequests();
}

function openAdminDetails(id) {
  const row = submissions.find((item) => item.id === id);
  if (!row) {
    return;
  }

  const docs = normalizeDocs(row.docs);
  const expenses = row.expenses || {};
  const docItems = docs.length
    ? docs.map((name) => `<li class="text-sm text-stone-700">• ${escapeHTML(name)}</li>`).join("")
    : '<li class="text-sm text-stone-500 italic">No files uploaded</li>';

  byId("adminDetailTitle").textContent = `${row.trip || "Travel Request"} - Full Submission`;
  byId("adminDetailContent").innerHTML = `
    <div class="grid md:grid-cols-2 gap-4">
      <section class="rounded-xl border border-stone-200 p-4">
        <h4 class="font-black text-stone-800 mb-2">Student Information</h4>
        <div class="space-y-1 text-sm">
          <div><span class="font-semibold text-stone-600">Name:</span> ${escapeHTML(row.name || "-")}</div>
          <div><span class="font-semibold text-stone-600">TUID:</span> ${escapeHTML(row.tuid || "-")}</div>
          <div><span class="font-semibold text-stone-600">Email:</span> ${escapeHTML(row.email || "-")}</div>
          <div><span class="font-semibold text-stone-600">Department:</span> ${escapeHTML(row.department || "-")}</div>
          <div><span class="font-semibold text-stone-600">Address:</span> ${escapeHTML(row.address || "-")}</div>
        </div>
      </section>

      <section class="rounded-xl border border-stone-200 p-4">
        <h4 class="font-black text-stone-800 mb-2">Trip Information</h4>
        <div class="space-y-1 text-sm">
          <div><span class="font-semibold text-stone-600">Trip / Event:</span> ${escapeHTML(row.trip || "-")}</div>
          <div><span class="font-semibold text-stone-600">Destination:</span> ${escapeHTML(row.destination || "-")}</div>
          <div><span class="font-semibold text-stone-600">Purpose:</span> ${escapeHTML(row.purpose || "-")}</div>
          <div><span class="font-semibold text-stone-600">Departure:</span> ${escapeHTML(row.startDate || "-")}</div>
          <div><span class="font-semibold text-stone-600">Return:</span> ${escapeHTML(row.endDate || "-")}</div>
          <div><span class="font-semibold text-stone-600">International:</span> ${escapeHTML(row.intl || "No")}</div>
        </div>
      </section>

      <section class="rounded-xl border border-stone-200 p-4 md:col-span-2">
        <h4 class="font-black text-stone-800 mb-3">Expense Breakdown</h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div class="rounded-lg bg-stone-50 p-2"><span class="text-stone-500">Registration</span><div class="font-semibold">$${formatCurrency(expenses.reg)}</div></div>
          <div class="rounded-lg bg-stone-50 p-2"><span class="text-stone-500">Lodging</span><div class="font-semibold">$${formatCurrency(expenses.lodging)}</div></div>
          <div class="rounded-lg bg-stone-50 p-2"><span class="text-stone-500">Airfare</span><div class="font-semibold">$${formatCurrency(expenses.air)}</div></div>
          <div class="rounded-lg bg-stone-50 p-2"><span class="text-stone-500">Transit</span><div class="font-semibold">$${formatCurrency(expenses.transit)}</div></div>
          <div class="rounded-lg bg-stone-50 p-2"><span class="text-stone-500">Meals</span><div class="font-semibold">$${formatCurrency(expenses.meals)}</div></div>
          <div class="rounded-lg bg-stone-50 p-2"><span class="text-stone-500">Parking/Tolls</span><div class="font-semibold">$${formatCurrency(expenses.parking)}</div></div>
          <div class="rounded-lg bg-stone-50 p-2"><span class="text-stone-500">Mileage (miles)</span><div class="font-semibold">${escapeHTML(expenses.mileage ?? 0)}</div></div>
          <div class="rounded-lg bg-stone-100 p-2 border border-stone-300"><span class="text-stone-700 font-semibold">Estimated Total</span><div class="font-black text-stone-900">$${formatCurrency(row.total)}</div></div>
        </div>
      </section>

      <section class="rounded-xl border border-stone-200 p-4">
        <h4 class="font-black text-stone-800 mb-2">Funding & Sponsorship</h4>
        <div class="space-y-1 text-sm">
          <div><span class="font-semibold text-stone-600">Faculty Sponsor:</span> ${escapeHTML(row.sponsor || "-")}</div>
          <div><span class="font-semibold text-stone-600">GSA / OURCI Funding:</span> ${escapeHTML(row.funding || "No")}</div>
          <div><span class="font-semibold text-stone-600">Funding Amount:</span> $${formatCurrency(row.fundingAmount)}</div>
          <div><span class="font-semibold text-stone-600">Status:</span> ${escapeHTML(row.status || "Under Review")}</div>
        </div>
      </section>

      <section class="rounded-xl border border-stone-200 p-4">
        <h4 class="font-black text-stone-800 mb-2">Supporting Documents</h4>
        <ul class="space-y-1">
          ${docItems}
        </ul>
      </section>
    </div>
  `;

  byId("adminDetailModal").classList.remove("hidden");
  byId("adminDetailModal").classList.add("flex");
}

function closeAdminDetails() {
  byId("adminDetailModal").classList.add("hidden");
  byId("adminDetailModal").classList.remove("flex");
}

function renderAdminTable() {
  const tbody = byId("adminTableBody");
  if (!submissions.length) {
    tbody.innerHTML = '<tr class="border-t"><td class="p-3 text-sm text-stone-500 italic" colspan="5">No submissions yet.</td></tr>';
    return;
  }

  tbody.innerHTML = submissions
    .slice()
    .sort((a, b) => b.id - a.id)
    .map(
      (s) => `
    <tr class="border-t">
      <td class="p-3"><strong>${escapeHTML(s.name || "-")}</strong><br><span class="text-xs">${escapeHTML(s.tuid || "-")}</span></td>
      <td class="p-3"><strong>${escapeHTML(s.trip || "-")}</strong><br><span class="text-xs">Sponsor: ${escapeHTML(s.sponsor || "-")}</span></td>
      <td class="p-3 font-bold text-amber-600">$${formatCurrency(s.total)}</td>
      <td class="p-3"><span class="px-2 py-1 rounded-full text-xs ${statusBadge(s.status)}">${escapeHTML(s.status || "Under Review")}</span></td>
      <td class="p-3 text-right space-x-2">
        <button onclick="openAdminDetails(${s.id})" class="text-blue-700 font-bold text-xs uppercase">View All</button>
        <button onclick="updateStatus(${s.id}, 'Approved')" class="text-green-700 font-bold text-xs uppercase">Approve</button>
        <button onclick="updateStatus(${s.id}, 'Revision Needed')" class="text-red-700 font-bold text-xs uppercase">Revise</button>
      </td>
    </tr>
  `
    )
    .join("");
}

function logout() {
  location.reload();
}

window.addEventListener("DOMContentLoaded", () => {
  updateStepUI();
  renderStudentRequests();
  renderAdminTable();
});
