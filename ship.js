const ships = (length, pos, direction) => {
  //direction: 0 is horizontal, 1 is vertical
  //position is the most SW point on the ship
  const size = length;
  const fullBody = (pos, length, direction) => {
    let positionArr = [];
    if (direction === 1) {
      //x and y are mixed up here, lets just reverse it for now
      for (let j = 0; j < length; j++) {
        let a = j + pos[0];
        positionArr.push({ x: a, y: pos[1] });
      }
    } else {
      for (let y = 0; y < length; y++) {
        let b = y + pos[1];
        positionArr.push({ x: pos[0], y: b });
      }
    }
    return positionArr;
  };

  const body = fullBody(pos, length, direction);
  let hits = 0;
  let sunk = false;

  const hit = () => {
    hits++;
    return isSunk();
  };

  const isSunk = () => {
    if (hits === length) {
      sunk = true;
      return 2;
    } else {
      return 1;
    }
  };

  return { body, hit, size, direction, pos };
};

const gameBoard = (() => {
  function initBoard() {
    let board = [];
    for (let j = 0; j < 10; j++) {
      let row = [];
      for (let k = 0; k < 10; k++) {
        row.push(-1);
      }
      board.push(row);
    }
    return board;
  }

  let p1Board = initBoard();
  let cpuBoard = initBoard();
  let p1Used = [];
  let cpuUsed = [];
  let p1Pieces = [];
  let cpuPieces = [];

  function randStart() {
    return [
      Math.floor(Math.random() * 10),
      Math.floor(Math.random() * 10),
      Math.floor(Math.random() * 2),
    ];
  }

  function checker(position, board) {
    const a = position[0];
    const b = position[1];
    return a < 10 && b < 10 && board[a][b] === -1;
  }

  function checkWhole(start, direction, length, board) {
    let x = 1;
    let arr = [start];
    while (x < length) {
      let a = direction === 0 ? start[0] : start[0] + x;
      let b = direction === 0 ? start[1] + x : start[1];
      arr.push([a, b]);
      x++;
    }
    if (arr.every((pos) => checker(pos, board))) {
      return arr;
    } else {
      return null;
    }
  }

  function placement(length, board) {
    let used = board === p1Board ? p1Used : cpuUsed;
    const pieceArr = board === p1Board ? p1Pieces : cpuPieces;
    let start = randStart().slice(0, 2);
    let direction = randStart().slice(2).shift();
    let end = checkWhole(start, direction, length, board);

    if (end !== null) {
      const ship = ships(length, start, direction);
      //used.push(start);
      //end.length === 1 ? used.push(end) : used = used.concat(end);
      //doing used = used.concat is reassigning used instead of changing the orig array
      for (const pos of end) {
        used.push(pos);
      }
      pieceArr.push(ship);
      //addToBoard(start, direction, length, board);
      addToBoard(ship, board)
    } else {
      placement(length, board);
    }
  }

  // function addToBoard(start, direction, length, board) {
  //   let pieceArr = board === p1Board ? p1Pieces : cpuPieces;
  //   const index = pieceArr.length - 1;
  //   for (let x = 0; x < length; x++) {
  //     let a = direction === 1 ? start[0] : start[0] + x;
  //     let b = direction === 1 ? start[1] + x : start[1];
  //     board[a][b] = index;
  //   }
  // }

  function addToBoard(ship, board) {
    const index = board === p1Board ? p1Pieces.length - 1 : cpuPieces.length - 1
    for (const pos of ship.body) {
      board[pos.x][pos.y] = index
    }
  }


  const pieces = (player) => {
    //player === 0 is p1
    const board = player === 0 ? p1Board : cpuBoard;
    let sizes = [4, 1, 1, 1, 2, 2, 2, 3, 3, 1];

    for (const size of sizes) {
      placement(size, board);
    }
    console.log(board);
  };

  const attack = (x, y, target) => {
    const board = target === "p1" ? p1Board : cpuBoard;
    const pieceArr = target === "p1" ? p1Pieces : cpuPieces;

    if (board[x][y] > -1) {
      const index = board[x][y];
      return pieceArr[index].hit();
    } else {
      return false;
    }
  };

  function movePiece(x, y) {
    const index = p1Board[x][y];

    if (index === -1) {
      return;
    } else {
      let tmp = [...p1Pieces];
      removePiece(index);
      return tmp[index];
    }
  }

  function removePiece(index) {
    const body = p1Pieces[index].body;

    for (const pos of body) {
      p1Board[pos.x][pos.y] = -1;
    }

    p1Pieces[index] = null;
  }

  function checkPlacement(start, direction, length) {
    return checkWhole(start, direction, length, p1Board);
  }

  function replace(start, length, direction) {
    const index = p1Pieces.findIndex((e) => e === null);
    p1Pieces[index] = ships(length, start, direction);
    const body = p1Pieces[index].body;
    for (pos of body) {
      p1Board[pos.x][pos.y] = index;
    }
    return body;
  }

  return {
    pieces,
    attack,
    p1Board,
    movePiece,
    removePiece,
    replace,
    checkPlacement,
  };
})();

