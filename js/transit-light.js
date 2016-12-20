define(['jquery'], function($) {

	/*
	 * Class to define the transit lights behaviour.
	 * Through the states array, it is possible to easly create a 2-stroke/step
	 * or 4-stroke/step transit light.
	 */
	return function light() {
		var self = this;

		/*
		 * Next state index
		 */
		var state = 0;

		/*
		 * Current state
		 */
		var stateObj = null;

		/*
		 * States array, defining a complete flow
		 */
		var stateArray = [
			new lightState('vertical-red-light', 8000, [0, 1, 0, 1]),
			new lightState('vertical-red-light horizontal-yellow-light', 2000, [0, 1, 0, 1]),
			new lightState('horizontal-red-light', 8000, [1, 0, 1, 0]),
			new lightState('horizontal-red-light vertical-yellow-light', 2000, [1, 0, 1, 0])
		];

		self.getClass = function() {
			return stateObj == null ? '' : stateObj.cssClass;
		};

		self.allowCarDirection = function(carDirection) {
			return stateObj == null ? true : stateObj.allowCarDirection[carDirection] == 1;
		};

		function loop() {
			if(!CONFIG.paused) {
				stateObj = stateArray[state];
				state = (state + 1) % 4;
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
});
