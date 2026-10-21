const activityData = {
  7: [7, 10, 8, 12, 13, 9, 8],
  14: [10, 14, 12, 17, 21, 15, 23, 18, 14, 21, 17, 26, 19, 21],
  30: [6, 7, 9, 8, 8, 10, 7, 6, 9, 8, 10, 7, 9, 8, 11, 7, 9, 10, 8, 9, 7, 11, 8, 10, 9, 8, 7, 11, 9, 8]
};
const monthLabels = ["Sep 08", "Sep 10", "Sep 12", "Sep 14", "Sep 16", "Sep 18", "Sep 20", "Sep 22", "Sep 24", "Sep 26", "Sep 28", "Sep 30", "Oct 02", "Oct 04", "Oct 06"];
const achieverData = [
  { initials: "SM", name: "Sarah Mansour", team: "Cairo team", area: "Cardiology", achievement: 128 },
  { initials: "YK", name: "Youssef Khalil", team: "Alexandria team", area: "Diabetes care", achievement: 116 },
  { initials: "NF", name: "Nour Farouk", team: "Delta team", area: "Neurology", achievement: 109 }
];
const areaData = [
  { key: "cardio", name: "Cardiology", visits: 96, color: "#43ae97" },
  { key: "diabetes", name: "Diabetes care", visits: 82, color: "#76aaa5" },
  { key: "neuro", name: "Neurology", visits: 70, color: "#9a8bca" }
];
const regionData = [
  { key: "cairo", name: "Greater Cairo", detail: "Cairo · Giza · Qalyubia", visits: 82 },
  { key: "alex", name: "Alexandria & North Coast", detail: "Alexandria · Beheira · Matrouh", visits: 46 },
  { key: "delta", name: "Nile Delta", detail: "Dakahlia · Gharbia · Sharqia", visits: 42 },
  { key: "canal", name: "Canal & Suez", detail: "Ismailia · Suez · Port Said", visits: 29 },
  { key: "upper", name: "Upper Egypt", detail: "Minya · Assiut · Sohag · Aswan", visits: 31 },
  { key: "redsea", name: "Red Sea", detail: "Red Sea governorate", visits: 18 }
];
const visitModal = document.getElementById("visitModal");
const toast = document.getElementById("toast");
let toastTimer;
let selectedChartRange = 14;
let selectedHeatRegion = null;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2800);
}

function drawChart(range = selectedChartRange, modifier = 1) {
  const values = activityData[range].map(value => Math.round(value * modifier));
  const svg = document.getElementById("activityChart");
  const width = 700;
  const height = 188;
  const maxValue = 40;
  const step = width / values.length;
  const barWidth = Math.min(22, step * 0.48);
  const bars = values.map((value, index) => {
    const barHeight = (value / maxValue) * height;
    const x = (index * step) + ((step - barWidth) / 2);
    const y = height - barHeight;
    const label = range === 7 ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index] :
      range === 14 ? monthLabels[index] : `Day ${index + 1}`;
    return `<rect class="chart-bar" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${barHeight.toFixed(1)}" rx="3"><title>${label}: ${value} visits</title></rect>`;
  }).join("");
  const targetY = height - (12 / maxValue) * height;
  svg.innerHTML = `<line class="chart-target" x1="0" y1="${targetY}" x2="${width}" y2="${targetY}"/>${bars}`;
  const labelIndices = range === 7 ? values.map((_, i) => i) : [0, 3, 6, 9, 12, values.length - 1];
  document.getElementById("chartLabels").innerHTML = labelIndices.map(i => {
    const label = range === 7 ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i] :
      range === 14 ? monthLabels[i] : `Day ${i + 1}`;
    return `<span>${label}</span>`;
  }).join("");
  const total = values.reduce((sum, value) => sum + value, 0);
  document.getElementById("chartTotal").textContent = total;
  document.querySelector(".chart-summary > span").textContent = `visits in ${range} days`;
  document.getElementById("dailyAverage").textContent = (total / range).toFixed(1);
}

