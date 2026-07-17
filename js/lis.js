/* ========================================================
    HIS - Laboratory Information System Controller Actions
    ======================================================== */

document.addEventListener('DOMContentLoaded', function () {
    console.log("Laboratory Information System pipeline connected.");

    localStorage.removeItem('lis_patient_profile');

    // Sidebar hide/unhide toggle (collapses to a slim sliver, not fully hidden)
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function () {
            const hidden = document.body.classList.toggle('sidebar-hidden');
            sidebarToggle.setAttribute('aria-label', hidden ? 'Show sidebar' : 'Hide sidebar');
        });
    }

    // Simple interaction to toggle individual card states mockups
    const testCards = document.querySelectorAll('.test-selection-card');
    const testInfoArea = document.getElementById('testInfoArea');
    const testInfoTitle = document.getElementById('testInfoTitle');
    const testInfoDescription = document.getElementById('testInfoDescription');
    const closeTestInfo = document.getElementById('closeTestInfo');

    const testExplanations = {
        'CBC': {
            title: 'Complete Blood Count (CBC)',
            description: 'Measures different components of blood including red blood cells, white blood cells, hemoglobin, hematocrit, and platelets. Used to evaluate overall health, detect infections, anemia, leukemia, and other blood disorders. For this patient, CBC helps monitor hemoglobin levels and detect any blood abnormalities.'
        },
        'Urinalysis': {
            title: 'Urinalysis',
            description: 'Examines the physical, chemical, and microscopic properties of urine. Detects protein, glucose, ketones, blood, and pH levels. Helps diagnose urinary tract infections, kidney diseases, diabetes, and liver problems. For this patient, it screens for kidney function and glucose abnormalities.'
        },
        'Blood Sugar': {
            title: 'Blood Sugar Test',
            description: 'Measures glucose levels in the blood. Fasting blood sugar is taken after 8-12 hours without eating. Postprandial is measured 2 hours after eating. Used to diagnose diabetes, monitor blood sugar control, and assess risk for diabetes complications. For this patient, monitors glucose control given the fasting protocol noted in the clinical note.'
        },
        'Lipid Profile': {
            title: 'Lipid Profile',
            description: 'Measures cholesterol and triglycerides in the blood. Includes Total Cholesterol, HDL (good), LDL (bad), and Triglycerides. Requires 12-hour fasting for accurate results. Helps assess risk for heart disease, stroke, and atherosclerosis. For this patient, screens cardiovascular risk and monitors lipid levels.'
        }
    };

    testCards.forEach(card => {
        card.addEventListener('click', function() {
            const wasChecked = this.classList.contains('checked');

            if (!wasChecked) {
                this.classList.add('checked');
                const targetRadio = this.querySelector('.custom-radio-circle');
                if(targetRadio) {
                    targetRadio.classList.add('checked');
                }
            } else {
                this.classList.remove('checked');
                const targetRadio = this.querySelector('.custom-radio-circle');
                if(targetRadio) {
                    targetRadio.classList.remove('checked');
                }
            }

            updateTestDescription();

            const checkedCards = document.querySelectorAll('.test-selection-card.checked');
            if (checkedCards.length > 0) {
                triggerMediSenseForSelectedTests();
            }
        });
    });

    if (closeTestInfo && testInfoArea) {
        closeTestInfo.addEventListener('click', function() {
            testInfoArea.classList.add('d-none');
            testCards.forEach(c => {
                c.classList.remove('checked');
                const radio = c.querySelector('.custom-radio-circle');
                if (radio) radio.classList.remove('checked');
            });
            closeTestInfo.classList.add('d-none');

            testInfoTitle.textContent = 'Requested Laboratory Tests';
            testInfoDescription.textContent = 'Select a test above to view its description, purpose, and how it helps this patient. Available tests: CBC, Urinalysis, Blood Sugar, and Lipid Profile.';
            testInfoArea.classList.remove('d-none');
        });
    }

    function updateTestDescription() {
        const checkedCards = document.querySelectorAll('.test-selection-card.checked');

        const checkedNames = [];
        checkedCards.forEach(card => {
            const testName = card.querySelector('.font-weight-semibold');
            if (testName) {
                checkedNames.push(testName.textContent.trim());
            }
        });

        if (checkedNames.length === 0) {
            testInfoTitle.textContent = 'Requested Laboratory Tests';
            testInfoDescription.textContent = 'Select a test above to view its description, purpose, and how it helps this patient. Available tests: CBC, Urinalysis, Blood Sugar, and Lipid Profile.';
            testInfoArea.classList.remove('d-none');
            const closeBtn = document.getElementById('closeTestInfo');
            if (closeBtn) closeBtn.classList.add('d-none');
            return;
        }

        const parts = checkedNames.map(function(name) {
            const info = testExplanations[name];
            const title = info ? info.title : name;
            const desc = info ? info.description : '';
            return '<strong>' + title + ':</strong> ' + desc;
        });

        testInfoTitle.textContent = 'Requested Laboratory Tests (' + checkedNames.length + ')';
        testInfoDescription.innerHTML = parts.join('<br><br>');
        testInfoArea.classList.remove('d-none');
        const closeBtn = document.getElementById('closeTestInfo');
        if (closeBtn) closeBtn.classList.remove('d-none');
    }

    // Save Changes action handler - saves patient profile locally without redirect
    const saveBtn = document.querySelector('.btn-save-changes');
    if(saveBtn) {
        saveBtn.addEventListener('click', function() {
            const patientNameDisplay = document.getElementById('patientNameDisplay');
            const patientIdDisplay = document.getElementById('patientIdDisplay');
            const avatarInitials = document.getElementById('patientAvatarInitials');
            const editableFields = document.querySelectorAll('.patient-editable');
            const clinicalNote = document.querySelector('.clinical-note-textarea');

            const profileData = {
                name: patientNameDisplay ? (patientNameDisplay.querySelector('input') ? patientNameDisplay.querySelector('input').value.trim() : patientNameDisplay.textContent.trim()) : '',
                id: patientIdDisplay ? (patientIdDisplay.querySelector('input') ? patientIdDisplay.querySelector('input').value.trim() : (patientIdDisplay.textContent || '').trim()) : '',
                initials: avatarInitials ? (avatarInitials.textContent || '').trim() : '',
                fields: {},
                clinicalNote: clinicalNote ? (clinicalNote.textContent || '').trim() : '',
                savedAt: new Date().toISOString()
            };

            editableFields.forEach(function(field) {
                const fieldName = field.dataset.field;
                const input = field.querySelector('input');
                const select = field.querySelector('select');
                profileData.fields[fieldName] = input ? input.value.trim() : (select ? select.value.trim() : field.textContent.trim());
            });

            localStorage.setItem('lis_patient_profile', JSON.stringify(profileData));
            updatePrintButtonState();
            appendPendingToResults();

            const originalText = this.innerHTML;
            this.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Saving...';
            this.disabled = true;

            setTimeout(() => {
                this.innerHTML = '<i class="bi bi-check-lg me-2"></i>Saved';
                this.classList.remove('btn-save-changes');
                this.classList.add('btn-success');

                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.classList.remove('btn-success');
                    this.classList.add('btn-save-changes');
                    this.disabled = false;
                }, 2000);
            }, 800);
        });
    }

    // Print Result action handler
    const printBtn = document.querySelector('.btn-outline-secondary .bi-printer');
    if (printBtn) {
        const button = printBtn.closest('.btn-outline-secondary');
        if (button) {
            button.addEventListener('click', function() {
                if (!isPatientProfileComplete()) {
                    alert('Please fill up the Patient Profile first before printing.');
                    return;
                }
                window.print();
            });
        }
    }

    // Go to Queue action handler
    const queueBtn = document.querySelector('.btn-validate-queue');
    if (queueBtn) {
        queueBtn.addEventListener('click', function() {
            const modalEl = document.getElementById('validationQueueModal');
            if (modalEl && window.bootstrap) {
                const modal = new bootstrap.Modal(modalEl);
                renderValidationQueue();
                modal.show();
            } else {
                const pendingCard = document.querySelector('.pending-card');
                if (pendingCard) pendingCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    }

    // Table row action button handlers (event delegation for dynamic rows)
    const resultsTable = document.querySelector('.alignment-middle-table');
    if (resultsTable) {
        resultsTable.addEventListener('click', function(e) {
            const editBtn = e.target.closest('.btn-table-edit');
            const deleteBtn = e.target.closest('.btn-table-delete');
            const printBtn = e.target.closest('.btn-table-print');

            if (editBtn) {
                const row = editBtn.closest('tr');
                if (row) {
                    openLabResultEditor(row, {
                        map: {
                            param: v => `<span class="d-block font-weight-semibold text-dark">${v}</span>`,
                            result: v => `<span class="font-weight-bold text-dark">${v}</span>`,
                            range: v => `<span class="text-muted">${v || '—'}</span>`,
                            unit: v => `<span class="text-muted">${v || 'N/A'}</span>`
                        },
                        statusClass: {
                            'Normal': 'bg-soft-success text-success',
                            'High': 'bg-soft-danger text-danger',
                            'Low': 'bg-soft-danger text-danger',
                            'Critical': 'bg-soft-danger text-danger'
                        }
                    });
                }
            }

            if (deleteBtn) {
                const row = deleteBtn.closest('tr');
                if (row) {
                    if (confirm('Are you sure you want to delete this lab result?')) {
                        row.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                        row.style.opacity = '0';
                        row.style.transform = 'translateX(-20px)';
                        setTimeout(function() {
                            row.remove();
                        }, 300);
                    }
                }
            }

            if (printBtn) {
                if (!isPatientProfileComplete()) {
                    alert('Please fill up the Patient Profile first before printing.');
                    return;
                }
                const row = printBtn.closest('tr');
                if (row) {
                    printRowResult(row);
                }
            }
        });
    }

    setupAddRecordModal({
        map: {
            param: v => `<span class="d-block font-weight-semibold text-dark">${v}</span>`,
            result: v => `<span class="font-weight-bold text-dark">${v}</span>`,
            range: v => `<span class="text-muted">${v || '—'}</span>`,
            unit: v => `<span class="text-muted">${v || 'N/A'}</span>`
        },
        statusClass: {
            'Normal': 'bg-soft-success text-success',
            'High': 'bg-soft-danger text-danger',
            'Low': 'bg-soft-danger text-danger',
            'Critical': 'bg-soft-danger text-danger'
        }
    });

    setupSearchFilter();
    setupSearchAutocomplete();
    setupMediSense();
    setupPatientProfileEditor();
    setupPatientIdManager();
    setupValidationQueue();
    updatePrintButtonState();
});

/* ========================================================
    LIS - Patient ID Manager (localStorage-based auto-increment)
    ======================================================== */
function setupPatientIdManager() {
    const patientIdDisplay = document.getElementById('patientIdDisplay');
    if (!patientIdDisplay) return;

    const STORAGE_KEY = 'lis_patient_id_counter';

    function getNextId() {
        let counter = localStorage.getItem(STORAGE_KEY);
        if (!counter) {
            counter = 1;
        } else {
            counter = parseInt(counter, 10) + 1;
        }
        localStorage.setItem(STORAGE_KEY, counter);
        return counter;
    }

    function getCurrentId() {
        const counter = localStorage.getItem(STORAGE_KEY);
        return counter ? parseInt(counter, 10) : 1;
    }

    function updatePatientIdDisplay() {
        const currentId = getCurrentId();
        const input = patientIdDisplay.querySelector('input');
        if (input) {
            input.value = String(currentId).padStart(2, '0');
        } else {
            patientIdDisplay.textContent = 'ID: ' + String(currentId).padStart(2, '0');
        }
    }

    updatePatientIdDisplay();

    window.lisPatientIdManager = {
        getNextId: getNextId,
        getCurrentId: getCurrentId,
        updatePatientIdDisplay: updatePatientIdDisplay
    };
}

/* ========================================================
    LIS - Patient Profile Validation
    ======================================================== */
function isPatientProfileComplete() {
    const patientNameDisplay = document.getElementById('patientNameDisplay');
    const patientIdDisplay = document.getElementById('patientIdDisplay');
    const profileRows = document.querySelectorAll('.table-profile-info tr');
    const ageField = profileRows[0] ? profileRows[0].querySelector('td:last-child') : null;
    const genderField = profileRows[1] ? profileRows[1].querySelector('td:last-child') : null;

    function getFieldValue(field) {
        if (!field) return '';
        const input = field.querySelector('input');
        const select = field.querySelector('select');
        if (input) {
            const val = input.value.trim();
            if (val !== '' && val !== input.placeholder) {
                return val;
            }
            const text = (field.textContent || '').trim();
            if (text && text !== input.placeholder) {
                return text;
            }
        }
        if (select) {
            const val = select.value.trim();
            if (val !== '') {
                return val;
            }
        }
        const text = (field.textContent || '').trim();
        return text !== '' ? text : '';
    }

    const name = getFieldValue(patientNameDisplay);
    const id = patientIdDisplay ? (patientIdDisplay.querySelector('input') ? patientIdDisplay.querySelector('input').value.trim() : (patientIdDisplay.textContent || '').trim()) : '';
    const age = getFieldValue(ageField);
    const gender = getFieldValue(genderField);

    return name !== '' && id !== '' && age !== '' && gender !== '';
}

function updatePrintButtonState() {
    const complete = isPatientProfileComplete();
    const printButtons = document.querySelectorAll('.btn-table-print');
    printButtons.forEach(function(btn) {
        btn.disabled = !complete;
        btn.style.opacity = complete ? '1' : '0.5';
        btn.style.cursor = complete ? 'pointer' : 'not-allowed';
    });

    const topPrintBtn = document.querySelector('.btn-outline-secondary .bi-printer');
    if (topPrintBtn) {
        const button = topPrintBtn.closest('.btn-outline-secondary');
        if (button) {
            button.disabled = !complete;
            button.style.opacity = complete ? '1' : '0.5';
            button.style.cursor = complete ? 'pointer' : 'not-allowed';
        }
    }
}

/* ========================================================
    LIS - Patient Profile Inputs Behavior
    ======================================================== */
function setupPatientProfileEditor() {
    const patientNameDisplay = document.getElementById('patientNameDisplay');
    const patientIdDisplay = document.getElementById('patientIdDisplay');
    const avatarInitials = document.getElementById('patientAvatarInitials');
    const editableFields = document.querySelectorAll('.patient-editable');
    const uploadBtn = document.getElementById('uploadAvatarBtn');
    const avatarInput = document.getElementById('avatarInput');

    if (uploadBtn && avatarInput) {
        uploadBtn.addEventListener('click', function() {
            avatarInput.click();
        });

        avatarInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(evt) {
                    avatarInitials.style.backgroundImage = 'url(' + evt.target.result + ')';
                    avatarInitials.style.backgroundSize = 'cover';
                    avatarInitials.style.backgroundPosition = 'center';
                    avatarInitials.textContent = '';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    const fieldOrder = [
        { id: 'patientNameDisplay', label: 'Name' },
        { id: 'patientIdDisplay', label: 'Patient ID' },
        { field: '[data-field="age"]', label: 'Age' },
        { field: '[data-field="gender"]', label: 'Gender' },
        { field: '[data-field="bloodType"]', label: 'Blood Type' },
        { field: '[data-field="ward"]', label: 'Ward' },
        { field: '[data-field="room"]', label: 'Room' },
        { field: '[data-field="physician"]', label: 'Physician' }
    ];

    function getFieldValue(field) {
        if (!field) return '';
        const input = field.querySelector('input');
        const select = field.querySelector('select');
        if (input) {
            const val = input.value.trim();
            if (val !== '' && val !== input.placeholder) {
                return val;
            }
            const text = (field.textContent || '').trim();
            if (text && text !== input.placeholder) {
                return text;
            }
        }
        if (select) {
            const val = select.value.trim();
            if (val !== '') {
                return val;
            }
        }
        const text = (field.textContent || '').trim();
        return text !== '' ? text : '';
    }

    function validateFieldAccess(fieldInfo) {
        const currentIndex = fieldOrder.indexOf(fieldInfo);
        if (currentIndex <= 0) return true;

        for (let i = 0; i < currentIndex; i++) {
            const prev = fieldOrder[i];
            let prevField = null;
            if (prev.id) {
                prevField = document.getElementById(prev.id);
            } else if (prev.field) {
                prevField = document.querySelector('.patient-editable' + prev.field);
            }
            const prevValue = getFieldValue(prevField);
            if (!prevValue) {
                alert('Please fill up ' + prev.label + ' first before entering ' + fieldInfo.label + '.');
                return false;
            }
        }
        return true;
    }

    editableFields.forEach(function(field) {
        const input = field.querySelector('input');
        const select = field.querySelector('select');
        const target = input || select;
        const fieldName = field.dataset.field;
        const isAgeField = field.classList.contains('patient-editable-age');

        const fieldInfo = fieldOrder.find(function(f) {
            if (f.id === 'patientNameDisplay') return field.id === 'patientNameDisplay';
            if (f.id === 'patientIdDisplay') return field.id === 'patientIdDisplay';
            if (f.field) return field.matches('.patient-editable' + f.field);
            return false;
        });

        if (target && fieldInfo) {
            target.addEventListener('focus', function() {
                if (!validateFieldAccess(fieldInfo)) {
                    this.blur();
                }
            });
        }

        if (input) {
            input.addEventListener('input', function() {
                if (isAgeField) {
                    this.value = this.value.replace(/[^0-9]/g, '');
                    if (this.value !== '' && parseInt(this.value, 10) > 200) {
                        this.value = '200';
                    }
                }
            });

            input.addEventListener('blur', function() {
                const val = this.value.trim();
                if (val === '') {
                    this.value = '';
                }
            });
        }
    });

    if (patientNameDisplay) {
        const nameInput = patientNameDisplay.querySelector('input');
        if (nameInput) {
            nameInput.addEventListener('blur', function() {
                const val = this.value.trim();
                if (val === '') {
                    this.value = '';
                }
            });
        }
    }

    if (patientIdDisplay) {
        const idInput = patientIdDisplay.querySelector('input');
        if (idInput) {
            idInput.addEventListener('blur', function() {
                const val = this.value.trim();
                if (val === '') {
                    this.value = '';
                }
            });
        }
    }
}

/* ========================================================
    LIS - MediSense AI Support Assistant (Suggestions only)
    ======================================================== */
function triggerMediSenseForSelectedTests() {
    const suggestions = generateMediSenseSuggestions();
    renderMediSenseSuggestions(suggestions);
    window._lastMediSenseSuggestions = suggestions;

    const mediSenseModal = document.getElementById('mediSenseModal');
    if (mediSenseModal && window.bootstrap) {
        const modal = new bootstrap.Modal(mediSenseModal);
        modal.show();
    }
}

function setupMediSense() {
    const btn = document.getElementById('mediSenseBtn');
    const modalEl = document.getElementById('mediSenseModal');
    const runBtn = document.getElementById('mediSenseRunBtn');
    const applyBtn = document.getElementById('applyToClinicalNoteBtn');
    if (!btn || !modalEl) return;

    const modal = new bootstrap.Modal(modalEl);
    let currentSuggestions = [];

    btn.addEventListener('click', function (e) {
        e.preventDefault();
        currentSuggestions = generateMediSenseSuggestions();
        renderMediSenseSuggestions(currentSuggestions);
        modal.show();
    });

    if (runBtn) {
        runBtn.addEventListener('click', function () {
            currentSuggestions = generateMediSenseSuggestions();
            renderMediSenseSuggestions(currentSuggestions);
        });
    }

    if (applyBtn) {
        applyBtn.addEventListener('click', function () {
            if (currentSuggestions.length === 0) {
                currentSuggestions = generateMediSenseSuggestions();
            }
            applyMediSenseToClinicalNote(currentSuggestions);
        });
    }
}

function generateMediSenseSuggestions() {
    const patientNameEl = document.getElementById('patientNameDisplay');
    const patientIdEl = document.getElementById('patientIdDisplay');
    const clinicalNote = document.querySelector('.clinical-note-textarea');
    const nameInput = patientNameEl ? patientNameEl.querySelector('input') : null;
    const patient = nameInput ? nameInput.value.trim() : (patientNameEl ? patientNameEl.textContent.trim() : 'the patient');
    const patientId = patientIdEl ? (patientIdEl.querySelector('input') ? patientIdEl.querySelector('input').value.trim() : (patientIdEl.textContent || '').trim()) : '';
    const noteText = clinicalNote ? (clinicalNote.textContent || '').trim() : '';

    const profileRows = document.querySelectorAll('.table-profile-info tr');
    const ageCell = profileRows[0] ? profileRows[0].querySelector('td:last-child') : null;
    const genderCell = profileRows[1] ? profileRows[1].querySelector('td:last-child') : null;
    const bloodTypeCell = profileRows[2] ? profileRows[2].querySelector('td:last-child') : null;
    const wardCell = profileRows[3] ? profileRows[3].querySelector('td:last-child') : null;
    const roomCell = profileRows[4] ? profileRows[4].querySelector('td:last-child') : null;
    const physicianCell = profileRows[5] ? profileRows[5].querySelector('td:last-child') : null;

    const age = ageCell ? (ageCell.querySelector('input') ? ageCell.querySelector('input').value.trim() : ageCell.textContent.trim()) : '';
    const gender = genderCell ? (genderCell.querySelector('select') ? genderCell.querySelector('select').value.trim() : genderCell.textContent.trim()) : '';
    const bloodType = bloodTypeCell ? (bloodTypeCell.querySelector('select') ? bloodTypeCell.querySelector('select').value.trim() : (bloodTypeCell.querySelector('input') ? bloodTypeCell.querySelector('input').value.trim() : bloodTypeCell.textContent.trim())) : '';
    const ward = wardCell ? (wardCell.querySelector('select') ? wardCell.querySelector('select').value.trim() : (wardCell.querySelector('input') ? wardCell.querySelector('input').value.trim() : wardCell.textContent.trim())) : '';
    const room = roomCell ? (roomCell.querySelector('select') ? roomCell.querySelector('select').value.trim() : (roomCell.querySelector('input') ? roomCell.querySelector('input').value.trim() : roomCell.textContent.trim())) : '';
    const physician = physicianCell ? (physicianCell.querySelector('select') ? physicianCell.querySelector('select').value.trim() : (physicianCell.querySelector('input') ? physicianCell.querySelector('input').value.trim() : physicianCell.textContent.trim())) : '';

    const requestedTests = [];
    document.querySelectorAll('.test-selection-card.checked').forEach(function(card) {
        const testName = card.querySelector('.font-weight-semibold');
        if (testName) {
            requestedTests.push(testName.textContent.trim());
        }
    });

    const labResults = [];
    const resultRows = document.querySelectorAll('.alignment-middle-table tbody tr:not(#lisNoResults)');
    resultRows.forEach(function(row) {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 5) {
            const param = cells[0].textContent.trim();
            const result = cells[1].textContent.trim();
            const range = cells[2].textContent.trim();
            const status = cells[4].textContent.trim();
            labResults.push({ param, result, range, status });
        }
    });

    let suggestions = [];

    if (requestedTests.length > 0) {
        suggestions.push('<strong>Requested Laboratory Tests (' + requestedTests.length + '):</strong> ' + requestedTests.join(', ') + '. Ensure all requested exams have corresponding recorded results before sign-off.');
    } else {
        suggestions.push('<strong>No tests selected.</strong> Please select at least one requested laboratory test from the test selection cards above.');
    }

    if (requestedTests.includes('CBC')) {
        const cbcResult = labResults.find(function(r) { return r.param.toLowerCase().includes('hemoglobin') || r.param.toLowerCase().includes('cbc'); });
        if (cbcResult) {
            if (cbcResult.status.toLowerCase().includes('normal')) {
                suggestions.push('<strong>CBC Result:</strong> Hemoglobin is within normal range (' + cbcResult.result + ' g/dL). No immediate action required for ' + patient + '.');
            } else if (cbcResult.status.toLowerCase().includes('high') || cbcResult.status.toLowerCase().includes('critical')) {
                suggestions.push('<strong>CBC Alert:</strong> Hemoglobin is ' + cbcResult.status.toLowerCase() + ' (' + cbcResult.result + ' g/dL). Recommend follow-up consultation with ' + physician + ' for ' + patient + '.');
            }
        } else {
            suggestions.push('<strong>CBC Pending:</strong> Complete Blood Count has been requested but no result recorded yet. Enter CBC parameters via "Enter Additional Parameters" to proceed.');
        }
    }

    if (requestedTests.includes('Blood Sugar')) {
        const sugarResult = labResults.find(function(r) { return r.param.toLowerCase().includes('blood sugar') || r.param.toLowerCase().includes('glucose'); });
        if (sugarResult) {
            if (sugarResult.status.toLowerCase().includes('high')) {
                suggestions.push('<strong>Blood Sugar Alert:</strong> Fasting Blood Sugar is elevated (' + sugarResult.result + ' mg/dL). Recommend dietary consultation and possible HbA1c follow-up for ' + patient + '.');
            } else if (sugarResult.status.toLowerCase().includes('normal')) {
                suggestions.push('<strong>Blood Sugar Normal:</strong> Fasting Blood Sugar is within normal range (' + sugarResult.result + ' mg/dL). No immediate action required.');
            }
        } else {
            suggestions.push('<strong>Blood Sugar Pending:</strong> Blood Sugar test has been requested. Ensure patient maintains proper fasting protocol prior to sample collection.');
        }
    }

    if (requestedTests.includes('Urinalysis')) {
        const urineResult = labResults.find(function(r) { return r.param.toLowerCase().includes('urine') || r.param.toLowerCase().includes('urinalysis'); });
        if (urineResult) {
            if (urineResult.status.toLowerCase().includes('normal')) {
                suggestions.push('<strong>Urinalysis Normal:</strong> Urine Glucose is ' + urineResult.result + '. No abnormalities detected.');
            } else {
                suggestions.push('<strong>Urinalysis Review:</strong> Urine result shows ' + urineResult.status.toLowerCase() + '. Further investigation may be needed for ' + patient + '.');
            }
        } else {
            suggestions.push('<strong>Urinalysis Pending:</strong> Urinalysis has been requested. Ensure proper midstream clean-catch collection technique is followed.');
        }
    }

    if (requestedTests.includes('Lipid Profile')) {
        suggestions.push('<strong>Lipid Profile:</strong> Lipid profile test has been requested for ' + patient + '. Ensure patient fasts for 12 hours before sample collection for accurate results.');
    }

    const criticalResults = labResults.filter(function(r) { return r.status.toLowerCase().includes('critical') || r.status.toLowerCase().includes('high') || r.status.toLowerCase().includes('low'); });
    if (criticalResults.length > 0) {
        suggestions.push('<strong>Critical Results (' + criticalResults.length + '):</strong> Immediate review required for ' + criticalResults.map(function(r) { return r.param; }).join(', ') + '. Notify ' + physician + ' for urgent clinical correlation.');
    }

    const normalResults = labResults.filter(function(r) { return r.status.toLowerCase().includes('normal'); });
    if (normalResults.length > 0) {
        suggestions.push('<strong>Normal Results (' + normalResults.length + '):</strong> ' + normalResults.map(function(r) { return r.param; }).join(', ') + ' are within normal limits. These can be signed off to clear the pending queue.');
    }

    if (noteText.toLowerCase().includes('fasting')) {
        suggestions.push('<strong>Fasting Protocol:</strong> Documented fasting period is noted. Verify glucose results against the documented fasting duration for ' + patient + '.');
    }

    if (ward.toLowerCase().includes('icu') || ward.toLowerCase().includes('intensive')) {
        suggestions.push('<strong>ICU Patient:</strong> ' + patient + ' is in ICU (' + ward + ' ' + room + '). Prioritize critical results and ensure expedited reporting to the attending physician.');
    }

    if (bloodType) {
        suggestions.push('<strong>Blood Type:</strong> ' + patient + '\'s blood type is ' + bloodType + '. Ensure compatibility checks are in place for any transfusion requirements.');
    }

    if (age) {
        suggestions.push('<strong>Patient Age:</strong> ' + patient + ' is ' + age + ' years old. Consider age-specific reference ranges when reviewing lab results.');
    }

    if (gender) {
        suggestions.push('<strong>Patient Gender:</strong> ' + patient + ' is ' + gender + '. Note gender-specific reference ranges may apply to certain parameters.');
    }

    if (suggestions.length === 0) {
        suggestions.push('<strong>Verify normal results first.</strong> The Normal results are good candidates for manual sign-off to clear the pending queue faster.');
        suggestions.push('<strong>Review high values.</strong> Any abnormal results should be cross-referenced with ' + patient + '\'s history before approval.');
        suggestions.push('<strong>Prioritize by urgency.</strong> Tackle Critical and High results ahead of Normal ones to shorten clinician wait time.');
    }

    window._lastMediSenseSuggestions = suggestions;
    return suggestions;
}

function renderMediSenseSuggestions(suggestions) {
    const container = document.getElementById('mediSenseSuggestions');
    if (!container) return;
    container.innerHTML = '';
    suggestions.forEach(function(text) {
        const div = document.createElement('div');
        div.className = 'medisense-advice';
        div.innerHTML = text;
        container.appendChild(div);
    });
}

function applyMediSenseToClinicalNote(suggestions) {
    const clinicalNote = document.querySelector('.clinical-note-textarea');
    if (!clinicalNote || suggestions.length === 0) return;

    const timestamp = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const mediSenseSection = '\n\n--- MediSense AI Suggestions (' + timestamp + ') ---\n';
    const bulletPoints = suggestions.map(function(s) {
        return '• ' + s.replace(/<[^>]+>/g, '').trim();
    }).join('\n');

    const currentNote = clinicalNote.textContent || '';
    const updated = currentNote.includes('MediSense AI Suggestions')
        ? currentNote
        : (currentNote + mediSenseSection + bulletPoints);

    clinicalNote.textContent = updated;

    clinicalNote.scrollIntoView({ behavior: 'smooth', block: 'center' });
    clinicalNote.style.transition = 'box-shadow 0.3s ease';
    clinicalNote.style.boxShadow = '0 0 0 4px rgba(46, 213, 115, 0.3)';
    setTimeout(function() {
        clinicalNote.style.boxShadow = '';
    }, 2000);
}

/* ========================================================
    LIS - Search Bar Table Filter
    ======================================================== */
function setupSearchFilter() {
    const input = document.getElementById('lisSearchInput');
    const clearBtn = document.getElementById('lisSearchClear');
    const table = document.querySelector('.alignment-middle-table');
    if (!input || !table) return;

    const rows = table.querySelectorAll('tbody tr:not(#lisNoResults)');
    const noResults = document.getElementById('lisNoResults');

    function applyFilter() {
        const term = input.value.trim().toLowerCase();
        clearBtn.classList.toggle('d-none', term === '');
        let visible = 0;

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const match = term === '' || text.includes(term);
            row.classList.toggle('d-none', !match);
            if (match) visible++;
        });

        if (noResults) {
            noResults.classList.toggle('d-none', visible !== 0);
        }
    }

    input.addEventListener('input', applyFilter);
    input.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            input.value = '';
            applyFilter();
            input.blur();
        }
    });
    clearBtn.addEventListener('click', function () {
        input.value = '';
        applyFilter();
        input.focus();
    });
}

