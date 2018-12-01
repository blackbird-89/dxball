let reloadTimeout;
$(window).resize(function () {
  clearTimeout(reloadTimeout);
  reloadTimeout = setTimeout(function () {
    location.reload();
  }, 250);
});


loadGame();
function loadGame() {
  // Main variables
  let lives;
  let score;
  let paused;
  const bricks = [];
  const keysPressed = {};
  const initialPaddleSpeed = 500;
  const initialBallSpeed = 320;
  const paddle = {};
  const ball = {};
  let gameBorders = loadGameBorders();

  // Setup key listeners before starting the first game
  setupKeyListeners();
  startNewGame();

  // Reset starting variables etc
  function startNewGame() {
    lives = 3;
    score = 0;
    paused = true;

    $(window).keydown(function (e) {
      if (e.which === 13) { paused = false }
    });
    resetBall();
    resetPaddle();
    spawnBricks();

    updateInterface();
    startInterval();
  }

  function updateGame(deltaTime) {
    if (paused) { return; }
    movePaddle(deltaTime);
    moveBall(deltaTime);
  }

  function movePaddle(deltaTime) {
    const direction = calculatePaddleDirection();
    const velocity = direction * paddle.speed * deltaTime;
    paddle.left += velocity;
    if (paddle.left < gameBorders.left) { paddle.left = 0; }
    if (paddle.left + paddle.width > gameBorders.width) { paddle.left = gameBorders.width - paddle.width; }
    paddle.$.css('left', paddle.left);
  }

  function moveBall(deltaTime) {
    ball.left += ball.direction.x * ball.speed * deltaTime;
    ball.top += ball.direction.y * ball.speed * deltaTime;

    if (!collisionDetectBallAndGame()) { return; }
    collisionDetectBallAndBricks();
    collisionDetectBallAndPaddle();

    ball.$.css('left', ball.left);
    ball.$.css('top', ball.top);
  }

  function calculatePaddleDirection() {
    let movementVelocity = 0;
    if (keysPressed.left) { --movementVelocity; }
    else if (keysPressed.right) { ++movementVelocity; }
    return movementVelocity;
  }

  function loseLife() {
    --lives;
    paused = true;
    updateInterface();
    resetBall();
    resetPaddle();
  }

  function collisionDetectBallAndGame() {
    if (ball.left < gameBorders.left) {
      new Audio('/audio/hitbrick.wav').play()
      ball.left = 0;
      ball.direction.x *= -1;
    } else if (ball.left + ball.width > gameBorders.width) {
      new Audio('/audio/hitbrick.wav').play()
      ball.left = gameBorders.width - ball.width;
      ball.direction.x *= -1;
    }

    if (ball.top < gameBorders.top) {
      new Audio('/audio/hitbrick.wav').play()
      ball.top = 0;
      ball.direction.y *= -1;
    } else if (ball.top + ball.height > gameBorders.height) {
      new Audio('/audio/gameover.wav').play()
      loseLife();
      return false;
    }
    return true;
  }

  function collisionDetectBallAndPaddle() {
    if (!isRectAOutsideRectB(ball, paddle)) {
      new Audio('/audio/paddleimpact.wav').play()
      ball.direction.y *= -1;
      ball.top = paddle.top - ball.height;
      score += 5;
      updateInterface();
    }

  }

  function collisionDetectBallAndBricks() {
    for (let i = bricks.length - 1; i >= 0; --i) {
      const brick = bricks[i];
      if (!isRectAOutsideRectB(ball, brick)) {
        new Audio('/audio/hitbrick.wav').play()
        if (getHorizontalOrVerticalDirection(brick, ball) == 'horizontal') {
          // If it bounced on the side of the brick
          ball.direction.x *= -1;
        } else {
          // If it bounced above/below a brick
          ball.direction.y *= -1;
        }
        brick.$.remove();
        bricks.splice(i, 1);
        score += 20;
        updateInterface();
      }
    }
    if (bricks.length == 0) {
      paused = true;
      updateInterface();
    }
  }

  // Assumes the properties: left, top, width, height
  function isRectAOutsideRectB(a, b) {
    if (a.left > b.left + b.width) return true; // to the right
    if (a.left + a.width < b.left) return true; // to the left
    if (a.top > b.top + b.height) return true; // below
    if (a.top + a.height < b.top) return true; // above
    return false;
  }

  // Does not work for rectangles, only squares
  function getHorizontalOrVerticalDirection(objA, objB) {
    //return 'vertical'; // Always return 'vertical' for non-square bricks
    // Todo: fix code for rectangle bricks
    const aY = objA.top + objA.height / 2;
    const aX = objA.left + objA.width / 2;
    const bY = objB.top + objB.height / 2;
    const bX = objB.left + objB.width / 2;
    const direction = Math.abs(Math.atan2(aY - bY, aX - bX));
    return (Math.abs(direction) < Math.PI / 4 || Math.abs(direction) > Math.PI / 4 * 3) ? 'horizontal' : 'vertical';
  }

  function updateInterface() {
    $('.score span').text((score + '').padStart(5, '0'));
    $('.lives span').text(lives);
    $('.main-text').hide();
    if (lives < 1) {
      $('.main-text').text('GAME OVER - PRESS ENTER TO PLAY AGAIN');
    } else if (!bricks.length) {
      $('.main-text').text('CONGRATULATIONS - YOU WON');
    } else if (paused) {
      $('.main-text').text('PAUSED - press ENTER to continue...');
    } else {
      $('.main-text').text('');
    }
    $('.main-text').fadeIn(500);
  }

  function onEnterPress() {
    if (keysPressed.enter) { return; }
    keysPressed.enter = true;

    if (lives > 0) {
      paused = !paused;
    } else {
      startNewGame();
    }

    updateInterface();
  }

  $(".arrowright").on('touchstart', function () {
    keysPressed.right = true;
  });

  $(".arrowright").on('touchend', function () {
    keysPressed.right = false;
  });

  $(".arrowleft").on('touchstart', function () {
    keysPressed.left = true;
  });

  $(".arrowleft").on('touchend', function () {
    keysPressed.left = false;
  });

  function setupKeyListeners() {
    $(window).keydown(function (e) {
      if (e.which === 37) { keysPressed.left = true; }
      if (e.which === 39) { keysPressed.right = true; }
      if (e.which === 13) { onEnterPress(); }

    });

    $(window).keyup(function (e) {
      if (e.which === 37) { keysPressed.left = false; }
      if (e.which === 39) { keysPressed.right = false; }
      if (e.which === 13) { keysPressed.enter = false; }
    });
  }

  function loadGameBorders() {
    return {
      left: 0,
      top: 0,
      width: $('.game').width(),
      height: $('.game').height()
    };
  }

  function resetPaddle() {
    paddle.$ = $('.paddle');
    paddle.speed = initialPaddleSpeed;
    paddle.top = paddle.$.position().top;
    paddle.left = paddle.$.position().left;
    paddle.width = paddle.$.width();
    paddle.height = paddle.$.height();
    paddle.$.css('left', (paddle.left = gameBorders.width / 2 - paddle.width / 2));
  }

  function resetBall() {
    ball.$ = $('.ball');


    //Ball responsive
    if (window.matchMedia("(min-width: 1200px)").matches) {
      ball.$.css('top', (ball.top = gameBorders.height - 70));
      ball.$.css('left', (ball.left = gameBorders.width / 2 - 15));
    } else if (window.matchMedia("(max-width: 1200px) and (min-width: 1000px)").matches) {
      ball.$.css('top', (ball.top = gameBorders.height - 70));
      ball.$.css('left', (ball.left = gameBorders.width / 2 - 15));
    } else if (window.matchMedia("(max-width: 999px) and (min-width: 660px)").matches) {
      ball.$.css('top', (ball.top = gameBorders.height - 70));
      ball.$.css('left', (ball.left = gameBorders.width / 2 - 15));
    } else if (window.matchMedia("(max-width: 659px)").matches) {
      ball.$.css('top', (ball.top = gameBorders.height - 70));
      ball.$.css('left', (ball.left = gameBorders.width / 2 - 15));
    }
    ball.speed = initialBallSpeed;

    ball.direction = { x: 1, y: 1 };

    ball.width = ball.$.width();
    ball.height = ball.$.height();
  }

  function spawnBricks() {
    const brickCSS = getBrickCSS('left', 'top', 'width', 'height');

 //Creating bricks
    const colors = [
      'url("images/red.png")',
      'url("images/red1.png")',
      'url("images/yellow.png")',
      'url("images/yellow1.png")',
      'url("images/red.png")',
      'url("images/red1.png")',
      'url("images/yellow.png")',
      'url("images/yellow1.png")',
      'url("images/red.png")',
      'url("images/red1.png")',
    ];

    let prevLeft = brickCSS.left;
    let size;

    //Bricks responsive
    if (window.matchMedia("(min-width: 1200px)").matches) {
      size = '90px 30px';
    }
    else if (window.matchMedia("(max-width: 1200px) and (min-width: 993px)").matches) {
      size = '72px 20px';
    }
    else if (window.matchMedia("(max-width: 992px) and (min-width: 660px) and (orientation: portrait)").matches) {
      size = '77px 15px';
    }
    else if (window.matchMedia("(max-width: 992px) and (min-width: 660px) and (orientation: landscape)").matches) {
      size = '64px 12px';
    }
    else if (window.matchMedia("(max-width: 659px)").matches) {
      size = '32.5px 8px';
    }

    for (let color of colors) {
      const brick = createBrick(prevLeft, brickCSS.top, brickCSS.width, brickCSS.height, color, size);

      bricks.push(brick);
      $('.game').append(brick.$);

      prevLeft += brickCSS.width * 1; // how close the bricks are
    }


    const colorsTwo = [
      'url("images/yellow.png")',
      'url("images/yellow1.png")',
      'url("images/red.png")',
      'url("images/red1.png")',
      'url("images/yellow.png")',
      'url("images/yellow1.png")',
      'url("images/red.png")',
      'url("images/red1.png")',
      'url("images/yellow.png")',
      'url("images/yellow1.png")',
    ];


    let prevTwo = brickCSS.top - 50;
    prevLeft = brickCSS.left;

    for (let color of colorsTwo) {
      const brick = createBrick(prevLeft, prevTwo, brickCSS.width, brickCSS.height, color, size);

      bricks.push(brick);
      $('.game').append(brick.$);

      prevLeft += brickCSS.width * 1; // how close the bricks are
    }



    const colorsThree = [
      'url("images/red.png")',
      'url("images/red1.png")',
      'url("images/yellow.png")',
      'url("images/yellow1.png")',
      'url("images/red.png")',
      'url("images/red1.png")',
      'url("images/yellow.png")',
      'url("images/yellow1.png")',
      'url("images/red.png")',
      'url("images/red1.png")',
    ];

    let prevThree = brickCSS.top - 100;
    prevLeft = brickCSS.left;


    for (let color of colorsThree) {
      const brick = createBrick(prevLeft, prevThree, brickCSS.width, brickCSS.height, color, size);

      bricks.push(brick);
      $('.game').append(brick.$);

      prevLeft += brickCSS.width * 1; // how close the bricks are
    }

    const colorsFour = [
      'url("images/red.png")',
      'url("images/red1.png")',
      'url("images/red.png")',
      'url("images/red1.png")',
      'url("images/red.png")',
      'url("images/red1.png")',
      'url("images/red.png")',
      'url("images/red1.png")',
      'url("images/red.png")',
      'url("images/red1.png")',


    ];

    let prevFour = brickCSS.top + 50;
    prevLeft = brickCSS.left;

    for (let color of colorsFour) {
      const brick = createBrick(prevLeft, prevFour, brickCSS.width, brickCSS.height, color, size);

      bricks.push(brick);
      $('.game').append(brick.$);

      prevLeft += brickCSS.width * 1; // how close the bricks are
    }


    const colorsFive = [
      'url("images/yellow.png")',
      'url("images/yellow1.png")',
      'url("images/yellow.png")',
      'url("images/yellow1.png")',
      'url("images/yellow.png")',
      'url("images/yellow1.png")',
      'url("images/yellow.png")',
      'url("images/yellow1.png")',
      'url("images/yellow.png")',
      'url("images/yellow1.png")'

    ];

    let prevFive = brickCSS.top + 100;
    prevLeft = brickCSS.left;

    for (let color of colorsFive) {
      const brick = createBrick(prevLeft, prevFive, brickCSS.width, brickCSS.height, color, size);

      bricks.push(brick);
      $('.game').append(brick.$);

      prevLeft += brickCSS.width * 1; // how close the bricks are
    }
  }


  function createBrick(left, top, width, height, backgroundImage, backgroundSize) {
    const brick = $('<div class="brick">').css({ backgroundImage, backgroundSize, left, top });
    return {
      $: brick,
      left,
      top,
      width,
      height,
      backgroundImage,  //adding that a brick is an image
      backgroundSize
    };
  }

  function getBrickCSS(...properties) {
    const tempBrick = $('<div class="brick">').appendTo('.game');
    const css = {}
    for (let prop of properties) {
      css[prop] = parseInt(tempBrick.css(prop));
    }
    tempBrick.remove();
    return css;
  }

  function startInterval() {
    const updateSpeed = 10; // lower = faster
    clearInterval(window.gameInterval);
    // Wait a short delay before starting to let the player prepare
    setTimeout(() => {
      let previousTime = performance.now() - updateSpeed;
      window.gameInterval = setInterval(() => {
        const now = performance.now();
        updateGame((now - previousTime) / 1000);
        previousTime = now;
      }, updateSpeed);
    }, 1000);
  }
}

