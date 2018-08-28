const WALLS_WIDTH = 64
const BLOCK = 16
const VELOCITY = 6
const DECELERATION = 0.1
const BIG_PLATFORM = 100
const NEW_LEVEL = 100

var loaded;
let imageGoblin = new Image();
imageGoblin.src = '../src/img/goblin.png';
let imageFire = new Image();
imageFire.src = '../src/img/fire.png';
let imageWater = new Image();
imageWater.src = '../src/img/water.png';
let imageEarth = new Image();
imageEarth.src = '../src/img/earth.png';
let imageDeath = new Image();
imageDeath.src = '../src/img/death.png';
let imageLife = new Image();
imageLife.src = '../src/img/life.png';
let imageDragon = new Image();
imageDragon.src = '../src/img/dragon.png';
imageFire.onload = function () {
	loaded = true;
}

let gameScene = 0 // 0 - menu, 1 - game
let sprites = [];
let score = 0;
let topScore = 0;
let highestScore = -10; // base is 0
let tilt = true;
let spriteSheet;
let player;
let levels = [
	{
		'splinter': 'Fire',
		'color': 'indianred',
		'background': '#752424',
		'land': 'The Burning Lands',
		'block': imageFire,
	},
	{
		'splinter': 'Water',
		'color': 'royalblue',
		'background': '#11286e',
		'land': 'AZMARE Islands',
		'block': imageWater,
	},
	{
		'splinter': 'Earth',
		'color': 'seagreen',
		'background': '#20603b',
		'land': 'ANUMUN',
		'block': imageEarth,
	},
	{
		'splinter': 'Death',
		'color': 'mediumpurple',
		'background': '#3d1f7a',
		'land': 'MorTis',
		'block': imageDeath,
	},
	{
		'splinter': 'Life',
		'color': 'navajowhite',
		'background': '#ffebcc',
		'land': 'Khymeria',
		'block': imageLife,
	},
	{
		'splinter': 'Dragon',
		'color': '#806c00',
		'background': 'gold',
		'land': 'Draykh-Nahka',
		'block': imageDragon
	},
]
let level = 0

kontra.init();

function createWall(side='left', open=false){
	let wall = kontra.sprite({
		width: kontra.canvas.width / 2,
		height: kontra.canvas.height,
		x: side == 'left' ? 0 : kontra.canvas.width / 2,
		y: 0,
		color: levels[level]['color'],
		type: 'wall',
		side: side,
		open: function(){
			if (this.side == 'left'){
				this.dx = -1;
				this.ddx = -0.1;
			}
			else {
				this.dx = 1;
				this.ddx = 0.1;
			}
		},
		close: function(){
			if (this.side == 'left'){
				this.dx = 1;
				this.ddx = 0.1;
			}
			else {
				this.dx = -1;
				this.ddx = -0.1;
			}
		},
		generateBricks(){
			let offset = 16;
			let offsetTwo = this.side == 'left' ? 0 : 0;
			this.context.lineWidth = 2;
			for (let j = 0; j < this.height; j){
				for (let i = 0; i < this.width; i){
					let start = i;
					let width = 32 - (i == 0 ? offset : 0);
					if (i + width > this.width){
						width = this.width - i - 3;
						i += 3;
					}
					i += width;
					this.context.strokeStyle = '#4d4d4d';
					this.context.strokeRect(
						this.x + start - offsetTwo, this.y + j,
						width, 16);
					this.context.strokeStyle = 'dimgrey';
					this.context.strokeRect(
						this.x + start - offsetTwo + 2, this.y + j + 2,
						width, 16);
				}
				offset = offset == 16 ? 0 : 16;
				if (this.side == 'left'){
					offsetTwo = offsetTwo == 3 ? 0 : 3;
				}
				j += 16;
			}
		},
		render(){
			this.draw();
			this.generateBricks();
		},
		update(){
			if (this.dx != 0){
				if (this.side == 'left'){
					if (this.x < WALLS_WIDTH - kontra.canvas.width / 2){
						this.x = WALLS_WIDTH - kontra.canvas.width / 2;
						this.dx = 0;
						this.ddx = 0;
					}
					else if (this.x > 0){
						this.x = 0;
						this.dx = 0;
						this.ddx = 0;
					}
				}
				else {
					if (this.x > kontra.canvas.width - WALLS_WIDTH){
						this.x = kontra.canvas.width - WALLS_WIDTH;
						this.dx = 0;
						this.ddx = 0;
					}
					else if (this.x < kontra.canvas.width / 2){
						this.x = kontra.canvas.width / 2;
						this.dx = 0;
						this.ddx = 0;
					}
				}
			}
			this.advance();
		}
	});
	if (open){
		if (side == 'left'){
			wall.x = WALLS_WIDTH - kontra.canvas.width / 2;
		} else {
			wall.x = kontra.canvas.width - WALLS_WIDTH;
		}
	}
	let previousWall = sprites.find(sprite => 
		sprite.type === 'wall' && 
		sprite.side == wall.side && 
		sprite.y < 240);
	if (previousWall)
	{
		wall.y = previousWall.y - 240;
	}
	sprites.push(wall);
	return wall;
}