/* ========================================================
    LIS - Search Bar Autocomplete / Quick Jump
    ======================================================== */
function setupSearchAutocomplete() {
    const input = document.getElementById('lisSearchInput');
    const table = document.querySelector('.alignment-middle-table');
    if (!input || !table) return;

    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    const rows = tbody.querySelectorAll('tr:not(#lisNoResults)');
    const suggestions = [];
    rows.forEach(row => {
        const firstCell = row.querySelector('td');
        if (firstCell) {
            const strongEl = firstCell.querySelector('.font-weight-semibold');
            const text = strongEl ? strongEl.textContent.trim() : firstCell.textContent.trim();
            suggestions.push({ text, row });
        }
    });

    const dropdown = document.createElement('div');
    dropdown.className = 'search-autocomplete-dropdown';

    const container = input.closest('.search-bar-container');
    if (!container) return;
    container.style.position = 'relative';
    container.appendChild(dropdown);

    function render(items) {
        dropdown.innerHTML = '';
        if (!items.length) {
            dropdown.classList.add('d-none');
            return;
        }
        dropdown.classList.remove('d-none');
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'search-autocomplete-item';
            div.textContent = item.text;
            div.addEventListener('click', function () {
                input.value = item.text;
                dropdown.classList.add('d-none');

                input.dispatchEvent(new Event('input'));

                requestAnimationFrame(function () {
                    item.row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    item.row.classList.add('search-highlight');
                    setTimeout(function () {
                        item.row.classList.remove('search-highlight');
                    }, 2000);
                });
            });
            dropdown.appendChild(div);
        });
    }

    input.addEventListener('focus', function () {
        const term = input.value.trim().toLowerCase();
        const items = term ? suggestions.filter(function (s) { return s.text.toLowerCase().includes(term); }) : suggestions;
        render(items);
    });

    input.addEventListener('input', function () {
        const term = input.value.trim().toLowerCase();
        const items = term ? suggestions.filter(function (s) { return s.text.toLowerCase().includes(term); }) : suggestions;
        render(items);
    });

    document.addEventListener('click', function (e) {
        if (!container.contains(e.target)) {
            dropdown.classList.add('d-none');
        }
    });
}

