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
    initProviderDropdowns();
    initCtaIntakeToggle();
    initCtaSubToggles();
    initPrintLogoSwap();
    // Start with CTA section fields disabled (excluded from FormData until shown)
    hideCTAIntakeSection(false);
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
 * Show/hide provider dropdowns based on which services are checked.
 * Therapy services → therapist dropdown
 * CTA → CTA dropdown
 */
function initProviderDropdowns() {
    const serviceCheckboxes = document.querySelectorAll('input[name="Services Requested"]');
    const providerArea = document.getElementById('provider-selection-area');
    const therapistGroup = document.getElementById('therapist-dropdown-group');
    const ctaGroup = document.getElementById('cta-dropdown-group');

    if (!providerArea) return;

    const therapyValues = [
        'Youth & Adolescent Counseling',
        'Family Therapy',
        'Adult Individual Therapy',
        'Trauma & PTSD Treatment',
        'Bilingual Services (Spanish)'
    ];

    function updateProviderVisibility() {
        const checked = Array.from(document.querySelectorAll('input[name="Services Requested"]:checked'))
            .map(cb => cb.value);

        const hasTherapy = checked.some(v => therapyValues.includes(v));
        const hasCta = checked.includes('Community Treatment Aide (CTA)');

        therapistGroup.style.display = hasTherapy ? 'block' : 'none';
        ctaGroup.style.display = hasCta ? 'block' : 'none';
        providerArea.style.display = (hasTherapy || hasCta) ? 'block' : 'none';

        // If CTA unchecked, reset CTA dropdown and hide intake section
        if (!hasCta) {
            const ctaSelect = document.getElementById('preferred-cta');
            if (ctaSelect) ctaSelect.value = '';
            hideCTAIntakeSection(true);
        }
    }

    serviceCheckboxes.forEach(cb => cb.addEventListener('change', updateProviderVisibility));
}

/**
 * Show/hide the CTA Intake section based on CTA dropdown selection.
 */
function initCtaIntakeToggle() {
    const ctaSelect = document.getElementById('preferred-cta');
    if (!ctaSelect) return;

    ctaSelect.addEventListener('change', function() {
        if (this.value) {
            showCTAIntakeSection();
        } else {
            hideCTAIntakeSection(true);
        }
    });
}

function showCTAIntakeSection() {
    const section = document.getElementById('cta-intake-section');
    if (!section) return;
    section.style.display = 'block';
    section.querySelectorAll('input, select, textarea').forEach(el => el.disabled = false);
    setTimeout(() => section.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
}

/**
 * @param {boolean} clearFields - if true, reset all field values
 */
function hideCTAIntakeSection(clearFields) {
    const section = document.getElementById('cta-intake-section');
    if (!section) return;
    section.style.display = 'none';
    section.querySelectorAll('input, select, textarea').forEach(el => {
        el.disabled = true;
        if (clearFields) {
            if (el.type === 'radio' || el.type === 'checkbox') {
                el.checked = false;
            } else {
                el.value = '';
            }
        }
    });
    // Also hide any conditional sub-groups inside CTA section
    if (clearFields) {
        ['medicaid-details', 'medicaid-details-2', 'medicaid-details-3',
         'other-ins-details', 'other-ins-details-2', 'other-ins-details-3',
         'other-ins-details-4', 'other-ins-details-5', 'other-ins-details-6',
         'email-address-group'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
    }
}

/**
 * Conditional sub-toggles inside the CTA intake section:
 * Medicaid yes/no → show Medicaid details
 * Other insurance yes/no → show insurer details
 * Has email yes/no → show email address field
 */
function initCtaSubToggles() {
    // Medicaid
    document.querySelectorAll('input[name="Medicaid"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const show = this.value === 'Yes';
            ['medicaid-details', 'medicaid-details-2', 'medicaid-details-3'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = show ? 'block' : 'none';
            });
        });
    });

    // Other insurance
    document.querySelectorAll('input[name="Other Insurance"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const show = this.value === 'Yes';
            ['other-ins-details', 'other-ins-details-2', 'other-ins-details-3',
             'other-ins-details-4', 'other-ins-details-5', 'other-ins-details-6'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = show ? 'block' : 'none';
            });
        });
    });

    // Has email
    document.querySelectorAll('input[name="Has Email"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const emailGroup = document.getElementById('email-address-group');
            if (emailGroup) emailGroup.style.display = this.value === 'Yes' ? 'block' : 'none';
        });
    });
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
 * Swap the print header logo based on the selected preferred therapist.
 * Cindy, Jenna, and Trey each have their own logo; all others use the SOS logo.
 */
function initPrintLogoSwap() {
    const select = document.getElementById('preferred-therapist');
    if (!select) return;

    function updateLogo() {
        const val = select.value;
        document.querySelectorAll('.print-logo').forEach(img => {
            const therapist = img.getAttribute('data-therapist');
            const isMatch = therapist === val ||
                (therapist === '' && (
                    val === 'First Available' ||
                    val === 'Alisha Thompson, PLMHP PCMSW' ||
                    !val
                ));
            img.classList.toggle('print-logo--active', isMatch);
        });
    }

    select.addEventListener('change', updateLogo);
    updateLogo(); // set initial state
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
                // Note: CTA intake fields are only included in FormData when section is visible
                // (disabled attribute is removed on show, added on hide)
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
                // Reset dynamic sections
                hideCTAIntakeSection(false); // fields already cleared by form.reset()
                const providerArea = document.getElementById('provider-selection-area');
                if (providerArea) providerArea.style.display = 'none';
                const therapistGroup = document.getElementById('therapist-dropdown-group');
                if (therapistGroup) therapistGroup.style.display = 'none';
                const ctaGroup = document.getElementById('cta-dropdown-group');
                if (ctaGroup) ctaGroup.style.display = 'none';
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
