(function () {
  'use strict';

  // ─── Page context detection ──────────────────────────────────────────────────
  // referral.html is the only page with id="referralForm"
  const PAGE_CONTEXT = document.getElementById('referralForm') ? 'referral' : 'home';

  // ─── Welcome messages per page ───────────────────────────────────────────────
  const WELCOME = {
    home: "Hi there! I'm the S.O.S. Counseling assistant. I can answer questions about our services, team, location, and how to get started. How can I help you today?",
    referral: "Hi! I'm here to help you fill out this referral form. Just tell me about the client and what services they need — I'll fill in the fields as we go. Want to start from the beginning?",
  };

  // ─── State ───────────────────────────────────────────────────────────────────
  const MAX_HISTORY = 20;
  let conversationHistory = [];
  let isOpen = false;
  let isLoading = false;
  let hasBeenOpened = false;

  // ─── Inject widget HTML ───────────────────────────────────────────────────────
  function buildWidget() {
    // Toggle button
    const toggle = document.createElement('button');
    toggle.id = 'sos-chat-toggle';
    toggle.className = 'sos-chat-toggle';
    toggle.setAttribute('aria-label', 'Open chat assistant');
    toggle.innerHTML = `
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <span class="sos-chat-badge" id="sos-chat-badge" aria-hidden="true"></span>
    `;

    // Chat panel
    const panel = document.createElement('div');
    panel.id = 'sos-chat-panel';
    panel.className = 'sos-chat-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'S.O.S. Counseling Chat Assistant');
    panel.innerHTML = `
      <div class="sos-chat-header">
        <div class="sos-chat-header-info">
          <div class="sos-chat-avatar" aria-hidden="true">SOS</div>
          <div>
            <p class="sos-chat-name">S.O.S. Counseling</p>
            <p class="sos-chat-status">Virtual Assistant</p>
          </div>
        </div>
        <button class="sos-chat-close" id="sos-chat-close" aria-label="Close chat">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="sos-chat-messages" id="sos-chat-messages" aria-live="polite" aria-atomic="false"></div>

      <div class="sos-chat-typing" id="sos-chat-typing" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>

      <form class="sos-chat-input-area" id="sos-chat-form" autocomplete="off">
        <textarea
          id="sos-chat-input"
          class="sos-chat-textarea"
          placeholder="Ask a question..."
          rows="1"
          aria-label="Type your message"
          maxlength="500"
        ></textarea>
        <button type="submit" class="sos-chat-send" id="sos-chat-send" aria-label="Send message">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    `;

    document.body.appendChild(toggle);
    document.body.appendChild(panel);
    return { toggle, panel };
  }

  // ─── Append a message bubble ──────────────────────────────────────────────────
  function appendBubble(role, text) {
    const container = document.getElementById('sos-chat-messages');
    const bubble = document.createElement('div');
    bubble.className = `sos-chat-bubble ${role}`;
    // Safely set text content (no XSS)
    bubble.textContent = text;
    container.appendChild(bubble);
    scrollToBottom();
  }

  // ─── Scroll messages to bottom ────────────────────────────────────────────────
  function scrollToBottom() {
    requestAnimationFrame(() => {
      const container = document.getElementById('sos-chat-messages');
      if (container) container.scrollTop = container.scrollHeight;
    });
  }

  // ─── Session storage helpers ──────────────────────────────────────────────────
  function saveHistory() {
    try {
      sessionStorage.setItem('sos_chat_history', JSON.stringify(conversationHistory));
    } catch (_) {}
  }

  function loadHistory() {
    try {
      const raw = sessionStorage.getItem('sos_chat_history');
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return [];
  }

  function saveOpenState(open) {
    try {
      sessionStorage.setItem('sos_chat_open', open ? 'true' : 'false');
    } catch (_) {}
  }

  function loadOpenState() {
    try {
      return sessionStorage.getItem('sos_chat_open') === 'true';
    } catch (_) {
      return false;
    }
  }

  // ─── Fill referral form fields ────────────────────────────────────────────────
  function fillFields(fields) {
    if (!fields || typeof fields !== 'object' || PAGE_CONTEXT !== 'referral') return;

    const filled = [];

    // Text / textarea / date / number fields — set by element ID
    const textIds = [
      'ref-date', 'client-name', 'client-address', 'referral-source',
      'referral-phone', 'referral-fax', 'referral-address', 'client-dob',
      'client-age', 'residing-with', 'client-address-2', 'contact-number',
      'presenting-concerns', 'diagnosis', 'other-location',
      'policy-number', 'group-number', 'insurance-phone',
      'cta-parent-names', 'cta-parental-availability', 'cta-referral-issues',
      'cta-pcp', 'cta-probation-officer', 'cta-referral-person',
      'cta-others-involved', 'cta-school', 'cta-grade', 'cta-email',
    ];

    textIds.forEach(id => {
      if (fields[id] !== undefined && fields[id] !== '') {
        const el = document.getElementById(id);
        if (el) { el.value = fields[id]; filled.push(id); }
      }
    });

    // Select / dropdown fields — set by ID then dispatch change
    const selectIds = ['client-gender', 'preferred-therapist', 'preferred-cta'];
    selectIds.forEach(id => {
      if (fields[id] !== undefined && fields[id] !== '') {
        const el = document.getElementById(id);
        if (el) {
          el.value = fields[id];
          el.dispatchEvent(new Event('change', { bubbles: true }));
          filled.push(id);
        }
      }
    });

    // Checkboxes — Services Requested (array of values)
    if (Array.isArray(fields.services) && fields.services.length > 0) {
      fields.services.forEach(service => {
        document.querySelectorAll('input[name="Services Requested"]').forEach(cb => {
          if (cb.value === service && !cb.checked) {
            cb.checked = true;
            cb.dispatchEvent(new Event('change', { bubbles: true }));
            filled.push('services:' + service);
          }
        });
      });
    }

    // Radio button fields — { fieldKey: [radioName, value] }
    const radioMap = {
      'service-location': 'Service Location',
      'insurance-type':   'Insurance Type',
      'medicaid':         'Medicaid',
      'other-insurance':  'Other Insurance',
      'has-email':        'Has Email',
      'can-print':        'Can Print Paperwork',
      'sees-therapist':   'Currently Sees Therapist',
    };

    Object.entries(radioMap).forEach(([key, name]) => {
      if (fields[key] !== undefined && fields[key] !== '') {
        document.querySelectorAll(`input[name="${name}"]`).forEach(radio => {
          if (radio.value === fields[key]) {
            radio.checked = true;
            radio.dispatchEvent(new Event('change', { bubbles: true }));
            filled.push(key);
          }
        });
      }
    });

    // Flash highlight on filled fields
    if (filled.length > 0) {
      flashFilledFields(filled);
    }
  }

  function flashFilledFields(filledIds) {
    filledIds.forEach(id => {
      // For composite keys like "services:Youth..." grab the checkbox element
      let el;
      if (id.startsWith('services:')) {
        const val = id.replace('services:', '');
        el = document.querySelector(`input[name="Services Requested"][value="${val}"]`);
        el = el ? el.closest('label') || el.parentElement : null;
      } else if (Object.keys({ 'service-location': 1, 'insurance-type': 1, 'medicaid': 1, 'other-insurance': 1, 'has-email': 1, 'can-print': 1, 'sees-therapist': 1 }).includes(id)) {
        // For radio buttons, flash the checked radio's parent
        const radioNames = { 'service-location': 'Service Location', 'insurance-type': 'Insurance Type', 'medicaid': 'Medicaid', 'other-insurance': 'Other Insurance', 'has-email': 'Has Email', 'can-print': 'Can Print Paperwork', 'sees-therapist': 'Currently Sees Therapist' };
        const checked = document.querySelector(`input[name="${radioNames[id]}"]:checked`);
        el = checked ? checked.closest('label') || checked.parentElement : null;
      } else {
        el = document.getElementById(id);
      }
      if (el) {
        el.classList.add('sos-field-filled');
        setTimeout(() => el.classList.remove('sos-field-filled'), 2000);
      }
    });
  }

  // ─── Open / Close panel ───────────────────────────────────────────────────────
  function openPanel() {
    isOpen = true;
    const panel = document.getElementById('sos-chat-panel');
    const badge = document.getElementById('sos-chat-badge');
    panel.classList.add('open');
    badge.style.display = 'none';
    saveOpenState(true);

    if (!hasBeenOpened) {
      hasBeenOpened = true;
      appendBubble('assistant', WELCOME[PAGE_CONTEXT]);
    }

    scrollToBottom();
    setTimeout(() => {
      const input = document.getElementById('sos-chat-input');
      if (input) input.focus();
    }, 250);
  }

  function closePanel() {
    isOpen = false;
    const panel = document.getElementById('sos-chat-panel');
    panel.classList.remove('open');
    saveOpenState(false);
  }

  // ─── Send a message to the API ────────────────────────────────────────────────
  async function sendMessage(userText) {
    const text = userText.trim();
    if (!text || isLoading) return;

    const input = document.getElementById('sos-chat-input');
    const sendBtn = document.getElementById('sos-chat-send');
    const typingEl = document.getElementById('sos-chat-typing');

    // Append user bubble and update state
    appendBubble('user', text);
    conversationHistory.push({ role: 'user', content: text });
    if (conversationHistory.length > MAX_HISTORY) {
      conversationHistory = conversationHistory.slice(-MAX_HISTORY);
    }
    saveHistory();

    // Reset input
    input.value = '';
    input.style.height = 'auto';

    // Show loading state
    isLoading = true;
    sendBtn.disabled = true;
    typingEl.classList.add('active');
    scrollToBottom();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationHistory,
          page: PAGE_CONTEXT,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      const reply = data.reply || 'Sorry, I could not generate a response. Please call us at 308-856-9949.';
      appendBubble('assistant', reply);

      // Populate form fields if the API returned any
      if (data.fields) fillFields(data.fields);

      // Store only the text reply in history (not the JSON fields)
      conversationHistory.push({ role: 'assistant', content: reply });
      if (conversationHistory.length > MAX_HISTORY) {
        conversationHistory = conversationHistory.slice(-MAX_HISTORY);
      }
      saveHistory();
    } catch (err) {
      appendBubble(
        'assistant',
        'Sorry, something went wrong. Please try again or call us directly at 308-856-9949.'
      );
    } finally {
      isLoading = false;
      sendBtn.disabled = false;
      typingEl.classList.remove('active');
      scrollToBottom();
    }
  }

  // ─── Initialize widget ────────────────────────────────────────────────────────
  function init() {
    const { toggle } = buildWidget();

    const input = document.getElementById('sos-chat-input');
    const form = document.getElementById('sos-chat-form');
    const closeBtn = document.getElementById('sos-chat-close');

    // Toggle open/close on button click
    toggle.addEventListener('click', () => {
      if (isOpen) {
        closePanel();
      } else {
        openPanel();
      }
    });

    // Close button
    closeBtn.addEventListener('click', closePanel);

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) closePanel();
    });

    // Form submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      sendMessage(input.value);
    });

    // Enter sends (Shift+Enter for newline)
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input.value);
      }
    });

    // Auto-expand textarea
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 100) + 'px';
    });

    // Restore session state
    const savedHistory = loadHistory();
    if (savedHistory.length > 0) {
      conversationHistory = savedHistory;
      hasBeenOpened = true;
      savedHistory.forEach((msg) => appendBubble(msg.role, msg.content));
    }

    if (loadOpenState()) {
      openPanel();
    }
  }

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
