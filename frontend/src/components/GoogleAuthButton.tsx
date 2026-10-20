import React from 'react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';

interface GoogleAuthButtonProps {
  onSuccess: (credential: string) => void;
  onError: () => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
}

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

/**
 * Wraps the auth page with the Google provider when a client ID is configured.
 * When it is missing, children render normally and the Google button is hidden.
 */
export const GoogleAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!clientId) return <>{children}</>;

  return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>;
};

/**
 * Renders the official Google button. Renders nothing when the client ID
 * has not been configured, so the rest of the auth page keeps working.
 */
const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  onSuccess,
  onError,
  text = 'signin_with',
}) => {
  if (!clientId) return null;

  return (
    <div className="google-auth-wrap">
      <GoogleLogin
        onSuccess={(response) => {
          if (response.credential) {
            onSuccess(response.credential);
          } else {
            onError();
          }
        }}
        onError={onError}
        text={text}
        shape="pill"
        width="340"
      />
      <div className="auth-divider">
        <span>hoặc tiếp tục với email</span>
      </div>
    </div>
  );
};

export default GoogleAuthButton;
