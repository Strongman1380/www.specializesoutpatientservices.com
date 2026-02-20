/**
 * S.O.S. Counseling - Referral Form Handler
 * Sends referral submissions via Google Apps Script (Sheets + branded email)
 */

// Google Sheets Web App URL
const REFERRAL_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbxBTPe_V2HYEc6R2rPjR1Gw1SV8aSA4k62DFHnghAnSK4Mjla9HeFMKu8uSCULoJ_ienw/exec';

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
 * Handle referral form submission via Google Apps Script
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
            const data = Object.fromEntries(formData);

            // Combine multiple checkbox values
            const services = formData.getAll('Services Requested');
            data['Services Requested'] = services.join(', ');
            data.formType = 'referral';

            // Remove honeypot field
            delete data.botcheck;

            await fetch(REFERRAL_SHEETS_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(data)
            });

            // no-cors means we can't read the response, so assume success
            showToast('Referral submitted successfully! We will be in touch soon.', 'success');
            form.reset();
            setDefaultDate();
            document.querySelector('.referral-form-section').scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            showToast('Network error. Please check your connection or call us at 308-856-9949.', 'error');
        }

        submitBtn.innerHTML = originalHTML;
        submitBtn.disabled = false;
    });
}
