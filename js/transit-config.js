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
	[0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0],
	[1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0],
	[0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 4, 1, 1, 1, 0],
	[0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
	[0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
	[1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0],
	[0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
	[0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
	[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 4, 1, 1, 1, 1, 0, 0, 1, 0],
	[0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
	[0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
	[0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
	[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
	[0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0]
];

function printCelInfo(x, y) {
	var table = MAIN_TABLE;
	var cel = table.getCelAt(x, y);
	var info = cel.printInfo();

	console.debug(info);
}

var CONFIG = {
	paused : false,
	speed : 5.0,
	maxCars : 15,
	chanceTurnRight : 25,
	chanceTurnLeft : 25,
	chanceForward : 50,
	maxCarSpeed : 3000,
	accCarSpeed : 400,
	avoidCollision : true,

	pause: function() {
		CONFIG.paused = true;
	},

	play: function() {
		CONFIG.paused = false;
		CONFIG.speed = $('#speed').val() * 1;
		CONFIG.maxCars = $('#maxCars').val() * 1;
		CONFIG.chanceTurnRight = $('#chanceTurnRight').val() * 1;
		CONFIG.chanceTurnLeft = $('#chanceTurnLeft').val() * 1;
		CONFIG.maxCarSpeed = $('#maxCarSpeed').val() * 1;
		CONFIG.accCarSpeed = $('#accCarSpeed').val() * 1;
		CONFIG.avoidCollision = $("#avoidCollision").is(":checked");
	}
};

requirejs(['transit-main']);