/* ========================================================
    LIS - Print Single Lab Result Row
    ======================================================== */
function printRowResult(row) {
    const cells = row.querySelectorAll('td');
    if (!cells.length) return;

    const paramCell = cells[0];
    const resultCell = cells[1];
    const rangeCell = cells[2];
    const unitCell = cells[3];
    const statusCell = cells[4];

    const paramText = paramCell.textContent.trim();
    const resultText = resultCell.textContent.trim();
    const rangeText = rangeCell.textContent.trim();
    const unitText = unitCell.textContent.trim();
    const statusText = statusCell.textContent.trim();

    const patientNameEl = document.getElementById('patientNameDisplay');
    const patientIdEl = document.getElementById('patientIdDisplay');

    function profileFieldValue(field) {
        if (!field) return '';
        const input = field.querySelector('input');
        const select = field.querySelector('select');
        if (input) {
            const val = input.value.trim();
            if (val !== '' && val !== input.placeholder) return val;
            const text = (field.textContent || '').trim();
            if (text && text !== input.placeholder) return text;
        }
        if (select) {
            const val = select.value.trim();
            if (val !== '') return val;
        }
        return (field.textContent || '').trim();
    }

    const ageCell = document.querySelector('.patient-editable[data-field="age"]');
    const genderCell = document.querySelector('.patient-editable[data-field="gender"]');
    const bloodTypeCell = document.querySelector('.patient-editable[data-field="bloodType"]');
    const wardCell = document.querySelector('.patient-editable[data-field="ward"]');
    const roomCell = document.querySelector('.patient-editable[data-field="room"]');
    const physicianCell = document.querySelector('.patient-editable[data-field="physician"]');

    const age = profileFieldValue(ageCell);
    const gender = profileFieldValue(genderCell);
    const bloodType = profileFieldValue(bloodTypeCell);
    const ward = profileFieldValue(wardCell);
    const room = profileFieldValue(roomCell);
    const physician = profileFieldValue(physicianCell);

    const patientName = profileFieldValue(patientNameEl);
    const patientId = profileFieldValue(patientIdEl);


    const clinicalNote = document.querySelector('.clinical-note-textarea');
    const clinicalNoteText = clinicalNote ? (clinicalNote.textContent || '').trim() : '';

    const mediSenseSuggestions = window._lastMediSenseSuggestions || [];
    const mediSenseHtml = mediSenseSuggestions.map(function(s) {
        return '<div class="suggestion-item" style="margin-top: 8px; padding: 10px; background: #f4faf7; border-left: 3px solid #2ed573; border-radius: 6px; font-size: 0.9rem; color: #1f3b30;">' + s + '</div>';
    }).join('');

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
        alert('Please allow popups to print the lab result.');
        return;
    }

    printWindow.document.write('<!DOCTYPE html><html><head><title>Print Lab Result</title>');
    printWindow.document.write('<link href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/5.3.3/css/bootstrap.min.css" rel="stylesheet">');
    printWindow.document.write('<style>body{padding:40px;font-family:system-ui,-apple-system,sans-serif;color:#1e293b;} .print-header{text-align:center;margin-bottom:30px;border-bottom:2px solid #066838;padding-bottom:20px;} .print-header h1{margin:0;font-size:1.5rem;color:#066838;} .print-header p{margin:5px 0 0;color:#64748b;} .patient-section{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:30px;} .patient-section h3{margin:0 0 15px;font-size:1.1rem;color:#066838;} .patient-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 40px;} .patient-item{display:grid;grid-template-columns:120px 1fr;align-items:baseline;} .patient-label{color:#64748b;font-size:0.85rem;} .patient-value{font-weight:600;color:#1e293b;text-align:left;} .result-table{width:100%;border-collapse:collapse;margin-top:20px;} .result-table th,.result-table td{padding:12px 16px;text-align:left;vertical-align:top;border-bottom:1px solid #e2e8f0;} .result-table th{background:#f8fafc;font-weight:600;color:#334155;width:220px;} .result-table td{color:#1e293b;} .status-badge{display:inline-block;padding:4px 12px;border-radius:6px;font-size:0.85rem;font-weight:600;} .status-normal{background:#e8f8f0;color:#065f46;} .status-high{background:#fcece9;color:#b91c1c;} .status-low{background:#fcece9;color:#b91c1c;} .status-critical{background:#fcece9;color:#b91c1c;} .section-title{margin-top:30px;margin-bottom:15px;font-size:1.1rem;color:#066838;border-bottom:1px solid #e2e8f0;padding-bottom:8px;} .clinical-note-box{background:#f8fafc;border-radius:8px;padding:15px;white-space:pre-wrap;font-size:0.9rem;color:#334155;line-height:1.6;} .suggestions-section{margin-top:30px;} .suggestion-item{margin-top:8px;padding:10px;background:#f4faf7;border-left:3px solid #2ed573;border-radius:6px;font-size:0.9rem;color:#1f3b30;} .footer{margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0;text-align:center;color:#94a3b8;font-size:0.8rem;} @media print{body{padding:0;} .no-print{display:none;}}</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<div class="print-header"><h1>Laboratory Information System</h1><p>Lab Result Report</p></div>');
    printWindow.document.write('<div class="patient-section"><h3>Patient Profile</h3><div class="patient-grid">');
    printWindow.document.write('<div class="patient-item"><span class="patient-label">Name:</span><span class="patient-value">' + patientName + '</span></div>');
    printWindow.document.write('<div class="patient-item"><span class="patient-label">Patient ID:</span><span class="patient-value">' + patientId + '</span></div>');
    printWindow.document.write('<div class="patient-item"><span class="patient-label">Age:</span><span class="patient-value">' + age + '</span></div>');
    printWindow.document.write('<div class="patient-item"><span class="patient-label">Gender:</span><span class="patient-value">' + gender + '</span></div>');
    printWindow.document.write('<div class="patient-item"><span class="patient-label">Blood Type:</span><span class="patient-value">' + bloodType + '</span></div>');
    printWindow.document.write('<div class="patient-item"><span class="patient-label">Ward:</span><span class="patient-value">' + ward + '</span></div>');
    printWindow.document.write('<div class="patient-item"><span class="patient-label">Room:</span><span class="patient-value">' + room + '</span></div>');
    printWindow.document.write('<div class="patient-item"><span class="patient-label">Physician:</span><span class="patient-value">' + physician + '</span></div>');
    printWindow.document.write('</div></div>');
    printWindow.document.write('<table class="result-table">');
    const statusClassMap = { 'Normal': 'status-normal', 'High': 'status-high', 'Low': 'status-low', 'Critical': 'status-critical' };
    const statusBadgeClass = statusClassMap[statusText] || 'status-normal';
    printWindow.document.write('<tr><th>Parameter</th><td>' + paramText.replace(/\s+/g, ' ').trim() + '</td></tr>');
    printWindow.document.write('<tr><th>Result</th><td>' + resultText + '</td></tr>');
    printWindow.document.write('<tr><th>Reference Range</th><td>' + rangeText + '</td></tr>');
    printWindow.document.write('<tr><th>Unit</th><td>' + unitText + '</td></tr>');
    printWindow.document.write('<tr><th>Status</th><td><span class="status-badge ' + statusBadgeClass + '">' + statusText + '</span></td></tr>');
    printWindow.document.write('</table>');

    if (clinicalNoteText) {
        printWindow.document.write('<div class="section-title">Clinical Note</div>');
        printWindow.document.write('<div class="clinical-note-box">' + clinicalNoteText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>');
    }

    if (mediSenseSuggestions.length > 0) {
        printWindow.document.write('<div class="section-title suggestions-section"><strong>MediSense AI Suggestions</strong></div>');
        printWindow.document.write(mediSenseHtml);
    }

    printWindow.document.write('<div class="footer"><p>Generated by HIS - Diagnostic Treatment, and Clinical Services</p><p>' + new Date().toLocaleString() + '</p></div>');
    printWindow.document.write('<div class="no-print text-center mt-4"><button onclick="window.print()" class="btn btn-primary">Print / Save as PDF</button></div>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();

    printWindow.onload = function() {
        printWindow.focus();
        setTimeout(function() {
            printWindow.print();
        }, 250);
    };
}

/* ========================================================
    LIS - Pending Validation Queue
    ======================================================== */
const VALIDATION_QUEUE_KEY = 'lis_validation_queue';

function getValidationQueue() {
    const saved = JSON.parse(localStorage.getItem(VALIDATION_QUEUE_KEY) || 'null');
    if (Array.isArray(saved) && saved.length) return saved;

    const queue = [
        { id: 1, patient: 'Mark Cortez', param: 'Hemoglobin (CBC)', result: '13.1', status: 'Normal' },
        { id: 2, patient: 'Rynella Biclar', param: 'Fasting Blood Sugar', result: '118', status: 'High' },
        { id: 3, patient: 'Lizelle Ongay', param: 'Urine Glucose', result: 'Negative', status: 'Normal' }
    ];

    localStorage.setItem(VALIDATION_QUEUE_KEY, JSON.stringify(queue));
    return queue;
}

function setValidationQueue(queue) {
    localStorage.setItem(VALIDATION_QUEUE_KEY, JSON.stringify(queue));
    updatePendingCount();
}

function updatePendingCount() {
    const queue = getValidationQueue().filter(function(item) {
        return item.patient && item.patient !== 'Unassigned Patient' && item.patient.trim() !== '';
    });
    const actualCount = queue.length;
    const pendingCountEl = document.getElementById('pendingCount');
    if (pendingCountEl) pendingCountEl.textContent = actualCount;
    const queueCountEl = document.getElementById('queueCount');
    if (queueCountEl) queueCountEl.textContent = actualCount;
}

function renderValidationQueue(filter) {
    const tbody = document.getElementById('validationQueueBody');
    if (!tbody) return;
    const queue = getValidationQueue().filter(function(item) {
        return item.patient && item.patient !== 'Unassigned Patient' && item.patient.trim() !== '';
    });
    const term = (filter || '').trim().toLowerCase();
    const filtered = queue.filter(function(item) {
        return !term || item.patient.toLowerCase().includes(term) || item.param.toLowerCase().includes(term);
    });

    tbody.innerHTML = '';
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No completed patient profiles in the validation queue.</td></tr>';
    } else {
        filtered.forEach(function(item) {
            const tr = document.createElement('tr');
            const statusClass = item.status === 'Normal' ? 'bg-soft-success text-success' : 'bg-soft-danger text-danger';
            tr.innerHTML =
                '<td class="ps-3 py-2 font-weight-medium text-dark">' + item.patient + '</td>' +
                '<td class="py-2">' + item.param + '</td>' +
                '<td class="py-2 font-weight-bold text-dark">' + item.result + '</td>' +
                '<td class="py-2"><span class="badge-status-pill ' + statusClass + ' text-uppercase">' + item.status + '</span></td>' +
                '<td class="py-2 pe-3 text-end d-flex align-items-center justify-content-end gap-2">' +
                    '<input type="checkbox" class="form-check-input queue-row-check m-0" data-id="' + item.id + '" title="Select for validation">' +
                    '<button type="button" class="btn btn-sm btn-save-changes queue-validate-one" data-id="' + item.id + '">Validate</button>' +
                '</td>';
            tbody.appendChild(tr);
        });
    }
    updatePendingCount();
}

