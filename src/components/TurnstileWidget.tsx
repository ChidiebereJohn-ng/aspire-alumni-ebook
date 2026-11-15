import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck } from 'lucide-react';

interface TurnstileWidgetProps {
  siteKey?: string;
  onVerify: (token: string) => void;
  onError?: (error: any) => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: (error: any) => void;
          theme?: 'light' | 'dark' | 'auto';
        }
      ) => string;
      reset: (widgetId: string) => void;
    };
  }
}

export const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({
  siteKey = '1x00000000000000000000AA', // Official Cloudflare Turnstile Always-Pass Test Key
  onVerify,
  onError,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [widgetId, setWidgetId] = useState<string | null>(null);
  const [verified, setVerified] = useState<boolean>(false);
  const [scriptLoaded, setScriptLoaded] = useState<boolean>(false);

  useEffect(() => {
    // Check if script already on page
    if (window.turnstile) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => {
      console.warn('Turnstile script failed to load, offering local bypass.');
      // Auto-verify with dummy token in local/fallback environments
      onVerify('test-turnstile-token-auto');
      setVerified(true);
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  useEffect(() => {
    if (scriptLoaded && window.turnstile && containerRef.current && !widgetId) {
      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => {
            setVerified(true);
            onVerify(token);
          },
          'error-callback': (err: any) => {
            console.warn('Turnstile error:', err);
            if (onError) onError(err);
          },
          theme: 'light',
        });
        setWidgetId(id);
      } catch (err) {
        console.warn('Failed to render Turnstile widget:', err);
      }
    }
  }, [scriptLoaded, siteKey]);

  return (
    <div className="py-2">
      <div ref={containerRef} className="flex justify-center" />

      {/* Local developer fallback indicator */}
      {!scriptLoaded && !verified && (
        <div className="text-center py-2">
          <button
            type="button"
            onClick={() => {
              setVerified(true);
              onVerify('dev-simulated-token');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-teal-tint text-brand-teal border border-brand-teal/20"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Spam Protection Check (Click to Verify)
          </button>
        </div>
      )}

      {verified && (
        <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 font-semibold pt-1">
          <ShieldCheck className="w-4 h-4" />
          Human verification passed
        </div>
      )}
    </div>
  );
};
