$(document).ready(theMain);

var total_width = 900;
var total_height = 480;

// MODEL
// Reset, Cell, Minefield

// Reset button Model
function Reset(){
	this.state = ''; // '', ohFace, dead, win
	this.changeResetButtonState = function(stateString){
		this.state = stateString;
	}
}
// Cell class
function Cell(rowCoord, columnCoord){
	this.contents = 0; // 0, 1, 2, 3, 4, 5, 6, 7, 8, x
	this.state = 'hidden'; // hidden, flag, question, revealed
	this.coordinates = [rowCoord, columnCoord];

	// methods

	// randomly places a mine (x) in a cell
	this.setMine = function(){
		this.contents = Math.random() < 0.87 ? 0 : 'x'; 
	}
	this.changeState = function(stateString){
		this.state = stateString;
	}
}

function Timer(){
	this.count = 0;
	this.counter;
	// start timer method
	this.startTimer = function(cbUpdate$Timer){
		this.count = 0;
		cbUpdate$Timer(this.count);
		var timerObj = this;
		this.counter = setInterval(function(){
			timerObj.count++;
			cbUpdate$Timer(timerObj.count);
		}, 1000);
	}

	this.stopTimer = function(){
		clearInterval(this.counter);
	}
}
function MineField(){
	//props
	this.plot = [];
	this.rows = 20;
	this.columns = 30;

	//methods

	// reset the playing field
	this.resetPlot = function(){
		this.createPlot();
		this.plantMines();
		this.plantNumbers();
	};

	// make my 2D plot of Cell objects
	this.createPlot = function(){
		for (var i = 0; i < this.rows; i++){
			this.plot[i] = [];
			for (var j = 0; j < this.columns; j++){
				this.plot[i][j] = new Cell(i,j);
			}
		}
	}

	// randomly plant mines across the minefield
	this.plantMines = function(){
		this.plot.forEach(function(eachRow){
			eachRow.forEach(function(eachCell){
				eachCell.setMine();
			});
		}); 
	}

	// get the neighbors of a specific cell, return an array
	this.getNeighbors = function(cell){
		var arrayOfNeighbors = [];
		var rowNext = cell.coordinates[0] + 1;
		var rowPrev = cell.coordinates[0] - 1;
		var columnNext = cell.coordinates[1] + 1;
		var columnPrev = cell.coordinates[1] - 1;
		// check if out of bounds
		if (rowNext >= 0 && rowNext < this.rows) arrayOfNeighbors.push(this.plot[rowNext][cell.coordinates[1]]);
		if (rowPrev >= 0 && rowPrev < this.rows) arrayOfNeighbors.push(this.plot[rowPrev][cell.coordinates[1]]);
		if (columnNext >= 0 && columnNext < this.columns) arrayOfNeighbors.push(this.plot[cell.coordinates[0]][columnNext]);
		if (columnPrev >= 0 && columnPrev < this.columns) arrayOfNeighbors.push(this.plot[cell.coordinates[0]][columnPrev]);
		if (rowPrev >= 0  && rowPrev < this.rows && columnPrev >= 0 && columnPrev < this.columns) arrayOfNeighbors.push(this.plot[rowPrev][columnPrev]);
		if (rowPrev >= 0  && rowPrev < this.rows && columnNext >= 0 && columnNext < this.columns) arrayOfNeighbors.push(this.plot[rowPrev][columnNext]);
		if (rowNext >= 0  && rowNext < this.rows && columnPrev >= 0 && columnPrev < this.columns) arrayOfNeighbors.push(this.plot[rowNext][columnPrev]);
		if (rowNext >= 0  && rowNext < this.rows && columnNext >= 0 && columnNext < this.columns) arrayOfNeighbors.push(this.plot[rowNext][columnNext]);
		return arrayOfNeighbors;
	}

	// plant numbers in each cell for the amount of nearby mines
	this.plantNumbers = function(){
		var myFieldObj = this; 
		this.plot.forEach(function(eachRow){
			eachRow.forEach(function(eachCell){
				// check if current cell is not a mine in order to put number into its contents
				if(eachCell.contents !== 'x'){
		 			// add up the number of mines surrounding the cell
					var neighborsOfEachCell = myFieldObj.getNeighbors(eachCell);
					var minesNearby = 0;
					for (var key in neighborsOfEachCell){

						if (neighborsOfEachCell[key].contents === 'x'){
							minesNearby++;
						}
					}
					// update cell contents with the number of mines nearby
					eachCell.contents = minesNearby;
				}
			});
		});
	}

	// Model minefield's method to handle left click event
	this.leftClickCell = function(cell, resetButton, cbUpdate$CellState, cbUpdate$CellContents, cbUpdate$ResetButtonState, cbStopTimer){
		if(cell.state === 'hidden' && resetButton.state !== 'dead' && resetButton.state !== 'win'){
			// if it's a mine, make reset button 'dead'
			if(cell.contents === 'x'){
				cell.changeState('revealed');
				resetButton.state = 'dead';
				for(var i in this.plot){
					for (var j in this.plot[i]){
						if(this.plot[i][j].contents === 'x'){
							this.plot[i][j].changeState('revealed');
							cbUpdate$CellState(this.plot[i][j]);
							cbUpdate$CellContents(this.plot[i][j]);
						}
					}
				}
			}else if(cell.contents === 0){
				// sweep if 0
				this.sweepField(cell, cbUpdate$CellState, cbUpdate$CellContents);
			}else{
				// reveal if neither x nor 0
				cell.changeState('revealed');
				cbUpdate$CellState(cell);
				cbUpdate$CellContents(cell);
			}
			// check all cells to determine if game has been won
			if (resetButton.state !== 'dead'){
				var checkIfWon = function(){
					for(var i in this.plot){
						for (var j in this.plot[i]){
							// must reveal all non-mines in order to win
							if(this.plot[i][j].state !== 'revealed' && this.plot[i][j].contents !== 'x'){
								return false;
							}
						}
					}
					return true;
				}
				var won = checkIfWon.call(this);
				if(won){
					resetButton.state = 'win';
				}
			}

			// update timer (stop if dead or win)
			if (resetButton.state === 'dead' || resetButton.state === 'win'){
				cbStopTimer();
			}

			// update reset button display after all cells have been rendered
			cbUpdate$ResetButtonState(resetButton.state);
		}
	}
	// Sweep algorithm for clearing cells with '0' 
	this.sweepField = function(cell, cbUpdate$CellState, cbUpdate$CellContents){
		// algo: Breadth-first search 
		// push clicked cell into queue array, reveal it
		// get all neighbors into neighborArray with contents !== x && state === hidden
		// push only those neighbors with contents === 0 into queue
		// reveal current node cell as well as all neighbors in neighborArray 
		// go to next node in queue
		// ... until end of queue
		var queueOfCells = [cell];
		for (var i = 0; i < queueOfCells.length; i++){
			// get all neighbors into neighborArray with contents !== x && state === hidden
			var neighbors = this.getNeighbors(queueOfCells[i]);
			for (var index = neighbors.length - 1; index >= 0; index--){
				if (!(neighbors[index].state === 'hidden' && neighbors[index].contents !== 'x')){ 
					neighbors.splice(index, 1);
				}
			}
			// push only neighbors with contents === 0 && state === hidden into queue
			// reveal all neighbors in neighborArray 
			for (var index in neighbors){
				if(neighbors[index].contents === 0){
					queueOfCells.push(neighbors[index]);
				}
				neighbors[index].changeState('revealed');
				cbUpdate$CellState(neighbors[index]);
				cbUpdate$CellContents(neighbors[index]);
			}
			queueOfCells[i].changeState('revealed');
			cbUpdate$CellState(queueOfCells[i]);
			cbUpdate$CellContents(queueOfCells[i]);
		}
	}
	// Model minefield's method to handle right click event
	this.rightClickCell = function(cell, resetButton, cbUpdate$CellState, cbUpdate$CellContents){
		console.log(cell.state + ' ' + cell.contents);
		if(resetButton.state !== 'dead' && resetButton.state !== 'win' && cell.state !== 'revealed'){
			switch(cell.state){
				case 'hidden': 
					cell.state = 'flag';
					break;
				case 'flag':
					cell.state = 'question';
					break;
				case 'question':
					cell.state = 'hidden';
					break;
				default:
			}
			cbUpdate$CellState(cell);
			cbUpdate$CellContents(cell);
		}
	}
}

