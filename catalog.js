/* Motorola Accessory Catalog — Shared Rendering Engine — catalog.js */

let activeRadio = null;
let activeCat   = null;
let searchTerm  = '';

function getBadges(item) {
  const txt = (item.desc + ' ' + (item.note || '')).toLowerCase();
  const badges = [];
  if (txt.includes('impres'))                           badges.push('<span class="badge badge-impres">IMPRES</span>');
  if (txt.includes('ip68'))                             badges.push('<span class="badge badge-ip68">IP68</span>');
  else if (txt.includes('ip67'))                        badges.push('<span class="badge badge-ip67">IP67</span>');
  else if (txt.includes('ip66'))                        badges.push('<span class="badge badge-ip66">IP66</span>');
  else if (txt.includes('ip54'))                        badges.push('<span class="badge badge-ip54">IP54</span>');
  if (txt.includes('ul hazloc') || txt.includes('ul ')) badges.push('<span class="badge badge-ul">UL</span>');
  return badges.join('');
}

const COL_KEY = {
  'IMPRES':'impres','IP68':'ip68','UL HazLoc':'ul','InAud':'intel',
  'Ion FW Req':'ion_fw','BT/Wireless':'bt','Full Duplex':'fulldx',
  'IP Rated':'ip','NRR':'nrr','Noise Cancel':'nc',
  'Wires':'wires','FW Required':'fw_req','NFC':'nfc','Emg Btn':'emg',
  'BT':'bt','Capacity':'mah','IP Rating':'ip','Temp Range':'temp',
  'Pockets':'pockets','Recond.':'recondn',
  'AINS':'ains','WWet':'wwet','SmartSW':'smart_sw',
  'Ambient':'ambient','IMPRES 2':'impres2',
  'HazLoc':'ul',
};

// Columns that display text values instead of checkmarks — sorted LEFT of checkmark cols
const TEXT_VALUE_COLS = new Set([
  'NRR','Wires','FW Required','Capacity','IP Rating','Temp Range','Pockets',
  'IP68','HazLoc','UL HazLoc'
]);

function colWidth(col) {
  return TEXT_VALUE_COLS.has(col) ? '80px' : '64px';
}

function ck(v) {
  if (v === 1 || v === true)  return '<span class="ck">✓</span>';
  if (v === 0 || v === false) return '<span class="dash">—</span>';
  if (v === '—' || v === null || v === undefined) return '<span class="dash">—</span>';
  return '<span style="font-family:JetBrains Mono,monospace;font-size:11px;color:var(--muted)">' + v + '</span>';
}

function escapeItemData(obj) {
  return "'" + JSON.stringify(obj).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
}

function copyPN(pn) {
  navigator.clipboard.writeText(pn).catch(() => {});
  const t = document.getElementById('copyToast');
  t.textContent = '"' + pn + '" copied!';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1800);
}

function highlightPN(pn) {
  if (!searchTerm || !pn.toLowerCase().includes(searchTerm)) return pn;
  const idx = pn.toLowerCase().indexOf(searchTerm);
  return pn.slice(0, idx)
    + '<span class="pn-match">' + pn.slice(idx, idx + searchTerm.length) + '</span>'
    + pn.slice(idx + searchTerm.length);
}

function filterItems(items) {
  if (!searchTerm) return items;
  return items.filter(item => item.pn.toLowerCase().includes(searchTerm));
}

