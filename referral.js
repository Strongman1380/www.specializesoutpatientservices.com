/**
 * S.O.S. Counseling - Referral Form Handler
 * Sends referral submissions via EmailJS + Google Sheets logging
 */

// EmailJS Referral Template — update this once you create the referral template in EmailJS
const EMAILJS_REFERRAL_TEMPLATE = 'REPLACE_WITH_REFERRAL_TEMPLATE_ID';

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

            // Build EmailJS template params
            const templateParams = {
                date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                ref_date: data['Date'] || '',
                referral_source: data['Referral Source'] || '',
                referral_phone: data['Referral Phone'] || '',
                referral_fax: data['Referral Fax'] || '',
                referral_address: data['Referral Address'] || '',
                client_name: data['Client Name'] || '',
                client_address: data['Client Address'] || '',
                client_dob: data['Client DOB'] || '',
                age: data['Age'] || '',
                gender: data['Gender'] || '',
                residing_with: data['Residing With'] || '',
                client_residence: data['Client Residence Address'] || '',
                contact_number: data['Contact Number'] || '',
                services_requested: data['Services Requested'] || '',
                presenting_concerns: data['Presenting Concerns'] || '',
                diagnosis: data['Diagnosis'] || '',
                therapist: data['Therapist'] || '',
                service_location: data['Service Location'] || '',
                other_location: data['Other Location'] || '',
                insurance_type: data['Insurance Type'] || '',
                policy_number: data['Policy Number'] || '',
                group_number: data['Group Number'] || '',
                insurance_phone: data['Insurance Phone'] || ''
            };

            // Send branded email via EmailJS
            await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_REFERRAL_TEMPLATE, templateParams);

            // Also log to Google Sheets via sendBeacon (fire-and-forget)
            navigator.sendBeacon(REFERRAL_SHEETS_URL, JSON.stringify(data));

            showToast('Referral submitted successfully! We will be in touch soon.', 'success');
            form.reset();
            setDefaultDate();
            document.querySelector('.referral-form-section').scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('EmailJS error:', error);
            showToast('Something went wrong. Please try again or call us directly.', 'error');
        }

        submitBtn.innerHTML = originalHTML;
        submitBtn.disabled = false;
    });
}
