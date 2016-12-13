requirejs.config({
	baseUrl: "js",
	paths: {
		"jquery": "https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min"
	}
});

var binaryTable = [
	[0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
	[1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0, 1, 0],
	[0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
	[0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0],
	[0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0],
	[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
	[0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0],
	[0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0],
	[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
	[0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
	[0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0],
	[0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0]
];

function printCelInfo(x, y) {
	var table = MAIN_TABLE;
	var cel = table.getCelAt(x, y);
	var info = cel.printInfo();

	console.debug(info);
}

requirejs(['transit-main']);
