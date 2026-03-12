/* Motorola Solutions — Report Tray — report-tray.js */
/* Shared across all MSI catalog sites. localStorage is browser-scoped per origin,
   so each GitHub Pages site (PCR, Astro, Tetra) is automatically isolated.       */

(function () {
  const STORAGE_KEY = 'msi_report_selections';

  /* ── Storage helpers ─────────────────────────────────────────── */

  function loadSelections() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  function saveSelections(obj) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  }

  /* ── Public API (called from catalog.js inline handlers) ─────── */

  window.isSelected = function (partNum) {
    return !!loadSelections()[partNum];
  };

  window.handleReportCheckbox = function (cbEl, itemDataJson) {
    const selections = loadSelections();
    let itemData;
    try {
      itemData = typeof itemDataJson === 'string' ? JSON.parse(itemDataJson) : itemDataJson;
    } catch (e) {
      console.error('report-tray: could not parse itemData', e);
      return;
    }

    if (cbEl.checked) {
      selections[itemData.partNum] = itemData;
    } else {
      delete selections[itemData.partNum];
    }

    saveSelections(selections);
    updateTray();
  };

  window.clearSelections = function () {
    saveSelections({});
    // Uncheck all visible checkboxes on the current page
    document.querySelectorAll('.report-cb').forEach(cb => { cb.checked = false; });
    updateTray();
  };

  window.openReport = function () {
    // report.html lives one level up from /PCR/ — works for all catalog pages
    // that are one directory deep inside the site root.
    const depth = window.location.pathname.replace(/\/[^/]*$/, '');
    // Navigate relative to site root
    window.open('../report.html', '_blank');
  };

  /* ── Tray DOM ────────────────────────────────────────────────── */

  function buildTray() {
    if (document.getElementById('reportTray')) return;

    const tray = document.createElement('div');
    tray.id = 'reportTray';
    tray.className = 'report-tray';
    tray.innerHTML = `
      <div class="rt-inner">
        <div class="rt-left">
          <span class="rt-icon">📋</span>
          <span class="rt-count" id="rtCount">0 items selected</span>
        </div>
        <div class="rt-actions">
          <button class="rt-btn rt-btn-clear" onclick="clearSelections()">Clear</button>
          <button class="rt-btn rt-btn-report" onclick="openReport()">Generate Report</button>
        </div>
      </div>
    `;
    document.body.appendChild(tray);
  }

  function updateTray() {
    const selections = loadSelections();
    const count = Object.keys(selections).length;
    const tray = document.getElementById('reportTray');
    const countEl = document.getElementById('rtCount');

    if (!tray) return;

    if (count > 0) {
      tray.classList.add('tray-active');
      countEl.textContent = count + (count === 1 ? ' item selected' : ' items selected');
    } else {
      tray.classList.remove('tray-active');
      countEl.textContent = '0 items selected';
    }
  }

  /* ── Init ────────────────────────────────────────────────────── */

  function init() {
    buildTray();
    updateTray();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();