function syncValidationQueueFromResults() {
    const patientNameEl = document.getElementById('patientNameDisplay');
    const patientName = patientNameEl ? (patientNameEl.querySelector('input') ? patientNameEl.querySelector('input').value.trim() : (patientNameEl.textContent || '').trim()) : '';
    const patientLabel = patientName || 'Unassigned Patient';

    if (!patientName || !isPatientProfileComplete()) {
        setValidationQueue([]);
        const search = document.getElementById('queueSearch');
        renderValidationQueue(search ? search.value : '');
        return;
    }

    const queue = [];
    const resultRows = document.querySelectorAll('.alignment-middle-table tbody tr:not(#lisNoResults)');
    let idCounter = 1;
    resultRows.forEach(function(row) {
        const cells = row.querySelectorAll('td');
        if (cells.length < 5) return;
        const paramEl = cells[0].querySelector('.font-weight-semibold');
        const param = paramEl ? paramEl.textContent.trim() : cells[0].textContent.replace(/\s+/g, ' ').trim();
        const result = cells[1].textContent.trim();
        const status = cells[4].textContent.trim();
        queue.push({ id: idCounter++, patient: patientLabel, param: param, result: result, status: status });
    });

    if (queue.length === 0) {
        queue.push({ id: idCounter++, patient: patientLabel, param: 'No recorded results', result: '—', status: 'Normal' });
    }

    setValidationQueue(queue);
    const search = document.getElementById('queueSearch');
    renderValidationQueue(search ? search.value : '');
}

