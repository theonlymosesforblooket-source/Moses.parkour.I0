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
    this.lastControls = {};

    this.constants = {
      gravity: 0.6,
      jumpPower: -13,
      moveSpeed: 5,
      worldSpeed: 3
    };

    this.loadLevel(1);
    this.bindEvents();
    this.update(); // Start main loop
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
    
    if(lvl === 1) {
      this.player.x = 50; 
      this.player.y = 340;
      this.platforms = [
        {x:0, y:380, w:200, h:10},
        {x:220, y:330, w:100, h:10},
        {x:350, y:280, w:100, h:10},
        {x:480, y:230, w:100, h:10},
        {x:610, y:180, w:150, h:10}
      ];
      this.goal = { x: 730, y: 150, w: 30, h: 30 };
    } else if(lvl === 2) {
      // FIXED: Player spawns ON first platform
      this.player.x = 110; 
      this.player.y = 285; 
      this.platforms = [
        {x:100, y:300, w:100, h:15},
        {x:350, y:250, w:100, h:15},
        {x:600, y:200, w:100, h:15}
      ];
      this.goal = { x: 750, y: 150, w: 30, h: 30 };
    } else if(lvl === 3) {
      this.player.x = 50; 
      this.player.y = 370; 
      this.platforms = [
        {x:0, y:380, w:800, h:10},
        {x:720, y:320, w:80, h:10}
      ];
      this.goal = { x: 750, y: 290, w: 30, h: 30 };
      this.level3Mode = true;
      this.wasdTimer = 30;
      this.level3StartTime = Date.now();
    } else if(lvl === 4) {
      this.player.x = 50; 
      this.player.y = 370; 
      this.platforms = [
        {x:0, y:380, w:250, h:10},
        {x:300, y:300, w:60, h:10},
        {x:420, y:220, w:80, h:10},
        {x:550, y:300, w:50, h:10},
        {x:650, y:380, w:150, h:10}
      ];
      this.goal = { x: 760, y: 350, w: 30, h: 30 };
    }
    // ADD MORE LEVELS HERE
  }

  // FIXED: Elmo faces RIGHT (proper player orientation)
  drawElmo(x, y, w, h) {
    const ctx = this.ctx;
    ctx.save();
    
    // Move to player position and rotate to face RIGHT
    ctx.translate(x + w/2, y);
    ctx.scale(1, -1); // Flip vertically so feet point down
    
    // Body (ellipse facing right)
    ctx.fillStyle = '#e01b22';
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.8, h/2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes (facing right)
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(-w/3, -h/3, h/5, 0, Math.PI * 2);
    ctx.arc(w/4, -h/3, h/5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(-w/3, -h/3, h/12, 0, Math.PI * 2);
    ctx.arc(w/4, -h/3, h/12, 0, Math.PI * 2);
    ctx.fill();
    
    // Nose
    ctx.fillStyle = '#ff9900';
    ctx.beginPath();
    ctx.arc(0, -h/2.5, w/4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }

  update() {
    this.updateControls();
    
    // Level 2 MOVING WORLD (your original mechanic restored)
    const controls = this.getControlSet(this.currentLevel);
    let netLeft = this.keys.left;
    let netRight = this.keys.right;
    let jumpPressed = this.keys.jump;

    // J OVERLOAD: Left UNLESS right held
    if (controls.left === 'j' && controls.jump === 'j') {
      if (this.keys.left || this.keys.jump) {
        if (!netRight) netLeft = true;
        jumpPressed = true;
      }
    }

    // LEVEL 2 WORLD MOVEMENT
    if (this.currentLevel === 2) {
      if (this.keys.right) { 
        this.player.x += this.constants.worldSpeed; 
        this.platforms.forEach(p => p.y -= this.constants.worldSpeed); 
        this.goal.y -= this.constants.worldSpeed; 
      }
      if (this.keys.left) { 
        this.player.x -= this.constants.worldSpeed; 
        this.platforms.forEach(p => p.y += this.constants.worldSpeed); 
        this.goal.y += this.constants.worldSpeed; 
      }
      if (this.keys.jump && this.player.onGround) {
        this.player.dy = this.constants.jumpPower;
        this.platforms.forEach(p => p.x -= this.constants.worldSpeed);
        this.goal.x -= this.constants.worldSpeed;
      }
    } 
    // LEVEL 3 DEATH MAZE
    else if (this.currentLevel === 3) {
      if (netLeft) return this.respawn(); // LEFT = DEATH
      if (netLeft && netRight) { netLeft = false; netRight = false; } // BOTH = FROZEN
      
      // Side wrap
      if (this.player.x < -20) this.player.x = 780;
      if (this.player.x > 800) this.player.x = 0;
      
      if (netRight && !netLeft) this.player.x += this.constants.moveSpeed;
    } 
    // NORMAL MOVEMENT
    else {
      if (netLeft && !netRight) this.player.x -= this.constants.moveSpeed;
      if (netRight && !netLeft) this.player.x += this.constants.moveSpeed;
    }

    if (jumpPressed && this.player.onGround) this.player.dy = this.constants.jumpPower;
    
    this.player.dy += this.constants.gravity;
    this.player.y += this.player.dy;

    // FIXED: Better collision detection
    this.player.onGround = false;
    this.platforms.forEach(p => {
      if (this.player.x + this.player.w > p.x && this.player.x < p.x + p.w &&
          this.player.y + this.player.h > p.y && this.player.y < p.y + 10) {
        this.player.y = p.y - this.player.h;
        this.player.dy = 0;
        this.player.onGround = true;
      }
    });

    if (this.player.y > 450) this.respawn();
    if (this.player.x < 0) this.player.x = 0;
    if (this.player.x > 780) this.player.x = 780;

    // Goal check
    const h = this.player.crouching ? this.player.crouchHeight : this.player.standHeight;
    if (this.player.x < this.goal.x + this.goal.w && 
        this.player.x + this.player.w > this.goal.x &&
        this.player.y < this.goal.y + this.goal.h && 
        this.player.y + h > this.goal.y) {
      this.nextLevel();
    }

    this.draw();
    requestAnimationFrame(() => this.update());
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

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, 800, 400);

    // HUD (NO CONTROL DISPLAY)
    ctx.fillStyle = this.deathCount > 10 ? "#ff4444" : "#ffffff";
    ctx.font = "bold 24px 'Courier New'";
    ctx.textAlign = 'left';
    ctx.fillText(`LEVEL ${this.currentLevel} | DEATHS: ${this.deathCount}`, 20, 35);
    ctx.fillText("NOT WASD - FIGURE IT OUT", 20, 65);

    // Level 3 messages
    if (this.currentLevel === 3) {
      const elapsed = (Date.now() - this.level3StartTime) / 1000;
      if (elapsed < 3) {
        ctx.fillStyle = "#ffff00";
        ctx.font = "bold 28px 'Courier New'";
        ctx.textAlign = 'center';
        ctx.fillText("🎁 HERE'S A GIFT: WASD! 🎁", 400, 120);
      } else if (elapsed > 30 && !this.inSikePhase) {
        ctx.fillStyle = "#ff0000";
        ctx.font = "bold 36px 'Courier New'";
        ctx.textAlign = 'center';
        ctx.fillText("SIKE! 😈", 400, 120);
      } else if (this.wasdTimer > 0) {
        ctx.fillStyle = "#00ff00";
        ctx.font = "bold 20px 'Courier New'";
        ctx.textAlign = 'left';
        ctx.fillText(`WASD LEFT: ${Math.ceil(this.wasdTimer)}s`, 20, 100);
      }
      ctx.textAlign = 'left';
    }

    // Platforms
    ctx.fillStyle = this.level3Mode ? "#ff6666" : "#666666";
    this.platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

    // Goal
    const gradient = ctx.createLinearGradient(this.goal.x, this.goal.y, this.goal.x + 30, this.goal.y + 30);
    gradient.addColorStop(0, '#ffd700');
    gradient.addColorStop(1, '#ffaa00');
    ctx.fillStyle = gradient;
    ctx.fillRect(this.goal.x, this.goal.y, this.goal.w, this.goal.h);

    // Elmo
    const h = this.player.crouching ? this.player.crouchHeight : this.player.standHeight;
    this.drawElmo(this.player.x, this.player.y, this.player.w, h);
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

  bindEvents() {
    document.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      const controls = this.getControlSet(this.currentLevel);
      
      if (key === controls.left) this.keys.left = true;
      if (key === controls.right) this.keys.right = true;
      if (key === controls.jump) this.keys.jump = true;
      if (key === controls.crouch) { 
        this.keys.crouch = true; 
        this.player.crouching = true; 
      }
      
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
      if (key === controls.crouch) { 
        this.keys.crouch = false; 
        this.player.crouching = false; 
      }
      
      if (key === '5') this.keys.key5 = false;
      if (key === '9') this.keys.key9 = false;
    });
  }
}

new ElmoRageGame();
