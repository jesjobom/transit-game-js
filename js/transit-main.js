define(['jquery', 'transit-table', 'transit-car'], function($, table, car) {

	function director(maxCars, binaryTable) {
		var self = this;
	
		var maxCars = maxCars;
		var mainTable = null;

		self.start = function() {
			mainTable = new table(binaryTable);
			loop();
		};

		function loop() {
			$("#game_area").html(mainTable.generateTable());
			if(mainTable.quantityCars() < maxCars) {
				mainTable.addCar(generateCar());
			}

			setTimeout(loop, 2000);
		}

		function generateCar() {
			return new car((Math.floor(Math.random() * 26) +10).toString(36));
		}
	}

	var director = new director(3, binaryTable);
	director.start();
});