function getFilterModifier() {
  const area = document.getElementById("areaFilter").value;
  const team = document.getElementById("teamFilter").value;
  const businessUnit = document.getElementById("businessUnitFilter").value;
  const businessLine = document.getElementById("businessLineFilter").value;
  return (area === "all" ? 1 : 0.74) *
    (team === "all" ? 1 : 0.61) *
    (businessUnit === "all" ? 1 : 0.68) *
    (businessLine === "all" ? 1 : 0.72);
}

function updateLeaderboards(modifier) {
  const team = document.getElementById("teamFilter").value;
  const selectedArea = document.getElementById("areaFilter").value;
  const selectedBusinessLine = document.getElementById("businessLineFilter").value;
  const periodFactor = { week: 0.55, month: 1, quarter: 1.18 }[document.getElementById("dateFilter").value];
  const areaForLine = { prescription: "all", devices: "all", consumer: "all" }[selectedBusinessLine] || "all";
  const areaSelection = selectedArea !== "all" ? selectedArea : areaForLine;
  const achievers = achieverData.filter(rep => team === "all" ||
    (team === "cairo" && rep.team === "Cairo team") ||
    (team === "alex" && rep.team === "Alexandria team") ||
    (team === "delta" && rep.team === "Delta team"));
  const achieverRows = document.getElementById("achieverRows");
  achieverRows.innerHTML = achievers.length ? achievers.map((rep, index) => {
    const achievement = Math.round(rep.achievement * periodFactor * Math.sqrt(modifier));
    const visits = Math.round(achievement * 0.22);
    return `<div class="leaderboard-row"><span class="leader-rank">${index + 1}</span><span class="leader-name">${rep.name}<small>${rep.team} · ${rep.area}</small></span><span class="leader-result">${achievement}%<small>${visits} visits</small></span></div>`;
  }).join("") : '<div class="leader-empty">No representatives match the current filters.</div>';

  const selectedAreas = areaSelection === "all" ? areaData : areaData.filter(area => area.key === areaSelection);
  const areaRows = document.getElementById("areaRows");
  areaRows.innerHTML = selectedAreas.map(area => {
    const visits = Math.round(area.visits * periodFactor * modifier);
    return `<div class="leaderboard-row"><span class="leader-rank" style="color:${area.color}">◎</span><span class="leader-name">${area.name}<small>Completed visits in selected period</small></span><span class="leader-result">${visits}<small>visits</small></span></div>`;
  }).join("");
}

function updateRegionHeatmap(modifier) {
  const period = document.getElementById("dateFilter").value;
  const periodFactor = { week: 67 / 248, month: 1, quarter: 702 / 248 }[period];
  const team = document.getElementById("teamFilter").value;
  const teamShares = {
    all: { cairo: 1, alex: 1, delta: 1, canal: 1, upper: 1, redsea: 1 },
    cairo: { cairo: 1.8, alex: 0.35, delta: 0.5, canal: 0.55, upper: 0.3, redsea: 0.4 },
    alex: { cairo: 0.4, alex: 1.8, delta: 0.45, canal: 0.3, upper: 0.25, redsea: 0.2 },
    delta: { cairo: 0.45, alex: 0.55, delta: 1.8, canal: 0.3, upper: 0.7, redsea: 0.2 }
  }[team];
  const regions = regionData.map(region => ({
    ...region,
    total: Math.round(region.visits * modifier * periodFactor * teamShares[region.key])
  })).sort((a, b) => b.total - a.total);
  const maximum = Math.max(...regions.map(region => region.total), 1);
  const rows = document.getElementById("regionRows");
  rows.innerHTML = regions.map((region, index) => {
    const intensity = Math.max(12, Math.round((region.total / maximum) * 100));
    const selected = selectedHeatRegion === region.key;
    return `<button class="region-row${selected ? " selected" : ""}" type="button" data-region="${region.key}" aria-pressed="${selected}" style="--region-intensity:${intensity}%"><span class="region-rank">${String(index + 1).padStart(2, "0")}</span><span class="region-name">${region.name}<small>${region.detail}</small><i><u></u></i></span><span class="region-visits">${region.total}<small>visits</small></span></button>`;
  }).join("");
  document.querySelectorAll("[data-heat-region]").forEach(heat => {
    const region = regions.find(item => item.key === heat.dataset.heatRegion);
    const opacity = region ? 0.14 + (region.total / maximum) * 0.56 : 0.14;
    heat.style.fillOpacity = opacity.toFixed(2);
    heat.classList.toggle("selected", selectedHeatRegion === heat.dataset.heatRegion);
  });
  document.querySelectorAll(".map-city").forEach(city => {
    city.classList.toggle("selected", selectedHeatRegion === city.dataset.region);
    const region = regions.find(item => item.key === city.dataset.region);
    if (region) city.setAttribute("aria-label", `${region.name}: ${region.total} visits`);
  });
}

