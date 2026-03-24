const sketch = (p) => {
  const baseSpeed = 5;
  const maxSpeed = 15;
  const squareSize = 40;
  const gridSize = 40;
  const colorBg = '#1a1a2e';
  const colorWall = '#4a5568';
  
  let p1 = {
    x: 0,
    y: 0,
    color: '#e94560',
    label: 'P1'
  };

  let p2 = {
    x: 0,
    y: 0,
    color: '#f5a623',
    label: 'P2'
  };

  const wallCells = [
    {r: 0, c: 0}, {r: 0, c: 1},
    {r: 1, c: 0}, {r: 1, c: 1},
    {r: 2, c: 0}, {r: 2, c: 1}, {r: 2, c: 2}, {r: 2, c: 3}, {r: 2, c: 4}
  ];
  let wallWorldBlocks = [];

  let currentSpeed = 0;

  let joyActive = false;
  let joyForce = 0;
  let joyVectorX = 0;
  let joyVectorY = 0;

  let speedSlider;
  let speedDisplay;

  function updateWallBlocks() {
    wallWorldBlocks = [];
    const wallW = 5 * gridSize;
    const wallH = 3 * gridSize;
    const startX = Math.floor((p.width - wallW) / 2 / gridSize) * gridSize;
    const startY = Math.floor((p.height - wallH) / 2 / gridSize) * gridSize;

    for (let cell of wallCells) {
      wallWorldBlocks.push({
        x: startX + cell.c * gridSize + gridSize/2,
        y: startY + cell.r * gridSize + gridSize/2,
        halfW: gridSize/2,
        halfH: gridSize/2
      });
    }
  }

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    
    p1.x = p.width / 2 - 100;
    p1.y = p.height / 2;
    p2.x = p.width / 2 + 100;
    p2.y = p.height / 2;

    updateWallBlocks();

    speedSlider = document.getElementById('speed-slider');
    speedDisplay = document.getElementById('speed-display');

    const manager = nipplejs.create({
      zone: document.body,
      color: 'rgba(255,255,255,0.3)',
      size: 120
    });

    manager.on('move', (evt) => {
      const data = evt?.data;
      if (data?.vector && data.force !== undefined) {
        joyActive = true;
        joyForce = data.force;
        joyVectorX = data.vector.x;
        joyVectorY = data.vector.y;
      }
    });

    manager.on('end', () => {
      joyActive = false;
      joyForce = 0;
      joyVectorX = 0;
      joyVectorY = 0;
      currentSpeed = 0;
      updateSpeedDisplay();
    });
  };

  function resolveWallCollision(player) {
    const pBox = { x: player.x, y: player.y, halfW: squareSize/2, halfH: squareSize/2 };
    
    for (let block of wallWorldBlocks) {
      const dx = pBox.x - block.x;
      const dy = pBox.y - block.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      
      const sumHalfW = pBox.halfW + block.halfW;
      const sumHalfH = pBox.halfH + block.halfH;
      
      if (absDx < sumHalfW && absDy < sumHalfH) {
        const overlapX = sumHalfW - absDx;
        const overlapY = sumHalfH - absDy;
        
        if (overlapX < overlapY) {
          if (dx > 0) player.x += overlapX;
          else player.x -= overlapX;
        } else {
          if (dy > 0) player.y += overlapY;
          else player.y -= overlapY;
        }
        pBox.x = player.x;
        pBox.y = player.y;
      }
    }
  }

  function resolvePlayerCollision() {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    
    const sumHalfW = squareSize; 
    const sumHalfH = squareSize;
    
    if (absDx < sumHalfW && absDy < sumHalfH) {
      const overlapX = sumHalfW - absDx;
      const overlapY = sumHalfH - absDy;
      
      let pushX = 0;
      let pushY = 0;
      
      if (overlapX < overlapY) {
        pushX = dx > 0 ? overlapX / 2 : -overlapX / 2;
      } else {
        pushY = dy > 0 ? overlapY / 2 : -overlapY / 2;
      }
      
      p1.x += pushX;
      p1.y += pushY;
      p2.x -= pushX;
      p2.y -= pushY;
      
      resolveWallCollision(p1);
      resolveWallCollision(p2);
    }
  }

  function movePlayer(player, vx, vy) {
    player.x += vx;
    player.y += vy;
    
    player.x = p.constrain(player.x, squareSize/2, p.width - squareSize/2);
    player.y = p.constrain(player.y, squareSize/2, p.height - squareSize/2);

    resolveWallCollision(player);
  }

  function drawPlayer(player) {
    p.push();
    p.translate(player.x, player.y);
    p.rectMode(p.CENTER);
    
    p.drawingContext.shadowBlur = 15;
    p.drawingContext.shadowColor = player.color;
    
    p.fill(player.color);
    p.noStroke();
    p.rect(0, 0, squareSize, squareSize, 4);
    
    p.drawingContext.shadowBlur = 0;
    p.fill(255);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(12);
    p.text(player.label, 0, -squareSize/2 - 5);
    
    p.pop();
  }

  p.draw = () => {
    p.background(colorBg);

    p.stroke('rgba(255, 255, 255, 0.08)');
    p.strokeWeight(1);
    for (let x = 0; x <= p.width; x += gridSize) {
      p.line(x, 0, x, p.height);
    }
    for (let y = 0; y <= p.height; y += gridSize) {
      p.line(0, y, p.width, y);
    }

    let p1Speed = 0;
    if (joyActive) {
      const speedMultiplier = parseFloat(speedSlider?.value || 2.0);
      const rawSpeed = baseSpeed * joyForce * speedMultiplier;
      p1Speed = Math.min(rawSpeed, maxSpeed);
      movePlayer(p1, joyVectorX * p1Speed, -joyVectorY * p1Speed);
    }

    let p2dx = 0;
    let p2dy = 0;
    if (p.keyIsDown(87)) p2dy -= 1; // W
    if (p.keyIsDown(83)) p2dy += 1; // S
    if (p.keyIsDown(65)) p2dx -= 1; // A
    if (p.keyIsDown(68)) p2dx += 1; // D

    if (p2dx !== 0 || p2dy !== 0) {
      const mag = Math.sqrt(p2dx*p2dx + p2dy*p2dy);
      p2dx /= mag;
      p2dy /= mag;
      
      const speedMultiplier = parseFloat(speedSlider?.value || 2.0);
      const p2Speed = Math.min(baseSpeed * 1.0 * speedMultiplier, maxSpeed);
      movePlayer(p2, p2dx * p2Speed, p2dy * p2Speed);
    }

    resolvePlayerCollision();

    p1.x = p.constrain(p1.x, squareSize/2, p.width - squareSize/2);
    p1.y = p.constrain(p1.y, squareSize/2, p.height - squareSize/2);
    p2.x = p.constrain(p2.x, squareSize/2, p.width - squareSize/2);
    p2.y = p.constrain(p2.y, squareSize/2, p.height - squareSize/2);

    if (joyActive) {
      currentSpeed = p1Speed;
      updateSpeedDisplay();
    }

    p.push();
    p.fill(colorWall);
    p.noStroke();
    p.rectMode(p.CENTER);
    for (let block of wallWorldBlocks) {
      p.rect(block.x, block.y, block.halfW*2, block.halfH*2);
    }
    p.pop();

    drawPlayer(p1);
    drawPlayer(p2);
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    updateWallBlocks();
    
    const halfSize = squareSize / 2;
    if (p1.x < halfSize || p1.x > p.width - halfSize || 
        p1.y < halfSize || p1.y > p.height - halfSize) {
      p1.x = p.width / 2 - 100;
      p1.y = p.height / 2;
    }
    if (p2.x < halfSize || p2.x > p.width - halfSize || 
        p2.y < halfSize || p2.y > p.height - halfSize) {
      p2.x = p.width / 2 + 100;
      p2.y = p.height / 2;
    }
  };

  function updateSpeedDisplay() {
    if (speedDisplay) {
      speedDisplay.innerText = `Speed: ${currentSpeed.toFixed(1)} px/f`;
    }
  }
};

new p5(sketch);
