$.module('component/mvc', function() {

var module = this;

$.require()
    .library(
        'server',
        'mvc/controller',
        'mvc/model',
        'mvc/view',
        'mvc/view.ejs',
        'mvc/lang.json'
    )
    .done(function() {

        Component.prototype.ajax = function(namespace, params, callback) {
            var self = this;

            var options = {
                    url: Foundry.indexUrl,
                    data: $.extend(
                        params,
                        {
                            option: self.componentName,
                            namespace: namespace
                        }
                    )
                };

            options = $.extend(true, options, this.options.ajax);

            // This is for server-side function arguments
            if (options.data.hasOwnProperty('args'))
                options.data.args = $.toJSON(options.data.args);

            if (callback.type=='jsonp')
            {
                delete callback.type;

                callback.dataType = 'jsonp';

                // This ensure jQuery doesn't use XHR should it detect the ajax url is a local domain.
                callback.crossDomain = true;
            }

            if ($.isPlainObject(callback))
                $.extend(options, callback);

            if ($.isFunction(callback))
                options.success = callback;

            return $.server(options);
        };

        Component.prototype.Controllers = function() {

            var self = this,
                args = $.makeArray(arguments),
                name = this.name + '.Controllers.' + args[0],
                staticProps,
                protoFactory;

            // Getter
            if (args.length==1) {
                return $.String.getObject(args[0]);
            };

            // Setter
            if (args.length > 2) {
                staticProps = args[1],
                protoFactory = args[2]
            } else {
                staticProps = {},
                protoFactory = args[1]
            }

            $.extend(staticProps, {
                component: self
            });

            // TODO: Destroy controller function
            this.Controllers.destroy = function(){};

            return $.Controller.apply(this, [name, staticProps, protoFactory]);
        };

        Component.prototype.Views = function(name) {

            var self = this,
                args = $.makeArray(arguments),
                templatePrefix = self.name.toLowerCase() + "/";

            // Getter (all component views)
            if (args.length < 1) {
                return $.grep($.template(), function(template, templateName){
                    return templateName.indexOf(templatePrefix)==0;
                });
            }

            // Add template prefix
            name = templatePrefix + name;

            // Getter
            if (args.length==1) {
                return $.template(name);
            }

            // Setter
            if (args.length > 1) {
                args[0] = name;
                return $.View.apply(this, args);
            }
        };

        module.resolve();

    });

});
