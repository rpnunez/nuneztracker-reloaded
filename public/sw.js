self.addEventListener("push", (event) => {
  let data = { title: "NunezTracker", body: "Check in on your plan." };
  try {
    data = event.data.json();
  } catch {
    /* ignore */
  }
  event.waitUntil(self.registration.showNotification(data.title || "NunezTracker", { body: data.body, icon: "/icon.svg" }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});
