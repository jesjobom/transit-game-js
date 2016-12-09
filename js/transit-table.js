define(['jquery', 'transit-cel', 'transit-car'], function($, cel, car) {

	function table(binaryTable) {

		var self = this;

		var binaryTable = binaryTable;
		var cels = null;

		init();
	
		function init() {
			cels = [];

			for(line in binaryTable) {
				var tds = [];
				for(column in binaryTable[line]) {
					tds.push(new cel(self, binaryTable[line][column], column, line));
				}

				cels.push(tds);
			}
		}

		self.generateTable = function() {
			var table = $("<table></table>");

			for(line in cels) {
				var tr = $("<tr></tr>");
				for(cel in cels[line]) {
					tr.append(cels[line][cel].generateTd());
				}

				table.append(tr);
			}

			return table;
		};

		self.quantityCars = function() {
			var quantity = 0;
			for(line in cels) {
				for(cel in cels[line]) {
					quantity += cels[line][cel].quantityCars();
				}
			}
			return quantity;
		};

		self.addCar = function(car) {
			var selectedCel = null;

			for(line in cels) {
				for(cel in cels[line]) {

					var randomValue = Math.random();

					if(randomValue < 0.1 && cels[line][cel].isBorder() && cels[line][cel].isRoad() && cels[line][cel].quantityCars() == 0) {

						if(selectedCel == null) {
							selectedCel = cels[line][cel];

						} else {
							var tempCel = cels[line][cel];
						
							if       (tempCel.x < selectedCel.x && tempCel.x < (cels[line].length - selectedCel.x -1)) {
								selectedCel = tempCel;
							} else if(tempCel.x > selectedCel.x && selectedCel.x > (cels[line].length - tempCel.x -1)) {
								selectedCel = tempCel;
							} else if(tempCel.y < selectedCel.y && tempCel.y < (cels.length - selectedCel.y -1)) {
								selectedCel = tempCel;
							} else if(tempCel.y > selectedCel.y && selectedCel.y > (cels.length - tempCel.y -1)) {
								selectedCel = tempCel;
							}
						}
					}
				}
			}

			if(selectedCel != null) {
				selectedCel.addCar(car);
			}
		};

		self.getCelAt = function(x, y) {
			return cels[y][x];
		};

		self.getXDimension = function() {
			return cels[0].length;
		};

		self.getYDimension = function() {
			return cels.length;
		};
	}

	return table;
});

