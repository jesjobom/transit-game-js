define(['jquery', 'transit-table', 'transit-car'], function($, table, car) {

	function director(binaryTable) {
		var self = this;

		var mainTable = null;

		self.start = function() {
			mainTable = new table(binaryTable);
			window.MAIN_TABLE = mainTable;
			loop();
		};

		function loop() {
			if(!CONFIG.paused) {
				$("#game_area").html(mainTable.generateTable());
				if(mainTable.quantityCars() < CONFIG.maxCars) {
					mainTable.addCar(generateCar());
				}
			}

			setTimeout(loop, 500 / CONFIG.speed);
		}

		function generateCar() {
			return new car();
		}
	}

	var director = new director(binaryTable);
	director.start();
});
