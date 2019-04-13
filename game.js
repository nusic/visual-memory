var game;

function Game(boardContainerId, gameStatsContainerId){
	this.boardElement = document.getElementById("game-board");
	this.levelElement = document.getElementById("level");
	this.highscoreElement = document.getElementById("highscore");
	this.width = this.boardElement.clientWidth;
	this.selectedMap = {};
	this.highscore = +this.read('highscore') || 1;

	// const initLevel = 1;	
	const initLevel = +window.location.hash.substr(1) || +this.read('level') || 1;
	console.log(initLevel);
	this.newGame(initLevel);
}

Game.prototype.newGame = function(level) {
	console.log("Starting level " + level);
	this.store('level', level);
	window.location.hash = level;
	this.level = level;
	this.timeout = this.getTimeout();
	this.boardSize = this.getBoardSize();
	this.selectedMap = this.getSelectedMap();
	this.hintShowedAtGuess = -1;
	this.interactingAllowed = false;
	this.resetDOM();
};

Game.prototype.getSelectedMap = function() {
	var squares = [];
	const numSquares = this.boardSize * this.boardSize;
	for (var i = 0; i < numSquares; i++) {
		squares.push(i);
	}

	var selectedMap = {};
	const numSelectable = this.getNumSelectable();
	for (var i = 0; i < numSelectable; i++) {
		const selected = Math.floor(Math.random() * squares.length);
		selectedMap[squares[selected]] = true;
		squares.splice(selected, 1);
	}
	return selectedMap;
};

Game.prototype.resetDOM = function() {
	this.highscoreElement.innerHTML = this.highscore;
	this.levelElement.innerHTML = this.level;
	var e = this.boardElement;
	while (e.firstChild) {
		e.removeChild(e.firstChild);
	}
	const gridSpacing = 5; // bc this.boardElement.style.gridColumnGap does not work
	const cardSize = Math.floor(this.width / this.boardSize - gridSpacing);

	this.boardElement.style.gridTemplateColumns = "repeat("+ this.boardSize +", "+ cardSize + "px)";
	this.boardElement.style.gridTemplateRows = "repeat("+ this.boardSize +", "+ cardSize + "px)";

	var i = 0;
	for (var y = 0; y < this.boardSize; y++) {
		for (var x = 0; x < this.boardSize; x++) {
			var e = this.createSquare(i);
			this.boardElement.append(e);
			i++;
		}
	}

	setTimeout(() => {
		var cards = document.getElementsByClassName("card");

		for (var i = 0; i < cards.length; i++) {
			if (this.selectedMap[i]) {
				cards[i].classList.add("show-selected");
			}
		}
		
		setTimeout(() => {
			for (var i = 0; i < cards.length; i++) {
				cards[i].classList.remove("show-selected");
			}
			this.interactingAllowed = true;
		}, this.timeout);
	}, 1000);
};

Game.prototype.createSquare = function(i) {
	var e = document.createElement("div");
	// e.innerHTML = i+1;
	e.classList.add("card");
	e.addEventListener('click', event => {
		if (this.interactingAllowed) {
			if (this.selectedMap[i]) {
				e.classList.add("correct-guess");
			} else {
				e.classList.add("incorrect-guess");
			}
			this.restartIfGameEnd();
		}
	});
	return e;
};

Game.prototype.restartIfGameEnd = function() {
	const correctGuesses = document.getElementsByClassName("correct-guess");
	const incorrectGuesses = document.getElementsByClassName("incorrect-guess");
	const allSelected = correctGuesses.length >= this.getNumSelectable();
	const gameLost = incorrectGuesses.length >= 3;

	if (allSelected) {
		if (gameLost) {
			this.newGame(this.level - (incorrectGuesses.length - 3));
		}
		else {
			var cards = document.getElementsByClassName("card");
			if (this.highscore < this.level) {
				this.highscore = this.level + 1;
				this.store('highscore', this.highscore);
			}
			setTimeout(() => {
				this.newGame(this.level + 1);
			}, 100);
		}
		return;
	}


	if (gameLost && incorrectGuesses.length > this.hintShowedAtGuess) {
		this.hintShowedAtGuess = incorrectGuesses.length;
		var cards = document.getElementsByClassName("card");
		for (var i = 0; i < cards.length; i++) {
			if (this.selectedMap[i] && !cards[i].classList.contains("correct-guess")) {
				(function(card) {
					card.classList.add("show-correct");
					setTimeout(() => {
						card.classList.remove("show-correct");
					}, 100);
				})(cards[i]);
			}
		}
	}
};

Game.prototype.store = function(key, value) {
	window.localStorage.setItem('VisualMemory_' + key, value);
};

Game.prototype.read = function(key) {
	return window.localStorage.getItem('VisualMemory_' + key);
};

Game.prototype.getTimeout = function() {
	return 700 + this.level*175;
};

Game.prototype.getBoardSize = function() {
	return Math.floor((Math.sqrt(9 + (this.level * 3))));
};

Game.prototype.getNumSelectable = function() {
	return 2 + this.level;
};

game = new Game();