// VIEW
function View(mineFieldString, resetButtonString, timerString){
	// get jQuery objects from elements selected from the document
	this.$mineField = $(mineFieldString);
	this.$resetButton = $(resetButtonString);
	this.$timer = $(timerString);

	// methods for updating display
	this.update$CellState = function(cell){
		var $cell = this.getElementByCoordinates(cell.coordinates);
		$cell.removeClass().addClass('column' + ' ' + cell.state);
	}
	this.update$CellContents = function(cell){
		var $cell = this.getElementByCoordinates(cell.coordinates);
		switch(cell.state){
			case 'flag':
				$cell.html('!');
				break;
			case 'question':
				$cell.html('?');
				break;
			case 'hidden':
				$cell.html('');
				break;
			default:
				$cell.html(cell.contents);
				if($cell.html() === 'x'){
					$cell.addClass('mine');
				}
		}
	}

	// get an element using given coordinates
	this.getElementByCoordinates = function(coord){
		return this.$mineField.find('.row').eq(coord[0]).find('.column').eq(coord[1]);
	}

	// get the coordinates of an element (e.g. a clicked cell)
	this.getCoordinatesOfElement = function($cell){
		var i = this.$mineField.find('.row').index($cell.parent());
		var j = this.$mineField.find('.row').eq(i).find('.column').index($cell);
		return [i,j];
	}

	// display the playing field
	this.renderPlot = function(rows, columns){
		this.$mineField.empty();
		for (var i = 0; i < rows; i++){
			// append row
			this.$mineField.append('<tr class="row"></tr>');

			// append columns to current row 
			var $currentRow = this.$mineField.find('.row').filter(':last');
			for (var j = 0; j < columns; j++){
				$currentRow.append('<td class="column hidden"></td>');
			}
		}
		var $columns = this.$mineField.find('.column');

		// size the field
		$columns.css({
			'width': total_width/columns,
			'height': total_height/rows,
			'font-size':0.034*(total_width/columns) + 'vw'
		});
	}

	this.update$ResetButtonState = function(className){
		this.$resetButton.removeClass().addClass('ohFace');
		var myViewObj = this;
		setTimeout(function(){
			myViewObj.$resetButton.removeClass().addClass(className);
		}, 100);
	}
	this.update$Timer = function(currentCount){
		this.$timer.html(currentCount);
	}
}