function appendPendingToResults() {
    if (!isPatientProfileComplete()) {
        return;
    }

    const tbody = document.querySelector('.alignment-middle-table tbody');
    if (!tbody) return;
    const statusClass = {
        'Normal': 'bg-soft-success text-success',
        'High': 'bg-soft-danger text-danger',
        'Low': 'bg-soft-danger text-danger',
        'Critical': 'bg-soft-danger text-danger'
    };

    getValidationQueue().forEach(function(item) {
        const tr = document.createElement('tr');
        tr.className = 'border-bottom';
        tr.innerHTML =
            '<td class="ps-3 py-3"><span class="d-block font-weight-semibold text-dark">' + item.param + '</span></td>' +
            '<td class="py-3"><span class="result-value font-weight-bold text-dark">' + item.result + '</span></td>' +
            '<td class="py-3 text-muted">—</td>' +
            '<td class="py-3 text-muted">N/A</td>' +
            '<td class="py-3 status-col"><span class="badge-status-pill ' + (statusClass[item.status] || 'bg-soft-secondary text-muted') + ' text-uppercase">' + item.status + '</span></td>' +
            '<td class="py-3 pe-3 sticky-action"><button type="button" class="btn btn-table-edit"><i class="bi bi-pencil"></i></button><button type="button" class="btn btn-table-print"><i class="bi bi-printer"></i></button><button type="button" class="btn btn-table-delete"><i class="bi bi-trash"></i></button></td>';
        tbody.appendChild(tr);
    });
}

