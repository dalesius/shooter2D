// Constants
const WIDTH = 600;
const HEIGHT = 500;
const CTX = document.getElementById("canvas").getContext("2d");

// Main class, handles the game
class Game {
  constructor() {
    this.entities = [];
    this.player = null;
    this.idCounter = 0;
    this.interval = null;
  }

  // Initialization of entities, listeners and main interval
  init() {
    CTX.canvas.width = WIDTH;
    CTX.canvas.height = HEIGHT;

    this.entities.push(new Obstacle(0, 350, 120, 30));
    this.entities.push(new Obstacle(WIDTH * 0.7, 300, 120, 30));
    this.entities.push(new Obstacle(WIDTH / 2, HEIGHT - 120, 30, 120));
    this.entities.push(new Zombie(WIDTH, HEIGHT, -1, this.setIdCounter()));
    this.entities.push(new Pidgeon(WIDTH, HEIGHT / 2, -1, this.setIdCounter()));
    this.entities.push(
      new Pidgeon(WIDTH / 2, HEIGHT / 3, 1, this.setIdCounter())
    );
    this.player = new Player(50, 250, 1, this.setIdCounter);
    this.entities.push(this.player);

    document.onkeydown = (event) => {
      this.handleEvent(event);
    };

    document.onkeyup = (event) => {
      this.handleEvent(event);
    };

    this.interval = setInterval(() => this.update(), 33);
  }

  // Called when you win for displaying amazing effects
  win() {
    let x = 1;

    setInterval(() => {
      x *= -1;
      CTX.font = "50px serif";
      CTX.fillStyle = x === 1 ? "green" : "blue";
      CTX.fillText("YOU WIN XD", WIDTH / 4, HEIGHT / 2);
    }, 100);

    clearInterval(this.interval);
  }

  // Called when you lose for displaying amazing effects
  gameover() {
    let x = 1;

    setInterval(() => {
      x *= -1;
      CTX.font = "50px serif";
      CTX.fillStyle = x === 1 ? "orange" : "brown";
      CTX.fillText("GAME OVER", WIDTH / 4, HEIGHT / 2);
    }, 100);

    clearInterval(this.interval);
  }

  // Called when an entity shoots to add it to screen
  spawnBullet(x, y, d, owner) {
    this.entities.push(new Bullet(x, y, d, this.setIdCounter(), owner));
  }

  // Removes entity from the screen
  destroy(entity) {
    let position = null;

    this.entities.forEach((ent, index) => {
      if (entity.id === ent.id) {
        position = index;
        return;
      }
    });

    if (position != null) this.entities.splice(position, 1);
  }

  // Main method to refresh the screen
  update() {
    // Check if we won
    if (this.countEnemies() === 0) this.win();

    // Clean screen
    CTX.clearRect(0, 0, WIDTH, HEIGHT);

    // Update each entity's state/position
    this.entities.forEach((entity) => {
      entity.updatePosition();
    });

    // Check for collisions
    this.entities.forEach((entity1, index1) => {
      this.entities.forEach((entity2, index2) => {
        if (index1 !== index2 && this.checkCollision(entity1, entity2))
          this.handleCollition(entity1, entity2);
      });
    });

    // Draw entities in screen
    this.entities.forEach((entity) => {
      entity.drawSprite();
    });
  }

  // Handles Input from keyboard
  handleEvent(event) {
    if (event.type === "keydown") {
      const key = event.key;
      switch (key) {
        case "ArrowRight":
          this.player.move("r");
          break;
        case "ArrowLeft":
          this.player.move("l");
          break;
        case "ArrowUp":
          this.player.jump();
          break;
        case " ":
          this.player.shoot();
          break;
      }
    } else if (event.type === "keyup") {
      const key = event.key;
      switch (key) {
        case "ArrowRight":
        case "ArrowLeft":
          this.player.vx = 0;
          break;
      }
    }
  }

  // Assigns a unique ID for each entity
  setIdCounter() {
    this.idCounter++;
    return this.idCounter - 1;
  }

  // Returns amount of enemies still alive
  countEnemies() {
    let enemies = 0;
    this.entities.forEach((entity) => {
      if (entity.type === "zombie" || entity.type === "pidgeon") enemies++;
    });
    return enemies;
  }

