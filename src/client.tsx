import { StrictMode, startTransition } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { StartClient } from '@tanstack/react-start/client';
import { RouterProvider } from '@tanstack/react-router';
import { getRouter } from './router';

// An offline navigation has no server route state. Load the current URL locally.
if (document.documentElement.dataset.fitOffline === 'true') {
  const router = getRouter();
  await router.load();
  createRoot(document).render(<StrictMode><RouterProvider router={router}/></StrictMode>);
} else {
  startTransition(() => { hydrateRoot(document, <StrictMode><StartClient/></StrictMode>); });
}
