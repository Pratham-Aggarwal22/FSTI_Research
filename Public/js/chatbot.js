// Modern Floating Chatbot Component

class FloatingChatbot {
  constructor() {
    this.isOpen = false;
    this.isAuthenticated = true;
    this.messages = [];
    this.init();
  }

  init() {
    // Create chatbot UI
    this.createChatbotUI();
    
    // Setup event listeners
    this.setupEventListeners();
    this.showWelcomeMessage();
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
    window.innerHTML = this.getAuthenticatedChatbotHTML();
    
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
          <button class="floating-chatbot-action-btn" id="closeChatbot" title="Close">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      
      <div class="floating-chatbot-messages" id="floatingChatbotMessages">
        <!-- Messages will be added here -->
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

  setupEventListeners() {
    // Toggle chatbot window
    const trigger = document.getElementById('floatingChatbotTrigger');
    trigger.addEventListener('click', () => this.toggleChatbot());

    // Minimize/close button
    const closeBtn = document.getElementById('closeChatbot');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeChatbot());
    }

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
  }

  async closeChatbot() {
    if (this.isOpen) {
        this.toggleChatbot();
    }
    
    // Call close endpoint
    try {
        await fetch('/api/chatbot/close', { method: 'POST' });
    } catch (e) {
        // Error handling without console logging
    }

    // Clear messages
    this.messages = [];
    const messagesContainer = document.getElementById('floatingChatbotMessages');
    if (messagesContainer) {
        messagesContainer.innerHTML = '';
        this.showWelcomeMessage(); 
    }
  }

  toggleChatbot() {
    this.isOpen = !this.isOpen;
    const chatbotWindow = document.getElementById('floatingChatbotWindow');
    const trigger = document.getElementById('floatingChatbotTrigger');
    
    if (this.isOpen) {
      chatbotWindow.classList.add('open');
      trigger.classList.add('active');
      trigger.innerHTML = '<i class="fas fa-times"></i>';
      
      setTimeout(() => {
        const input = document.getElementById('floatingChatbotInput');
        if (input) {
          input.focus();
        }
      }, 300);
    } else {
      chatbotWindow.classList.remove('open');
      trigger.classList.remove('active');
      trigger.innerHTML = '<i class="fas fa-comments"></i>';
    }
  }

  showWelcomeMessage() {
    const messagesContainer = document.getElementById('floatingChatbotMessages');
    const welcomeHTML = `
      <div class="floating-welcome-message" id="floatingWelcomeMessage">
        <h4><i class="fas fa-sparkles"></i> Welcome to TransitHub AI!</h4>
        <p>I can help you explore transit accessibility and equity data. Feel free to ask about specific states, counties, or compare different regions!</p>
        
        <div class="floating-welcome-attention">
          <div class="attention-header">
            <i class="fas fa-exclamation-triangle"></i>
            <span>Attention</span>
          </div>
          <p>This chatbot is currently in training and may produce inaccurate information (hallucinations). Please verify answers with the website data. Additionally, conversation history is not saved—please provide full context for each new question.</p>
        </div>
      </div>
    `;
    messagesContainer.innerHTML = welcomeHTML;
  }

  async sendMessage() {
    const input = document.getElementById('floatingChatbotInput');
    const sendBtn = document.getElementById('floatingChatbotSend');
    const message = input.value.trim();

    if (!message) return;

    // Remove welcome message if it exists
    const welcomeMessage = document.getElementById('floatingWelcomeMessage');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }

    // Add user message
    this.addMessage(message, 'user');
    
    // Clear input and disable send button
    input.value = '';
    sendBtn.disabled = true;

    // Show typing indicator
    this.showTypingIndicator();

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
      this.addMessage(botContent, 'bot', { isError: !result.success });

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
        <div class="transit-thinking-container">
          <div class="transit-line"></div>
          <div class="transit-bus">
            <i class="fas fa-bus"></i>
          </div>
          <span class="transit-thinking-text">Thinking...</span>
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
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Wait a bit for the page to fully load
  setTimeout(() => {
    // Check if logged in
    const isAuthenticated = document.body.getAttribute('data-authenticated') === 'true';
    if (!isAuthenticated) {
        return;
    }
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

