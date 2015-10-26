$(document).ready(theMain);

var total_width = 530;
var total_height = 530;

// Cell class
function Cell(){
	this.mine = 0; 
	this.flag = '';
	this.hidden = true;
	this.reveal = function(){
		// useless?
		this.hidden = false;
	}
	this.setMine = function(){
		this.mine = Math.random() < 0.8 ? 0 : 1; // true or false, use randomizer function 
		return this;
	}
	this.plantFlag = function(){
		// useless?
	}
}

// Main function
function theMain(){

	// get html elements, turn them into jQuery objects
	var $mineField = $('#mineField');
	var $resetButton = $('#resetButton');
	var	$rows;

	// get the index's of the clicked cell
	function getCoordinatesOf(clickedCell){
		var i = $rows.index(clickedCell.parent());
		var j = $rows.eq(i).find('.column').index(clickedCell);
		return [i,j];
	}

	// Reset button, make the :o face for 100ms
	$resetButton.makeOhFace = function(){
		this.addClass('ohFace');
		setTimeout(function(){
			this.removeClass();
			console.log(this);
		}.bind(this), 100);
	}

	// my minefield object!!!
	var mineField = {
		// 2D model array of a mineField. Each element is a Cell object 
		plot: [],
		// size of the plot/grid
		rows: 20,
		columns: 20,

		//// Methods here:

		resetGame: function(){
			this.renderCells();
			this.plantMines();
			this.plantNumbers();
			this.hideAllCells();
			$resetButton.removeClass();
		},

		// renders empty cells onto minefield
		renderCells: function(){
			$mineField.empty();

			// render my plot as well as the html minefield
			for (var i = 0; i < this.rows; i++){
				this.plot[i] = [];
				$mineField.append('<tr class="row"></div>');
				for (var j = 0; j < this.columns; j++){
					this.plot[i][j] = new Cell();
					this.plot[i][j].position = [i,j];
				}
			}
			for (var j = 0; j < this.columns; j++){
				$rows = $mineField.find('.row');
				$rows.append('<td class="column"></div>');
			};
			// set css styling for width and height of each cell
			$mineField.find('.column').css({
				'width': total_width/this.columns,
				'height': total_height/this.rows
			});
		},

		// plant mines across the minefield
		plantMines: function(){
			this.plot.forEach(function(eachRow, i){
				eachRow.forEach(function(eachCell, j){
					var $targetCell = $rows.eq(i).find('.column').eq(j);
					eachCell.setMine();
					if(eachCell.mine){
						$targetCell.removeClass('mine').addClass('mine');
					}
					else{
						$targetCell.removeClass('mine');
					}					
				});
			}); 
		},

		// plant numbers in each cell for the amount of nearby mines
		plantNumbers: function(){
			var myObj = this; 
			this.plot.forEach(function(eachRow, i){
				eachRow.forEach(function(eachCell, j){
		 			
		 			// positions of nearest mines

					var rowNext = i + 1 < myObj.rows? i + 1: i;
					var rowPrev = i - 1 >= 0 ? i - 1: i;
					var columnNext = j + 1 < myObj.columns? j + 1: j;
					var columnPrev = j - 1 >= 0? j - 1: j;
					
					// flaw !! Must check if cell exists. Then push its mine value to an accumulator

					// add up the number of mines
					var minesNearby =  
					myObj.plot[rowNext][j].mine + 
					myObj.plot[rowPrev][j].mine +
					myObj.plot[i][columnNext].mine +
					myObj.plot[i][columnPrev].mine +
					myObj.plot[rowPrev][columnPrev].mine +
					myObj.plot[rowPrev][columnNext].mine +
					myObj.plot[rowNext][columnPrev].mine +
					myObj.plot[rowNext][columnNext].mine;

					// update html minefield with numbers
					eachCell.minesNearby = minesNearby;
					$rows.eq(i).find('.column').eq(j).html(minesNearby);

					// hide each cell too
					// eachCell.hidden = true;
				});
			});
		},

		hideAllCells: function(){
			$mineField.find('.column').addClass('hidden');
		},

		// Sweep the field to reveal cells with the number 0
		sweepField: function($clickedCell){
			// NOT FINISHED YET
			// use Breadth-first search!!

			// algo:
			// set clicked cell's hidden = false, push that cell into queue array
			// go into that node, check neighbor cells for mine === 0 && hidden === true && minesNearby === 0 
			// set those hidden = false, push those cells into queue
			// go to next node in queue, check neigbors, set hiddens = false, push to queue... 
			// keep going until end of queue array

			var coordinates = getCoordinatesOf($clickedCell);
			var clickedCell = this.plot[coordinates[0]][coordinates[1]];
			
			// $clickedCell.removeClass('hidden');
			// clickedCell.reveal();

			var queue = [clickedCell];
			var lengthChange = 1;
			while (lengthChange !== 0){
				var oldLength = queue.length;
				for (var key in queue){
					// get neighbors
					var neighborMines = [];
					var rowNext = queue[key].position[0]+1 < this.rows? queue[key].position[0]+1: queue[key].position[0];
					var rowPrev = queue[key].position[0]-1 >= 0 ? queue[key].position[0]-1: queue[key].position[0];
					var columnNext = queue[key].position[1]+1 < this.columns? queue[key].position[1]+1: queue[key].position[1];
					var columnPrev = queue[key].position[1]-1 >= 0? queue[key].position[1]-1: queue[key].position[1];
					neighborMines.push(this.plot[rowNext][queue[key].position[1]]);
					neighborMines.push(this.plot[queue[key].position[0]][columnNext]);
					neighborMines.push(this.plot[rowPrev][queue[key].position[1]]);
					neighborMines.push(this.plot[queue[key].position[0]][columnPrev]);
					
					neighborMines.push(this.plot[rowNext][columnNext]);
					neighborMines.push(this.plot[rowPrev][columnNext]);
					neighborMines.push(this.plot[rowNext][columnPrev]);
					neighborMines.push(this.plot[rowPrev][columnPrev]);

					for (var i in neighborMines){
						var neighborCoordinates = neighborMines[i].position;
						if (neighborMines[i].mine === 0 && neighborMines[i].minesNearby === 0 && neighborMines[i].hidden === true){
							
							// reveal neighbor cell
							neighborMines[i].reveal();
							$rows.eq(neighborCoordinates[0]).find('.column').eq(neighborCoordinates[1]).html(0).removeClass('hidden');

							// reveal neighbor's neighbor cells
							var rowNext = neighborCoordinates[0]+1 < this.rows? neighborCoordinates[0]+1: neighborCoordinates[0];
							var rowPrev = neighborCoordinates[0]-1 >= 0 ? neighborCoordinates[0]-1: neighborCoordinates[0];
							var columnNext = neighborCoordinates[1]+1 < this.columns? neighborCoordinates[1]+1: neighborCoordinates[1];
							var columnPrev = neighborCoordinates[1]-1 >= 0? neighborCoordinates[1]-1: neighborCoordinates[1];

							var neighborsOfNeighbor = [];
							neighborsOfNeighbor.push(this.plot[rowNext][neighborCoordinates[1]]);
							neighborsOfNeighbor.push(this.plot[neighborCoordinates[0]][columnNext]);
							neighborsOfNeighbor.push(this.plot[rowPrev][neighborCoordinates[1]]);
							neighborsOfNeighbor.push(this.plot[neighborCoordinates[0]][columnPrev]);

							neighborsOfNeighbor.push(this.plot[rowPrev][columnPrev]);
							neighborsOfNeighbor.push(this.plot[rowPrev][columnNext]);
							neighborsOfNeighbor.push(this.plot[rowNext][columnPrev]);
							neighborsOfNeighbor.push(this.plot[rowNext][columnNext]);
							
							for (var j in neighborsOfNeighbor){
								if(neighborsOfNeighbor[j].minesNearby !== 0){
									neighborsOfNeighbor[j].reveal();
									$rows.eq(neighborsOfNeighbor[j].position[0]).find('.column').eq(neighborsOfNeighbor[j].position[1]).html(neighborsOfNeighbor[j].minesNearby).removeClass('hidden');
								}
							}


							queue.push(neighborMines[i]);
						}
						if(neighborMines[i].minesNearby !== 0){
							neighborMines[i].reveal();
							$rows.eq(neighborCoordinates[0]).find('.column').eq(neighborCoordinates[1]).html(neighborMines[i].minesNearby).removeClass('hidden');
						}
					}
				}

				// check length of queue to see if loop should be executed again
				lengthChange = queue.length - oldLength;
			}
			
			// NOT FINISHED YET
		},
		explode: function(){
			// what to do?
		}
	};

	// Start game
	mineField.resetGame();



	//// Event Listeners:

	// click to reveal cell
	$mineField.on('click', '.column', function(){

		var $this = $(this);

		//check if flag or dead or win or hidden
		if(!$this.hasClass('flag') && !$resetButton.hasClass('dead') && !$resetButton.hasClass('win') && $this.hasClass('hidden')){
			
			// get coordinates of clicked cell.  
			var coordinatesOfCell = getCoordinatesOf($this);
			var minesNearby = mineField.plot[coordinatesOfCell[0]][coordinatesOfCell[1]].minesNearby;
			
			// reveal cell
			$this.html(minesNearby).removeClass('hidden');
			mineField.plot[coordinatesOfCell[0]][coordinatesOfCell[1]].reveal();
			// if it's a mine, change smiley face to dead face
			if($this.hasClass('mine')){
				$resetButton.addClass('dead');
			}
			else{
				if(minesNearby === 0){
					mineField.sweepField($this);
				}
				$resetButton.makeOhFace();
			}
		}
	});

	// right click to set flag
	$mineField.on('mousedown', '.column', function(event){
		if(event.which === 3 && !$resetButton.hasClass('dead')){
			var $this = $(this);
			var coordinatesOfCell = getCoordinatesOf($this);
			var marks = ['', 'x', '?'];
			var currentCell = mineField.plot[coordinatesOfCell[0]][coordinatesOfCell[1]];
			var currentFlag = marks.indexOf(currentCell.flag);
			currentFlag++;
			if(currentFlag >= marks.length){
				currentFlag = 0;
			}
			currentCell.flag = marks[currentFlag];

			// next mark is nothing. remove flag and update html with mines number
			if(marks[currentFlag] === ''){
				var minesNearby = currentCell.minesNearby;
				$this.html(minesNearby);
				$this.removeClass('flag');
			}else if($this.hasClass('hidden')){
				$this.html(marks[currentFlag]);
				$this.addClass('flag');
			}
		}
	});

	// click reset button to reset game
	$resetButton.on('click', mineField.resetGame.bind(mineField));	
};