function updateFilters() {
  const period = document.getElementById("dateFilter").value;
  const team = document.getElementById("teamFilter").value;
  const modifier = getFilterModifier();
  const visits = Math.round(({ week: 67, month: 248, quarter: 702 })[period] * modifier);
  const opportunities = ({ week: 0.42, month: 1.42, quarter: 3.86 })[period] * modifier;
  const coverage = Math.max(42, Math.round(({ week: 39, month: 86, quarter: 94 })[period] * (team === "all" ? 1 : 0.9)));
  const samples = Math.round(({ week: 312, month: 1284, quarter: 3560 })[period] * modifier);
  document.querySelector('[data-metric="visits"]').textContent = visits.toLocaleString();
  document.querySelector('[data-metric="opportunities"]').textContent = `$${opportunities.toFixed(2)}M`;
  document.querySelector('[data-metric="coverage"]').textContent = `${coverage}%`;
  document.querySelector('[data-metric="samples"]').textContent = samples.toLocaleString();
  document.querySelectorAll(".segment").forEach(button => {
    button.classList.toggle("active", Number(button.dataset.range) === selectedChartRange);
  });
  drawChart(selectedChartRange, modifier);
  updateLeaderboards(modifier);
  updateRegionHeatmap(modifier);
}

document.querySelectorAll(".segment").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".segment").forEach(segment => segment.classList.remove("active"));
    button.classList.add("active");
    selectedChartRange = Number(button.dataset.range);
    const modifier = getFilterModifier();
    drawChart(selectedChartRange, modifier);
  });
});

document.getElementById("dateFilter").addEventListener("change", () => {
  selectedChartRange = ({ week: 7, month: 14, quarter: 30 })[document.getElementById("dateFilter").value];
  updateFilters();
});

["areaFilter", "teamFilter", "businessUnitFilter", "businessLineFilter"].forEach(id => {
  document.getElementById(id).addEventListener("change", updateFilters);
});

document.getElementById("regionRows").addEventListener("click", event => {
  const row = event.target.closest("[data-region]");
  if (!row) return;
  selectedHeatRegion = selectedHeatRegion === row.dataset.region ? null : row.dataset.region;
  updateRegionHeatmap(getFilterModifier());
});

document.querySelector(".egypt-map").addEventListener("click", event => {
  const city = event.target.closest(".map-city");
  if (!city) return;
  selectedHeatRegion = selectedHeatRegion === city.dataset.region ? null : city.dataset.region;
  updateRegionHeatmap(getFilterModifier());
});

document.querySelector(".egypt-map").addEventListener("keydown", event => {
  const city = event.target.closest(".map-city");
  if (!city || (event.key !== "Enter" && event.key !== " ")) return;
  event.preventDefault();
  selectedHeatRegion = selectedHeatRegion === city.dataset.region ? null : city.dataset.region;
  updateRegionHeatmap(getFilterModifier());
});

document.getElementById("resetFilters").addEventListener("click", () => {
  document.getElementById("dateFilter").value = "month";
  document.getElementById("businessUnitFilter").value = "all";
  document.getElementById("businessLineFilter").value = "all";
  document.getElementById("areaFilter").value = "all";
  document.getElementById("teamFilter").value = "all";
  selectedChartRange = 14;
  selectedHeatRegion = null;
  updateFilters();
  showToast("Filters reset to all representatives this month.");
});

