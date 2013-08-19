// Component should always be the last core plugin to load.
// Now that Component is done loading, we open the flood gate,
// distribute Foundry to all.

Dispatch("$FOUNDRY_NAMESPACE").toAll();
