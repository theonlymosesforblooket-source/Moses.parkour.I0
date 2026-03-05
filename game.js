class ElmoRageGame {
  constructor() {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    this.WIDTH = this.canvas.width;  // 1000
    this.HEIGHT = this.canvas.height; // 500
    
    this.currentLevel = 1;
    this.deathCount = 0;
    this.wasdTimer = 0;
    this.level3StartTime = 0;
    this.inSikePhase = false;
    
    this.player = { 
      x: 50, y: 420, w: 25, h: 50,
      dy: 0, onGround: false, 
      crouching: false, standHeight: 50, crouchHeight: 25 
    };

    this.keys = { 
      left: false, right: false, jump: false, 
      crouch: false, key5: false, key9: false 
    };
    
    this.goal = { x: 930, y: 420, w: 40, h: 40 };
    this.platforms = [];
    this.level3Mode = false;

    this.constants = {
      gravity: 0.8,
      jumpPower: -16,
      moveSpeed: 6,
      worldSpeed: 4
    };

    this.loadLevel(1);
    this.bindEvents();
    this.update();
  }

  getControlSet(level) {
    const group = Math.floor((level - 1) / 3);
    if (group === 0) {
      return { left: 'h', right: '2', jump: 'shift', crouch: 'enter' };
    } else if (group === 1 && level === 3 && this.wasdTimer > 0) {
      return { left: 'a', right: 'd', jump: 'w', crouch: 's' };
    } else if (group === 1) {
      return { left: 'j', right: '1', jump: 'j', crouch: 'backspace' };
    } else if (group === 2) {
      return { left: '4', right: '6', jump: '8', crouch: '2' };
    }
    return { left: 'h', right: '2', jump: 'shift', crouch: 'enter' };
  }

  loadLevel(lvl) {
    this.player.dy = 0;
    this.level3Mode = false;

    if (lvl === 1) {
      this.player.x = 60; 
      this.player.y = 420;
      this.platforms = [
        {x:0, y:470, w:250, h:15},
        {x:280, y:420, w:130, h:15},
        {x:450, y:370, w:130, h:15},
        {x:620, y:320, w:130, h:15},
        {x:780, y:270, w:200, h:15}
      ];
      this.goal = { x: 930, y: 240, w: 40, h: 40 };
    } else if (lvl === 2) {
      this.player.x = 110; 
      this.player.y = 285;
      this.platforms = [
        {x:100, y:300, w:130, h:20},
        {x:350, y:250, w:130, h:20},
        {x:600, y:200, w:130, h:20}
      ];
      this.goal = { x: 950, y: 150, w: 40, h: 40 };
    } else if (lvl === 3) {
      this.player.x = 60; 
      this.player.y = 450;
      this.platforms = [
        {x:0, y:470, w:1000, h:15},
        {x:900, y:400, w:100, h:15}
      ];
      this.goal = { x: 930, y: 370, w: 40, h: 40 };
      this.level3Mode = true;
      this.wasdTimer = 30;
      this.level3StartTime = Date.now();
      this.inSikePhase = false;
    }
  }

  drawElmo(x, y, w, h) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x + w/2, y + h/2);
    
    // Body
    ctx.fillStyle = '#e01b22';
    ctx.beginPath();
    ctx.arc(0, 0, w * 0.7, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes moved slightly up
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(-8, -12, 6, 0, Math.PI * 2);
    ctx.arc(8, -12, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(-8, -12, 3, 0, Math.PI * 2);
    ctx.arc(8, -12, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Nose slightly higher too
    ctx.fillStyle = '#ff9900';
    ctx.beginPath();
    ctx.arc(0, -9, 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }

  updateControls() {
    const elapsed = (Date.now() - this.level3StartTime) / 1000;
    if (this.currentLevel === 3 && elapsed > 30 && !this.inSikePhase) {
      this.inSikePhase = true;
      this.wasdTimer = 0;
      document.body.classList.add('sike-flash');
      setTimeout(() => document.body.classList.remove('sike-flash'), 600);
    }
    if (this.currentLevel === 3 && this.wasdTimer > 0) {
      this.wasdTimer -= 1/60;
      if (this.wasdTimer < 0) this.wasdTimer = 0;
    }
  }

  nextLevel() {
    if (this.currentLevel < 20) {
      this.currentLevel++;
      this.loadLevel(this.currentLevel);
    } else {
      alert(`🎉 RAGE SURVIVED! 🎉\nTotal Deaths: ${this.deathCount}`);
      this.currentLevel = 1;
      this.loadLevel(1);
    }
  }

  respawn() {
    this.deathCount++;
    document.body.classList.add('death-shake');
    setTimeout(() => document.body.classList.remove('death-shake'), 400);
    this.loadLevel(this.currentLevel);
  }

  update() {
    this.updateControls();
    const controls = this.getControlSet(this.currentLevel);
    
    let netLeft = this.keys.left;
    let netRight = this.keys.right;
    let jumpPressed = this.keys.jump;

    // Keep hitbox in sync with crouch state
    this.player.h = this.player.crouching ? this.player.crouchHeight : this.player.standHeight;

    // J OVERLOAD: Left UNLESS right held
    if (controls.left === 'j' && controls.jump === 'j') {
      if (this.keys.left || this.keys.jump) {
        if (!netRight) netLeft = true;
        jumpPressed = true;
      }
    }
    // LEVEL 2: World movement (fixed)
    if (this.currentLevel === 2) {

      if (netRight && !netLeft) { 
        this.player.x += this.constants.worldSpeed; 
        this.platforms.forEach(p => p.y -= this.constants.worldSpeed); 
        this.goal.y -= this.constants.worldSpeed; 
      }

      if (netLeft && !netRight) { 
        this.player.x -= this.constants.worldSpeed; 
        this.platforms.forEach(p => p.y += this.constants.worldSpeed); 
        this.goal.y += this.constants.worldSpeed; 
      }

      if (jumpPressed) {
        this.platforms.forEach(p => p.x -= this.constants.worldSpeed);
        this.goal.x -= this.constants.worldSpeed;
      }
    }

    // LEVEL 3: Death maze (fixed left/right logic)
    else if (this.currentLevel === 3) {

      // Left alone = death
      if (netLeft && !netRight) {
        return this.respawn();
      }

      // Left + Right = cancel
      if (netLeft && netRight) {
        netLeft = false;
        netRight = false;
      }

      // Right moves
      if (netRight && !netLeft) {
        this.player.x += this.constants.moveSpeed;
      }

      // Wrap-around
      if (this.player.x < -30) this.player.x = 970;
      if (this.player.x > 1000) this.player.x = 0;
    }

    // NORMAL MOVEMENT
    else {
      if (netLeft && !netRight) this.player.x -= this.constants.moveSpeed;
      if (netRight && !netLeft) this.player.x += this.constants.moveSpeed;
    }

    // Jump
    if (jumpPressed && this.player.onGround) {
      this.player.dy = this.constants.jumpPower;
    }

    // Gravity
    const prevY = this.player.y;
    this.player.dy += this.constants.gravity;
    this.player.y += this.player.dy;

    // Reset ground state
    this.player.onGround = false;

    // FIXED COLLISION DETECTION (true AABB landing)
    for (let p of this.platforms) {

      const feet = this.player.y + this.player.h;
      const prevFeet = prevY + this.player.h;

      const withinX =
        this.player.x + this.player.w > p.x &&
        this.player.x < p.x + p.w;

      const landing =
        prevFeet <= p.y &&
        feet >= p.y &&
        this.player.dy >= 0;

      if (withinX && landing) {
        this.player.y = p.y - this.player.h;
        this.player.dy = 0;
        this.player.onGround = true;
        break;
      }
    }

    // BOUNDARIES
    if (this.player.y > 520) this.respawn();
    if (this.currentLevel !== 3) {
      if (this.player.x < 0) this.player.x = 0;
      if (this.player.x > this.WIDTH - this.player.w) this.player.x = this.WIDTH - this.player.w;
    }

    // GOAL COLLISION
    if (
      this.player.x < this.goal.x + this.goal.w &&
      this.player.x + this.player.w > this.goal.x &&
      this.player.y < this.goal.y + this.goal.h &&
      this.player.y + this.player.h > this.goal.y
    ) {
      this.nextLevel();
    }

    this.draw();
    requestAnimationFrame(() => this.update());
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);

    // HUD
    ctx.fillStyle = this.deathCount > 15 ? "#ff4444" : "#ffffff";
    ctx.font = "bold 28px 'Courier New'";
    ctx.textAlign = 'left';
    ctx.fillText(`LEVEL ${this.currentLevel} | DEATHS: ${this.deathCount}`, 25, 45);
    
    ctx.fillStyle = "#ffaa00";
    ctx.font = "bold 20px 'Courier New'";
    ctx.fillText("NOT WASD - FIGURE IT OUT", 25, 80);

    // LEVEL 3 TAUNTS
    if (this.currentLevel === 3) {
      const elapsed = (Date.now() - this.level3StartTime) / 1000;

      if (elapsed < 3) {
        ctx.fillStyle = "#ffff00";
        ctx.font = "bold 36px 'Courier New'";
        ctx.textAlign = 'center';
        ctx.fillText("🎁 HERE'S A GIFT: WASD! 🎁", 500, 150);
      } 
      else if (elapsed > 30 && !this.inSikePhase) {
        ctx.fillStyle = "#ff0000";
        ctx.font = "bold 48px 'Courier New'";
        ctx.textAlign = 'center';
        ctx.fillText("SIKE! 😈", 500, 150);
      } 
      else if (this.wasdTimer > 0) {
        ctx.fillStyle = "#00ff00";
        ctx.font = "bold 24px 'Courier New'";
        ctx.textAlign = 'left';
        ctx.fillText(`WASD LEFT: ${Math.ceil(this.wasdTimer)}s`, 25, 120);
      }

      ctx.textAlign = 'left';
    }

    // PLATFORMS
    ctx.fillStyle = this.level3Mode ? "#ff6666" : "#888888";
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 8;
    this.platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));
    ctx.shadowBlur = 0;

    // GOAL
    const gradient = ctx.createLinearGradient(this.goal.x, this.goal.y, this.goal.x + 40, this.goal.y + 40);
    gradient.addColorStop(0, '#ffd700');
    gradient.addColorStop(1, '#ffaa00');
    ctx.fillStyle = gradient;
    ctx.fillRect(this.goal.x, this.goal.y, this.goal.w, this.goal.h);

    // ELMO
    const h = this.player.crouching ? this.player.crouchHeight : this.player.standHeight;
    this.drawElmo(this.player.x, this.player.y, this.player.w, h);
  }
  bindEvents() {
    document.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      const controls = this.getControlSet(this.currentLevel);

      // Movement keys
      if (key === controls.left) this.keys.left = true;
      if (key === controls.right) this.keys.right = true;
      if (key === controls.jump) this.keys.jump = true;

      // Crouch
      if (key === controls.crouch) { 
        this.keys.crouch = true; 
        this.player.crouching = true; 
      }

      // Secret keys
      if (key === '5') this.keys.key5 = true;
      if (key === '9') this.keys.key9 = true;

      // Skip forward
      if (this.keys.key5 && key === 'd') {
        this.nextLevel();
      }

      // Skip backward
      if (this.keys.key9 && key === 'a') {
        this.currentLevel = Math.max(1, this.currentLevel - 1);
        this.loadLevel(this.currentLevel);
      }
    });

    document.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      const controls = this.getControlSet(this.currentLevel);

      if (key === controls.left) this.keys.left = false;
      if (key === controls.right) this.keys.right = false;
      if (key === controls.jump) this.keys.jump = false;

      if (key === controls.crouch) { 
        this.keys.crouch = false; 
        this.player.crouching = false; 
      }

      if (key === '5') this.keys.key5 = false;
      if (key === '9') this.keys.key9 = false;
    });
  }
}

// START GAME
new ElmoRageGame();
