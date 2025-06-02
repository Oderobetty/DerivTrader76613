import { useState, useEffect } from 'react';

const DERIV_APP_ID = '76613';
const DERIV_OAUTH_URL = 'https://oauth.deriv.com/oauth2/authorize';
const API_BASE_URL = 'https://quantumaixtrade-backend.onrender.com';

export function useDerivAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    // Check if we have a stored auth token
    const token = localStorage.getItem('deriv_auth_token');
    if (token) {
      setAuthToken(token);
      setIsAuthenticated(true);
    }
    setIsLoading(false);

    // Handle OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      handleOAuthCallback(code);
    }
  }, []);

  const handleOAuthCallback = async (code: string) => {
    try {
      setIsLoading(true);
      
      // Send authorization code to your backend
      const response = await fetch(`${API_BASE_URL}/auth/deriv/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code,
          app_id: DERIV_APP_ID 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const { access_token } = data;
        
        localStorage.setItem('deriv_auth_token', access_token);
        setAuthToken(access_token);
        setIsAuthenticated(true);
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        console.error('OAuth callback failed:', response.statusText);
      }
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initiateLogin = () => {
    const redirectUri = window.location.origin;
    const oauthUrl = `${DERIV_OAUTH_URL}?app_id=${DERIV_APP_ID}&l=en&brand=deriv&redirect_uri=${encodeURIComponent(redirectUri)}`;
    
    window.location.href = oauthUrl;
  };

  const logout = () => {
    localStorage.removeItem('deriv_auth_token');
    setAuthToken(null);
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    isLoading,
    authToken,
    initiateLogin,
    logout,
  };
}