self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});

self.addEventListener("push", (event) => {
  event.waitUntil(
    (async () => {
      let payload = null;

      try {
        const subscription = await self.registration.pushManager.getSubscription();
        if (subscription?.endpoint) {
          const response = await fetch(
            `/api/push-subscriptions.php?action=pending&endpoint=${encodeURIComponent(
              subscription.endpoint
            )}`,
            {
              cache: "no-store",
            }
          );
          if (response.ok) {
            const data = await response.json();
            payload = data?.notification ?? null;
          }
        }
      } catch {}

      if (!payload && event.data) {
        try {
          payload = event.data.json();
        } catch {
          payload = {
            title: "Doctor Barber",
            body: event.data.text(),
            url: "/moji-termini",
          };
        }
      }

      if (!payload) {
        payload = {
          title: "Doctor Barber",
          body: "Imate novu notifikaciju.",
          url: "/moji-termini",
        };
      }

      await self.registration.showNotification(payload.title || "Doctor Barber", {
        body: payload.body || "",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        data: {
          url: payload.url || "/moji-termini",
          appointmentId: payload.appointmentId || null,
        },
      });
    })()
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || "/moji-termini";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => "focus" in client);
      if (existing) {
        existing.focus();
        if ("navigate" in existing) {
          existing.navigate(targetUrl);
        }
        return;
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }

      return undefined;
    })
  );
});
