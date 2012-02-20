/**
 * jquery.component.
 * Boilerplate for client-side MVC application.
 *
 * Copyright (c) 2011 Jason Ramos
 * www.stackideas.com
 *
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 */

var Components = {};

var Component = function(name, options, callback) {

    var self = this;

    self.options       = options;
    self.name          = name;
    self.componentName = "com_" + this.name.toLowerCase();
    self.version       = options.version;
    self.environment   = options.environment || Foundry.environment;
    self.debug         = (self.environment=='development');
    self.baseUrl       = options.baseUrl || Foundry.indexUrl + "?option=" + this.componentName;
    self.scriptPath    = options.scriptPath || Foundry.rootPath + "media/" + this.componentName + ((self.debug) ? "/scripts_/" : "/scripts/");
    self.ejsPath       = self.baseUrl + '&controller=themes&task=getAjaxTemplate&no_html=1&tmpl=component&templateName=';
    self.isReady       = false;
    self.dependencies  = $.Deferred();

    var resolveComponent = function() {

        self.dependencies.resolve();

        self.ready(function() {
            self.isReady = true;
            self.run(callback);
        });
    }

    // Load component dependencies,
    if ($.isFunction(options.dependencies)) {

        var require = self.require({loadingComponentDependencies: true});

        options.dependencies.call(self, require);

        require.done(resolveComponent);

    // or resolve component straightaway.
    } else {
        resolveComponent();
    }
}

$.extend(Component.prototype, {

    run: function(func) {

        if (!$.isFunction(func))
            return;

        return func.call(self, $);
    },

    ready: function(callback) {

        if (!$.isFunction(callback))
            return;

        var self = this;

        self.dependencies
            .done(function() {
                $.module('component/mvc').done(function(){
                    self.run(callback);
                });
            });
    },

    require: function(options) {

        var self = this,
            options = options || {},
            require = $.require($.extend(options, {path: self.scriptPath})),
            done = require.done;

        // To ensure all require callbacks are executed after the component's dependencies are ready,
        // every callback made through component.require() is wrapped in a component.ready() function.
        require.done = function(callback) {
            done.call(require, (options.loadingComponentDependencies) ? callback : function() { self.ready(callback); });
        }

        return require;
    }
});

$.Component = function(name, options, callback) {

    if (arguments.length < 1)
        return Components;

    if (arguments.length < 2)
        return Components[name];

    // Create a global namespace for this component
    return window[name] = Components[name] = new Component(name, options, callback);
};
