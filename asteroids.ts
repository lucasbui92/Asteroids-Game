// FIT2102 2019 Assignment 1
// https://docs.google.com/document/d/1Gr-M6LTU-tfm4yabqZWJYg-zTjEVqHKKTCvePGCYsUA/edit?usp=sharing

function asteroids() {
  // Inside this function you will use the classes and functions 
  // defined in svgelement.ts and observable.ts
  // to add visuals to the svg element in asteroids.html, animate them, and make them interactive.
  // Study and complete the Observable tasks in the week 4 tutorial worksheet first to get ideas.

  // You will be marked on your functional programming style
  // as well as the functionality that you implement.
  // Document your code!  
  // Explain which ideas you have used ideas from the lectures to 
  // create reusable, generic functions.
  const svg = document.getElementById("canvas")!;
  // make a group for the spaceship and a transform to move it and rotate it
  // to animate the spaceship you will update the transform property
  let xValue = 300, yValue = 300, rotateValue = 360;
  let g = new Elem(svg,'g')
    .attr("transform","translate(" + xValue + " " + yValue + ") rotate(" + rotateValue + ")")


  // Function to give the bullet its location and image
  function createBullet() {
    let svg = document.getElementById("canvas")!;
    return new Elem(svg, 'circle')
        .attr('cx', 0)
        .attr('cy', -20)
        .attr('r', 4)
        .attr('style', 'fill: none; stroke: white; stroke-width: 2px;');
  }
  let bullet = createBullet();
  let bullet_speed = 10;


  // Function to make the space ship as a child of the transform group and its shape and color
  function createShip() {
    return new Elem(svg, 'polygon', g.elem)
      .attr("points", "-15,20 15,20 0,-20")
      .attr("style", "fill:lime;stroke:purple;stroke-width:1");
  }
  let ship: Elem = createShip();


  // An asteroid interface
  interface IAsteroidObj {
    scale: number,
    xAsteroid: number,
    yAsteroid: number,
    asteroid: Elem
  }

  // Function to create an asteroid with x and y as random values for the location
  function createAsteroid(x: number, y: number, scale: number) {
    return new Elem(svg, 'polygon')
        .attr('transform', "translate(" + x + ", " + y + ") scale("+ scale +")")
        .attr('points', "50,5 100,5 125,30 125,80 100,105 50,105 25,80 25,30")
        .attr('style', "stroke:yellow; fill:brown; stroke-width: 3;");};

  // Asteroids are stored in an array of type IAsteroidObj
  let asteroidLocation: IAsteroidObj[] = [];

  // Create asteroids using observable
  const asteroidObservable = Observable.interval(1);
  asteroidObservable
  .takeUntil(asteroidObservable.filter(i => i == 10))
  .forEach(_ => asteroidLocation.push(createNewAsteroid(0.7)))
  .subscribe(_ => {});

  // Function to generate asteroids of smaller size once the large asteroid got hit
  function createNewAsteroid(scalable: number): IAsteroidObj {
    let x = randomInteger(10, 600), y = randomInteger(10, 400);
    return {
      scale: scalable,
      xAsteroid: x,
      yAsteroid: y,
      asteroid: createAsteroid(x, y, scalable)
    }
  };


  // Generate a random integer between 0 and size(canvas)
  const randomInteger = function (min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  };

  // Initial values for SCORE and the number of LIVES
  const txtscore = document.getElementById("txtscore")!,
        txtlives = document.getElementById("txtlives")!,
        txtGameOver = document.getElementById("txtgameOver")!;
  let playerScore = 0;
  let numberOfLives = 3;
  txtscore.innerHTML += playerScore;
  txtlives.innerHTML += numberOfLives;


  /**
  * Check if an element collide with canvas
  * @param element the inside element
  */
  function isCollision(element: Elem) {
    let svg = document.getElementById("canvas")!;
    let r1 = svg.getBoundingClientRect();
    let r2 = element.elem.getBoundingClientRect();
    return (r2.left < r1.left ||
        r2.right > r1.right ||
        r2.top < r1.top ||
        r2.bottom > r1.bottom);
  }


  /**
  * Check if the 2 bounding boxes overlap
  * @param elem1 the first Element
  * @param elem2 the second Element
  */
  function intersectElement(elem1: Elem, elem2: Elem) {
    var r1 = elem1.elem.getBoundingClientRect();
    var r2 = elem2.elem.getBoundingClientRect();
    return !(r2.left > r1.right ||
        r2.right < r1.left ||
        r2.top > r1.bottom ||
        r2.bottom < r1.top);
  }


  // The mainObservable to handle most of the events of the game
  const shipInterval = Observable.interval(1),
        mainInterval = Observable.interval(50).map(() => ({})),
        mainObservable = mainInterval
    .takeUntil(
      mainInterval.filter(() => numberOfLives <= 0)
    );

  
  // Enable the ship to shoot and destroy the asteroids
  function shooting() {
    mainObservable
      .map(() => ({
        cx: parseInt(bullet.elem.getAttributeNS(null, 'cx')!),
        cy: parseInt(bullet.elem.getAttributeNS(null, 'cy')!),
        svgRect: svg.getBoundingClientRect(),
        asteroid: hitBullet(bullet)
      }))
      .filter(({ cx, cy, svgRect, asteroid }) =>
        Math.abs(cx) < svgRect.width && Math.abs(cy) < svgRect.height && asteroid.scale == -1
      )
      .subscribe(({ cy }) => {
        bullet.attr('cy', cy - bullet_speed);
        g.elem.appendChild(bullet.elem);
      })
    
  // Destroy the asteroid
  mainObservable
    .map(() => ({
      asteroid: hitBullet(bullet)
    }))
    .filter(({ asteroid }) => asteroid.scale != -1 && asteroid.scale <= 0.3)
    .subscribe(({ asteroid }) => {
      // Once the asteroid got hit -> update SCORE
      increaseNumberScore();
      // Reset the radius of bullet to zero to disappear
      bullet.attr("r", 0);
      asteroid.scale = 0;
      asteroid.asteroid.attr('transform', "translate(" + 0 + ", " + 0 + ") scale(" + 0 + ")");
    })

  // Handle breaking down the asteroids
  mainObservable
    .map(() => ({
      asteroid: hitBullet(bullet)
    }))
    .filter(({ asteroid }) => asteroid.scale > 0.3)
    .map(({ asteroid }) => ({
      x: randomInteger(10, 200),
      y: randomInteger(10, 400),
      rect: asteroid.asteroid.elem.getBoundingClientRect(),
      asteroid: asteroid
    }))
    .subscribe(({ x, y, asteroid }) => {
      // Once the asteroid got hit -> update SCORE
      increaseNumberScore();
      // Reset the radius of bullet to zero to disappear
      bullet.attr("r", 0);
      // The asteroids disappear by setting "transform translate to zero and scale to zero"
      asteroid.scale = 0.3;
      asteroid.asteroid.attr('transform', "translate(" + x + ", " + y + ") scale(" + asteroid.scale + ")");

      // Breaking down another asteroid and push smaller ones to the asteroid list
      let newAsteroid = createNewAsteroid(asteroid.scale);
      newAsteroid.asteroid.attr('transform', "translate(" + (x + 50) + ", " + y + ") scale(" + asteroid.scale + ")");
      asteroidLocation.push(newAsteroid);
      animateAsteroids(newAsteroid, randomInteger(1, 4));
    })
  }


  // Get the asteroids hit by the bullet
  function hitBullet(bullet: Elem): IAsteroidObj {
    for (let element of asteroidLocation) {
      if (intersectElement(element.asteroid, bullet)) {
        return element;
      }
    }
    return { scale: -1, xAsteroid: 0, yAsteroid: 0, asteroid: new Elem(svg, 'cirle') };
  }


  // Handle the collision between the ship and the asteroid, reset the ship back to its original position and decrement the lives
  function checkShipLost() {
    for (let element of asteroidLocation) {
      if (intersectElement(element.asteroid, ship)) {
        if (svg.contains(element.asteroid.elem)) {
          svg.removeChild(element.asteroid.elem);
        }
        if (g.elem.contains(ship.elem)) {
          ship.attr("transform", "translate(0, 0) rotate(0) scale(0)");

          // Game over
          numberOfLives -= 1;
          txtlives.innerHTML = "LIVES: " + numberOfLives;
          if (numberOfLives <= 0) {
            txtGameOver.innerHTML = "GAME OVER!!!"
            g.elem.removeChild(ship.elem)
          }
          shipInterval.subscribe(() => {
            ship.attr("transform", "translate(0, 0) rotate(0) scale(1)")
          })
        }
      }
    }
  }

  function moveAsteroids(obj: IAsteroidObj) {
    obj.asteroid.attr("transform","translate(" + obj.xAsteroid + " " + obj.yAsteroid + ") scale(" + obj.scale +")");
  }

  // Asteroids move randomly and wrap around the edges
  const animateAsteroids = function(obj: IAsteroidObj, direction: number) {
    // Move right
    asteroidObservable.filter(_ => !isCollision(obj.asteroid) && direction == 1)
    .map(_ => obj.xAsteroid += 0.3)
    .subscribe(_ => moveAsteroids(obj));
    asteroidObservable.filter(_ => isCollision(obj.asteroid) && direction == 1)
    .map(_ => obj.xAsteroid = 100)
    .subscribe(_ => moveAsteroids(obj));

    // Move left
    asteroidObservable.filter(_ => !isCollision(obj.asteroid) && direction == 2)
    .map(_ => obj.xAsteroid -= 0.3)
    .subscribe(_ => moveAsteroids(obj));
    asteroidObservable.filter(_ => isCollision(obj.asteroid) && direction == 2)
    .map(_ => obj.xAsteroid = svg.getBoundingClientRect().width - 100)
    .subscribe(_ => moveAsteroids(obj));

    // Move top
    asteroidObservable.filter(_ => !isCollision(obj.asteroid) && direction == 3)
    .map(_ => obj.yAsteroid -= 0.3)
    .subscribe(_ => moveAsteroids(obj));
    asteroidObservable.filter(_ => isCollision(obj.asteroid) && direction == 3)
    .map(_ => obj.yAsteroid = svg.getBoundingClientRect().height - 100)
    .subscribe(_ => moveAsteroids(obj));

    // Move bottom
    asteroidObservable.filter(_ => !isCollision(obj.asteroid) && direction == 4)
    .map(_ => obj.yAsteroid += 0.3)
    .subscribe(_ => moveAsteroids(obj));
    asteroidObservable.filter(_ => isCollision(obj.asteroid) && direction == 4)
    .map(_ => obj.yAsteroid = 100)
    .subscribe(_ => moveAsteroids(obj));
  };

  function asteroidMovement() {
    for(let element of asteroidLocation) {
      animateAsteroids(element, randomInteger(1, 4))
    }
  }
  

  // Update the score 
  function increaseNumberScore() {
    playerScore += 1;
      txtscore.innerHTML = "SCORE: " + playerScore;
  }
  
  // Update the ship's next location
  const moveValue = function() {
    checkShipLost();
    g.attr("transform","translate(" + xValue + " " + yValue + ") rotate(" + rotateValue + ")");
  };

  // All actions executed by the user in the game. These actions are moving, rotating and shooting. Any ship movements also include Thrust
  const keydown = Observable.fromEvent<KeyboardEvent>(document, "keydown");
  keydown.filter(({key}) => key == "ArrowUp" && !isCollision(ship))
   .subscribe(_ => 
    {
      shipInterval
        .filter(() => isCollision(ship))
        .map(() => ({ yShip: svg.getBoundingClientRect().height }))
        .subscribe(({ yShip }) => yValue = yShip - 30);
  
      shipInterval
        .takeUntil(shipInterval.filter(i => i == 150))
        .map(() => yValue -= 1)
        .subscribe(() => moveValue());
    });

  keydown.filter(({key}) => key == "ArrowDown" && !isCollision(ship))
  .subscribe(_ => 
    {
      shipInterval
        .filter(() => isCollision(ship))
        .map(() => ({ yShip: ship.elem.getBoundingClientRect().height }))
        .subscribe(({ yShip }) => yValue = yShip + 30);
  
      shipInterval
        .takeUntil(shipInterval.filter(i => i == 150))
        .map(() => yValue += 1)
        .subscribe(() => moveValue());
    });

  keydown.filter(({key}) => key == "ArrowLeft" && !isCollision(ship))
  .subscribe(_ => 
    {
      shipInterval
        .filter(() => isCollision(ship))
        .map(() => ({ xShip: svg.getBoundingClientRect().width }))
        .subscribe(({ xShip }) => xValue = xShip - 30);
  
      shipInterval
        .takeUntil(shipInterval.filter(i => i == 150))
        .map(() => xValue -= 1)
        .subscribe(() => moveValue());
    });

  keydown.filter(({key}) => key == "ArrowRight" && !isCollision(ship))
  .map(_ => xValue += 15)
  .subscribe(_ => 
    {
      shipInterval
        .filter(() => isCollision(ship))
        .map(() => ({ xShip: ship.elem.getBoundingClientRect().width }))
        .subscribe(({ xShip }) => xValue = xShip + 30);
  
      shipInterval
        .takeUntil(shipInterval.filter(i => i == 150))
        .map(() => xValue += 1)
        .subscribe(() => moveValue());
    });
  
  keydown.filter(({key}) => key == "Control")
  .map(_ => rotateValue += 10)
  .subscribe(_ => moveValue());

  keydown.filter(key => key.code == "Space")
  .subscribe(_ => {
    bullet.attr('cx', 0)
    .attr('cy', -20)
    .attr('r', 4)
    shooting()
  });

  keydown.filter(key => key.code == "Enter")
  .subscribe(_ => asteroidMovement())
  
}

// the following simply runs your asteroids function on window load.  Make sure to leave it in place.
if (typeof window != 'undefined')
  window.onload = ()=>{
    asteroids();
  }

 

 
