define(['jquery'], function($) {

	return function car(id) {
		var self = this;

		this.id = id;
		var cel = null;
		var exploded = false;

		/*
		 * Speed converted to timeout (ms) in the movement function.
		 * timeout = 3000 - speed
		 * speed in [0-2000]
		 */
		var speed = 0;

		/*
		 * 0 = North
		 * 1 = East
		 * 2 = South
		 * 3 = West
		 */
		var direction = null;

		var color = "#"+((1<<24)*Math.random()|0).toString(16);

		self.explode = function() {
			exploded = true;
		};

		self.setCel = function(c) {
			cel = c;
		};

		self.start = function() {
			if(direction == null) {
				loop();
			}
		};

		self.getDirection = function() {
			return direction;
		};

		self.printCar = function() {
			return "<i class='icon-car " + generateOrientationClass() + "' style='color:" + color + "'></i>"
		};

		function generateOrientationClass() {
			return 'icon-rotate-' + ['north', 'east', 'south', 'west'][direction];
		}

		self.printInfo = function() {
			var info = "Car '" + self.id + "'";
			info += " {speed: " + speed;
			info += ", direction: " + direction;
			info += "}";
			return info;
		};

		function loop() {
			if(!exploded) {

				if(!CONFIG.paused) {
					if(direction == null) {
						direction = generateInitialDirection();
					} else {
						move();
					}
				}

				setTimeout(loop, (3000-speed) / CONFIG.speed);
			}
		}

		function speedUp() {
			if(speed < 2000) {
				speed += 100;
			}
		}

		function speedDown() {
			speed = 0;
		}

		/*
		 * Dictates how the car should move.
		 * TODO: avoid colisions
		 */
		function move() {

			var leftCel = null;
			var frontCel = null;
			var rightCel = null;
			var backCel = null;

			if(direction === 0) {
				leftCel = cel.getWestCel();
				frontCel = cel.getNorthCel();
				rightCel = cel.getEastCel();
				backCel = cel.getSouthCel();
			} else if(direction === 1) {
				leftCel = cel.getNorthCel();
				frontCel = cel.getEastCel();
				rightCel = cel.getSouthCel();
				backCel = cel.getWestCel();
			} else if(direction === 2) {
				leftCel = cel.getEastCel();
				frontCel = cel.getSouthCel();
				rightCel = cel.getWestCel();
				backCel = cel.getNorthCel();
			} else if(direction === 3) {
				leftCel = cel.getSouthCel();
				frontCel = cel.getWestCel();
				rightCel = cel.getNorthCel();
				backCel = cel.getEastCel();
			}

			var deltaDirection = 0;
			//If the car is in a dead end that isn't the end of the map, go back
			if((leftCel == null || !leftCel.isRoad()) && frontCel != null && !frontCel.isRoad() && (rightCel == null || !rightCel.isRoad())) {
				deltaDirection = 2;
			} else {
				deltaDirection = chooseDirection();
			}

			var chosenCel = [frontCel, rightCel, backCel, leftCel][deltaDirection];

			if( (chosenCel != null && !chosenCel.isRoad())
				|| (chosenCel == null && deltaDirection !== 0) ) {
				return move();
			}

			cel.removeCar(self);

			if(chosenCel == null) {
				self.explode();
			} else {
				direction = (direction + deltaDirection) % 4;
				if(deltaDirection === 0) {
					speedUp();
				} else {
					speedDown();
				}
				chosenCel.addCar(self);
			}
		}

		function generateInitialDirection() {
			if(cel.getSouthCel() == null) {
				return 0;
			}
			if(cel.getWestCel() == null) {
				return 1;
			}
			if(cel.getNorthCel() == null) {
				return 2;
			}
			if(cel.getEastCel() == null) {
				return 3;
			}
			return 0;
		}
	}

	function chooseDirection() {
		var guide = Math.random() * 100;

		if(guide < 25) {
			return 3;
		}
		if(guide < 50) {
			return 1;
		}
		if(guide < 100) {
			return 0;
		}
	}

});
