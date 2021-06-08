import Button from '@material-ui/core/Button';
import Snackbar from '@material-ui/core/Snackbar';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { register } from 'register-service-worker';
import { inspect } from 'util';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

const Pwa = () => {
  const [update, setUpdate] = useState(null as null | (() => () => void));
  const [refreshing, setRefreshing] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const installPromptEvent = useRef<BeforeInstallPromptEvent | null>(null);

  const installApp = useCallback(() => {
    // Update the install UI to remove the install button
    setShowInstall(false);
    // Show the modal add to home screen dialog
    installPromptEvent.current?.prompt?.();
    // Wait for the user to respond to the prompt
    installPromptEvent.current?.userChoice.then((choice) => {
      if (choice.outcome === 'accepted') {
        console.log('User accepted the A2HS prompt');
      } else {
        console.log('User dismissed the A2HS prompt');
      }
      // Clear the saved prompt since it can't be used again
      installPromptEvent.current = null;
    });
  }, []);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (event) => {
      console.log('Before Install Prompt');
      // Prevent Chrome <= 67 from automatically showing the prompt
      event.preventDefault();
      // Stash the event so it can be triggered later.
      installPromptEvent.current = event;
      // Update the install UI to notify the user app can be installed
      setShowInstall(true);
    });

    if (process.env.NODE_ENV !== 'production') return;
    register(`${process.env.PUBLIC_URL}service-worker.js`, {
      ready: () => console.log('ready'),
      updatefound: () => console.log('updatefound'),
      cached: () => console.log('cached'),
      registered: () => console.log('registered'),
      updated(registration) {
        setUpdate(() => () => {
          setRefreshing(true);
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          registration.update().then(() => window.location.reload());
        });
      },
      offline() {
        // pushQuickMessage(
        //   "No internet connection found. App is running in offline mode."
        // );
      },
      error(error) {
        console.error('Error during service worker registration:', inspect(error));
      },
    });
  }, []);
  console.log(showInstall);
  return (
    <>
      <Snackbar
        open={update !== null}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        message={'New content is available; please refresh.'}
        action={
          <Button {...(!update ? null : { onClick: update })} disabled={refreshing}>
            refresh
          </Button>
        }
      />
      <Snackbar
        open={showInstall}
        message={'Add to home screen.'}
        action={<Button onClick={installApp}>Install</Button>}
      />
    </>
  );
};

export default memo(Pwa);

export const withPWA =
  <P extends object>(Component: React.ComponentType<P>) =>
  (props: P) =>
    (
      <>
        <Pwa />
        <Component {...(props as P)} />
      </>
    );
