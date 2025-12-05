// Public/js/auth.js
document.addEventListener('DOMContentLoaded', () => {
    // Enable dismiss buttons for auth cards
    const closeButtons = document.querySelectorAll('[data-close-auth]');
    if (closeButtons.length) {
      closeButtons.forEach((button) => {
        button.addEventListener('click', () => {
          const canGoBack = document.referrer && document.referrer.startsWith(window.location.origin) && window.history.length > 1;
          if (canGoBack) {
            window.history.back();
          } else {
            window.location.href = '/';
          }
        });
      });
    }

    // Password strength checker (only for signup page)
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    // Only enable password strength checker on signup page
    if (passwordInput && confirmPasswordInput) {
      passwordInput.addEventListener('input', checkPasswordStrength);
      confirmPasswordInput.addEventListener('input', checkPasswordMatch);
    }
    
    function checkPasswordStrength() {
      const password = passwordInput.value;
      let strength = 0;
      
      if (password.length >= 8) strength += 1;
      if (/[A-Z]/.test(password)) strength += 1;
      if (/[a-z]/.test(password)) strength += 1;
      if (/[0-9]/.test(password)) strength += 1;
      if (/[^A-Za-z0-9]/.test(password)) strength += 1;
      
      const strengthMeter = document.createElement('div');
      strengthMeter.className = 'password-strength';
      strengthMeter.innerHTML = getStrengthHTML(strength);
      
      // Remove existing meter if it exists
      const existingMeter = passwordInput.parentElement.querySelector('.password-strength');
      if (existingMeter) {
        passwordInput.parentElement.removeChild(existingMeter);
      }
      
      if (password.length > 0) {
        passwordInput.parentElement.appendChild(strengthMeter);
      }
    }
    
    function getStrengthHTML(strength) {
      let strengthText = '';
      let strengthColor = '';
      
      switch (strength) {
        case 0:
        case 1:
          strengthText = 'Weak';
          strengthColor = 'var(--transit-red)';
          break;
        case 2:
        case 3:
          strengthText = 'Medium';
          strengthColor = 'var(--transit-yellow)';
          break;
        case 4:
        case 5:
          strengthText = 'Strong';
          strengthColor = 'var(--transit-green)';
          break;
      }
      
      const bars = Array(5).fill('').map((_, index) => {
        const barColor = index < strength ? strengthColor : 'var(--border-color)';
        return `<span class="strength-bar" style="background-color: ${barColor}"></span>`;
      }).join('');
      
      return `
        <div class="strength-bars">${bars}</div>
        <span class="strength-text" style="color: ${strengthColor}">${strengthText}</span>
      `;
    }
    
    function checkPasswordMatch() {
      if (!confirmPasswordInput || !passwordInput) return;
      
      const password = passwordInput.value;
      const confirmPassword = confirmPasswordInput.value;
      
      const matchIndicator = document.createElement('div');
      matchIndicator.className = 'password-match';
      
      if (confirmPassword.length > 0) {
        if (password === confirmPassword) {
          matchIndicator.innerHTML = '<i class="fas fa-check-circle"></i> Passwords match';
          matchIndicator.style.color = 'var(--transit-green)';
        } else {
          matchIndicator.innerHTML = '<i class="fas fa-times-circle"></i> Passwords do not match';
          matchIndicator.style.color = 'var(--transit-red)';
        }
        
        // Remove existing indicator if it exists
        const existingIndicator = confirmPasswordInput.parentElement.querySelector('.password-match');
        if (existingIndicator) {
          confirmPasswordInput.parentElement.removeChild(existingIndicator);
        }
        
        confirmPasswordInput.parentElement.appendChild(matchIndicator);
      }
    }
    
    // Organization field based on user type
    const userTypeSelect = document.getElementById('userType');
    const organizationField = document.getElementById('organization');
    
    if (userTypeSelect && organizationField) {
      userTypeSelect.addEventListener('change', () => {
        const userType = userTypeSelect.value;
        
        switch (userType) {
          case 'student':
            organizationField.placeholder = 'Enter university or school name';
            break;
          case 'professional':
            organizationField.placeholder = 'Enter company or organization name';
            break;
          case 'researcher':
            organizationField.placeholder = 'Enter research institution or university';
            break;
          case 'administrator':
            organizationField.placeholder = 'Enter government agency or department';
            break;
          default:
            organizationField.placeholder = 'Enter organization name';
        }
      });
    }
    
    // Real-time username/email availability feedback
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const usernameFeedback = document.getElementById('usernameFeedback');
    const emailFeedback = document.getElementById('emailFeedback');

    const debounce = (fn, delay = 350) => {
      let timer;
      return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
      };
    };

    const setFieldFeedback = (element, state, message) => {
      if (!element) return;
      element.textContent = message || '';
      element.classList.remove('error', 'success', 'checking');
      if (state) {
        element.classList.add(state);
      }
    };

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const availabilityFields = [
      {
        field: 'username',
        input: usernameInput,
        feedback: usernameFeedback,
        minLength: 3,
        availableMessage: 'Username is available.',
        takenMessage: 'Username already exists.'
      },
      {
        field: 'email',
        input: emailInput,
        feedback: emailFeedback,
        minLength: 5,
        validator: (value) => emailPattern.test(value),
        availableMessage: 'Email looks good to use.',
        takenMessage: 'Email is already registered.'
      }
    ];

    availabilityFields.forEach((config) => {
      const { field, input, feedback, minLength = 1, validator, availableMessage, takenMessage } = config;
      if (!input || !feedback) return;

      let controller;
      let requestId = 0;

      const runCheck = async () => {
        const value = input.value.trim();

        if (!value || value.length < minLength || (validator && !validator(value))) {
          setFieldFeedback(feedback, null, '');
          if (controller) controller.abort();
          return;
        }

        if (controller) {
          controller.abort();
        }
        const currentController = new AbortController();
        controller = currentController;
        const currentRequestId = ++requestId;

        setFieldFeedback(feedback, 'checking', 'Checking availability...');

        try {
          const response = await fetch(`/auth/check-availability?field=${field}&value=${encodeURIComponent(value)}`, {
            signal: currentController.signal,
            credentials: 'same-origin'
          });

          if (!response.ok) {
            throw new Error('Request failed');
          }

          const result = await response.json();

          if (currentRequestId !== requestId || input.value.trim() !== value) {
            return;
          }

          if (result.available) {
            setFieldFeedback(feedback, 'success', availableMessage);
          } else {
            setFieldFeedback(feedback, 'error', takenMessage);
          }
        } catch (error) {
          if (error.name === 'AbortError') {
            return;
          }
          if (currentRequestId !== requestId) {
            return;
          }
          setFieldFeedback(feedback, 'error', 'Unable to verify right now.');
        }
      };

      const debouncedCheck = debounce(runCheck, 400);
      input.addEventListener('input', debouncedCheck);
      input.addEventListener('blur', runCheck);
    });

    // Client-side token refresh mechanism
    function setupTokenRefresh() {
        // Only run if the user is logged in (check for access token)
        if (!document.cookie.includes('access_token')) return;
        
        // Function to refresh the token
        async function refreshToken() {
            try {
                const response = await fetch('/auth/refresh', {
                    method: 'POST',
                    credentials: 'same-origin'
                });
                
                if (!response.ok) {
                    // If refresh fails, redirect to login
                    window.location.href = '/auth/login';
                }
            } catch (error) {
                // Token refresh failed
            }
        }
        
        // Check token every minute
        setInterval(refreshToken, 60 * 1000);
        
        // Also refresh when tab becomes active
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                refreshToken();
            }
        });
    }
    
    // Initialize token refresh once
    setupTokenRefresh();

    // Handle back button navigation - prevent going back to login/signup if authenticated
    const isAuthenticated = document.cookie.includes('access_token');
    const currentPath = window.location.pathname;
    const isAuthPage = currentPath === '/auth/login' || currentPath === '/auth/signup';
    
    // If user is authenticated and on auth page, redirect to homepage immediately
    if (isAuthenticated && isAuthPage) {
        window.history.replaceState(null, '', '/');
        window.location.replace('/');
        return; // Exit early, no need to set up other handlers
    }

    // Listen for back button navigation (only if not authenticated or not on auth page)
    if (isAuthenticated) {
        window.addEventListener('popstate', function(event) {
            // Small delay to let navigation complete
            setTimeout(() => {
                const path = window.location.pathname;
                if (path === '/auth/login' || path === '/auth/signup') {
                    // Replace with homepage instead
                    window.history.replaceState(null, '', '/');
                    window.location.replace('/');
                }
            }, 0);
        });
    }
});