// // a controller is where the model and the view are used together.
function Controller(mineField, resetButton, timer, view){

	// model objects:
	this.mineField = mineField;
	this.resetButton = resetButton;
	this.timer = timer;
	// view object:
	this.view = view;

	this.clickReset = function(){
		// model
		this.mineField.resetPlot();
		this.resetButton.changeResetButtonState('');
		// view 
		this.view.renderPlot(this.mineField.rows, this.mineField.columns);
		this.view.update$ResetButtonState('');

		// timer: model and view
		this.timer.stopTimer();
		var cb = this.view.update$Timer.bind(this.view);
		this.timer.startTimer(cb);
	}

	this.leftClickCell = function($clickedCell){
		// get model of clicked cell
		var coord = this.view.getCoordinatesOfElement($clickedCell);
		var clickedCell = this.mineField.plot[coord[0]][coord[1]];

		// model's left click function
		// view's callbacks passed into model in order to display model changes
		var cb1 = this.view.update$CellState.bind(this.view);
		var cb2 = this.view.update$CellContents.bind(this.view);
		var cb3 = this.view.update$ResetButtonState.bind(this.view);
		var cb4 = this.timer.stopTimer.bind(this.timer);
		this.mineField.leftClickCell(clickedCell, this.resetButton, cb1, cb2, cb3, cb4);

	}
	this.rightClickCell = function($clickedCell){
		// get model of clicked cell
		var coord = this.view.getCoordinatesOfElement($clickedCell);
		var clickedCell = this.mineField.plot[coord[0]][coord[1]];

		// model's right click function
		// view's callbacks passed into model in order to display model changes
		var cb1 = this.view.update$CellState.bind(this.view);
		var cb2 = this.view.update$CellContents.bind(this.view);
		this.mineField.rightClickCell(clickedCell, this.resetButton, cb1, cb2);
	}
}

// Main game
function theMain(){
	// Initialize objects
	var myMineField = new MineField();
	var myResetButton = new Reset();
	var myTimer = new Timer();
	var myDisplay = new View('#mineField', '#resetButton', '#timer');
	var myController = new Controller(myMineField, myResetButton, myTimer, myDisplay);
	// prompt player for size of minefield
	var getRowsFromPlayer = prompt('How many rows do you want the field to have?', 20);
	var getColumnsFromPlayer = prompt('How many columns do you want the field to have?', 30);
	myMineField.rows = parseInt(getRowsFromPlayer);
	myMineField.columns = parseInt(getColumnsFromPlayer);
	// Start game!
	myController.clickReset();

	//// Event Listeners:

	// left click cell 
	myDisplay.$mineField.on('click', '.column', function(){
		var $this = $(this);
		myController.leftClickCell.call(myController, $this);
	});

	// right click cell
	myDisplay.$mineField.on('mousedown', '.column', function(event){
		// check if event is a right click
		if(event.which === 3){
			var $this = $(this);
			myController.rightClickCell.call(myController, $this);
		}
	});

	// click reset button to reset game
	myDisplay.$resetButton.on('click', myController.clickReset.bind(myController));
}
