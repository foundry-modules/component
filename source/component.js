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

    var token = window[name].token;

    var self =

        // Put it in component registry
        Component.registry[name] =

        // Set it to the global namespace
        window[name] =

        // When called as a function, it will return the correct jQuery object.
        function(command) {

            return ($.isFunction(command)) ? command($) : component;
        };

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
    self.safeVersion   = self.version.replace(/\./g,"");

    self.environment   = options.environment  || $.environment;
    self.mode          = options.mode         || $.mode;
    self.debug         = (self.environment=='development');
    self.console       = Component.console(self);

    self.language      = options.language || $.locale.lang || "en";

    self.baseUrl       = options.baseUrl      || $.indexUrl + "?option=" + self.componentName;
    self.scriptPath    = options.scriptPath   || $.rootPath + "media/" + self.componentName + "/scripts/";
    self.stylePath     = options.stylePath    || $.rootPath + "media/" + self.componentName + "/styles/";
    self.templatePath  = options.templatePath || options.scriptPath;
    self.languagePath  = options.languagePath || self.baseUrl + '&tmpl=component&no_html=1&controller=lang&task=getLanguage';
    self.viewPath      = options.viewPath     || self.baseUrl + '&tmpl=component&no_html=1&controller=themes&task=getAjaxTemplate';
    self.prefix        = self.identifier + "/";

    if (token) {
        self.ajax = {};
        self.ajax[token] = 1;
    }    

    self.optimizeResources  = options.optimizeResources || (self.environment==="optimized") ? true : false;
    self.resourcePath       = options.resourcePath || self.baseUrl + '&tmpl=component&no_html=1&controller=foundry&task=getResource';
    self.resourceCollectionInterval = 1200; // Joomla session timestamp is per second, we add another 200ms just to be safe.

    self.scriptVersioning = options.scriptVersioning || false;

    // Dispatch itself to precompiled scripts first
    Dispatch.to(self.className).at(function(fn){ fn($, self); });

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

$.template("component/console",'<div id="[%== component.identifier %]-console" class="foundry-console" style="display: none; z-index: 999999;"><div class="console-header"><div class="console-title">[%= component.className %] [%= component.version %]</div><div class="console-remove-button">x</div></div><div class="console-log-item-group"></div><style type="text/css">.foundry-console{position:fixed;width:50%;height:50%;bottom:0;left:0;background:white;box-shadow: 0 0 5px 0;margin-left: 25px;}.console-log-item-group{width: 100%;height: 100%;overflow-y:scroll;}.console-header{position: absolute;background:red;color:white;font-weight:bold;top:-24px;left: 0;line-height:24px;width:100%}.console-remove-button{text-align:center;cursor: pointer;display:block;width: 24px;float:right}.console-remove-button:hover{color: yellow}.console-title{padding: 0 5px;float:left}.console-log-item{padding: 5px}.console-log-item + .console-log-item{border-top: 1px solid #ccc}</style></div>');

Component.console = function(component) {

    return (function(self){

        var instance = function(method) {

                if (arguments.length < 1) {
                    return instance.toggle();
                }

                return instance[method] && instance[method].apply(instance, arguments);
            },

            element;

            instance.selector = "#" + self.identifier + "-console";

            instance.init = (function() {

                element = $(instance.selector);

                if (element.length < 1) {
                    element = $($.View("component/console", {component: self})).appendTo("body");

                    element.find(".console-remove-button").click(function(){
                        element.hide();
                    });
                }

                instance.element = element;

                return arguments.callee;
            })();

            instance.methods = {

                log: function(message, type, code) {

                    type = type || "info";

                    var itemGroup = element.find(".console-log-item-group"),
                        item =
                            $(document.createElement("div"))
                                .addClass("console-log-item type-" + type)
                                .attr("data-code", code)
                                .html(message);

                    itemGroup.append(item);
                    itemGroup[0].scrollTop = itemGroup[0].scrollHeight;

                    // Automatically show window on each log
                    if (self.debug) { element.show(); }
                },

                toggle: function() {
                    element.toggle();
                },

                reset: function() {
                    element.find(".console-log-item-group").empty();
                }
            };

        $.each(instance.methods, function(method, fn) {
            instance[method] = function() {
                instance.init(); // Always call init in case of destruction of element
                return fn.apply(instance, arguments);
            }
        });

        return instance;

    })(component);
}

