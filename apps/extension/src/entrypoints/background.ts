export default defineBackground(() => {
  // Clicking the toolbar icon opens the side panel. Without this the action click is a no-op
  // unless a popup is declared, and this extension deliberately has no popup.
  browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {
    // Not fatal — the user can still open the panel from Chrome's side-panel menu.
  });
});
