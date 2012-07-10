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

        $.Component.extend("ajax", function(namespace, params, callback) {

            var self = this;

            var options = {
                    url: $.indexUrl,
                    data: $.extend(
                        params,
                        {
                            option: self.componentName,
                            namespace: namespace
                        }
                    )
                };

            options = $.extend(true, options, self.options.ajax);

            // Look for an updated token replaced by Joomla on page load and use
            // that token instead. This is for sites where cache is turned on.
            var token = $("input#" + self.identifier + "-token").val();

            if (token) {
                options.data[token] = 1;
            }

            // This is for server-side function arguments
            if (options.data.hasOwnProperty('args')) {
                options.data.args = $.toJSON(options.data.args);
            }

            if (callback.type=='jsonp')
            {
                delete callback.type;

                callback.dataType = 'jsonp';

                // This ensure jQuery doesn't use XHR should it detect the ajax url is a local domain.
                callback.crossDomain = true;
            }

            if ($.isPlainObject(callback)) {
                $.extend(options, callback);
            }

            if ($.isFunction(callback)) {
                options.success = callback;
            }

            return $.server(options);
        });

        $.Component.extend("Controller", function() {

            var self = this,
                args = $.makeArray(arguments),
                name = self.className + '.Controller.' + args[0],
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

            // Map component as a static property
            // of the controller class
            $.extend(staticProps, {
                component: self
            });

            return $.Controller.apply(this, [name, staticProps, protoFactory]);
        });

        $.Component.extend("View", function(name) {

            var self = this;

            // Gett all component views
            if (arguments.length < 1) {
                return self.template();
            }

            // Prepend component prefix
            arguments[0] = self.prefix + arguments[0];

            // Getter or setter
            return $.View.apply(this, arguments);
        });

        module.resolve();

    });

});
