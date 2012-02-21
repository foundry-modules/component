Component
=========
`$.Component` is a boilerplate for client-side MVC application.


Language
--------

To customize remote url where language strings are retrieved, modify the `languagePath` option during creation of the Component:

	$.Component(
		"ComponentName",
		{
			languagePath: "http://foobar.com/?getlang="
		}
	);

To load language strings from server-side:

	ComponentName
		.require()
		.language(
			"COM_COMPONENTNAME_ADD_ITEM",
        	"COM_COMPONENTNAME_REMOVE_ITEM"
		);

To access language string:

	$.language("COM_COMPONENTNAME_ADD_ITEM", "Foobar");
	// returns "Do you want to return item Foobar?"




