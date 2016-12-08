define(['jquery'], function($) {

	return function car(id) {
		var self = this;

		this.id = id;
		var cel = null;
		var exploded = false;
		var lastDirection = null;
	
		self.explode = function() {
			exploded = true;
		};
	
		self.setCel = function(c) {
			cel = c;
		};

		self.start = function() {
			if(lastDirection == null) {
				loop();
			}
		};

		function loop() {
			if(!exploded) {
				var gotoCel = moveRandomly(null, cel.getNorthCel(), cel.getEastCel(), cel.getSouthCel(), cel.getWestCel());
				lastDirection = {};
				cel.removeCar(self);
				gotoCel.addCar(self);
		
				setTimeout(loop, 1900);
			}
		}
	}

	function moveRandomly(currentDirection, northCel, eastCel, southCel, westCel) {
		var guide = Math.random() * 4;

		if(guide < 1 && northCel != null && northCel.isRoad()) {
			return northCel;
		}
		if(guide < 2 && eastCel != null && eastCel.isRoad()) {
			return eastCel;
		}
		if(guide < 3 && southCel != null && southCel.isRoad()) {
			return southCel;
		}
		if(guide < 4 && westCel != null && westCel.isRoad()) {
			return westCel;
		}
		return moveRandomly(currentDirection, northCel, eastCel, southCel, westCel);
	}

});
