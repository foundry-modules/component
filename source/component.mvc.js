$.Component.extend("ajax", function(namespace, params, callback) {

    var self = this,
        date = new Date();

    var options = {
            url: self.ajaxUrl + "&_ts=" + date.getTime(),
            data: $.extend(
                params,
                {
                    option: self.componentName,
                    namespace: namespace
                }
            )
        };

    options = $.extend(true, options, self.options.ajax);

    options.data[self.token()] = 1;

    // This is for server-side function arguments
    if (options.data.hasOwnProperty('args')) {
        options.data.args = $.toJSON(options.data.args);
    }

    if ($.isPlainObject(callback)) {

        if (callback.type) {

            switch (callback.type) {

                case 'jsonp':

                    callback.dataType = 'jsonp';

                    // This ensure jQuery doesn't use XHR should it detect the ajax url is a local domain.
                    callback.crossDomain = true;

                    options.data.transport = 'jsonp';
                    break;

                case 'iframe':

                    // For use with iframe-transport
                    callback.iframe = true;

                    callback.processData = false;

                    callback.files = options.data.files;

                    delete options.data.files;

                    options.data.transport = 'iframe';
                    break;
            }

            delete callback.type;
        }

        $.extend(options, callback);
    }

    if ($.isFunction(callback)) {
        options.success = callback;
    }

    var ajax = $.server(options);

    ajax.progress(function(message, type, code) {
        if (self.debug && type=="debug") {
            self.console.log(message, type, code);
        }
    });

    return ajax;
});

$.Component.extend("Controller", function() {

    var self = this,
        args = $.makeArray(arguments),
        name = args[0],
        staticProps,
        protoFactory;

    // Getter
    if (args.length==1) {
        return $.String.getObject(name);
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
        root: self.className + '.Controller',
        component: self
    });

    return $.Controller.apply(this, [name, staticProps, protoFactory]);
});

$.Component.extend("Model", function() {
    var self = this,
        args = $.makeArray(arguments),
        name = self.className + '.Model.' + args[0],
        staticProps,
        protoFactory;

    // Getter
    if (args.length==1) {
        return $.String.getObject(args[0]);
    }

    if( args.length==2) {
        staticProps = {},
        protoFactory = args[1]
    }

    if( args.length > 2) {
        staticProps = args[1],
        protoFactory = args[2]
    }

    // Map component as a static property
    // of the model class
    $.extend(staticProps, {
        component: self
    });

    return $.Model.apply(this, [name, staticProps, protoFactory]);
});

$.Component.extend("Model.List", function() {
    var self = this,
        args = $.makeArray(arguments),
        name = self.className + '.Model.List.' + args[0],
        staticProps,
        protoFactory;

    // Getter
    if (args.length==1) {
        return $.String.getObject(args[0]);
    }

    if( args.length==2) {
        staticProps = {},
        protoFactory = args[1]
    }

    if( args.length > 2) {
        staticProps = args[1],
        protoFactory = args[2]
    }

    // Map component as a static property
    // of the model class
    $.extend(staticProps, {
        component: self
    });

    return $.Model.List.apply(this, [name, staticProps, protoFactory]);
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
