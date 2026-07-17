/* ========================================================
    HIS - Shared "Add Record" Modal Controller
    Provides a reusable modal that appends a new row to the
    first data table found on the page.
    ======================================================== */

function openLabResultEditor(row, config) {
    const modalEl = document.getElementById('addRecordModal');
    const form = document.getElementById('addRecordForm');
    if (!modalEl || !form) return;

    modalEl._editTargetRow = row;

    const paramInput = document.getElementById('paramSelect');
    const rangeInput = form.elements['range'];
    const unitInput = form.elements['unit'];
    const resultInput = document.getElementById('resultInput');
    const statusSelect = document.getElementById('statusSelect');

    if (!paramInput || !rangeInput || !unitInput || !resultInput || !statusSelect) return;

    const cells = row.querySelectorAll('td');
    const keys = Object.keys(config.map);

    keys.forEach((key, index) => {
        const field = form.elements[key];
        if (field && cells[index]) {
            if (key === 'param') {
                const paramName = cells[index].querySelector('.font-weight-semibold');
                field.value = paramName ? paramName.textContent.trim() : cells[index].textContent.trim();
            } else {
                field.value = cells[index].textContent.trim();
            }
        }
    });

    const statusCell = cells[keys.length];
    if (statusCell) {
        statusSelect.value = statusCell.textContent.trim();
    }

    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

function setupAddRecordModal(config) {
    const trigger = document.querySelector('.btn-add-record');
    const modalEl = document.getElementById('addRecordModal');
    const form = document.getElementById('addRecordForm');
    const tbody = document.querySelector('.alignment-middle-table tbody');
    if (!trigger || !modalEl || !form || !tbody) return;

    const modal = new bootstrap.Modal(modalEl);

    const paramInput = document.getElementById('paramSelect');
    const rangeInput = form.elements['range'];
    const unitInput = form.elements['unit'];
    const resultInput = document.getElementById('resultInput');
    const statusSelect = document.getElementById('statusSelect');
    const autoStatusCheck = document.getElementById('autoStatusCheck');

    // Default range/unit/sample suggestions tied to common parameters
    const paramPresets = {
        'Hemoglobin (CBC)': { range: '13.5 - 17.5', unit: 'g/dL', sample: '14.2' },
        'WBC Count': { range: '4.0 - 11.0', unit: '10^9/L', sample: '7.5' },
        'Platelet Count': { range: '150 - 400', unit: '10^3/µL', sample: '250' },
        'Hematocrit': { range: '40 - 54', unit: '%', sample: '45' },
        'Fasting Blood Sugar': { range: '70 - 99', unit: 'mg/dL', sample: '92' },
        'Postprandial Glucose': { range: '0 - 140', unit: 'mg/dL', sample: '120' },
        'HbA1c': { range: '0 - 5.6', unit: '%', sample: '5.2' },
        'Total Cholesterol': { range: '125 - 200', unit: 'mg/dL', sample: '185' },
        'Triglycerides': { range: '0 - 150', unit: 'mg/dL', sample: '130' },
        'HDL': { range: '40 - 60', unit: 'mg/dL', sample: '50' },
        'LDL': { range: '0 - 100', unit: 'mg/dL', sample: '95' },
        'Serum Creatinine': { range: '0.6 - 1.3', unit: 'mg/dL', sample: '0.9' },
        'BUN': { range: '7 - 20', unit: 'mg/dL', sample: '14' },
        'Uric Acid': { range: '3.5 - 7.2', unit: 'mg/dL', sample: '5.5' },
        'Sodium': { range: '135 - 145', unit: 'mEq/L', sample: '140' },
        'Potassium': { range: '3.5 - 5.1', unit: 'mEq/L', sample: '4.2' },
        'ALT': { range: '0 - 41', unit: 'U/L', sample: '28' },
        'AST': { range: '0 - 40', unit: 'U/L', sample: '25' },
        'Total Bilirubin': { range: '0.3 - 1.2', unit: 'mg/dL', sample: '0.8' },
        'Albumin': { range: '3.5 - 5.0', unit: 'g/dL', sample: '4.2' },
        'Urine Protein': { range: 'Negative', unit: 'N/A', sample: 'Negative' },
        'Urine pH': { range: '4.5 - 8.0', unit: 'N/A', sample: '6.0' },
        'Urine Ketones': { range: 'Negative', unit: 'N/A', sample: 'Negative' }
    };

    function applyPreset() {
        const preset = paramPresets[paramInput.value.trim()];
        if (preset) {
            if (!rangeInput.value.trim()) rangeInput.value = preset.range;
            if (!unitInput.value.trim()) unitInput.value = preset.unit;
            if (!resultInput.value.trim()) resultInput.value = preset.sample;
        }
    }

    function computeStatus() {
        if (!autoStatusCheck || !autoStatusCheck.checked) return;
        const resultRaw = parseFloat(resultInput.value);
        const rangeRaw = rangeInput.value.trim();

        if (isNaN(resultRaw) || !rangeRaw) {
            statusSelect.value = 'Normal';
            return;
        }
        // Text-based ranges (e.g. Negative)
        if (isNaN(parseFloat(rangeRaw))) {
            statusSelect.value = 'Normal';
            return;
        }
        const match = rangeRaw.match(/([\d.]+)\s*[-–]\s*([\d.]+)/);
        if (!match) {
            statusSelect.value = 'Normal';
            return;
        }
        const min = parseFloat(match[1]);
        const max = parseFloat(match[2]);
        if (resultRaw > max) {
            statusSelect.value = resultRaw > max * 1.5 ? 'Critical' : 'High';
        } else if (resultRaw < min) {
            statusSelect.value = resultRaw < min * 0.5 ? 'Critical' : 'Low';
        } else {
            statusSelect.value = 'Normal';
        }
    }

    paramInput.addEventListener('change', function () {
        applyPreset();
        computeStatus();
    });
    resultInput.addEventListener('input', computeStatus);
    rangeInput.addEventListener('input', computeStatus);
    if (autoStatusCheck) {
        autoStatusCheck.addEventListener('change', computeStatus);
    }

    trigger.addEventListener('click', function () {
        if (typeof isPatientProfileComplete === 'function' && !isPatientProfileComplete()) {
            alert('Please fill up the Patient Profile first before adding a lab result.');
            return;
        }
        form.reset();
        if (autoStatusCheck) autoStatusCheck.checked = true;
        modalEl._editTargetRow = null;
        modal.show();
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const data = {};
        new FormData(form).forEach((value, key) => {
            data[key] = value.trim();
        });

        const firstField = Object.keys(config.map)[0];
        if (!data[firstField]) {
            alert('Please fill in the required fields.');
            return;
        }

        const status = data.status || 'Pending';
        const statusCls = (config.statusClass && config.statusClass[status]) || 'bg-soft-secondary text-muted';

        if (modalEl._editTargetRow) {
            const row = modalEl._editTargetRow;
            const cells = row.querySelectorAll('td');
            const keys = Object.keys(config.map);

            keys.forEach((key, index) => {
                if (cells[index]) {
                    cells[index].innerHTML = config.map[key](data[key] || '');
                }
            });

            const statusCell = cells[keys.length];
            if (statusCell) {
                statusCell.innerHTML = `<span class="badge-status-pill ${statusCls} font-weight-bold">${status}</span>`;
            }

            modalEl._editTargetRow = null;
            modal.hide();
            return;
        }

        const tr = document.createElement('tr');
        tr.className = 'border-bottom';

        Object.keys(config.map).forEach(key => {
            const td = document.createElement('td');
            td.className = 'py-3';
            td.innerHTML = config.map[key](data[key] || '');
            tr.appendChild(td);
        });

        const statusTd = document.createElement('td');
        statusTd.className = 'py-3';
        statusTd.innerHTML = `<span class="badge-status-pill ${statusCls} font-weight-bold">${status}</span>`;
        tr.appendChild(statusTd);

        const actionTd = document.createElement('td');
        actionTd.className = 'py-3 pe-3 sticky-action';
        actionTd.innerHTML = '<button type="button" class="btn btn-table-edit"><i class="bi bi-pencil"></i></button><button type="button" class="btn btn-table-print"><i class="bi bi-printer"></i></button><button type="button" class="btn btn-table-delete"><i class="bi bi-trash"></i></button>';
        tr.appendChild(actionTd);

        tbody.appendChild(tr);
        modal.hide();

        if (window.lisPatientIdManager) {
            window.lisPatientIdManager.updatePatientIdDisplay();
        }

        if (window.syncValidationQueueFromResults) {
            window.syncValidationQueueFromResults();
        }
    });
}
