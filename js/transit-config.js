requirejs.config({
	baseUrl: "js",
	paths: {
		"jquery": "https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min"
	}
});

/*
 * 0 = empty cell
 * 1 = road
 * 2 = road with 2-staged traffic light
 * 4 = road with 4-staged traffic light
 */
var binaryTable = [
	[0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0],
	[1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0],
	[0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
	[0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0],
	[0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0],
	[1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1],
	[0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0],
	[0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0],
	[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 4, 1, 1, 1, 1, 1],
	[0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0],
	[0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0],
	[0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0],
	[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
	[0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0]
];

function printCelInfo(x, y) {
	var table = MAIN_TABLE;
	var cel = table.getCelAt(x, y);
	var info = cel.printInfo();

	console.debug(info);
}

var CONFIG = {
	paused : false,
	speed : 1.0,

	pause: function() {
		CONFIG.paused = true;
	},

	play: function(speed) {
		CONFIG.paused = false;
		CONFIG.speed = speed * 1;
	}
};

requirejs(['transit-main']);
