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
            var args = arguments;
            args[0] = this.name + '.Controllers.' + args[0];

            if (args.length < 2)
            {
                return $.String.getObject(args[0]);
            };

            // TODO: Destroy controller function
            this.Controllers.destroy = function(){};

            return $.Controller.apply(this, args);
        };

        // TODO: Setter.
        Component.prototype.Views = function(name) {

            // Append component identifier
            name = this.name + '.Views.' + name;
            name = name.toLowerCase();

            // If template does not exist in <script> tag, use the url.
            if ($('script[type="text/ejs"][id="'+name+'"]').length < 1)
            {
                name = self.ejsPath + name;
            };

            // Replace the original argument
            var args = $.makeArray(arguments);
            args[0] = name;

            return $.View.apply(this, args);
        };

        // Depecrated.
        Component.prototype.View = function(name) {
            // Append component identifier
            name = this.name.toLowerCase() + '.' + name;

            // If template does not exist in <script> tag, use the url.
            if ($('script[type="text/ejs"][id="'+name+'"]').length < 1)
            {
                name = self.ejsPath + name;
            };

            // Replace the original argument
            var args = $.makeArray(arguments);
            args[0] = name;

            return $.View.apply(this, args);
        };

        module.resolve();

    });

});
