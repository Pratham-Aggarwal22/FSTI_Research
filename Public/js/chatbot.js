// Modern Floating Chatbot Component

class FloatingChatbot {
  constructor() {
    this.isOpen = false;
    this.isAuthenticated = false;
    this.messages = [];
    this.init();
  }

  init() {
    // Check if user is authenticated
    this.checkAuthentication();
    
    // Create chatbot UI
    this.createChatbotUI();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Show welcome message if authenticated
    if (this.isAuthenticated) {
      this.showWelcomeMessage();
    }
  }

  checkAuthentication() {
    // Check if user is authenticated from server-provided state or cookie
    // First check if there's a data attribute on the body
    const bodyAuth = document.body.getAttribute('data-authenticated');
    if (bodyAuth === 'true') {
      this.isAuthenticated = true;
      return;
    }
    
    // Fallback: check cookie
    this.isAuthenticated = document.cookie.includes('access_token');
    
    // Also check for the cookie with proper parsing
    if (!this.isAuthenticated) {
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'access_token' && value) {
          this.isAuthenticated = true;
          break;
        }
      }
    }
  }

  createChatbotUI() {
    // Create trigger button
    const trigger = document.createElement('button');
    trigger.className = 'floating-chatbot-trigger';
    trigger.id = 'floatingChatbotTrigger';
    trigger.innerHTML = '<i class="fas fa-comments"></i>';
    document.body.appendChild(trigger);

    // Create chatbot window
    const window = document.createElement('div');
    window.className = 'floating-chatbot-window';
    window.id = 'floatingChatbotWindow';
    
    if (this.isAuthenticated) {
      window.innerHTML = this.getAuthenticatedChatbotHTML();
    } else {
      window.innerHTML = this.getUnauthenticatedChatbotHTML();
    }
    
    document.body.appendChild(window);
  }

  getAuthenticatedChatbotHTML() {
    return `
      <div class="floating-chatbot-header">
        <div class="floating-chatbot-header-content">
          <div class="floating-chatbot-avatar">
            <i class="fas fa-robot"></i>
          </div>
          <div class="floating-chatbot-title">
            <h3>TransitHub AI</h3>
            <p>Ask me anything about transit & equity</p>
          </div>
        </div>
        <div class="floating-chatbot-actions">
          <button class="floating-chatbot-action-btn" id="minimizeChatbot" title="Minimize">
            <i class="fas fa-minus"></i>
          </button>
        </div>
      </div>
      
      <div class="floating-chatbot-messages" id="floatingChatbotMessages">
        <!-- Messages will be added here -->
      </div>
      
      <div class="floating-quick-suggestions" id="quickSuggestions">
        <button class="floating-quick-suggestion-btn" data-query="Tell me about California transit">
          California transit
        </button>
        <button class="floating-quick-suggestion-btn" data-query="Compare New York and Texas">
          Compare states
        </button>
        <button class="floating-quick-suggestion-btn" data-query="Show me equity data for Los Angeles County">
          County equity
        </button>
      </div>
      
      <div class="floating-chatbot-input-container">
        <input 
          type="text" 
          class="floating-chatbot-input" 
          id="floatingChatbotInput"
          placeholder="Ask about transit and equity data..."
        />
        <button class="floating-chatbot-send-btn" id="floatingChatbotSend">
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
    `;
  }

  getUnauthenticatedChatbotHTML() {
    return `
      <div class="floating-chatbot-header">
        <div class="floating-chatbot-header-content">
          <div class="floating-chatbot-avatar">
            <i class="fas fa-robot"></i>
          </div>
          <div class="floating-chatbot-title">
            <h3>TransitHub AI</h3>
            <p>Login to chat with AI</p>
          </div>
        </div>
        <div class="floating-chatbot-actions">
          <button class="floating-chatbot-action-btn" id="minimizeChatbot" title="Close">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      
      <div class="floating-chatbot-login-prompt">
        <i class="fas fa-lock"></i>
        <h3>Login Required</h3>
        <p>Please log in to use the TransitHub AI Assistant and get insights about transit accessibility and equity data.</p>
        <a href="/auth/login" class="floating-chatbot-login-btn">
          <i class="fas fa-sign-in-alt"></i>
          Login to Continue
        </a>
      </div>
    `;
  }

  setupEventListeners() {
    // Toggle chatbot window
    const trigger = document.getElementById('floatingChatbotTrigger');
    trigger.addEventListener('click', () => this.toggleChatbot());

    // Minimize/close button
    const minimizeBtn = document.getElementById('minimizeChatbot');
    if (minimizeBtn) {
      minimizeBtn.addEventListener('click', () => this.toggleChatbot());
    }

    if (this.isAuthenticated) {
      // Send message on Enter or button click
      const input = document.getElementById('floatingChatbotInput');
      const sendBtn = document.getElementById('floatingChatbotSend');

      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });

      sendBtn.addEventListener('click', () => this.sendMessage());

      // Quick suggestions
      const suggestions = document.querySelectorAll('.floating-quick-suggestion-btn');
      suggestions.forEach(btn => {
        btn.addEventListener('click', () => {
          const query = btn.getAttribute('data-query');
          document.getElementById('floatingChatbotInput').value = query;
          this.sendMessage();
        });
      });
    }
  }

  toggleChatbot() {
    // Re-check authentication when opening
    if (!this.isOpen) {
      this.checkAuthentication();
      
      // If authentication state changed, recreate the UI
      const chatbotWindow = document.getElementById('floatingChatbotWindow');
      const wasAuthenticated = chatbotWindow && chatbotWindow.querySelector('.floating-chatbot-input-container');
      
      if (this.isAuthenticated && !wasAuthenticated) {
        // User just logged in, recreate the UI
        chatbotWindow.innerHTML = this.getAuthenticatedChatbotHTML();
        this.setupEventListeners();
        this.showWelcomeMessage();
      } else if (!this.isAuthenticated && wasAuthenticated) {
        // User logged out, show login prompt
        chatbotWindow.innerHTML = this.getUnauthenticatedChatbotHTML();
        this.setupEventListeners();
      }
    }
    
    this.isOpen = !this.isOpen;
    const chatbotWindow = document.getElementById('floatingChatbotWindow');
    const trigger = document.getElementById('floatingChatbotTrigger');
    
    if (this.isOpen) {
      chatbotWindow.classList.add('open');
      trigger.classList.add('active');
      trigger.innerHTML = '<i class="fas fa-times"></i>';
      
      // Focus input if authenticated
      if (this.isAuthenticated) {
        setTimeout(() => {
          const input = document.getElementById('floatingChatbotInput');
          if (input) {
            input.focus();
          }
        }, 300);
      }
    } else {
      chatbotWindow.classList.remove('open');
      trigger.classList.remove('active');
      trigger.innerHTML = '<i class="fas fa-comments"></i>';
    }
  }

  showWelcomeMessage() {
    const messagesContainer = document.getElementById('floatingChatbotMessages');
    const welcomeHTML = `
      <div class="floating-welcome-message">
        <h4><i class="fas fa-sparkles"></i> Welcome to TransitHub AI!</h4>
        <p>I can help you explore transit accessibility and equity data. Ask me about specific states, counties, or compare different regions!</p>
      </div>
    `;
    messagesContainer.innerHTML = welcomeHTML;
  }

  async sendMessage() {
    const input = document.getElementById('floatingChatbotInput');
    const sendBtn = document.getElementById('floatingChatbotSend');
    const message = input.value.trim();

    if (!message) return;

    // Add user message
    this.addMessage(message, 'user');
    
    // Clear input and disable send button
    input.value = '';
    sendBtn.disabled = true;

    // Show typing indicator
    this.showTypingIndicator();

    // Hide quick suggestions after first message
    const suggestions = document.getElementById('quickSuggestions');
    if (suggestions) {
      suggestions.style.display = 'none';
    }

    try {
      // Send to backend
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message,
          context: this.getCurrentContext()
        })
      });

      const result = await response.json();

      // Hide typing indicator
      this.hideTypingIndicator();

      const botContent = result.narrative || result.message || (result.success ? 'I was unable to generate a response.' : 'Sorry, I encountered an error.');
      const botMessageEl = this.addMessage(botContent, 'bot', { isError: !result.success });

      if (result.showDetails && botMessageEl) {
        this.attachDetails(botMessageEl, result.showDetails);
      }

    } catch (error) {
      this.hideTypingIndicator();
      this.addMessage('Sorry, I encountered an error. Please try again.', 'bot', { isError: true });
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  }

  addMessage(content, type, options = {}) {
    const { isError = false } = typeof options === 'object' ? options : { isError: !!options };
    const messagesContainer = document.getElementById('floatingChatbotMessages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `floating-chat-message ${type}`;
    if (isError && type === 'bot') {
      messageDiv.classList.add('error');
    }
    
    const avatar = document.createElement('div');
    avatar.className = 'floating-chat-message-avatar';
    avatar.innerHTML = type === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
    
    const content_div = document.createElement('div');
    content_div.className = 'floating-chat-message-content';
    
    if (type === 'bot' && !isError) {
      // Parse markdown-style formatting
      content_div.innerHTML = this.parseMarkdown(content);
    } else {
      content_div.textContent = content;
    }
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content_div);
    
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Store message
    this.messages.push({ content, type, timestamp: new Date() });

    return messageDiv;
  }

  parseMarkdown(text) {
    // Convert markdown-style formatting to HTML
    let html = text;
    
    // Bold text: **text** or __text__
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // Bullet points: - item or * item
    const lines = html.split('\n');
    let inList = false;
    let result = [];
    
    for (let line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        if (!inList) {
          result.push('<ul>');
          inList = true;
        }
        result.push(`<li>${trimmedLine.substring(2)}</li>`);
      } else {
        if (inList) {
          result.push('</ul>');
          inList = false;
        }
        if (trimmedLine) {
          result.push(`<p>${trimmedLine}</p>`);
        }
      }
    }
    
    if (inList) {
      result.push('</ul>');
    }
    
    return result.join('');
  }

  showTypingIndicator() {
    const messagesContainer = document.getElementById('floatingChatbotMessages');
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'floating-chat-message bot';
    typingDiv.id = 'floatingTypingIndicator';
    
    typingDiv.innerHTML = `
      <div class="floating-chat-message-avatar">
        <i class="fas fa-robot"></i>
      </div>
      <div class="floating-chat-message-content">
        <div class="floating-typing-indicator">
          <div class="floating-typing-dot"></div>
          <div class="floating-typing-dot"></div>
          <div class="floating-typing-dot"></div>
        </div>
      </div>
    `;
    
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  hideTypingIndicator() {
    const indicator = document.getElementById('floatingTypingIndicator');
    if (indicator) {
      indicator.remove();
    }
  }

  getCurrentContext() {
    // Get current context from the page
    return {
      currentView: typeof activeView !== 'undefined' ? activeView : 'map',
      selectedState: typeof selectedState !== 'undefined' ? selectedState : null,
      selectedCounty: typeof selectedCounty !== 'undefined' ? selectedCounty : null,
      selectedMetric: typeof selectedMetric !== 'undefined' ? selectedMetric : null
    };
  }

  attachDetails(messageDiv, details) {
    if (!messageDiv || !details) return;

    try {
      const detailsContainer = document.createElement('div');
      detailsContainer.className = 'floating-chatbot-details';

      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'floating-chatbot-details-toggle';
      toggleBtn.type = 'button';
      toggleBtn.textContent = 'Show details';

      const detailsBody = document.createElement('pre');
      detailsBody.className = 'floating-chatbot-details-body';
      detailsBody.textContent = JSON.stringify(details, null, 2);
      detailsBody.style.display = 'none';

      toggleBtn.addEventListener('click', () => {
        const isHidden = detailsBody.style.display === 'none';
        detailsBody.style.display = isHidden ? 'block' : 'none';
        toggleBtn.textContent = isHidden ? 'Hide details' : 'Show details';
      });

      detailsContainer.appendChild(toggleBtn);
      detailsContainer.appendChild(detailsBody);
      messageDiv.appendChild(detailsContainer);
    } catch (error) {
      // Failed to attach details
    }
  }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Wait a bit for the page to fully load
  setTimeout(() => {
    window.floatingChatbot = new FloatingChatbot();
    
    // Add pulse animation to trigger button after 3 seconds
    setTimeout(() => {
      const trigger = document.getElementById('floatingChatbotTrigger');
      if (trigger && !trigger.classList.contains('active')) {
        trigger.classList.add('pulsing');
        
        // Remove pulse after user interacts
        trigger.addEventListener('click', () => {
          trigger.classList.remove('pulsing');
        }, { once: true });
      }
    }, 3000);
  }, 1000);
});

