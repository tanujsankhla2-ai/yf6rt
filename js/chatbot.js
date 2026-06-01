/**
 * Muah Muah � AI Chatbot Widget � js/chatbot.js
 * ---------------------------------------------
 * ?  NO backend server required.
 *     Calls Google Gemini API directly from the browser.
 *
 * ??  SETUP: Paste your Gemini API key below (one line).
 *     Get a free key at: https://aistudio.google.com/app/apikey
 *
 * ??  TIP: In Google AI Studio ? restrict your key to only the
 *     Generative Language API, and add your website domain as an
 *     HTTP referrer so the key cannot be used from other sites.
 */

(() => {
    'use strict';

    // ------------------------------------------------------------
    //  ??  CONFIG � Edit only this section
    // ------------------------------------------------------------
    const GEMINI_API_KEY = 'AIzaSyDi6iLZWivvRZI51Ecf3gL1Ia2bgMiRamo';

    const GEMINI_URL =
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    // WhatsApp number for booking (without +)
    const WHATSAPP_NUMBER = '918949853554';

    const SYSTEM_PROMPT = `You are "Muah Concierge", a warm and professional AI beauty assistant for Muah � Mumbai's premier luxury hair salon.

Your personality:
- Warm, professional, and friendly
- Use refined language befitting a premium Mumbai salon brand
- Keep responses concise yet helpful (2�4 sentences per point max)
- Always guide relevant conversations toward booking a session

Services you know about:
1. **Expert Hair Styling** � Precision cuts & luxury colour by senior Muah stylists
2. **Hair Spa** � Deep conditioning and scalp treatments with Muah's nourishing protocols
3. **Bridal Makeup** � Flawless, high-fashion bridal artistry for your most defining Mumbai moments

Pricing packages:
- **Luminous Base** � ?199+ (Hair Styling, Hair Spa, Cosmetic Polish, Consult)
- **Modern Signature** � ?349+ (Expert Styling, Deep Conditioning, Full Artistry, Muah Gift) ? Most popular
- **Radiant Royale** � ?599+ (VIP Bridal Package, Full Re-Design, Master Portfolio, Personal Concierge)

Booking: Clients can use the booking form on the website or WhatsApp us at +91 89498 53554.
We are located in Mumbai. Sessions are by appointment � recommend booking at least 10 days in advance.

For unrelated questions, politely redirect: "As the Muah Concierge, I'm best equipped to assist with hair, beauty, and our Mumbai salon services."`

    const SUGGESTIONS = [
        '?? View our services',
        '?? Pricing packages',
        '?? How to book a session',
        '? Skincare tips',
    ];
    // ------------------------------------------------------------

    // -- State -----------------------------------------------------
    let conversationHistory = [];
    let isOpen = false;
    let isTyping = false;
    let hasShownWelcome = false;

    // -- Build Widget HTML -----------------------------------------
    function buildWidget() {
        const wrapper = document.createElement('div');
        wrapper.id = 'mrko-chat-root';
        wrapper.setAttribute('role', 'region');
        wrapper.setAttribute('aria-label', 'Muah AI Chat Concierge');

        wrapper.innerHTML = `
            <!-- Toggle Bubble -->
            <button
                id="mrko-chat-toggle"
                aria-label="Open Muah chat"
                aria-expanded="false"
                aria-controls="mrko-chat-window"
                title="Chat with Muah Concierge"
            >
                <span class="badge" id="mrko-badge" aria-label="1 new message">1</span>
                <i class="fas fa-comment-dots chat-toggle-icon" aria-hidden="true"></i>
                <i class="fas fa-times chat-toggle-close" aria-hidden="true"></i>
            </button>

            <!-- Chat Window -->
            <div
                id="mrko-chat-window"
                role="dialog"
                aria-modal="true"
                aria-label="Muah AI Chatbot"
                aria-hidden="true"
            >
                <!-- Header -->
                <div class="chat-header">
                    <div class="chat-header-avatar" aria-hidden="true">
                        <i class="fas fa-spa"></i>
                    </div>
                    <div class="chat-header-info">
                        <div class="chat-header-name">Muah Concierge</div>
                        <div class="chat-header-status">
                            <span class="status-dot" aria-hidden="true"></span>
                            AI-Powered &bull; Always Available
                        </div>
                    </div>
                    <div class="chat-header-actions">
                        <button class="chat-header-btn" id="mrko-wa-btn" title="WhatsApp us" aria-label="Contact on WhatsApp">
                            <i class="fab fa-whatsapp" aria-hidden="true"></i>
                        </button>
                        <button class="chat-header-btn" id="mrko-clear-btn" title="Clear conversation" aria-label="Clear conversation">
                            <i class="fas fa-rotate-right" aria-hidden="true"></i>
                        </button>
                        <button class="chat-header-btn" id="mrko-close-btn" title="Close chat" aria-label="Close chat">
                            <i class="fas fa-chevron-down" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>

                <!-- Messages -->
                <div class="chat-messages" id="mrko-messages" role="log" aria-live="polite" aria-label="Chat messages"></div>

                <!-- Suggestion Chips -->
                <div class="chat-suggestions" id="mrko-suggestions" aria-label="Suggested topics">
                    ${SUGGESTIONS.map(s => `<button class="suggestion-chip" aria-label="Ask: ${s}">${s}</button>`).join('')}
                </div>

                <!-- Input Row -->
                <div class="chat-input-area">
                    <div class="chat-input-row">
                        <textarea
                            id="mrko-chat-input"
                            placeholder="Ask Muah Concierge anything�"
                            rows="1"
                            maxlength="500"
                            aria-label="Type your message"
                        ></textarea>
                        <button id="mrko-chat-mic" aria-label="Speak" title="Voice Input">
                            <i class="fas fa-microphone" aria-hidden="true"></i>
                        </button>
                        <button id="mrko-chat-send" aria-label="Send message" title="Send">
                            <i class="fas fa-paper-plane" aria-hidden="true"></i>
                        </button>
                    </div>
                    <p class="chat-footer-note" aria-hidden="true">? Powered by Muah AI &bull; Gemini 2.0 Flash</p>
                </div>
            </div>
        `;

        document.body.appendChild(wrapper);
    }

    // -- Open / Close ----------------------------------------------
    function toggleChat() {
        isOpen = !isOpen;
        const toggle  = document.getElementById('mrko-chat-toggle');
        const chatWin = document.getElementById('mrko-chat-window');
        const badge   = document.getElementById('mrko-badge');

        toggle.classList.toggle('is-open', isOpen);
        toggle.setAttribute('aria-expanded', String(isOpen));
        chatWin.classList.toggle('is-visible', isOpen);
        chatWin.setAttribute('aria-hidden', String(!isOpen));

        // Stop AI voice when chat is closed
        if (!isOpen && window.speechSynthesis) {
            window.speechSynthesis.cancel();
            if (isRecording) stopRecording();
        }

        if (isOpen && badge) badge.remove();

        if (isOpen && !hasShownWelcome) {
            hasShownWelcome = true;
            setTimeout(() => {
                appendBotMessage(
                    "Welcome to **Muah** ?\n\nI'm your personal hair & beauty concierge for Mumbai's finest salon. How may I assist you today?\n\nFeel free to ask about our services, pricing, or book a session � I'm here for you."
                );
            }, 380);
        }

        if (isOpen) {
            setTimeout(() => {
                const inp = document.getElementById('mrko-chat-input');
                if (inp) inp.focus();
            }, 360);
        }
    }

    // -- Utilities -------------------------------------------------
    function timeNow() {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    /** Minimal markdown ? safe HTML */
    function md(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    function scrollBottom() {
        const m = document.getElementById('mrko-messages');
        if (m) m.scrollTop = m.scrollHeight;
    }

    function showSuggestions(visible) {
        const s = document.getElementById('mrko-suggestions');
        if (s) s.style.display = visible ? 'flex' : 'none';
    }

    // -- Render Bubbles --------------------------------------------
    function appendBotMessage(text) {
        const msgs = document.getElementById('mrko-messages');
        if (!msgs) return;
        const div = document.createElement('div');
        div.className = 'chat-message bot';
        div.setAttribute('role', 'listitem');
        div.innerHTML = `
            <div class="msg-avatar bot-avatar" aria-hidden="true"><i class="fas fa-spa"></i></div>
            <div>
                <div class="msg-bubble">${md(text)}</div>
                <span class="msg-time">${timeNow()}</span>
            </div>`;
        msgs.appendChild(div);
        scrollBottom();
    }

    function appendUserMessage(text) {
        const msgs = document.getElementById('mrko-messages');
        if (!msgs) return;
        const div = document.createElement('div');
        div.className = 'chat-message user';
        div.setAttribute('role', 'listitem');
        div.innerHTML = `
            <div>
                <div class="msg-bubble">${md(text)}</div>
                <span class="msg-time">${timeNow()}</span>
            </div>
            <div class="msg-avatar user-avatar" aria-hidden="true"><i class="fas fa-user"></i></div>`;
        msgs.appendChild(div);
        scrollBottom();
    }

    function showTyping() {
        const msgs = document.getElementById('mrko-messages');
        if (!msgs) return;
        const div = document.createElement('div');
        div.id = 'mrko-typing';
        div.className = 'typing-indicator';
        div.setAttribute('role', 'status');
        div.setAttribute('aria-label', 'Muah Concierge is typing');
        div.innerHTML = `
            <div class="msg-avatar bot-avatar" aria-hidden="true"><i class="fas fa-spa"></i></div>
            <div class="typing-dots" aria-hidden="true">
                <span></span><span></span><span></span>
            </div>`;
        msgs.appendChild(div);
        scrollBottom();
    }

    function removeTyping() {
        const el = document.getElementById('mrko-typing');
        if (el) el.remove();
    }

    // -- Call Gemini API -------------------------------------------
    async function callGemini(userText) {
        // Build full contents array (system prompt is in system_instruction)
        const contents = conversationHistory.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));

        const body = {
            system_instruction: {
                parts: [{ text: SYSTEM_PROMPT }]
            },
            contents,
            generationConfig: {
                maxOutputTokens: 512,
                temperature: 0.75,
                topP: 0.9
            }
        };

        const res = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            // Surface a friendly key-error hint
            if (res.status === 400 || res.status === 403) {
                throw new Error('API key error � please check your Gemini key in chatbot.js.');
            }
            throw new Error(errData?.error?.message || `Gemini API error (${res.status})`);
        }

        const data = await res.json();
        return (
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "I apologise � I wasn't able to generate a response. Please try again."
        );
    }

    // -- Send Message Flow -----------------------------------------
    async function sendMessage(text) {
        text = text.trim();
        if (!text || isTyping) return;

        const input   = document.getElementById('mrko-chat-input');
        const sendBtn = document.getElementById('mrko-chat-send');

        if (input)   { input.value = ''; autoResize(input); }
        if (sendBtn) sendBtn.disabled = true;
        isTyping = true;

        showSuggestions(false);
        appendUserMessage(text);
        conversationHistory.push({ role: 'user', content: text });
        showTyping();

        try {
            const reply = await callGemini(text);
            removeTyping();
            conversationHistory.push({ role: 'assistant', content: reply });
            appendBotMessage(reply);
            speakText(reply);

        } catch (err) {
            removeTyping();

            let errMsg;
            if (err.message.includes('API key error')) {
                errMsg = '?? **API key not configured.**\n\nTo activate the AI, open `js/chatbot.js` and paste your Gemini key on the `GEMINI_API_KEY` line.\n\nGet a free key at **aistudio.google.com**';
            } else if (err.message.toLowerCase().includes('failed to fetch') || err.message.includes('NetworkError')) {
                errMsg = '?? **Network error.** Please check your internet connection and try again.';
            } else {
                errMsg = `?? ${err.message}`;
            }

            appendBotMessage(errMsg);
            speakText(errMsg.replace(/[*#]/g, ''));
            console.error('[Muah Chatbot]', err);
        } finally {
            isTyping = false;
            if (sendBtn) sendBtn.disabled = false;
            if (input) input.focus();
        }
    }

    // -- Voice Agent Implementation (Speech API) --------------------
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    let isRecording = false;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            isRecording = true;
            const micBtn = document.getElementById('mrko-chat-mic');
            if (micBtn) micBtn.classList.add('recording');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const input = document.getElementById('mrko-chat-input');
            if (input) {
                input.value = transcript;
                autoResize(input);
            }
            sendMessage(transcript);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            stopRecording();
        };

        recognition.onend = () => {
            stopRecording();
        };
    }

    function stopRecording() {
        isRecording = false;
        const micBtn = document.getElementById('mrko-chat-mic');
        if (micBtn) micBtn.classList.remove('recording');
    }

    function toggleVoiceInput() {
        if (!recognition) {
            alert('Voice input is not supported in your browser.');
            return;
        }
        if (isRecording) {
            recognition.stop();
        } else {
            // Stop any current speech before listening
            window.speechSynthesis.cancel();
            recognition.start();
        }
    }

    function speakText(text) {
        if (!window.speechSynthesis) return;
        
        // Strip markdown and emojis for better speech
        const cleanText = text.replace(/[*_~`#]/g, '').replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');
        
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'en-US';
        utterance.rate = 1.05;
        utterance.pitch = 1.1; // Slightly higher pitch for a female concierge voice
        
        // Try to find a premium female English voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Female') && v.lang.includes('en')) || 
                               voices.find(v => v.lang === 'en-US' || v.lang === 'en-GB');
        if (preferredVoice) utterance.voice = preferredVoice;

        window.speechSynthesis.speak(utterance);
    }


    // -- Clear Chat ------------------------------------------------
    function clearConversation() {
        conversationHistory = [];
        const msgs = document.getElementById('mrko-messages');
        if (msgs) msgs.innerHTML = '';
        showSuggestions(true);
        hasShownWelcome = false;
        setTimeout(() => appendBotMessage('Conversation cleared ? How may I assist you today?'), 150);
    }

    // -- Textarea Auto-height --------------------------------------
    function autoResize(el) {
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 80) + 'px';
    }

    // -- Wire All Events -------------------------------------------
    function wireEvents() {
        const toggle   = document.getElementById('mrko-chat-toggle');
        const closeBtn = document.getElementById('mrko-close-btn');
        const clearBtn = document.getElementById('mrko-clear-btn');
        const waBtn    = document.getElementById('mrko-wa-btn');
        const input    = document.getElementById('mrko-chat-input');
        const sendBtn  = document.getElementById('mrko-chat-send');
        const micBtn   = document.getElementById('mrko-chat-mic');

        if (toggle)   toggle.addEventListener('click', toggleChat);
        if (closeBtn) closeBtn.addEventListener('click', toggleChat);
        if (clearBtn) clearBtn.addEventListener('click', clearConversation);

        // WhatsApp quick-contact button
        if (waBtn) {
            waBtn.addEventListener('click', () => {
                window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=Hello%20Muah!%20I%27d%20like%20to%20inquire%20about%20a%20session.`, '_blank');
            });
        }

        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                if (input) sendMessage(input.value);
            });
        }

        if (micBtn) {
            micBtn.addEventListener('click', toggleVoiceInput);
        }

        if (input) {
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input.value);
                }
            });
            input.addEventListener('input', () => autoResize(input));
        }

        // Suggestion chips ? send that topic
        document.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                // Strip leading emoji/spaces for the actual query
                const query = chip.textContent.replace(/^[\p{Emoji}\s]+/u, '').trim();
                if (!isOpen) { toggleChat(); setTimeout(() => sendMessage(query), 420); }
                else sendMessage(query);
            });
        });

        // Escape key closes chat
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && isOpen) toggleChat();
        });
    }

    // -- Init ------------------------------------------------------
    function init() {
        buildWidget();
        wireEvents();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