  // Handles each collision possibility with entities
  handleCollition(entity1, entity2) {
    switch (entity1.type) {
      case "bullet":
        switch (entity2.type) {
          case "player":
            if (entity1.owner !== "player") this.gameover();
            break;
          case "zombie":
          case "pidgeon":
            if (entity1.owner === "player") {
              this.destroy(entity1);
              this.destroy(entity2);
            }
            break;
        }
        break;
      case "zombie":
      case "pidgeon":
        if (entity2.type === "player") {
          this.gameover();
        }
        break;
      case "obstacle":
        switch (entity2.type) {
          case "bullet":
            this.destroy(entity2);
            break;
          case "zombie":
          case "player":
            let x = entity2.x;
            let y = entity2.y;

            // Player bumps from below
            if (
              entity2.y + entity2.height - entity1.y - entity1.height >=
                entity2.height * 0.5 &&
              entity2.y <= entity1.y + entity1.height
            ) {
              y = entity1.y + entity1.height;
              entity2.setPosition(x, y);
              entity2.setVy(0);
              break;
            }

            // Player stands on obstacle
            if (
              entity2.y + entity2.height - entity1.y < entity2.height * 0.5 &&
              entity2.y + entity2.height >= entity1.y
            ) {
              y = entity1.y - entity2.height;

              entity2.setPosition(x, y);
              entity2.setVy(0);
              entity2.setJumping(false);
              break;
            }

            // Player bumps from the rifht
            if (entity2.type === "zombie") entity2.setDirection(-entity2.d);

            if (
              entity2.x + entity2.width - entity1.x - entity1.width >=
                entity2.width * 0.5 &&
              entity2.x <= entity1.x + entity1.width
            ) {
              x = entity1.x + entity1.width;
              entity2.setPosition(x, y);
            }

            // Player bumps from the left
            if (
              entity2.x + entity2.width - entity1.x <= entity2.width * 0.5 &&
              entity2.x + entity2.width >= entity1.x
            ) {
              x = entity1.x - entity2.width;
              entity2.setPosition(x, y);
            }
            break;
        }
        break;
    }
  }

  checkCollision(entity1, entity2) {
    if (
      entity1.x < entity2.x + entity2.width &&
      entity1.x + entity1.width > entity2.x &&
      entity1.y < entity2.y + entity2.height &&
      entity1.height + entity1.y > entity2.y
    ) {
      return true;
    }
    return false;
  }
}

// Class for handling the main character
class Player {
  constructor(x, y, d, id) {
    this.x = x;
    this.y = y;
    this.d = d;
    this.vx = 0;
    this.vy = 0;
    this.jumping = true;
    this.style = "blue";
    this.width = 50;
    this.height = 50;
    this.type = "player";
    this.id = id;
  }

  move(direction) {
    if (direction === "r") {
      this.vx = 10;
      this.d = 1;
    } else {
      this.vx = -10;
      this.d = -1;
    }
  }

  jump() {
    if (!this.jumping) {
      this.jumping = true;
      this.vy -= 25;
    }
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  setVy(vy) {
    this.vy = vy;
  }

  setJumping(bool) {
    this.jumping = bool;
  }

  shoot() {
    let x;
    this.d === -1 ? (x = this.x - 2) : (x = this.x + this.width + 2);
    game.spawnBullet(x, this.y + 5, this.d, this.type);
  }

  // Updates position in screen
  updatePosition() {
    this.vy += 1.5; // Gravity

    this.x += this.vx;
    this.y += this.vy;

    // If falling, stop at bottom
    if (this.y + this.height >= HEIGHT) {
      this.vy = 0;
      this.y = HEIGHT - this.height;
      this.jumping = false;
    }

    // prevent player from going off of the screen
    if (this.x < 0) {
      this.x = 0;
    } else if (this.x > WIDTH - this.width) {
      this.x = WIDTH - this.width;
    }
  }

  // Draws the entity in the screen
  drawSprite() {
    // Draw the shape
    CTX.beginPath();
    CTX.fillStyle = this.style;
    CTX.fillRect(this.x, this.y, this.width, this.height);

    // Draw the eye for knowing where is aiming at
    if (this.isShooting) {
      CTX.fillStyle = "red";
      this.isShooting = false;
    } else {
      CTX.fillStyle = "white";
    }
    if (this.d === -1) {
      CTX.arc(this.x + 10, this.y + 10, 5, 0, 2 * Math.PI);
    } else {
      CTX.arc(this.x + this.width - 10, this.y + 10, 5, 0, 2 * Math.PI);
    }
    CTX.fill();
    CTX.closePath();
  }
}

// Class used when an entity shoots
class Bullet {
  constructor(x, y, d, id, owner) {
    this.x = x;
    this.y = y;
    this.d = d;
    this.vx = owner === "player" ? 15 : 10;
    this.style = owner === "player" ? "red" : "brown";
    this.width = 10;
    this.height = 10;
    this.type = "bullet";
    this.id = id;
    this.owner = owner;
  }

