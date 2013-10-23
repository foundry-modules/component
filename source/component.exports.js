// Component should always be the last core plugin to load.

// Execute all pending foundry modules
$FOUNDRY_BOOTLOADER.module.execute();

// Get all abstract components
$.each($FOUNDRY_BOOTLOADER.component(), function(i, abstractComponent){

    // If this component is registered, stop.
    if (abstractComponent.registered) return;

    // Create an instance of the component
    $.Component.register(abstractComponent);
});