function createPlatform(y=192, fullWidth=false){
	highestScore += 10;
	if (isNewLevel())
	{
		level += 1;
		if (level > levels.length - 1){
			level = 0;
		}
	}
	let width = fullWidth ? 192 : Math.floor((Math.random() * 3) + 2) * BLOCK;
	let platform = kontra.sprite({
		width: highestScore % BIG_PLATFORM == 0 
			? kontra.canvas.width - 2 * WALLS_WIDTH 
			: width,
		height: BLOCK,
		x: highestScore % BIG_PLATFORM == 0 
			? WALLS_WIDTH
			: WALLS_WIDTH + Math.floor(
				Math.random() * (kontra.canvas.width - width - 2 * WALLS_WIDTH)),
		y: y,
		block: levels[level]['block'],
		type: 'platform',
		highestScore: highestScore,
		render(){
			for (let i = 0; i < this.width; i += BLOCK){
				this.context.drawImage(this.block, this.x + i, this.y);
			}
			if (gameScene == 1 && 
				this.highestScore % BIG_PLATFORM == 0 &&
				this.highestScore != 0)
			{
				TCTX.clearRect(this.x, this.y - 12, this.width, this.height + 20);
				drawTextShadowed(this.highestScore.toString(), 0.4, 'orange', {
					x: this.x + this.width / 2 - 2 - (2 * highestScore.toString().length),
					y: this.y + 2,
				})
			}
		}
	});
	sprites.push(platform);
}

function createScene(){
	for (let i = kontra.canvas.height - BLOCK; i > -2 * BLOCK; i -= BLOCK * 2){
		if (!sprites.find(sprite => 
			sprite.type === 'platform' && 
			sprite.y < i + BLOCK * 2))
		{
			sprite = sprites.find(
				sprite => sprite.highestScore == highestScore);
			createPlatform(sprite.y - 32);
			
			if (isNewLevel())
			{
				let y = sprite.y - 240 - 16;
				createBackground(y);
				createWall('left', true).y = y;
				createWall('right', true).y = y;
			}
		}
	}
}

function createWalls(){
	if (!sprites.find(sprite => 
		sprite.type === 'wall'))
	{
		createWall('left');
		createWall('right');
	} else if (!sprites.find(sprite => 
		sprite.type === 'wall' && 
		sprite.y <= 0))
	{
		createWall('left', true);
		createWall('right', true);
	}
}

function createBackground(y=0){
	let background = kontra.sprite({
		width: kontra.canvas.width - 2 * WALLS_WIDTH,
		height: kontra.canvas.height,
		x: WALLS_WIDTH,
		y: y,
		color: levels[level]['background'],
		type: 'background'
	});
	sprites.push(background);
}

function isNewLevel(){
	return highestScore % NEW_LEVEL == 0 && highestScore != 0;
}

function startMenu(){
	gameScene = 0;
	score = 0;
	highestScore = -10;
	player.x = 320 / 2 - 8;
	player.y = 240 / 2 - 8;
	player.dy = 0;
	player.ddy = DECELERATION;
}

function startGame(){
	// reset scene
	TCTX.clearRect(0, 0, kontra.canvas.width, kontra.canvas.height);
	sprites = sprites.filter(function (sprite) {
		return sprite.type == 'wall';
	});

	sprites.map(sprite => sprite.open());
	createBackground();
	createPlatform(y=kontra.canvas.height - BLOCK, true);
	createScene();
	gameScene = 1;
}