function buildImgCell(item) {
  if (item.img) {
    return '<td class="col-img"><img src="' + item.img
      + '" alt="' + item.desc.replace(/"/g, '&quot;') + '" class="product-thumb"></td>';
  }
  return '<td class="col-img"><div class="img-placeholder">📷</div></td>';
}

function buildCbCell(item, itemData) {
  const cbChecked = (typeof isSelected === 'function' && isSelected(item.pn)) ? 'checked' : '';
  return '<td class="report-cb-cell">'
    + '<input type="checkbox" class="report-cb" value="' + item.pn + '" ' + cbChecked
    + ' onchange="handleReportCheckbox(this,' + escapeItemData(itemData) + ')">'
    + '</td>';
}

function buildItemData(item, cat, sec, radio) {
  return {
    partNum:  item.pn,
    desc:     item.desc,
    note:     item.note  || null,
    category: cat.label,
    section:  sec.title,
    catalog:  (typeof CATALOG_NAME !== 'undefined') ? CATALOG_NAME : (CATALOG_TITLE || ''),
    radio:    radio.name,
    checks:   item.checks || {},
    img:      item.img    || null,
  };
}

function renderSpecCell(col, val) {
  if (col === 'HazLoc' || col === 'UL HazLoc') {
    if (!val || val === 0) return '<td class="col-check tc"><span class="dash">—</span></td>';
    return '<td class="col-check tc"><span class="val-text">HazLoc</span></td>';
  }
  if (col === 'IP68') {
    if (!val || val === 0) return '<td class="col-check tc"><span class="dash">—</span></td>';
    return '<td class="col-check tc"><span class="val-text">IP68</span></td>';
  }
  if (TEXT_VALUE_COLS.has(col)) {
    return '<td class="col-check tc"><span class="val-text">' + (val || '—') + '</span></td>';
  }
  return '<td class="col-check tc">' + ck(val !== undefined ? val : 0) + '</td>';
}

function sortCols(cols) {
  const text  = cols.filter(c => TEXT_VALUE_COLS.has(c));
  const check = cols.filter(c => !TEXT_VALUE_COLS.has(c));
  return [...text, ...check];
}

function renderSidebar() {
  const sb = document.getElementById('radioSidebar');
  sb.innerHTML = `
    <div class="rs-logo-row">
      <strong style="font-size:13px;color:var(--text)">${CATALOG_TITLE}</strong>
      <p>${CATALOG_SUBTITLE}</p>
    </div>
    <div class="rs-group-label">Portable Radios</div>
  `;
  Object.entries(RADIOS).forEach(([id, radio]) => {
    if (!activeRadio) activeRadio = id;
    const btn = document.createElement('button');
    btn.className = 'radio-btn' + (id === activeRadio ? ' active' : '');
    btn.setAttribute('data-radio', id);
    const catCount = Object.keys(radio.categories).length;
    btn.innerHTML = `
      <div class="rb-inner">
        <span class="rb-name">${radio.name}</span>
        <span class="rb-sub">${radio.sub}</span>
      </div>
      <span class="rb-badge">${catCount}</span>
    `;
    btn.onclick = () => { activeRadio = id; activeCat = null; renderAll(); };
    sb.appendChild(btn);
  });
}

function renderCatSidebar() {
  const sb = document.getElementById('catSidebar');
  const radio = RADIOS[activeRadio];
  if (!activeCat) activeCat = Object.keys(radio.categories)[0];
  sb.innerHTML = `<div class="cs-label">Categories</div>`;
  Object.entries(radio.categories).forEach(([key, cat]) => {
    const btn = document.createElement('button');
    btn.className = 'cat-btn' + (key === activeCat ? ' active' : '');
    btn.innerHTML = `<span class="cb-icon">${cat.icon}</span><span class="cb-label">${cat.label}</span>`;
    btn.onclick = () => { activeCat = key; renderCatSidebar(); renderContent(); };
    sb.appendChild(btn);
  });
}

function renderContent() {
  const panel = document.getElementById('contentInner');
  const radio = RADIOS[activeRadio];
  const cat   = radio.categories[activeCat];
  const total = cat.sections.reduce((s, sec) => s + sec.items.length, 0);
  const cols     = cat.cols || null;
  const specCols = cols ? cols.slice(2) : [];

  const tagHtml = radio.tags.map((t, i) =>
    '<span class="rh-tag ' + (radio.tagStyles[i] || '') + '">' + t + '</span>'
  ).join('');

  let html = '<div class="radio-header">'
    + '<div class="rh-img-wrap"><span class="rh-img-placeholder">📻</span></div>'
    + '<div class="rh-info">'
    + '<div class="rh-name">' + radio.name + '</div>'
    + '<div class="rh-sub">' + radio.sub + '</div>'
    + '<div class="rh-tags">' + tagHtml + '</div>'
    + '</div></div>'
    + '<div class="cat-section">'
    + '<div class="cat-section-header">'
    + '<span class="cat-section-icon">' + cat.icon + '</span>'
    + '<span class="cat-section-title">' + cat.label + '</span>'
    + '<span class="cat-section-count">' + total + ' items</span>'
    + '</div>';

  cat.sections.forEach(sec => {
    const items = filterItems(sec.items);
    if (!items.length) return;

    const isReplacementSection = sec.title.toLowerCase().includes('replacement');
    const useSpecTable = !isReplacementSection && specCols.length > 0;

    html += '<div class="acc-subsection">';
    html += '<div class="acc-subsection-title">' + sec.title + '</div>';

    if (useSpecTable) {

      const rawActiveCols = specCols.filter(col => {
        const k = COL_KEY[col];
        return items.some(item => {
          if (!item.checks || k === undefined) return false;
          const v = item.checks[k];
          return v !== undefined && v !== 0 && v !== false && v !== '—' && v !== null;
        });
      });

      const activeCols = sortCols(rawActiveCols);

      const colgroupHtml = '<colgroup>'
        + '<col style="width:28px;min-width:28px;max-width:28px">'
        + '<col style="width:52px;min-width:52px;max-width:52px">'
        + '<col style="width:130px;min-width:130px;max-width:130px">'
        + '<col style="min-width:220px;width:auto">'
        + activeCols.map(c => {
            const w = colWidth(c);
            return '<col style="width:' + w + ';min-width:' + w + ';max-width:' + w + '">';
          }).join('')
        + '</colgroup>';

      const headerHtml = ''
        + '<th class="report-cb-cell" style="width:28px;min-width:28px;max-width:28px"></th>'
        + '<th class="col-img" style="width:52px;min-width:52px;max-width:52px;text-align:center">IMG</th>'
        + '<th class="col-pn" style="width:130px;min-width:130px;max-width:130px;text-align:center">Part Number</th>'
        + '<th style="min-width:220px;text-align:center">Description</th>'
        + activeCols.map(c => {
            const w = colWidth(c);
            return '<th class="col-check tc" style="width:' + w + ';min-width:' + w + ';max-width:' + w + '">' + c + '</th>';
          }).join('');

      html += '<div class="table-wrap"><table>'
        + colgroupHtml
        + '<thead><tr>' + headerHtml + '</tr></thead>'
        + '<tbody>';

      items.forEach(item => {
        const itemData = buildItemData(item, cat, sec, radio);
        const cbCell   = buildCbCell(item, itemData);
        const imgCell  = buildImgCell(item);
        const noteHtml = item.note
          ? '<div class="td-note">' + item.note + '</div>'
          : '';

        const specCells = activeCols.map(col => {
          const k   = COL_KEY[col];
          const val = (item.checks && k !== undefined) ? item.checks[k] : undefined;
          return renderSpecCell(col, val);
        }).join('');

        html += '<tr>'
          + cbCell
          + imgCell
          + '<td class="col-pn" style="text-align:center"><span class="pn" onclick="copyPN(\'' + item.pn + '\')">' + highlightPN(item.pn) + '</span></td>'
          + '<td style="min-width:220px;text-align:center;vertical-align:middle">'
          +   '<div class="td-main">' + item.desc + '</div>' + noteHtml
          + '</td>'
          + specCells
          + '</tr>';
      });

      html += '</tbody></table></div>';

    } else {

      const colgroupHtml = '<colgroup>'
        + '<col style="width:28px;min-width:28px;max-width:28px">'
        + '<col style="width:52px;min-width:52px;max-width:52px">'
        + '<col style="width:130px;min-width:130px;max-width:130px">'
        + '<col style="min-width:220px;width:auto">'
        + '<col style="width:160px;min-width:160px;max-width:160px">'
        + '</colgroup>';

      html += '<table class="acc-table">'
        + colgroupHtml
        + '<thead><tr>'
        + '<th class="report-cb-cell" style="width:28px;min-width:28px;max-width:28px"></th>'
        + '<th class="col-img" style="width:52px;min-width:52px;max-width:52px;text-align:center">IMG</th>'
        + '<th class="col-pn" style="width:130px;min-width:130px;max-width:130px;text-align:center">Part Number</th>'
        + '<th style="min-width:220px;text-align:center">Description</th>'
        + '<th class="col-note" style="width:160px;min-width:160px;max-width:160px;text-align:center">Notes</th>'
        + '</tr></thead><tbody>';

      items.forEach(item => {
        const itemData = buildItemData(item, cat, sec, radio);
        const cbCell   = buildCbCell(item, itemData);
        const imgCell  = buildImgCell(item);

        html += '<tr>'
          + cbCell
          + imgCell
          + '<td class="col-pn" style="text-align:center"><span class="pn" onclick="copyPN(\'' + item.pn + '\')">' + highlightPN(item.pn) + '</span></td>'
          + '<td style="min-width:220px;text-align:center;vertical-align:middle">'
          +   '<div class="td-main">' + item.desc + '</div>'
          +   (item.note ? '<div class="td-note">' + item.note + '</div>' : '')
          + '</td>'
          + '<td class="col-note">' + (item.note || '') + '</td>'
          + '</tr>';
      });

      html += '</tbody></table>';
    }

    html += '</div>';
  });

  html += '</div>';
  panel.innerHTML = html;
  panel.parentElement.scrollTop = 0;
}

function renderSubbar() {
  const existing = document.getElementById('subbar');
  if (existing) return;
  const bar = document.createElement('div');
  bar.className = 'subbar';
  bar.id = 'subbar';
  bar.innerHTML = `
    <a class="subbar-home" href="../index.html">← Home</a>
    <div class="subbar-sep"></div>
    <div class="subbar-spacer"></div>
    <div class="subbar-search-wrap">
      <span class="subbar-search-icon">🔍</span>
      <input class="subbar-search" id="subbarSearch" type="text" placeholder="Search part numbers..." autocomplete="off">
      <span class="subbar-clear" id="subbarClear">✕</span>
    </div>
  `;
  document.body.insertBefore(bar, document.querySelector('.page-body'));

  const input = document.getElementById('subbarSearch');
  const clear = document.getElementById('subbarClear');

  input.addEventListener('input', () => {
    searchTerm = input.value.trim().toLowerCase();
    clear.classList.toggle('show', searchTerm.length > 0);
    renderContent();
  });

  clear.addEventListener('click', () => {
    input.value = '';
    searchTerm = '';
    clear.classList.remove('show');
    renderContent();
  });
}

function renderAll() {
  renderSubbar();
  renderSidebar();
  renderCatSidebar();
  renderContent();
}

renderAll();
