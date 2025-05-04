'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const TARGET_DOMAIN = 'peterkuo0108.github.io';
const TARGET_URL = `https://${TARGET_DOMAIN}/eattime/`;

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCheck, setRetryCheck] = useState(0); // State to trigger re-check
  const { toast } = useToast();

  const checkConnectivity = () => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
    } else {
      // Assume online during server render or if navigator is unavailable
      setIsOnline(true);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    // Check connectivity immediately
    checkConnectivity();

    // Set up online/offline event listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Cleanup listeners on component unmount
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [retryCheck]); // Re-run checkConnectivity when retryCheck changes

  useEffect(() => {
    // Logo animation timer
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000); // Show logo for 2 seconds

    return () => clearTimeout(timer); // Cleanup timer on component unmount
  }, []);

  const handleRetry = () => {
    setIsLoading(true);
    // Increment retryCheck to trigger the useEffect for connectivity check
    setRetryCheck((prev) => prev + 1);
  };

  // Handle external link clicks within the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin && // Basic security check
        event.data &&
        event.data.type === 'navigateExternal' &&
        event.data.url
      ) {
        const url = new URL(event.data.url);
        if (url.hostname !== TARGET_DOMAIN) {
          // Open in default browser only if domain is different
          window.open(event.data.url, '_blank');
          toast({
            title: 'Redirecting',
            description: `Opening ${url.hostname} in your browser.`,
          });
          // Optionally, prevent the iframe from navigating away
          // This part is tricky as we can't directly stop the iframe navigation initiated internally
          // The best approach is to ensure the iframe content uses postMessage correctly
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [toast]);

  // Inject script into iframe to handle link clicks
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe && !showSplash && isOnline) {
      const script = `
        document.addEventListener('click', function(event) {
          let target = event.target;
          while (target && target.tagName !== 'A') {
            target = target.parentElement;
          }
          if (target && target.tagName === 'A' && target.href) {
            const url = new URL(target.href);
            const currentDomain = '${TARGET_DOMAIN}';
            if (url.hostname !== currentDomain && url.protocol.startsWith('http')) {
              event.preventDefault(); // Prevent default navigation within iframe
              window.parent.postMessage({ type: 'navigateExternal', url: target.href }, '*');
            }
          }
        }, true); // Use capture phase to catch clicks early
      `;

      const handleLoad = () => {
        try {
          iframe.contentWindow?.postMessage({ type: 'injectScript', script: script }, '*');
          // For direct injection (less safe due to cross-origin restrictions)
          // const scriptElement = iframe.contentDocument.createElement('script');
          // scriptElement.textContent = script;
          // iframe.contentDocument.body.appendChild(scriptElement);
        } catch (e) {
          console.error("Error injecting script into iframe:", e);
          // Fallback or notification if injection fails
          toast({
             variant: "destructive",
             title: "Error",
             description: "Could not enhance external link handling.",
          });
        }
      };

      iframe.addEventListener('load', handleLoad);
      return () => {
        iframe.removeEventListener('load', handleLoad);
      };
    }
  }, [showSplash, isOnline, toast]);


  if (showSplash || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center flex-grow bg-background animate-fade-scale-in">
        <Image
          src="/logo.svg"
          alt="食刻 Logo"
          width={120}
          height={120}
          priority
        />
        <p className="mt-4 text-xl font-semibold text-foreground">食刻</p>
        {isLoading && !showSplash && (
           <p className="mt-2 text-sm text-muted-foreground">Checking connection...</p>
        )}
      </div>
    );
  }

  if (isOnline === false) {
    return (
      <div className="flex flex-col items-center justify-center flex-grow text-center p-4 bg-background">
        <WifiOff className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2 text-foreground">No Internet Connection</h2>
        <p className="text-muted-foreground mb-6">
          Because AI features require internet, please connect to Wi-Fi and try again!
        </p>
        <Button onClick={handleRetry} variant="default" size="lg">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  // isOnline === true and splash is finished
  return (
    <div className="flex-grow flex flex-col w-full h-full overflow-hidden">
       <iframe
         ref={iframeRef}
         src={TARGET_URL}
         title="食刻 Web App"
         className="w-full h-full border-none flex-grow"
         sandbox="allow-scripts allow-same-origin allow-popups allow-forms" // Adjust sandbox as needed
       />
    </div>
  );
}