document.getElementById("exportButton").addEventListener("click", () => {
  const rows = [
    ["Metric", "Value"],
    ["Completed visits", document.querySelector('[data-metric="visits"]').textContent],
    ["Open opportunities", document.querySelector('[data-metric="opportunities"]').textContent],
    ["Territory coverage", document.querySelector('[data-metric="coverage"]').textContent],
    ["Samples & gifts given", document.querySelector('[data-metric="samples"]').textContent]
  ];
  const csv = rows.map(row => row.map(value => `"${value.replaceAll('"', '""')}"`).join(",")).join("\r\n");
  const file = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = "fieldnote-dashboard-report.csv";
  link.click();
  URL.revokeObjectURL(link.href);
  showToast("Your dashboard report has been exported.");
});

function openVisitModal() {
  visitModal.classList.add("open");
  visitModal.setAttribute("aria-hidden", "false");
  visitModal.querySelector("input").focus();
}
function closeVisitModal() {
  visitModal.classList.remove("open");
  visitModal.setAttribute("aria-hidden", "true");
}
document.getElementById("newVisitButton").addEventListener("click", openVisitModal);
document.getElementById("closeModal").addEventListener("click", closeVisitModal);
visitModal.addEventListener("click", event => {
  if (event.target === visitModal) closeVisitModal();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeVisitModal();
    document.getElementById("sidebar").classList.remove("open");
    document.querySelector(".app-shell").classList.remove("sidebar-collapsed");
    document.getElementById("menuToggle").setAttribute("aria-expanded", "true");
  }
});

document.getElementById("visitForm").addEventListener("submit", event => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const name = form.get("hcp").toString().trim();
  const location = form.get("location").toString().trim();
  if (!name || !location) return;
  const row = document.createElement("tr");
  row.innerHTML = `<td><span class="rep-cell"><span class="rep-avatar avatar-lilac">FM</span><span>Freddie Mounir<small>Cairo team</small></span></span></td><td></td><td><span class="location-cell"><svg viewBox="0 0 16 16"><path d="M13 6.5c0 4-5 8-5 8s-5-4-5-8a5 5 0 1 1 10 0Z"/><circle cx="8" cy="6.5" r="1.5"/></svg></span></td><td>Just now</td><td><span class="status-tag status-verified"><i></i>Verified</span></td>`;
  row.cells[1].textContent = name;
  const area = document.createElement("small");
  area.textContent = form.get("area");
  row.cells[1].append(area);
  row.querySelector(".location-cell").append(document.createTextNode(location));
  const body = document.getElementById("visitRows");
  body.prepend(row);
  while (body.rows.length > 4) body.deleteRow(-1);
  document.querySelector('[data-metric="visits"]').textContent =
    (Number(document.querySelector('[data-metric="visits"]').textContent.replaceAll(",", "")) + 1).toLocaleString();
  document.getElementById("chartTotal").textContent = Number(document.getElementById("chartTotal").textContent) + 1;
  event.currentTarget.reset();
  closeVisitModal();
  showToast(`Visit with ${name} added to today’s activity.`);
});

document.querySelectorAll(".nav-item[data-page]").forEach(item => {
  item.addEventListener("click", event => {
    event.preventDefault();
    document.querySelectorAll(".nav-item[data-page]").forEach(link => link.classList.remove("active"));
    item.classList.add("active");
    const page = item.dataset.page;
    if (page !== "Overview") showToast(`${page} workspace selected.`);
    document.getElementById("sidebar").classList.remove("open");
  });
});

document.getElementById("menuToggle").addEventListener("click", () => {
  const sidebar = document.getElementById("sidebar");
  const button = document.getElementById("menuToggle");
  if (window.matchMedia("(max-width: 700px)").matches) {
    sidebar.classList.toggle("open");
    button.setAttribute("aria-expanded", sidebar.classList.contains("open"));
  } else {
    const shell = document.querySelector(".app-shell");
    shell.classList.toggle("sidebar-collapsed");
    button.setAttribute("aria-expanded", !shell.classList.contains("sidebar-collapsed"));
  }
  button.setAttribute("aria-label", button.getAttribute("aria-expanded") === "true" ? "Close sidebar" : "Open sidebar");
});
document.querySelector(".notification-button").addEventListener("click", () => {
  showToast("You’re all caught up — no new notifications.");
});
document.querySelector(".profile-menu").addEventListener("click", () => {
  showToast("Signed in as Freddie Mounir · Sales manager.");
});

updateFilters();