imageGoblin.onload = function() {
	createTextCanvas();

	// use kontra.spriteSheet to create animations from an image
	spriteSheet = kontra.spriteSheet({
		image: imageGoblin,
		frameWidth: 16,
		frameHeight: 16,
		animations: {
			idle: {
				frames: 0
			},
			walkLeft: {
				frames: '6..7',
				frameRate: 10
			},
			walkRight: {
				frames: '3..4',
				frameRate: 10
			},
			jump: {
				frames: 1
			},
			jumpLeft: {
				frames: 8
			},
			jumpRight: {
				frames: 5
			}
		}
	});

	player = kontra.sprite({
		x: 320 / 2 - 8,
		y: 240 / 2 - 8,
		ddy: DECELERATION,
		// width: BLOCK,
		// height: BLOCK,
		// color: 'red',
		type: 'player',
		onPlatform: false,
		animation: 'idle',
		animations: spriteSheet.animations,

		animate(anim){
			if (this.animation != anim){
				this.animation = anim;
				player.playAnimation(anim);
			}
		},
		update(){
			if (kontra.keys.pressed('up') || kontra.keys.pressed('space')){
				if (player.dy == 0){
					this.dy = -(3 + Math.sqrt(Math.abs(this.dx)));
					this.ddy = DECELERATION;
					this.onPlatform = false;
				}
			}
			if (kontra.keys.pressed('left') || kontra.keys.pressed('right')){
				if (kontra.keys.pressed('left')){
					if (this.dx > 0){
						this.dx -= 0.5;
					}
					else {
						this.dx -= 0.1;
					}
					this.dx = Math.max(this.dx, -VELOCITY);
				}
				if (kontra.keys.pressed('right')){
					if (this.dx < 0){
						this.dx += 0.5;
					}
					else {
						this.dx += 0.1;
					}
					this.dx = Math.min(this.dx, VELOCITY);
				}
			} else {
				this.dx *= 0.9;
			}

			// fall from platform
			for (let i = 0; i < sprites.length; i++){
				if (this.onPlatform &&
					sprites[i].type === 'platform' &&
					(player.x + player.width <= sprites[i].x ||
					player.x >= sprites[i].x + sprites[i].width))
				{
					player.ddy = DECELERATION;
					onPlatform = false;
					break;
				}
			};

			// animate
			if (this.onPlatform){
				if (this.dx > 0){
					this.animate('walkRight');
				} else if (this.dx < 0){
					this.animate('walkLeft');
				} else{
					this.animate('idle');
				}
			} else {
				if (this.dx > 0){
					this.animate('jumpRight');
				} else if (this.dx < 0){
					this.animate('jumpLeft');
				} else{
					this.animate('jump');
				}
			}
			this.advance();

			// normalizations (deblur)
			if (this.dx == 0){
				this.x = Math.round(this.x);
			}
			if (this.dy == 0){
				this.y = Math.round(this.y);
			}
			this.dx = Math.abs(this.dx) >= DECELERATION ? this.dx : 0;
			this.dy = Math.min(this.dy, VELOCITY * 0.8);
		}
	})

	setInterval(function(){ tilt = !tilt }, 500);
	createWalls();
	startMenu();

	loop.start();
};

