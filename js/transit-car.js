define(['jquery'], function($) {

	return function car(id) {
		var self = this;

		this.id = id;
		var cel = null;
		var exploded = false;

		/*
		 * 0 = North
		 * 1 = East
		 * 2 = South
		 * 3 = West
		 */
		var direction = null;
	
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

		function loop() {
			if(!exploded) {
				move();
		
				//TODO create speed simulation
				setTimeout(loop, (Math.random() * 1000) + 1000);
			}
		}

		function move() {
			if(direction == null) {
				direction = generateInitialDirection();
			}
			
			var leftCel = null;
			var frontCel = null;
			var rightCel = null;

			if(direction === 0) {
				leftCel = cel.getWestCel();
				frontCel = cel.getNorthCel();
				rightCel = cel.getEastCel();
			} else if(direction === 1) {
				leftCel = cel.getNorthCel();
				frontCel = cel.getEastCel();
				rightCel = cel.getSouthCel();
			} else if(direction === 2) {
				leftCel = cel.getEastCel();
				frontCel = cel.getSouthCel();
				rightCel = cel.getWestCel();
			} else if(direction === 3) {
				leftCel = cel.getSouthCel();
				frontCel = cel.getWestCel();
				rightCel = cel.getNorthCel();
			}

			var deltaDirection = chooseDirection();

			var chosenCel = deltaDirection === 0 ? frontCel : deltaDirection === 1 ? rightCel : leftCel;

			if(chosenCel != null && !chosenCel.isRoad()) {
				return move();
			}
			
			direction = (direction + deltaDirection) % 4;
			cel.removeCar(self);

			if(chosenCel == null) {
				self.explode();
			} else {
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
