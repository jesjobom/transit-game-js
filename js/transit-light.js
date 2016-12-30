define(['jquery'], function($) {

	/*
	 * Class to define the transit lights behaviour.
	 * Through the states array, it is possible to easly create a 2-staged
	 * or 4-staged traffic light.
	 */
	function light(states) {
		var self = this;

		/*
		 * Next state index
		 */
		var nextState = 0;

		/*
		 * Current state
		 */
		var stateObj = null;

		/*
		 * States array, defining a complete flow
		 */
		var stateArray = states;

		self.getClass = function() {
			return stateObj == null ? '' : stateObj.cssClass;
		};

		self.allowCarDirection = function(carDirection) {
			return stateObj == null ? true : stateObj.allowCarDirection[carDirection] == 1;
		};

		function loop() {
			if(!CONFIG.paused) {
				stateObj = stateArray[nextState];
				nextState = (nextState + 1) % stateArray.length;
			}

			setTimeout(function () {
				loop();
			}, stateObj.timeout / CONFIG.speed);
		}

		loop();
	}

	function lightState(cssClass, timeout, allowCarDirection) {
		var self = this;

		self.cssClass = cssClass;

		/*
		 * Duration of the current state
		 */
		self.timeout = timeout;

		/*
		 * Array of car directions that can pass.
		 * Given [north, east, south, west], a 1 allows a car to come with this direction.
		 * For instance, [0, 1, 0, 0] allows a car coming from WEST (its direction is EAST) to pass.
		 */
		self.allowCarDirection = allowCarDirection;
	}

	light.INSTANCE_2STAGE = new light([
		new lightState('vertical-red-light', 10000, [0, 1, 0, 1]),
		new lightState('vertical-red-light horizontal-yellow-light', 4000, [0, 1, 0, 1]),
		new lightState('horizontal-red-light', 10000, [1, 0, 1, 0]),
		new lightState('horizontal-red-light vertical-yellow-light', 4000, [1, 0, 1, 0])
	]);

	light.INSTANCE_4STAGE = new light([
		new lightState('north-green-light', 8000, [0, 0, 1, 0]),
		new lightState('north-green-light north-yellow-light', 2000, [0, 0, 1, 0]),
		new lightState('east-green-light', 8000, [0, 0, 0, 1]),
		new lightState('east-green-light east-yellow-light', 2000, [0, 0, 0, 1]),
		new lightState('south-green-light', 8000, [1, 0, 0, 0]),
		new lightState('south-green-light south-yellow-light', 2000, [1, 0, 0, 0]),
		new lightState('west-green-light', 8000, [0, 1, 0, 0]),
		new lightState('west-green-light west-yellow-light', 2000, [0, 1, 0, 0])
	]);

	return light;
});
