'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
        event.origin !== window.location.origin && // Basic security check (adjust if TARGET_URL origin is different and expected)
        event.data &&
        event.data.type === 'navigateExternal' &&
        event.data.url
      ) {
        try {
          const url = new URL(event.data.url);
          // Allow navigation within the target domain, open others externally.
          if (url.hostname !== TARGET_DOMAIN && url.protocol.startsWith('http')) {
            window.open(event.data.url, '_blank');
            toast({
              title: 'Redirecting',
              description: `Opening ${url.hostname} in your browser.`,
            });
          } else {
            // If it's the same domain, let the iframe handle it or handle internally if needed
            // console.log('Internal navigation or same domain:', event.data.url);
          }
        } catch (e) {
          console.error('Error processing external navigation message:', e);
          // Handle invalid URL case if necessary
          window.open(event.data.url, '_blank'); // Fallback to opening
           toast({
             variant: "destructive",
             title: "Warning",
             description: `Could not verify URL, opening ${event.data.url} externally.`,
           });
        }
      } else if (event.data && event.data.type === 'injectScript') {
         // Handle script injection request from parent (if needed for complex scenarios)
         // This part is usually handled by the 'load' event listener below
      }
    };


    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [toast]);

  // Inject script into iframe to handle link clicks after load
  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe && !showSplash && isOnline) {
      const scriptContent = `
        document.addEventListener('click', function(event) {
          let target = event.target;
          // Traverse up the DOM tree to find the nearest anchor tag
          while (target && target.tagName !== 'A') {
            target = target.parentElement;
          }
          // Check if it's a valid anchor tag with an href
          if (target && target.tagName === 'A' && target.href) {
            // Ensure it's an absolute URL before creating URL object
            let absoluteUrl;
            try {
              absoluteUrl = new URL(target.href, document.baseURI).href;
              const url = new URL(absoluteUrl);
              const currentDomain = '${TARGET_DOMAIN}';

              // Only intercept http/https links that are not on the target domain
              if (url.hostname !== currentDomain && url.protocol.startsWith('http')) {
                event.preventDefault(); // Prevent default navigation within iframe
                // Send message to parent window to handle the external navigation
                window.parent.postMessage({ type: 'navigateExternal', url: absoluteUrl }, '*'); // Use target origin in production if known
              }
            } catch (e) {
              // If URL parsing fails or it's not http/https, let the browser handle it (e.g., mailto:, tel:)
              console.log('Non-HTTP link or invalid URL clicked:', target.href);
            }
          }
        }, true); // Use capture phase to catch clicks early
      `;

      const handleLoad = () => {
        try {
          // Best practice: Use postMessage to ask the iframe to execute the script
          // This requires the iframe page to listen for this specific message.
          // iframe.contentWindow?.postMessage({ type: 'executeScript', script: scriptContent }, TARGET_URL);

          // Alternative (less safe, might face CORS issues): Direct script injection
          if (iframe.contentDocument) {
            const scriptElement = iframe.contentDocument.createElement('script');
            scriptElement.textContent = scriptContent;
            iframe.contentDocument.body.appendChild(scriptElement);
            console.log('Link interception script injected.');
          } else {
             console.warn("Cannot access iframe contentDocument, script injection failed.");
              toast({
                 variant: "destructive",
                 title: "Integration Issue",
                 description: "Could not fully integrate external link handling.",
              });
          }

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

      // Ensure the iframe is fully loaded before attempting to inject script
      if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
        handleLoad();
      } else {
        iframe.addEventListener('load', handleLoad, { once: true });
      }

      return () => {
        iframe.removeEventListener('load', handleLoad);
        // Clean up injected script if possible? Difficult without script ID.
      };
    }
  }, [showSplash, isOnline, toast]); // Re-run if splash/online state changes or iframe ref is set


  if (showSplash || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center flex-grow bg-background animate-fade-scale-in">
        <Image
          src="/logo.png" // Updated logo path
          alt="食刻 Logo"
          width={120} // Adjusted size
          height={120} // Adjusted size
          priority
          data-ai-hint="groceries box"
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
    // Use flex-grow with overflow-hidden on the container to ensure iframe fills space without causing body scroll
    <div className="flex-grow flex flex-col w-full h-full overflow-hidden">
       <iframe
         ref={iframeRef}
         src={TARGET_URL}
         title="食刻 Web App"
         // Ensure iframe takes full height and width of its container
         className="w-full h-full border-none flex-grow"
         // Allow necessary permissions, be mindful of security
         sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation-by-user-activation"
       />
    </div>
  );
}
