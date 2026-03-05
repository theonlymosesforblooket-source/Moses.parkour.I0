class ElmoRageGame {
  constructor() {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    this.init();
  }

  init() {
    this.currentLevel = 1;
    this.deathCount = 0;
    this.wasdTimer = 0;
    this.level3StartTime = 0;
    this.inSikePhase = false;
    
    this.player = { 
      x: 50, y: 300, w: 20, h: 40, 
      dy: 0, onGround: false, 
      crouching: false, standHeight: 40, crouchHeight: 20 
    };

    this.keys = { left: false, right: false, jump: false, crouch: false, key5: false, key9: false };
    this.goal = { x: 730, y: 150, w: 30, h: 30 };
    this.platforms = [];
    this.level3Mode = false;

    this.constants = {
      gravity: 0.6,
      jumpPower: -13,
      moveSpeed: 5,
      worldSpeed: 3
    };

    this.loadLevel(1);
    this.bindEvents();
    this.gameLoop();
  }

  getControlSet(level) {
    const group = Math.floor((level - 1) / 3);
    
    if (group === 0) return { left: 'h', right: '2', jump: 'shift', crouch: 'enter' };
    else if (group === 1 && level === 3 && this.wasdTimer > 0) return { left: 'a', right: 'd', jump: 'w', crouch: 's' };
    else if (group === 1) return { left: 'j', right: '1', jump: 'j', crouch: 'backspace' };
    else if (group === 2) return { left: '4', right: '6', jump: '8', crouch: '2' };
    return { left: 'h', right: '2', jump: 'shift', crouch: 'enter' };
  }

  loadLevel(lvl) {
    this.player.dy = 0;
    this.player.x = 50;
    this.player.y = 340;
    this.deathCount = 0;
    this.wasdTimer = lvl === 3 ? 30 : 0;
    this.inSikePhase = false;
    this.level3StartTime = Date.now();

    if (lvl === 1) {
      this.platforms = [
        {x: 0, y: 380, w: 200, h: 10}, {x: 220, y: 330, w: 100, h: 10},
        {x: 350, y: 280, w: 100, h: 10}, {x: 480, y: 230, w: 100, h: 10},
        {x: 610, y: 180, w: 150, h: 10}
      ];
      this.goal = { x: 730, y: 150, w: 30, h: 30 };
    } else if (lvl === 2) {
      this.platforms = [
        {x: 100, y: 300, w: 100, h: 15}, {x: 350, y: 250, w: 100, h: 15},
        {x: 600, y: 200, w: 100, h: 15}
      ];
      this.goal = { x: 750, y: 150, w: 30, h: 30 };
    } else if (lvl === 3) {
      this.platforms = [
        {x: 0, y: 380, w: 800, h: 10},
        {x: 720, y: 320, w: 80, h: 10}
      ];
      this.goal = { x: 750, y: 290, w: 30, h: 30 };
      this.level3Mode = true;
    } else if (lvl === 4) {
      this.platforms = [
        {x: 0, y: 380, w: 250, h: 10}, {x: 300, y: 300, w: 60, h: 10},
        {x: 420, y: 220, w: 80, h: 10}, {x: 550, y: 300, w: 50, h: 10},
        {x: 650, y: 380, w: 150, h: 10}
      ];
      this.goal = { x: 760, y: 350, w: 30, h: 30 };
    } else if (lvl === 5) {
      this.platforms = [
        {x: 0, y: 380, w: 120, h: 10}, {x: 180, y: 300, w: 70, h: 10},
        {x: 320, y: 220, w: 100, h: 10}, {x: 480, y: 280, w: 60, h: 10},
        {x: 600, y: 340, w: 80, h: 10}, {x: 720, y: 260, w: 80, h: 10}
      ];
      this.goal = { x: 760, y: 230, w: 30, h: 30 };
    } else if (lvl === 6) {
      this.platforms = [
        {x: 0, y: 380, w: 800, h: 10}, {x: 200, y: 280, w: 50, h: 10},
        {x: 350, y: 200, w: 40, h: 10}, {x: 450, y: 300, w: 60, h: 10},
        {x: 580, y: 220, w: 50, h: 10}
      ];
      this.goal = { x: 720, y: 190, w: 30, h: 30 };
    }
    // ADD NEW LEVELS HERE - copy pattern above
  }

  nextLevel() {
    if (this.currentLevel < 20) {
      this.currentLevel++;
      this.loadLevel(this.currentLevel);
    } else {
      alert(`🎉 RAGE MASTERED! 🎉\nDeaths: ${this.deathCount}`);
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
    }
  }

  drawElmo(x, y, w, h) {
    const ctx = this.ctx;
    ctx.save();
    
    ctx.fillStyle = '#e01b22';
    ctx.beginPath();
    ctx.arc(x + w/2, y, w * 0.8, h/2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(x + w/4, y - h/2 + 5, h/5, 0, Math.PI * 2);
    ctx.arc(x + 3*w/4, y - h/2 + 5, h/5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(x + w/4, y - h/2 + 5, h/12, 0, Math.PI * 2);
    ctx.arc(x + 3*w/4, y - h/2 + 5, h/12, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ff9900';
    ctx.beginPath();
    ctx.arc(x + w/2, y - h/1.8, w/4, h/6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }

  update() {
    this.updateControls();
    const controls = this.getControlSet(this.currentLevel);
    
    let netLeft = this.keys.left;
    let netRight = this.keys.right;
    let jumpPressed = this.keys.jump;

    // J OVERLOAD LOGIC
    if (controls.left === 'j' && controls.jump === 'j') {
      if (this.keys.left || this.keys.jump) {
        if (!netRight) netLeft = true;
        jumpPressed = true;
      }
    }

    // LEVEL 3 DEATH MAZE
    if (this.level3Mode && this.currentLevel === 3) {
      if (netLeft) return this.respawn();
      if (netLeft && netRight) { netLeft = false; netRight = false; }
      
      if (this.player.x < -20) this.player.x = 780;
      if (this.player.x > 800) this.player.x = 0;
    }

    // MOVEMENT
    if (netLeft && !netRight) this.player.x -= this.constants.moveSpeed;
    if (netRight && !netLeft) this.player.x += this.constants.moveSpeed;
    if (jumpPressed && this.player.onGround) this.player.dy = this.constants.jumpPower;

    this.player.dy += this.constants.gravity;
    this.player.y += this.player.dy;

    this.player.onGround = false;
    this.platforms.forEach(p => {
      if (this.player.x + this.player.w > p.x && this.player.x < p.x + p.w &&
          this.player.y >= p.y && this.player.y - Math.abs(this.player.dy) - 5 <= p.y) {
        this.player.y = p.y;
        this.player.dy = 0;
        this.player.onGround = true;
      }
    });

    if (this.player.y > 450) return this.respawn();
    if (this.player.y < -100) this.player.y = -100;

    // GOAL CHECK
    const h = this.player.crouching ? this.player.crouchHeight : this.player.standHeight;
    if (this.player.x < this.goal.x + this.goal.w && this.player.x + this.player.w > this.goal.x &&
        this.player.y - h < this.goal.y + this.goal.h && this.player.y > this.goal.y) {
      this.nextLevel();
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, 800, 400);

    // HUD
    ctx.fillStyle = this.deathCount > 10 ? "#ff4444" : "#ffffff";
    ctx.font = "bold 22px 'Courier New'";
    ctx.textAlign = 'left';
    ctx.fillText(`LEVEL ${this.currentLevel} | DEATHS: ${this.deathCount}`, 20, 35);

    const controls = this.getControlSet(this.currentLevel);

    // LEVEL 3 SPECIAL TEXT
    if (this.currentLevel === 3) {
      const elapsed = (Date.now() - this.level3StartTime) / 1000;
      if (elapsed < 3) {
        ctx.fillStyle = "#ffff00";
        ctx.font = "bold 28px 'Courier New'";
        ctx.textAlign = 'center';
        ctx.fillText("🎁 HERE'S A GIFT: WASD! 🎁", 400, 120);
        ctx.textAlign = 'left';
      } else if (elapsed > 30 && !this.inSikePhase) {
        ctx.fillStyle = "#ff0000";
        ctx.font = "bold 36px 'Courier New'";
        ctx.textAlign = 'center';
        ctx.fillText("SIKE! 😈", 400, 120);
        ctx.textAlign = 'left';
      } else if (this.wasdTimer > 0) {
        ctx.fillStyle = "#00ff00";
        ctx.font = "bold 18px 'Courier New'";
        ctx.fillText(`WASD LEFT: ${Math.ceil(this.wasdTimer)}s`, 20, 70);
      }
    }

    // CONTROLS
    ctx.fillStyle = "#cccccc";
    ctx.font = "16px 'Courier New'";
    ctx.textAlign = 'left';
    ctx.fillText(
      `Move: ${controls.left.toUpperCase()}/${controls.right.toUpperCase()} Jump: ${controls.jump.toUpperCase()} Crouch: ${controls.crouch.toUpperCase()}`,
      20, 370
    );
    ctx.fillText("5+D Next | 9+A Prev", 20, 390);

    // PLATFORMS
    ctx.fillStyle = this.level3Mode ? "#ff6666" : "#666666";
    this.platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

    // GOAL
    const gradient = ctx.createLinearGradient(this.goal.x, this.goal.y, this.goal.x + 30, this.goal.y + 30);
    gradient.addColorStop(0, '#ffd700');
    gradient.addColorStop(1, '#ffaa00');
    ctx.fillStyle = gradient;
    ctx.fillRect(this.goal.x, this.goal.y, this.goal.w, this.goal.h);

    // ELMO
    const h = this.player.crouching ? this.player.crouchHeight : this.player.standHeight;
    this.drawElmo(this.player.x, this.player.y, this.player.w, h);
  }

  gameLoop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }

  bindEvents() {
    document.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      const controls = this.getControlSet(this.currentLevel);
      
      if (key === controls.left) this.keys.left = true;
      if (key === controls.right) this.keys.right = true;
      if (key === controls.jump) this.keys.jump = true;
      if (key === controls.crouch) { this.keys.crouch = true; this.player.crouching = true; }
      
      if (key === '5') this.keys.key5 = true;
      if (key === '9') this.keys.key9 = true;
      if (this.keys.key5 && key === 'd') this.nextLevel();
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
      if (key === controls.crouch) { this.keys.crouch = false; this.player.crouching = false; }
      
      if (key === '5') this.keys.key5 = false;
      if (key === '9') this.keys.key9 = false;
    });
  }
}

// START GAME
new ElmoRageGame();
