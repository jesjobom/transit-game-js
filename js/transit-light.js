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
		self.timeout = timeout;
		self.allowCarDirection = allowCarDirection;
	}

	light.INSTANCE_2STAGE = new light([
		new lightState('vertical-red-light', 8000, [0, 1, 0, 1]),
		new lightState('vertical-red-light horizontal-yellow-light', 2000, [0, 1, 0, 1]),
		new lightState('horizontal-red-light', 8000, [1, 0, 1, 0]),
		new lightState('horizontal-red-light vertical-yellow-light', 2000, [1, 0, 1, 0])
	]);

	light.INSTANCE_4STAGE = new light([
		new lightState('north-green-light', 6000, [0, 0, 1, 0]),
		new lightState('north-green-light north-yellow-light', 1000, [0, 0, 1, 0]),
		new lightState('east-green-light', 6000, [0, 0, 0, 1]),
		new lightState('east-green-light east-yellow-light', 1000, [0, 0, 0, 1]),
		new lightState('south-green-light', 6000, [1, 0, 0, 0]),
		new lightState('south-green-light south-yellow-light', 1000, [1, 0, 0, 0]),
		new lightState('west-green-light', 6000, [0, 1, 0, 0]),
		new lightState('west-green-light west-yellow-light', 1000, [0, 1, 0, 0])
	]);

	return light;
});
