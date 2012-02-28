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

    // @TODO: Component should be a deferred object, replace $.module("component/mvc").done().

    var self = this;

    self.options       = options;
    self.name          = name;
    self.componentName = "com_" + this.name.toLowerCase();
    self.version       = options.version;

    self.environment   = options.environment || Foundry.environment;
    self.debug         = (self.environment=='development');
    self.language      = "en";

    self.baseUrl       = options.baseUrl      || Foundry.indexUrl + "?option=" + this.componentName;
    self.scriptPath    = options.scriptPath   || Foundry.rootPath + "media/" + this.componentName + ((self.debug) ? "/scripts_/" : "/scripts/");
    self.templatePath  = options.templatePath || options.scriptPath;
    self.languagePath  = options.languagePath || self.baseUrl + '&tmpl=component&no_html=1&controller=lang&task=getLanguage';
    self.viewPath      = options.viewPath     || self.baseUrl + '&tmpl=component&no_html=1&controller=themes&task=getAjaxTemplate';
    self.prefix        = self.name.toLowerCase() + "/";


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

    template: function(name) {

        var self = this;

        if (name==undefined) {

            return $.grep($.template(), function(template) {

                return template.indexOf(self.prefix)==0;
            });
        }

        arguments[0] = self.prefix + name;

        return $.template.apply(null, arguments);
    },

    require: function(options) {

        var self = this,
            options = options || {},
            require = $.require($.extend(options, {path: self.scriptPath})),
            __library  = require.library,
            __script   = require.script,
            __language = require.language,
            __template = require.template,
            __done     = require.done,
            requireScript;

        require.script = requireScript = function() {

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
        };

        // Override path
        require.template = function() {

            var args = $.makeArray(arguments),

                options = {path: self.templatePath},

                names = [];

            if ($.isPlainObject(args[0])) {

                options = $.extend(args[0], options);

                names = args.slice(1);

            } else {

                names = args;
            }

            names = $.map(names, function(name) {

                templateName = self.prefix + name;

                return [[templateName, name]];
            });

            return __template.apply(require, [options].concat(names));
        };

        require.view = function() {

            var batch = this,

                args = $.makeArray(arguments),

                options = {path: self.viewPath},

                names = [];

            if ($.isPlainObject(args[0])) {

                options = $.extend(args[0], options);

                names = args.slice(1);

            } else {

                names = args;
            }

            if (!options.reload) {

                var templates = $.template();

                names = $.grep(names, function(name){
                    return !templates[self.prefix + name];
                });
            }

            if (names.length < 1) {
                return require;
            }

            var task = $.ajax(
                {
                    url: options.path,

                    dataType: "json",

                    data: {
                        names: names
                    }
                })
                .success(function(templates) {

                    if ($.isArray(templates)) {

                        $.each(templates, function(i, template) {

                            $.template(self.prefix + template.name, template.content);
                        });
                    }
                });

            task.name = "View " + self.prefix + names.join(", " + self.prefix);

            batch.addTask(task);

            return require;
        };

        require.library = function() {

            // Replace component script method
            // with foundry script method
            require.script = __script;

            // Execute library method
            __library.apply(require, arguments);

            // Reverse script method replacement
            require.script = requireScript;

            return require;
        };

        require.language = function() {

            var args = $.makeArray(arguments),

                options = {path: self.languagePath},

                names = [];

            if ($.isPlainObject(args[0])) {

                options = $.extend(args[0], options);

                names = args.slice(1);
            }

            return __language.apply(require, [options].concat(names));
        };

        // To ensure all require callbacks are executed after the component's dependencies are ready,
        // every callback made through component.require() is wrapped in a component.ready() function.
        require.done = function(callback) {

            return __done.call(require, function(){

                $.module('component/mvc').done(

                    (options.loadingComponentDependencies) ?

                        function() {
                            callback.call(self, $);
                        } :

                        function() {
                            self.ready(callback);
                        }
                );
            });
        };

        return require;
    },

    module: function(name, factory) {

        var self = this;

        // TODO: Support for multiple module factory assignment
        if ($.isArray(name)) {
            return;
        }

        name = self.name.toLowerCase() + "/" + name;

        return $.module.apply(null, [name, function(){

            var module = this;

            // Wait until MVC is loaded
            $.module('component/mvc').done(function(){

                factory.call(module, $);

            });
        }]);
    }
});

$.Component = function(name, options, callback) {

    if (arguments.length < 1) {
        return Components;
    }

    if (arguments.length < 2) {
        return Components[name];
    }

    // Create a global namespace for this component
    return window[name] = Components[name] = new Component(name, options, callback);
};