  // Draws entity in screen
  drawSprite() {
    // Draw the shape
    CTX.beginPath();
    CTX.fillStyle = this.style;
    CTX.fillRect(this.x - this.width, this.y, this.width, this.height);
    CTX.closePath();
  }

  // Updates position in screen
  updatePosition() {
    // if direction is 0, drops to the floor
    if (this.d === 0) {
      this.y += this.vx;
    } else {
      this.x += this.vx * this.d;
    }

    // getting rid of the bullet out of boundaries
    if (
      this.x < 0 ||
      this.x + this.width >= WIDTH ||
      this.y + this.height >= HEIGHT
    ) {
      game.destroy(this);
    }
  }
}

// Enemy #1 - Best enemy ever
class Zombie {
  constructor(x, y, d, id) {
    this.width = 40;
    this.height = 60;
    this.x = x - this.width;
    this.y = y - this.height;
    this.d = d;
    this.vx = 5;
    this.vy = 0;
    this.style = "green";
    this.type = "zombie";
    this.id = id;
  }

  // Updates position in screen
  updatePosition() {
    this.x += this.vx * this.d;

    // prevent enemy from going off of the screen
    if (this.x < 0) {
      this.x = 0;
      this.d = -this.d;
    }
    if (this.x > WIDTH - this.width) {
      this.x = WIDTH - this.width;
      this.d = -this.d;
    }
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  setDirection(d) {
    this.d = d;
  }

  // Draws entity in screen
  drawSprite() {
    // Draw the shape
    CTX.beginPath();
    CTX.fillStyle = this.style;
    CTX.fillRect(this.x, this.y, this.width, this.height);

    // Draw the eye for knowing where is aiming at
    CTX.fillStyle = "red";
    if (this.d === -1) {
      CTX.arc(this.x + 10, this.y + 10, 5, 0, 2 * Math.PI);
    } else {
      CTX.arc(this.x + this.width - 10, this.y + 10, 5, 0, 2 * Math.PI);
    }
    CTX.fill();
    CTX.closePath();
  }
}

// Enemy #2 - Be careful, it poops!
class Pidgeon {
  constructor(x, y, d, id) {
    this.width = 60;
    this.height = 30;
    this.x = x - this.width;
    this.y = y - this.height;
    this.d = d;
    this.vx = 5;
    this.vy = 0;
    this.style = "grey";
    this.type = "pidgeon";
    this.id = id;
    this.cycle = 0;
    this.shootingRate = Math.random() * 100 + 50;
  }

  // Be careful, this code smells
  shoot() {
    game.spawnBullet(
      this.x + this.width / 2,
      this.y + this.height + 2,
      0,
      this.type
    );
  }

  updatePosition() {
    this.x += this.vx * this.d;

    // prevent enemy from going off of the screen
    if (this.x < 0) {
      this.x = 0;
      this.d = -this.d;
    }
    if (this.x > WIDTH - this.width) {
      this.x = WIDTH - this.width;
      this.d = -this.d;
    }

    // After interval, poop! I mean... shoot!
    if (this.cycle >= this.shootingRate) {
      this.shoot();
      this.cycle = 0;
    }

    this.cycle++;
  }

  drawSprite() {
    // Draw the shape
    CTX.beginPath();
    CTX.fillStyle = this.style;
    CTX.fillRect(this.x, this.y, this.width, this.height);

    // Draw the eye for knowing where is aiming at
    CTX.fillStyle = "white";
    if (this.d === -1) {
      CTX.arc(this.x + 10, this.y + 10, 5, 1.7 * Math.PI, 0.9 * Math.PI);
    } else {
      CTX.arc(this.x + this.width - 10, this.y + 10, 5, 0, 2 * Math.PI);
    }
    CTX.fill();
    CTX.closePath();
  }
}

// Walls and platforms of the game
class Obstacle {
  constructor(x, y, w, h) {
    this.width = w;
    this.height = h;
    this.x = x;
    this.y = y;
    this.style = "pink";
    this.type = "obstacle";
  }

  updatePosition() {}

  drawSprite() {
    // Draw the shape
    CTX.beginPath();
    CTX.fillStyle = this.style;
    CTX.fillRect(this.x, this.y, this.width, this.height);
    CTX.closePath();
  }
}

let game = new Game();
game.init();
