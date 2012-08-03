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

var Component = $.Component = function(name, options, callback) {

    if (arguments.length < 1) {
        return Component.registry;
    }

    if (arguments.length < 2) {
        return Component.registry[name];
    }

    return Component.register(name, options, callback);
}

Component.registry = {};

Component.proxy = function(component, property, value) {

    // If it's a method
    if ($.isFunction(value)) {

        // Change the "this" context to the component itself
        component[property] = $.proxy(value, component);

    } else {

        component[property] = value;
    }
}

Component.register = function(name, options, callback) {

    // If an abstract component was found,
    // extract the execution queue.
    var queue = (window[name]) ? window[name].queue || [] : [];

    var self =

        // Put it in component registry
        Component.registry[name] =

        // Set it to the global namespace
        window[name] =

        // When called as a function, it will return the correct jQuery object.
        function(command) {

            return ($.isFunction(command)) ? command($) : component;
        };

    // @TODO: Component should be a deferred object, replace $.module("component/mvc").done().

    // Extend component with properties in component prototype
    $.each(Component.prototype, function(property, value) {

        Component.proxy(self, property, value);
    });

    self.$             = $;
    self.options       = options;
    self.className     = name;
    self.identifier    = name.toLowerCase();
    self.componentName = "com_" + self.identifier;
    self.version       = options.version;

    self.environment   = options.environment  || $.environment;
    self.debug         = (self.environment=='development');
    self.language      = "en";

    self.baseUrl       = options.baseUrl      || $.indexUrl + "?option=" + self.componentName;
    self.scriptPath    = options.scriptPath   || $.rootPath + "media/" + self.componentName + ((self.debug) ? "/scripts_/" : "/scripts/");
    self.templatePath  = options.templatePath || options.scriptPath;
    self.languagePath  = options.languagePath || self.baseUrl + '&tmpl=component&no_html=1&controller=lang&task=getLanguage';
    self.viewPath      = options.viewPath     || self.baseUrl + '&tmpl=component&no_html=1&controller=themes&task=getAjaxTemplate';
    self.prefix        = self.identifier + "/";

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

    // Go through each execution queue and run it
    $.each(queue, function(i, func) {

        if ($.isPlainObject(func)) {

            self[func.method].apply(self, func.args);
        }

        if ($.isArray(func)) {

            var chain = func,
                context = self;

            $.each(chain, function(i, func) {

                context = context[func.method].apply(context, func.args);
            });
        }
    });
}

Component.extend = function(property, value) {

    // For later components
    Component.prototype[property] = value;

    // For existing components
    $.each(Component.registry, function(name, component) {
        Component.proxy(component, property, value);
    });
}

$.extend(Component.prototype, {

    run: function(command) {

        return ($.isFunction(command)) ? command($) : component;
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

        // Get all component templates
        if (name==undefined) {

            return $.grep($.template(), function(template) {

                return template.indexOf(self.prefix)==0;
            });
        }

        // Prepend component prefix
        arguments[0] = self.prefix + name;

        // Getter or setter
        return $.template.apply(null, arguments);
    },

    require: function(options) {

        var self = this,
            options = options || {},
            require = $.require($.extend({path: self.scriptPath}, options)),
            __library  = require.library,
            __script   = require.script,
            __language = require.language,
            __template = require.template,
            __done     = require.done,
            requireScript;

        require.script = requireScript = function() {

            var batch = this,

                // Translate module names
                names = $.makeArray(arguments),

                args = $.map(names, function(name) {

                        // Ignore script settings
                    if ($.isPlainObject(name) ||

                        // and module definitions
                        $.isArray(name) ||

                        // and urls
                        $.isUrl(name) ||

                        // and relative paths.
                        /^(\/|\.)/.test(name)) return name;

                    var moduleName = self.prefix + name,
                        moduleUrl = $.uri(batch.options.path).toPath('./' + name + '.js').toString(); // Get extension from options

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

            // Temporarily disabled
            // if (!options.reload) {
            // }

            // If component is not collecting views
            if (!self.viewCollector) {

                // Then start collecting
                self.viewCollector = $.Deferred();

                // Create an array of names
                self.viewCollector.names = [];

                self.viewCollector.timer =

                    setTimeout(function() {

                        // Reassign myself to a private variable
                        var collector = self.viewCollector;

                        // I will now stop collecting, and wait for
                        // subsequent view() call to wake me up.
                        self.viewCollector = false;

                        // Collecting template loaders
                        collector.loaders = [];

                        $.each(collector.names, function(i, name){

                            var templateName = self.prefix + name,
                                templateLoader = $.template.loaders[templateName];

                            // If template loader hasn't been created,
                            if (!templateLoader) {

                                // create template loader.
                                templateLoader = $.template.loaders[templateName] = $.Deferred();
                            }

                            // Push it to our collection
                            collector.loaders.push(templateLoader);
                        });

                        if (collector.names.length > 0) {

                            $.ajax(
                                {
                                    url: options.path,

                                    dataType: "json",

                                    data: {
                                        names: collector.names
                                    }
                                })
                                .done(function(templates) {

                                    if ($.isArray(templates)) {

                                        $.each(templates, function(i, template) {

                                            var templateName = self.prefix + template.name;

                                            $.template(templateName, template.content);

                                            $.template.loaders[templateName].resolveWith($, [template.content]);
                                        });
                                    }
                                });
                        }

                        $.when.apply(null, collector.loaders)
                            .done(function() {
                                collector.resolve();
                            })
                            .fail(function(){
                                collector.reject();
                            });

                    // Joomla session timestamp is per second, we add another 200ms just to be safe.
                    }, 1200);
            }

            // Warning: There may be a race condition issue.

            var task = self.viewCollector;

            task.names = task.names.concat(names);

            task.name = "View " + self.prefix + task.names.join(", " + self.prefix);

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

            } else {

                names = args;
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

        name = self.prefix + name;


        return (factory) ?

            // Set module
            $.module.apply(null, [name, function(){

                var module = this;

                // Wait until MVC is loaded
                $.module('component/mvc').done(function(){

                    factory.call(module, $);

                });
            }])

            :

            // Get module
            $.module(name);
    }
});
