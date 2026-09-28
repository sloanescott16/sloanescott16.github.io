/* Press Box v21: minimal service worker so the site installs as an app.
   Pass-through only: every request goes to the network, nothing is cached,
   so scores and the sub-sites are never stale. */
"use strict";
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", function (e) { e.respondWith(fetch(e.request)); });
