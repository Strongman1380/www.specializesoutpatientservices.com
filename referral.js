/**
 * S.O.S. Counseling - Referral Form Handler
 * Sends referral submissions via Web3Forms API + Google Sheets
 */

// Google Sheets Web App URL — paste your URL from the setup guide
const REFERRAL_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbx9C39iXX5Otwo3oqU5DURxbM4FTcGH7gZ0xHFUkar9NIDD6C3-AniOWH3IviTp-zSKfg/exec';

document.addEventListener('DOMContentLoaded', function() {
    initReferralForm();
    initOtherLocationToggle();
    setDefaultDate();
});

/**
 * Set today's date as default
 */
function setDefaultDate() {
    const dateInput = document.getElementById('ref-date');
    if (dateInput && !dateInput.value) {
        dateInput.valueAsDate = new Date();
    }
}

/**
 * Show/hide "Other location" field based on radio selection
 */
function initOtherLocationToggle() {
    const locationRadios = document.querySelectorAll('input[name="Service Location"]');
    const otherGroup = document.getElementById('other-location-group');

    if (!otherGroup) return;

    locationRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'Other') {
                otherGroup.style.display = 'block';
            } else {
                otherGroup.style.display = 'none';
            }
        });
    });
}

/**
 * Send referral data to Google Sheets (fire-and-forget)
 */
function sendToGoogleSheets(formData) {
    if (REFERRAL_SHEETS_URL === 'YOUR_GOOGLE_SHEETS_URL_HERE') return;

    const data = Object.fromEntries(formData);
    // Combine multiple "Services Requested" checkbox values
    const services = formData.getAll('Services Requested');
    data['Services Requested'] = services.join(', ');
    data.formType = 'referral';

    // Remove Web3Forms-specific fields
    delete data.access_key;
    delete data.subject;
    delete data.from_name;
    delete data.botcheck;

    fetch(REFERRAL_SHEETS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).catch(function() {
        // Silent fail — email is the primary delivery method
    });
}

/**
 * Handle referral form submission via Web3Forms + Google Sheets
 */
function initReferralForm() {
    const form = document.getElementById('referralForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const submitBtn = document.getElementById('referralSubmitBtn');
        const originalHTML = submitBtn.innerHTML;

        // Validate at least one service is selected
        const servicesChecked = form.querySelectorAll('input[name="Services Requested"]:checked');
        if (servicesChecked.length === 0) {
            showToast('Please select at least one service.', 'error');
            return;
        }

        // Show loading state
        submitBtn.innerHTML = '<span>Submitting...</span>';
        submitBtn.disabled = true;

        try {
            const formData = new FormData(form);

            // Send to Google Sheets in background
            sendToGoogleSheets(formData);

            // Send email via Web3Forms
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                showToast('Referral submitted successfully! We will be in touch soon.', 'success');
                form.reset();
                setDefaultDate();
                document.querySelector('.referral-form-section').scrollIntoView({ behavior: 'smooth' });
            } else {
                showToast('There was a problem submitting the referral. Please call us at 308-856-9949.', 'error');
            }
        } catch (error) {
            showToast('Network error. Please check your connection or call us at 308-856-9949.', 'error');
        }

        submitBtn.innerHTML = originalHTML;
        submitBtn.disabled = false;
    });
}