$.extend(Component.prototype, {

    run: function(command) {

        return ($.isFunction(command)) ? command($) : component;
    },

    ready: function(callback) {

        if (!$.isFunction(callback)) return;

        var self = this;

        // When document is ready
        $(document).ready(function() {

            // then only execute ready callback
            // wrapped in a setTimeout to prevent
            // chain from breaking.
            setTimeout(function(){self.run(callback)}, 0);
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

    // Component require extends $.require with the following additional methods:
    // - resource()
    // - view()
    // - language()
    //
    // It also changes the behaviour of existing methods to load in component-specific behaviour.
    require: function(options) {

        var self = this,

            options = options || {},

            require = $.require(options),

            _require = {};

            // Keep a copy of the original method so the duck punchers below can use it.
            $.each(["library", "script", "language", "template", "done"], function(i, method){
                _require[method] = require[method];
            });

        // Resource call should NOT be called directly.
        // .resource({type: "view", name: "photo.item", loader: deferredObject})
        require.resource = function(resource) {

            // If this is not a valid resource object, skip.
            if (!$.isPlainObject(resource)) return;
            if (!resource.type || !resource.name || !$.isDeferred(resource.loader)) return;

            var batch = this;

            // Get resource collector
            var resourceCollector = self.resourceCollector;

            // If we haven't started collecting resources
            if (!resourceCollector) {

                // Then start collecting resources
                resourceCollector = self.resourceCollector = $.Deferred();

                $.extend(resourceCollector, {

                    name: $.uid("ResourceCollector"),

                    manifest: [],

                    loaderList: [],

                    loaders: [],

                    load: function() {

                        // End this batch of resource collecting
                        delete self.resourceCollector;

                        // If there are not resources to pull,
                        // just resolve resource collector.
                        if (resourceCollector.manifest.length < 0) {
                            resourceCollector.resolve();
                            return;
                        }

                        var retry = 0;

                        var loadResources = function(){

                            retry++;

                            $.Ajax(
                                {
                                    type: 'POST',
                                    url: self.resourcePath,
                                    dataType: "json",
                                    data: {
                                        resource: resourceCollector.manifest
                                    }
                                })
                                .done(function(manifest) {

                                    if (!$.isArray(manifest)) {
                                        resourceCollector.reject("Server did not return a valid resource manifest.");
                                        return;
                                    }

                                    $.each(manifest, function(i, resource) {

                                        var content = resource.content;

                                        resourceCollector.loaders[resource.id]
                                            [content!==undefined ? "resolve" : "reject"]
                                            (content);
                                    });

                                    if (retry > 1 && self.debug) {
                                        console.info("Attempt to try and get resources again was successful!");
                                    }                                    
                                })
                                .fail(function(){
                                    if (retry > 2) {
                                        if (self.debug) { console.error("Unable to get resource again. Giving up!"); };
                                        return;
                                    }
                                    if (self.debug) {
                                        console.warn("Unable to get resource. Trying again...");
                                    }
                                    loadResources();
                                });
                        }

                        loadResources();

                        // Resolve resource collector when all is done
                        $.when.apply(null, resourceCollector.loaderList)
                            .done(resourceCollector.resolve)
                            .fail(resourceCollector.reject);
                    }
                });

                setTimeout(resourceCollector.load, self.resourceCollectionInterval);
            }

            // Create a resource id
            var id = resource.id = $.uid("Resource");

            // Add to the loader map
            // - to be used to resolve the loader with the returned content
            resourceCollector.loaders[id] = resource.loader;

            // Add to the loader list
            // - to be used with $.when()
            resourceCollector.loaderList.push(resource.loader);

            // Remove the reference to the loader
            // - so the loader doesn't get included in the manifest that gets sent to the server
            delete resource.loader;

            // Then add it to our list of resource manifest
            resourceCollector.manifest.push(resource);

            // Note: Only resource loaders are batch tasks, not resource collectors.
            // var task = resourceCollector;
            // batch.addTask(task);
            return require;
        };

        require.view = function() {

            var batch   = this,

                request = batch.expand(arguments, {path: self.viewPath}),

                loaders = {},

                options = request.options,

                names   = $.map(request.names, function(name) {

                    // Get template loader
                    var absoluteName = self.prefix + name,
                        loader = $.require.template.loaders[absoluteName];

                    // If this is being loaded, skip.
                    if (loader) return;

                    loader = $.require.template.loader(absoluteName);

                    // Add template loader as a task of this batch
                    batch.addTask(loader);

                    // Load as part of a coalesced ajax call if enabled
                    if (self.optimizeResources) {

                        require.resource({
                            type: "view",
                            name: name,
                            loader: loader
                        });

                        return;

                    } else {

                        loaders[name] = loader;
                        return name;
                    }
                });

            // Load using regular ajax call
            // This will always be zero when optimizeResources is enabled.
            if (names.length > 0) {

                $.Ajax(
                    {
                        url: options.path,
                        dataType: "json",
                        data: { names: names }
                    })
                    .done(function(templates) {

                        if (!$.isArray(templates)) return;

                        $.each(templates, function(i, template) {

                            var content = template.content;

                            loaders[template.name]
                                [content!==undefined ? "resolve" : "reject"]
                                (content);
                        });
                    });
            }

            return require;
        };

        require.language = function() {

            var batch   = this,

                request = batch.expand(arguments, {path: self.languagePath});

            // Load as part of a coalesced ajax call if enabled
            if (self.optimizeResources) {

                $.each(request.names, function(i, name) {

                    var loader = $.require.language.loaders[name];

                    if (loader) return;

                    loader = $.require.language.loader(name);

                    batch.addTask(loader);

                    require.resource({
                        type: "language",
                        name: name,
                        loader: loader
                    });
                });

            } else {

                _require.language.apply(require, [request.options].concat(request.names));
            }

            return require;
        };

        require.library = function() {

            _require.script.apply(this, arguments);

            return require;
        };

        require.script = function() {

            var batch = this,

                request = batch.expand(arguments, {path: self.scriptPath})

                names = $.map(request.names, function(name) {

                    // Ignore module definitions
                    if ($.isArray(name) ||

                        // and urls
                        $.isUrl(name) ||

                        // and relative paths.
                        /^(\/|\.)/.test(name)) return name;

                    var moduleName = self.prefix + name,

                        moduleUrl =

                            $.uri(request.options.path)
                                .toPath(
                                    './' + name + '.' + (request.options.extension || 'js') +
                                    ((self.scriptVersioning) ? "?" + "version=" + self.safeVersion : "")
                                )
                                .toString();

                    return [[moduleName, moduleUrl, true]];
                });

            _require.script.apply(require, [request.options].concat(names));

            return require;
        };

        // Override path
        require.template = function() {

            var batch   = this,

                request = batch.expand(arguments, {path: self.templatePath});

            _require.template.apply(require, [request.options].concat(

                $.map(request.names, function(name) {

                    return [[self.prefix + name, name]];
                })
            ));

            return require;
        };


        // Only execute require done callback when component is ready
        require.done = function(callback) {

            return _require.done.call(require, function(){

                self.ready(callback);
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

        var fullname = self.prefix + name;

        return (factory) ?

            // Set module
            $.module.apply(null, [fullname, function(){

                var module = this;

                factory.call(module, $);
            }])

            :

            // Get module
            $.module(fullname);
    }

});
