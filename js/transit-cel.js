define(['jquery'], function($) {

	return function cel(t, isRoad, x, y) {
		var self = this;
	
		var isRoad = isRoad;
		var cars = [];
		this.x = x;
		this.y = y;
		this.tableParent = t;

		self.generateTd = function() {
			var el = $("<td></td>", {
				style: generateStyle(),
				html: generateCars(),
				title: "[" + this.x + "," + this.y + "]"
			});
			if(cars.length > 0) {
				console.debug(el);
			}
			return el;
		};

		self.isRoad = function() {
			return isRoad ? true : false;
		};

		function generateCars() {
			if(cars.length == 0) {
				return "";
			}

			if(cars.length == 1) {
				return cars[0].id;
			}

			self.explodeCars();
			return "<span style='color: red;'>X</span>";
		}

		self.addCar = function(car) {
			cars.push(car);
			car.setCel(this);
			car.start();
		};

		self.removeCar = function(car) {
			cars.every(function(c, i) {
				if(c.id == car.id) {
					cars.splice(i, 1);
					return false;
				}
				return true;
			});
		};

		self.quantityCars = function() {
			return cars.length;
		};

		self.explodeCars = function() {
			cars.forEach(function(c){
				c.explode();
			});
			cars = [];
		};

		function generateStyle() {
			return "background-color: " + (isRoad ? "grey" : "white") + "; width: 20px; height: 20px; text-align: center;";
		}

		self.getNorthCel = function() {
			return getNeighborCel(0, -1);
		};

		self.getEastCel = function() {
			return getNeighborCel(1, 0);
		};

		self.getSouthCel = function() {
			return getNeighborCel(0, 1);
		};

		self.getWestCel = function() {
			return getNeighborCel(-1, 0);
		};

		function getNeighborCel(dX, dY) {
			if(self.x * 1 + dX < 0 || self.x * 1 + dX > self.tableParent.getXDimension()-1) {
				return null;
			}
			if(self.y * 1 + dY < 0 || self.y * 1 + dY > self.tableParent.getYDimension()-1) {
				return null;
			}
			var neighborCel = self.tableParent.getCelAt(self.x * 1 + dX, self.y * 1 + dY);
			return neighborCel;
		}
	}
});

