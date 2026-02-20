/**
 * S.O.S. Counseling - Referral Form Handler
 * Sends referral submissions via Web3Forms + Google Sheets logging
 */

// Web3Forms API URL
const WEB3FORMS_REFERRAL_URL = 'https://api.web3forms.com/submit';

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
 * Handle referral form submission via Web3Forms
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
            // Send via Web3Forms
            const formData = new FormData(form);
            const response = await fetch(WEB3FORMS_REFERRAL_URL, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                // Build data for Google Sheets
                const data = Object.fromEntries(formData);
                const services = formData.getAll('Services Requested');
                data['Services Requested'] = services.join(', ');
                data.formType = 'referral';
                delete data.botcheck;
                delete data.access_key;
                delete data.subject;
                delete data.from_name;
                delete data.cc;

                // Log to Google Sheets via sendBeacon (fire-and-forget)
                navigator.sendBeacon(REFERRAL_SHEETS_URL, JSON.stringify(data));

                showToast('Referral submitted successfully! We will be in touch soon.', 'success');
                form.reset();
                setDefaultDate();
                document.querySelector('.referral-form-section').scrollIntoView({ behavior: 'smooth' });
            } else {
                showToast('Something went wrong. Please try again or call us directly.', 'error');
            }
        } catch (error) {
            console.error('Form submission error:', error);
            showToast('Something went wrong. Please try again or call us directly.', 'error');
        }

        submitBtn.innerHTML = originalHTML;
        submitBtn.disabled = false;
    });
}
