// Public/js/auth.js
document.addEventListener('DOMContentLoaded', () => {
    // Password strength checker
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    if (passwordInput) {
      passwordInput.addEventListener('input', checkPasswordStrength);
    }
    
    if (confirmPasswordInput) {
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
                console.error('Token refresh failed:', error);
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
});