function setupValidationQueue() {
    const search = document.getElementById('queueSearch');
    const selectAll = document.getElementById('queueSelectAll');
    const validateSelected = document.getElementById('queueValidateSelected');

    if (search) {
        search.addEventListener('input', function() {
            renderValidationQueue(search.value);
        });
    }

    if (selectAll) {
        selectAll.addEventListener('change', function() {
            document.querySelectorAll('.queue-row-check').forEach(function(cb) {
                cb.checked = selectAll.checked;
            });
        });
    }

    if (validateSelected) {
        validateSelected.addEventListener('click', function() {
            const ids = Array.from(document.querySelectorAll('.queue-row-check:checked')).map(function(cb) {
                return parseInt(cb.dataset.id, 10);
            });
            if (ids.length === 0) {
                alert('Please select at least one record to validate.');
                return;
            }
            const queue = getValidationQueue().filter(function(item) {
                return ids.indexOf(item.id) === -1;
            });
            setValidationQueue(queue);
            renderValidationQueue(search ? search.value : '');
        });
    }

    document.addEventListener('click', function(e) {
        const one = e.target.closest('.queue-validate-one');
        if (one) {
            const id = parseInt(one.dataset.id, 10);
            const queue = getValidationQueue().filter(function(item) {
                return item.id !== id;
            });
            setValidationQueue(queue);
            renderValidationQueue(search ? search.value : '');
        }
    });

    localStorage.removeItem('lis_validation_queue');
    updatePendingCount();
}

window.syncValidationQueueFromResults = syncValidationQueueFromResults;