gameBoard.pieces(0);
gameBoard.pieces(1);

const htmlControl = (() => {
  const main = document.getElementById("main");

  let turn = 0;
  let cpuQueue = [];
  let cpuHits = 0;
  let cpuLast = [];
  let movable = true;
  let moveDirection = null;
  let moveSize = null;

  function getIndex(element) {
    let tester = element;
    let x = 0;
    while (tester.previousSibling) {
      tester = tester.previousSibling;
      x++;
    }

    return x;
  }

  const hitControl = (e) => {
    if (
      turn === 1 ||
      e.target.className === "missed" ||
      e.target.className === "hit" || !movable
    ) {
      return;
    }
    movable = false;
    turn = 1;
    const y = getIndex(e.target);
    const x = getIndex(e.currentTarget);
    const result = gameBoard.attack(x, y, "cpu");

    if (!result) {
      colorChange(x, y, 0, 0);
    } else {
      colorChange(x, y, result, 0);
    }
    //add msg, change class

    cpuTurn();
    turn = 0;
  };

  const genBoard = (player) => {
    const board = document.createElement("div");
    let arr = [];
    for (let x = 0; x < 10; x++) {
      let rowArr = [];
      const row = document.createElement("div");
      row.setAttribute("class", "row");
      for (let y = 0; y < 10; y++) {
        const col = document.createElement("div");
        col.className = player === "p1" ? "show" : "hide";
        rowArr.push(col);
        //col.setAttribute("class", y);
        row.appendChild(col);
      }
      arr.push(rowArr);

      if (player === "cpu") {
        row.addEventListener("click", hitControl);
      }

      if (player === "p1") {
        row.addEventListener("click", movement, {once: true});
      }
      board.appendChild(row);
    }
    board.className = "gameboard";
    main.appendChild(board);
    //let's make this return an array of references to the divs
    return arr;
  };

  const p1Grid = genBoard("p1");
  const cpuGrid = genBoard("cpu");

  function followMouse(e) {
    const follower = document.getElementById('followerDiv')
    log(e.pageX, e.pageY)
    follower.style.left = `calc(${e.pageX}px - 2vw)`;
    follower.style.top = `calc(${e.pageY}px + 2vh)`;
  }

  function toggleDir(e) {
    if (e.keyCode !== 32) {
      return
    }
    const followers = document.getElementById("followerDiv");
    if (moveDirection === 0) {
      moveDirection = 1;
      followers.style.gridTemplateColumns = "1fr";
      followers.style.gridTemplateRows = `repeat(${moveSize},  1fr)`;
    } else {
      moveDirection = 0;
      followers.style.gridTemplateColumns = `repeat(${moveSize},  1fr)`;
      followers.style.gridTemplateRows = `1fr`;
    }
  }

  //for testing
  function log(x, y) {
    const el = document.getElementById('coord')
    el.textContent = `x = ${x}, y = ${y}`
  }

  function removeListeners() {
    for (const row of p1Grid) {
        row[0].parentElement.removeEventListener("click", placePiece);
      
    }
    document.removeEventListener("keydown", toggleDir);
    document.getElementById('followerDiv').removeEventListener("mousemove", followMouse)
    document.getElementById("followerDiv").remove();
  }

  function movement(e) {
    if (e.target.className !== "ship" || !movable) {
      return;
    }

    const y = getIndex(e.target);
    const x = getIndex(e.currentTarget);

    const clickedPiece = gameBoard.movePiece(x, y);
    const size = clickedPiece.size;
    moveSize = size;
    const direction = clickedPiece.direction;
    moveDirection = direction;
    let iter = direction === 0 ? clickedPiece.pos[1] : clickedPiece.pos[0];
    let constant = direction === 0 ? clickedPiece.pos[0] : clickedPiece.pos[1];
    const followers = document.createElement("div");
    const playerBoard = document.querySelector("div.gameboard");
    followers.setAttribute("id", "followerDiv");
    //playerBoard.appendChild(followers);
    let gridRows = direction === 0 ? `1fr` : `repeat(${size}, 1fr)`;
    let gridCols = direction === 1 ? `1fr` : `repeat(${size}, 1fr)`;
    followers.style.gridTemplateColumns = gridCols
    followers.style.gridTemplateRows = gridRows
    followers.style.left = `calc(${e.clientX}px - 2vw)`
    followers.style.top = `calc(${e.clientY}px + 2vh)`
    log(e.clientX, e.clientY)

    for (let a = 0; a < size; a++) {
      let target =
        direction === 0
          ? p1Grid[constant][a + iter]
          : p1Grid[a + iter][constant];
      target.className = "show";
      const div = document.createElement("div");
      div.className = `moving`;
      followers.appendChild(div);
    }
    playerBoard.appendChild(followers);
    playerBoard.addEventListener("mousemove", followMouse);

    for (const row of p1Grid) {
        row[0].parentElement.addEventListener("click", placePiece);
    }

    document.addEventListener("keydown", toggleDir);
    movable = false;
  }

  function placePiece(e) {
    let start = e.target;

    if (start.className === "ship" || movable) {
      //handle error
      return;
    }
    const y = getIndex(start);
    const x = getIndex(start.parentElement);

    if (gameBoard.checkPlacement) {
      removeListeners();
      const body = gameBoard.replace([x, y], moveSize, moveDirection);
      for (pos of body) {
        p1Grid[pos.x][pos.y].className = "ship";
      }
    }
    movable = true;
    return
  }

  (function colorShips() {
    const board = gameBoard.p1Board;

    function color(x, y) {
      //let row = document.getElementById(x);
      let row = p1Grid[x];
      //let target = row.getElementsByClassName(y)[0];
      let target = row[y];

      target.className = "ship";
    }

    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
        if (board[x][y] !== -1) {
          color(x, y);
        }
      }
    }
  })();

  const cpuTurn = () => {
    if (cpuHits === 0) {
      cpuRand();
    } else {
      cpuStrat();
    }
  };

  const checkQueue = (x, y) => {
    for (const pos of cpuLast) {
      if (pos[0] === x && pos[1] === y) {
        return true;
      }
    }
  };

  const cpuRand = () => {
    const x = Math.floor(Math.random() * 10);
    const y = Math.floor(Math.random() * 10);
    //this won't work for nested array? use another fxn with arr.find(el => el[0] === x)
    if (checkQueue(x, y)) {
      return cpuRand();
    }

    const result = gameBoard.attack(x, y, "p1");
    //add hits to the front, add misses to the back
    if (result !== false) {
      colorChange(x, y, result, 1);
      cpuHits += 1;
      cpuLast.unshift([x, y]);

      if (result === 2) {
        cpuHits = 0;
        return;
      }

      //target surrounding area for next few turns
      const addToQueue = [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
      ];
      //shuffle algo
      for (let x = 3; x > 0; x--) {
        const swap = Math.floor(Math.random() * (x + 1));
        const tmp = addToQueue[x];
        addToQueue[x] = addToQueue[swap];
        addToQueue[swap] = tmp;
      }
      cpuQueue = addToQueue;
    } else {
      colorChange(x, y, 0, 1);
      cpuLast.push([x, y]);
    }
  };

  const cpuStrat = () => {
    if (cpuHits < 2) {
      const pos = cpuQueue.shift();
      const result = gameBoard.attack(pos[0], pos[1], "p1");

      if (result !== false) {
        result === 2 ? (cpuHits = 0) : cpuHits++;
        colorChange(pos[0], pos[1], result, 1);
        cpuLast.unshift(pos);
      } else {
        colorChange(pos[0], pos[1], 0, 1);
        cpuLast.push(pos);
        if (cpuQueue.length === 0) {
          cpuHits = 0;
        }
      }
    } else {
      //For 2 hits in a row, keep attacking horizontal or vertical
      //depending on the last two hits, by checking cpuLast
      cpuQueue = [];
      const a = cpuLast[0];
      const b = cpuLast[1];
      let x, y;

      if (a[0] - b[0] === 0) {
        x = a[0];
      } else {
        x = a[0] - b[0] === 1 ? a[0] + 1 : b[0] - 1;
      }

      if (a[1] - b[1] === 0) {
        y = a[1];
      } else {
        y = a[1] - b[1] === 1 ? a[1] + 1 : b[1] - 1;
      }

      const result = gameBoard.attack(x, y, "p1");

      if (result !== false) {
        colorChange(x, y, result, 1);
        cpuLast.unshift([x, y]);
        result === 2 ? (cpuHits = 0) : (cpuHits = 2);
      } else {
        cpuLast.push([x, y]);
        colorChange(x, y, 0, 1);
        cpuHits = 0;
      }
    }
  };

  const colorChange = (x, y, hit, player) => {
    //hit === 0 is a miss, 1 is a hit, 2 is sink
    //player === 0 is p1

    const board = player === 0 ? cpuGrid : p1Grid;
    //const row = document.getElementById(x);
    const row = board[x];
    const outputUl = document.getElementById("events");
    //const target = row.getElementsByClassName(y)[0];
    const target = row[y];

    target.className = hit === 0 ? "miss" : "hit";
    let text = hit === 0 ? "miss" : "hit";
    const playerText = player === 0 ? "Player 1" : "CPU";

    const newEntry = document.createElement("li");
    newEntry.textContent = `${playerText} : That's a ${text} on row ${x}, column ${y}!`;

    //Add li to top of ul
    if (outputUl.firstChild) {
      outputUl.insertBefore(newEntry, outputUl.firstChild);
    } else {
      outputUl.appendChild(newEntry);
    }

    if (hit === 2) {
      let play = player === 0 ? "You" : "Your opponent";
      let target = player === 0 ? "your opponent's" : "your";
      const sunk = document.createElement("li");
      sunk.textContent = `${play} sunk ${target} battleship!`;
      outputUl.insertBefore(sunk, outputUl.firstChild);
    }
  };
})();
