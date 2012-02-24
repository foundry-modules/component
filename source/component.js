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
    self.templatePath  = self.baseUrl + '&controller=themes&task=getAjaxTemplate&no_html=1&tmpl=component&templateName=';
    self.languagePath  = self.baseUrl + '&controller=lang&task=getLanguage&no_html=1';
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

        // Only when MVC is loaded
        $.module('component/mvc').done(function() {

            // and intial dependencies are loaded
            self.dependencies
                .done(function() {

                    // and document is ready
                    $(document).ready(function() {

                        // then only execute ready callback
                        self.run(callback);

                    });
                });
        });
    },

    require: function(options) {

        var self = this,
            options = options || {},
            require = $.require($.extend(options, {path: self.scriptPath})),
            __library = require.library,
            __script = require.script,
            __language = require.language,
            __done = require.done,
            requireScript;

        require.script = requireScript = function() {

            // TODO: Merge script options

            // Translate module names
            var names = $.makeArray(arguments),

                args = $.map(names, function(name) {

                        // Ignore script settings
                    if ($.isPlainObject(name) ||

                        // and module definitions
                        $.isArray(name) ||

                        // and urls
                        $.isUrl(name) ||

                        // and relative paths.
                        /^(\/|\.)/.test(name)) return name;

                    var moduleName = self.name.toLowerCase() + "/" + name,
                        moduleUrl = self.scriptPath + name + ".js"; // TODO: Get extension from options

                    return [[moduleName, moduleUrl, true]];
                });

            return __script.apply(require, args);
        }

        require.library = function() {

            require.script = __script;

            __library.apply(require, arguments);

            require.script = requireScript;

            return require;
        }

        require.language = function() {

            var args = $.makeArray(arguments),
                override = {path: self.languagePath};

            if ($.isPlainObject(args[0])) {

                args[0] = $.extend(args[0], override);

            } else {
                args = [override].concat(args);
            }

            return __language.apply(require, args);
        }

        // To ensure all require callbacks are executed after the component's dependencies are ready,
        // every callback made through component.require() is wrapped in a component.ready() function.
        require.done = function(callback) {

            return __done.call(require, function(){

                $.module('component/mvc').done(

                    (options.loadingComponentDependencies) ? callback : function() { self.ready(callback); }

                );
            });
        }

        return require;
    },

    module: function(name, factory) {

        var self = this;

        // TODO: Support for multiple module factory assignment
        if ($.isArray(name))
            return;

        name = self.name.toLowerCase() + "/" + name;

        return $.module.apply(null, [name, factory]);
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
