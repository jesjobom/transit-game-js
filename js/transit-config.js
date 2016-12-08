requirejs.config({
	baseUrl: "js",
	paths: {
		"jquery": "https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min"
	},
	shim: {
		"transit-main" : {
			
		}
	}
});

var binaryTable = [
	[0, 1, 0, 0, 0],
	[1, 1, 1, 1, 0],
	[0, 1, 0, 1, 1],
	[0, 1, 0, 0, 0]
];

requirejs(['transit-main']);
