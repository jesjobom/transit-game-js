define(['jquery', 'transit-light'], function($, light) {

	/*
	 * This class defines a cell in the table used to draw our "city".
	 * It is also responsible for the information about position in the map that
	 * cars will use to navigate.
	 * And it should handle colisions, since cars decide where to go, but they
	 * won't handle any side efect of this movement...
	 */
	return function cel(t, typeRoad, x, y) {
		var self = this;

		var isRoad = typeRoad > 0;
		var transitLight = [null, null, light.INSTANCE_2STAGE, null, light.INSTANCE_4STAGE][typeRoad];
		var cars = [];
		this.x = x * 1;
		this.y = y * 1;

		/*
		 * Table that contains this cell. Generally used to determine the limits of the map
		 */
		this.tableParent = t;

		/*
		 * Generates the HTML for the table's cell with car(s) or explosion if
		 * that's the case.
		 */
		self.generateTd = function() {
			var el = $("<td></td>", {
				class: generateClass(),
				html: generateCars(),
				title: "[" + this.x + "," + this.y + "]",
				onclick: "printCelInfo(" + x + ", " + y + ");"
			});
			return el;
		};

		function generateClass() {
			var cssClass = isRoad ? "road" : "";
			if(transitLight != null) {
				cssClass += " " + transitLight.getClass();
			}
			return cssClass;
		}

		function generateCars() {
			if(cars.length == 0) {
				return "";
			}

			if(cars.length == 1) {
				return cars[0].printCar();
			}

			if(isCarsParallelAndOpposite()) {
				var mCars = cars[0].printCar() + cars[1].printCar();
				return mCars;
			}

			self.explodeCars();
			return "<i class='icon-explosion'><i class='path1'></i><i class='path2'></i><i class='path3'></i></i>";
		}

		/*
		 * The only case where 2 cars can occupy the same space is when they are
		 * moving in opposite directions, because they are on different lanes.
		 */
		function isCarsParallelAndOpposite() {
			if(cars.length != 2) {
				return false;
			}

			var directionDifference = cars[0].getDirection() - cars[1].getDirection();
			return Math.abs(directionDifference) === 2;
		}

		/*
		 * Answer to a car can enter this cell.
		 * The answer will be false if there will be a collision or if the traffic
		 * light is red
		 */
		self.cannotEnter = function(newCar, deltaDirection) {
			if(transitLight != null && !transitLight.allowCarDirection((newCar.getDirection() + deltaDirection) % 4)) {
				return true;
			}

			if(!CONFIG.avoidCollision) {
				return false;
			}

			if(cars.length != 1) {
				return cars.length > 1;
			}

			var carInHere = cars[0];
			var directionDifference = carInHere.getDirection() - ((newCar.getDirection() + deltaDirection) % 4);
			return Math.abs(directionDifference) !== 2;
		}

		self.isRoad = function() {
			return isRoad ? true : false;
		};

		self.addCar = function(car) {
			cars.push(car);
			car.setCel(this);
			car.start();
		};

		self.removeCar = function(car) {
			cars.every(function(c, i) {
				if(c == car) {
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
			if(self.x + dX < 0 || self.x + dX > self.tableParent.getXDimension()-1) {
				return null;
			}
			if(self.y + dY < 0 || self.y + dY > self.tableParent.getYDimension()-1) {
				return null;
			}
			var neighborCel = self.tableParent.getCelAt(self.x + dX, self.y + dY);
			return neighborCel;
		}

		self.isBorder = function() {
			return self.x === 0 || self.y === 0
				|| self.x === self.tableParent.getXDimension()-1
				|| self.y === self.tableParent.getYDimension()-1;
		};

		self.printInfo = function() {
			var info = "[" + self.x + ", " + self.y + "] ";
			if(self.isRoad()) {
				info += self.quantityCars() + " cars: ";
				cars.forEach(function(c){
					info += c.printInfo() + " / ";
				});
			} else {
				info += " No a road";
			}

			return info;
		};
	}
});
