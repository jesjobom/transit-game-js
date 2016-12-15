define(['jquery', 'transit-table', 'transit-car'], function($, table, car) {

	function director(maxCars, binaryTable) {
		var self = this;

		var maxCars = maxCars;
		var mainTable = null;

		self.start = function() {
			mainTable = new table(binaryTable);
			window.MAIN_TABLE = mainTable;
			loop();
		};

		function loop() {
			if(!CONFIG.paused) {
				$("#game_area").html(mainTable.generateTable());
				if(mainTable.quantityCars() < maxCars) {
					mainTable.addCar(generateCar());
				}
			}

			setTimeout(loop, 500 / CONFIG.speed);
		}

		function generateCar() {
			return new car();
		}
	}

	var director = new director(15, binaryTable);
	director.start();
});
