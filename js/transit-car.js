define(['jquery'], function($) {

	/*
	 * This class will define a Car. It should be able to see the roads around itself
	 * and decide what to do (where to go or wether it should stop).
	 */
	return function car() {
		var self = this;

		/*
		 * The cel where this car is in
		 */
		var cel = null;

		/*
		 * Logic flag to know if the car exploded and should be removed from the game
		 */
		var exploded = false;

		/*
		 * Speed converted to timeout (ms) in the movement function.
		 * timeout = 3000 - speed
		 * speed in [0-2000]
		 */
		var speed = 0;

		/*
		 * Direction this car is facing
		 *
		 * 0 = North
		 * 1 = East
		 * 2 = South
		 * 3 = West
		 *
		 * null = never moved before
		 */
		var direction = null;

		/*
		 * Generate a random color between #000000 (black) and #ffffff (white).
		 */
		var color = "#"+((1<<24)*Math.random()|0).toString(16);

		/*
		 * Explodes this car stoping its loop
		 */
		self.explode = function() {
			exploded = true;
		};

		/*
		 * Sets the cel where this car is in
		 */
		self.setCel = function(c) {
			cel = c;
		};

		/*
		 * Stats this car and its loop if it is new
		 */
		self.start = function() {
			if(direction == null) {
				loop();
			}
		};

		/*
		 * Returns the current directin this car is facing
		 */
		self.getDirection = function() {
			return direction;
		};

		/*
		 * Prints the HTML of this car using icons and a random color
		 */
		self.printCar = function() {
			return "<i class='icon-car " + generateOrientationClass() + "' style='color:" + color + "'></i>"
		};

		/*
		 * Generates the class that should rotate the icon representing the car
		 * according to its direction
		 */
		function generateOrientationClass() {
			return 'icon-rotate-' + ['north', 'east', 'south', 'west'][direction];
		}

		/*
		 * Print informarions about this car for debug purposes
		 */
		self.printInfo = function() {
			var info = "Car '" + color + "'";
			info += " {speed: " + speed;
			info += ", direction: " + direction;
			info += "}";
			return info;
		};

    /*
		 * Main processing loop that keeps the car "alive".
		 * If the car explodes, this loop will stop, but the object will only
		 * be discarted if there isn't any referentes to this
		 */
		function loop() {
			if(!exploded) {

				//Every car will stop if the button PAUSE is pressed
				if(!CONFIG.paused) {
					if(direction == null) {
						//The first time it is running, the car will define its direction
						//based on the roads around
						direction = generateInitialDirection();
					} else {
						//With the direction set, let's move!
						move();
					}
				}

				//The frequency of movements is set by the car's speed and the
				//speed set by the user
				setTimeout(loop, (4000-speed) / CONFIG.speed);
			}
		}

		/*
		 * Accelerate the car with a speed limit
		 */
		function speedUp() {
			if(speed < CONFIG.maxCarSpeed) {
				speed += CONFIG.accCarSpeed;
			}
		}

		/*
		 * Reduce the speed to the minimum
		 */
		function speedDown() {
			speed = 0;
		}

		/*
		 * Dictates how the car should move.
		 *
		 *  - If it is possible to go Right, Left ou Forward, randomly chose one
		 *  - If chose to go forward, accelerate the car
		 *  - If chose to go forward, but it is the end of the map, exit the game
		 *  - If cannot go Left, Right or Forward, go Backward
		 *  - If chose to turn right, left or backward, reduce the speed
		 *
		 */
		function move() {

			var leftCel = null;
			var frontCel = null;
			var rightCel = null;
			var backCel = cel; //will make a U turn if necessary

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

			//The car will turn right 90 degrees * deltaDirection
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
				//TODO this recursion with exceed the recursion pile when there is nowhere to go
				//Should choose to stay in current cell if tried too many times to choose a destiny
				return move();
			}

			if(chosenCel == null) {
				//Exiting the map
				cel.removeCar(self);
				self.explode();

			} else if(chosenCel.cannotEnter(self, deltaDirection)) {
				//Won't move to avoid colision
				speedDown();

			} else {
				//Moving
				cel.removeCar(self);
				direction = (direction + deltaDirection) % 4;
				if(deltaDirection === 0) {
					speedUp();
				} else {
					speedDown();
				}
				chosenCel.addCar(self);
			}
		}


		/*
		 * Tries to identify the direction where the map ends in order to go
		 * to the oposite direction
		 */
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

  /*
	 * Randomly calculates the direction it should go.
	 *
	 * - 25% to go Right
	 * - 25% to go Left
	 * - 50% to go Forward
	 */
	function chooseDirection() {
		var guide = Math.random() * 100;
		//left
		if(guide < CONFIG.chanceTurnLeft) {
			return 3;
		}
		//right
		if(guide < (CONFIG.chanceTurnLeft + CONFIG.chanceTurnRight)) {
			return 1;
		}
		//forward
		return 0;
	}

});
