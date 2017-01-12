# Transit: Game of Life... with cars...

While talking with a friend about [Conway's Game of Life](https://en.wikipedia.org/wiki/Conway's_Game_of_Life) I had an idea about a simple transit simulator, where cars would indepentently move along roads respecting some basic rules. (Actually I had had this idea for some time, but I was lacking time and motivation to do it ^^).

I chose Javascript/HTML to do it because
  1. It is simple to code and visualize
  2. I could start it without a lot of preparation of environment
  3. There is asynchronous execution
  4. I won't need high performance

Technologies I am using:
  * A lot of raw Javascript
  * Some help with JQuery
  * RequireJS for dynamyc JS loading
  * CSS
  * HTML

TODO
  * Cars are stuck when it should be "free to turn right", but a car is already in the next spot and transversal
  * There should be some way to randomly cause accidents (colisions), and these accidents should block the transit for some time (maybe random chance to hit a transversal car in a crossroad without trafic light and with high speed?)
  * Cars are sometimes throwing exception due a big recursion pile when trying to decide where to go without good options (see TODO in transit-car.js)