let loop = kontra.gameLoop({
	update: function(){
		if (gameScene == 0){
			sprites.map(sprite => {
				if (sprite.type == 'wall'){
					sprite.update();
				}
			});
			if (kontra.keys.pressed('space')){
				startGame();
			}
		}
		else{
			sprites.map(sprite => sprite.update());
			player.update();

			// collide with ground
			if (player.dy > 0 &&
				Math.floor(player.y + player.height) >= kontra.canvas.height)
			{
				topScore = Math.max(score, topScore);
				TCTX.clearRect(0, 0, kontra.canvas.width, kontra.canvas.height);
				sprites.map(sprite => {
					if (sprite.type == 'wall'){
						sprite.close();
					}
				});
				sprites.sort(sprite => 
					// sprite.type == 'wall' &&
					sprite.color == levels[level]['color']);
				startMenu();
			}

			// collide with platforms
			if (player.dy > 0){
				for (let i = 0; i < sprites.length; i++){
					if (sprites[i].type === 'platform' &&
						player.y + player.height >= sprites[i].y &&
						player.y + player.height <= sprites[i].y + 6 &&
						player.x + player.width > sprites[i].x &&
						player.x < sprites[i].x + sprites[i].width)
					{
						player.y = sprites[i].y - player.height;
						player.dy = player.ddy = 0;
						player.onPlatform = true;
						if (sprites[i].highestScore > score){
							score = sprites[i].highestScore;
							TCTX.clearRect(0, 24, WALLS_WIDTH, 32);
						}
						break;
					}
				}
			}

			// collide with walls
			if (player.dx != 0){
				for (let i = 0; i < sprites.length; i++){
					if (sprites[i].type === 'wall' &&
						player.collidesWith(sprites[i]))
					{
						if (sprites[i].side === 'left'){
							player.x = sprites[i].x + sprites[i].width;
						}
						else {
							player.x = sprites[i].x - player.width;
						}
						// bounce if in air
						if (!player.onPlatform){
							player.dx = -player.dx;
						}
						break
					}
				}
			}

			// generate upper floors
			if (player.y < 0){
				sprites.map(sprite => {
					if (sprite.type == 'platform' ||
						sprite.type == 'wall'){
						sprite.y -= player.y;
					}
					if (sprite.type == 'background'){
						// scroll parallax, move o .background after
						if (sprite.y < 0){
							sprite.y = Math.min(sprite.y - player.y, 0);
						}
					}
				})
				player.y = 0;
				createScene();
				createWalls();

				// remove old sprites
				sprites = sprites.filter(function (sprite) {
					return sprite.y < 240;
				});
			}

			// normalizations (deblur)
			sprites.map(sprite =>{
				if (sprite.dx == 0){
					sprite.x = Math.round(sprite.x);
				}
				if (sprite.dy == 0){
					sprite.y = Math.round(sprite.y);
				}
			})
		}
	},
	render: function(){
		if (gameScene == 0){
			sprites.map(sprite => {
				if (sprite.type == 'background'){
					sprite.render()
				}
			});
			sprites.map(sprite => {
				if (sprite.type == 'platform'){
					sprite.render()
				}
			});
			sprites.map(sprite => {
				if (sprite.type == 'wall'){
					sprite.render()
				}
			});

			if (loaded){
				for (let i = 0; i < 10 * 16; i += 16){
					textCanvas.getContext("2d").drawImage(
						imageFire, 82 + i, 27);
					textCanvas.getContext("2d").drawImage(
						imageFire, 82 + i, 39);
				}
			}
			drawTextShadowed('STEEM MONSTERS', 0.5, 'orange', {
				x: 88,
				y: 32
			})

			if (loaded){
				for (let i = 0; i < 19 * 16; i += 16){
					textCanvas.getContext("2d").drawImage(
						imageFire, 10 + i, 52);
					textCanvas.getContext("2d").drawImage(
						imageFire, 10 + i, 64);
					textCanvas.getContext("2d").drawImage(
						imageFire, 10 + i, 76);
				}
			}
			drawTextShadowed('GOBLIN TOWER 13k', 0.9, 'orange', {
				x: 16,
				y: 60
			})
			drawText('13 KILOBYTE  MINI GAME', 0.3, 'orange', {
				x: 91,
				y: 100
			})
			drawText('PRESS SPACE TO START', 0.5, tilt ? 'orange' : 'brown', {
				x: 64,
				y: 136
			})
			if (topScore > 0){
				drawTextShadowed('TOP SCORE ' + topScore.toString(), 0.5, 'orange', {
					x: 104,
					y: 192
				})
			}
			drawText('STEEM  @mys', 0.3, 'brown', {
				x: 244,
				y: 228
			})
		}
		else{
			sprites.map(sprite => {
				if (sprite.type == 'background'){
					sprite.render()
				}
			});
			sprites.map(sprite => {
				if (sprite.type == 'platform'){
					sprite.render()
				}
			});
			sprites.map(sprite => {
				if (sprite.type == 'wall'){
					sprite.render()
				}
			});
			player.render();
	
			drawTextShadowed('SCORE', 0.5, 'orange', {
				x: 8,
				y: 4
			})
			drawTextShadowed(score.toString(), 0.5, 'orange', {
				x: 48,
				y: 24
			}, true)
			drawTextShadowed('GOBLIN', 0.3, 'orange', {
				x: 260,
				y: 4
			})
			drawTextShadowed('TOWER 13k', 0.3, 'orange', {
				x: 260,
				y: 16
			})
		}
	}
});