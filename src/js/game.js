const WALLS_WIDTH = 64
const BLOCK = 16
const VELOCITY = 6
const DECELERATION = 0.1
const BIG_PLATFORM = 100
const NEW_LEVEL = 100

var loaded;
let iGoblin = new Image();
iGoblin.src = '../src/img/goblin.png';
let iFire = new Image();
iFire.src = '../src/img/fire.png';
let iWater = new Image();
iWater.src = '../src/img/water.png';
let iEarth = new Image();
iEarth.src = '../src/img/earth.png';
let iDeath = new Image();
iDeath.src = '../src/img/death.png';
let iLife = new Image();
iLife.src = '../src/img/life.png';
let iDragon = new Image();
iDragon.src = '../src/img/dragon.png';

let iWarrior = new Image();
iWarrior.src = '../src/img/silvershieldwarrior.png';
let iMermaid = new Image();
iMermaid.src = '../src/img/mischievousmermaid.png';
let iSorcerer = new Image();
iSorcerer.src = '../src/img/goblinsorcerer.png';
let iDemon = new Image();
iDemon.src = '../src/img/firedemon.png';
let iKobold = new Image();
iKobold.src = '../src/img/koboldminer.png';
let monsters = [
	{ 'm': iWarrior , x: 12 },
	{ 'm': iMermaid , x: 16 },
	{ 'm': iSorcerer , x: 20 },
	{ 'm': iDemon , x: 1 },
	{ 'm': iKobold , x: 12 }
];

var audio = new Audio('sfx/jump.wav');

let gameScene = 0 // 0 - menu, 1 - game, -1 - credits
let sprites = [];
let score = 0;
let topScore = 0;
let hScore = -10; // base is 0
let tilt = true;
let spriteSheet;
let player;
let levels = [
	{
		's': 'Fire',
		'color': 'indianred',
		'background': '#752424',
		'land': 'The Burning Lands',
		'block': iFire,
	},
	{
		's': 'Water',
		'color': 'royalblue',
		'background': '#11286e',
		'land': 'AZMARE Islands',
		'block': iWater,
	},
	{
		's': 'Earth',
		'color': 'seagreen',
		'background': '#20603b',
		'land': 'ANUMUN',
		'block': iEarth,
	},
	{
		's': 'Death',
		'color': 'mediumpurple',
		'background': '#3d1f7a',
		'land': 'MorTis',
		'block': iDeath,
	},
	{
		's': 'Life',
		'color': 'navajowhite',
		'background': '#ffebcc',
		'land': 'Khymeria',
		'block': iLife,
	},
	{
		's': 'Dragon',
		'color': '#806c00',
		'background': 'gold',
		'land': 'Draykh-Nahka',
		'block': iDragon
	},
]
let level = 0
let lock = false

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
						this.dx = this.ddx = 0;
					}
					else if (this.x > 0){
						this.x = this.dx = this.ddx = 0;
					}
				}
				else {
					if (this.x > kontra.canvas.width - WALLS_WIDTH){
						this.x = kontra.canvas.width - WALLS_WIDTH;
						this.dx = this.ddx = 0;
					}
					else if (this.x < kontra.canvas.width / 2){
						this.x = kontra.canvas.width / 2;
						this.dx = this.ddx = 0;
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

function createMonster(y){
	let side = Math.random() > 0.5 ? 'left' : 'right';
	if (sprites.find(sprite => 
		sprite.type == 'monster' &&
		sprite.side == side &&
		sprite.y - 80 < y))
	{
		return;
	}
	let ran = monsters[Math.floor(Math.random() * monsters.length)];
	let monster = kontra.sprite({
		x: ran['x'],
		y: y,
		block: ran['m'],
		type: 'monster',
		side: side,
		render(){
			if (this.side == 'left'){
				this.context.drawImage(this.block, this.x, this.y);
			} else {
				this.context.save();
				// translate context to center of canvas
				this.context.translate(kontra.canvas.width, 0);
				// flip context horizontally
				this.context.scale(-1,1);
				this.context.drawImage(this.block, this.x, this.y);
				this.context.restore();
			}
		}
	});
	sprites.push(monster);
}

function createPlatform(y=192, fullWidth=false){
	hScore += 10;
	if (isNewLevel())
	{
		level += 1;
		if (level > levels.length - 1){
			level = 0;
		}
	}
	let width = fullWidth ? 192 : Math.floor((Math.random() * 3) + 2) * BLOCK;
	let platform = kontra.sprite({
		width: hScore % BIG_PLATFORM == 0 
			? kontra.canvas.width - 2 * WALLS_WIDTH 
			: width,
		height: BLOCK,
		x: hScore % BIG_PLATFORM == 0 
			? WALLS_WIDTH
			: WALLS_WIDTH + Math.floor(
				Math.random() * (kontra.canvas.width - width - 2 * WALLS_WIDTH)),
		y: y,
		block: levels[level]['block'],
		type: 'platform',
		highestScore: hScore,
		render(){
			for (let i = 0; i < this.width; i += BLOCK){
				this.context.drawImage(this.block, this.x + i, this.y);
			}
			if (gameScene == 1 && 
				this.highestScore % BIG_PLATFORM == 0 &&
				this.highestScore != 0)
			{
				TCTX.clearRect(this.x, this.y - 16, this.width, this.height + 24);
				drawTextShadowed(this.highestScore.toString(), 0.4, 'orange', {
					x: this.x + this.width / 2 - 2 - (2 * hScore.toString().length),
					y: this.y + 2,
				})
			}
		}
	});
	sprites.push(platform);
	if (Math.random() * 10 > 5){
		createMonster(platform.y - 128);
	}
}

function createScene(){
	for (let i = kontra.canvas.height - BLOCK; i > -2 * BLOCK; i -= BLOCK * 2){
		if (!sprites.find(sprite => 
			sprite.type === 'platform' && 
			sprite.y < i + BLOCK * 2))
		{
			sprite = sprites.find(
				sprite => sprite.highestScore == hScore);
			createPlatform(sprite.y - 32);
			
			if (isNewLevel())
			{
				let y = sprite.y - 240 - 16;
				createBackground(y);
				createWall('left', true).y = y;
				createWall('right', true).y = y;
				drawLandName();
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
		type: 'background',
		render(){
			this.draw();
			let pixels = this.context.getImageData(
				this.x, this.y, this.width, this.height
			);
			let data = pixels.data;
			let j = 0;
			for (let i = pixels.data.length; i >= 0; i -= 4){
				data[i] += j;
				data[i-1] += j;
				data[i-2] += j;
				if (i % 3072 == 0){
					j -= 2;
				}
			}
			this.context.putImageData(pixels, this.x, this.y);
		}
	});
	sprites.push(background);
}

function drawLandName(){
	drawTextShadowed(levels[level]['land'], 0.5, levels[level]['color'], {
		x: kontra.canvas.width / 2 - 5 * levels[level]['land'].length,
		y: kontra.canvas.height - 32
	});
	setTimeout(function(){ 
	TCTX.clearRect(WALLS_WIDTH, kontra.canvas.height - 32, 
		kontra.canvas.width - 2 * WALLS_WIDTH, 32);
	}, 4000);
}

function isNewLevel(){
	return hScore % NEW_LEVEL == 0 && hScore != 0;
}

function startMenu(){
	gameScene = score = 0;
	hScore = -10;
	player.x = 320 / 2 - 8;
	player.y = 240 / 2 - 8;
	player.dy = 0;
	player.ddy = DECELERATION;
}

function startGame(){
	TCTX.clearRect(0, 0, kontra.canvas.width, kontra.canvas.height);
	sprites = sprites.filter(function (sprite) {
		return sprite.type == 'wall';
	});

	sprites.map(sprite => sprite.open());
	createBackground();
	createPlatform(y=kontra.canvas.height - BLOCK, true);
	createScene();
	drawLandName();
	drawControls();
	gameScene = 1;
}

function startCredits(){
	TCTX.clearRect(0, 0, kontra.canvas.width, kontra.canvas.height);
	gameScene = -1;
}

function drawControls(){
	drawTextShadowed('Controls', 0.3, 'orange', {
		x: 260,
		y: 120
	});
	drawTextShadowed('UP   SPACE', 0.3, 'orange', {
		x: 260,
		y: 136
	});
	drawTextShadowed('LEFT RIGHT', 0.3, 'orange', {
		x: 260,
		y: 152
	});
	drawTextShadowed('ESC', 0.3, 'orange', {
		x: 260,
		y: 168
	});
	setTimeout(function(){ 
	TCTX.clearRect(260, 120, 
		WALLS_WIDTH, 96);
	}, 4000);
}

iGoblin.onload = function() {
	createTextCanvas();

	// use kontra.spriteSheet to create animations from an image
	spriteSheet = kontra.spriteSheet({
		image: iGoblin,
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
					audio.play();
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
				} else {
					this.animate('idle');
				}
			} else {
				if (this.dx > 0){
					this.animate('jumpRight');
				} else if (this.dx < 0){
					this.animate('jumpLeft');
				} else {
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

	// wait a moment for resources
	setTimeout(function(){ 
		loop.start();
		loaded = true;
	}, 500);
};

function renderSprites(){
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
	sprites.map(sprite => {
		if (sprite.type == 'monster'){
			sprite.render()
		}
	});
}

function endGame(){
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

function drawLogo(){
	if (loaded){
		for (let i = 0; i < 10 * 16; i += 16){
			textCanvas.getContext("2d").drawImage(
				iFire, 82 + i, 27);
			textCanvas.getContext("2d").drawImage(
				iFire, 82 + i, 39);
		}
	}
	drawTextShadowed('STEEM MONSTERS', 0.5, 'orange', {
		x: 88,
		y: 32
	})

	if (loaded){
		for (let i = 0; i < 19 * 16; i += 16){
			textCanvas.getContext("2d").drawImage(
				iFire, 10 + i, 52);
			textCanvas.getContext("2d").drawImage(
				iFire, 10 + i, 64);
			textCanvas.getContext("2d").drawImage(
				iFire, 10 + i, 76);
		}
	}
	drawTextShadowed('GOBLIN TOWER 13k', 0.9, 'orange', {
		x: 16,
		y: 60
	})
	drawTextShadowed('13 KILOBYTE  MINI GAME', 0.4, 'orange', {
		x: 68,
		y: 100
	})
}

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
			if (kontra.keys.pressed('esc') && !lock){
				startCredits();

				lock = true;
				setTimeout(function(){ lock = false; }, 500);
			}
		} else if (gameScene == -1){
			if (kontra.keys.pressed('esc') && !lock){
				endGame();
				startMenu();

				lock = true;
				setTimeout(function(){ lock = false; }, 500);
			}
		} else {
			if (kontra.keys.pressed('esc')){
				endGame();

				lock = true;
				setTimeout(function(){ lock = false; }, 500);
				return;
			}

			sprites.map(sprite => sprite.update());
			player.update();

			// collide with ground
			if (player.dy > 0 &&
				Math.floor(player.y + player.height) >= kontra.canvas.height)
			{
				endGame();
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
							audio.play();
						}
						break
					}
				}
			}

			// generate upper floors
			if (player.y < 0){
				sprites.map(sprite => {
					if (sprite.type == 'platform' ||
						sprite.type == 'wall' ||
						sprite.type == 'monster'){
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
			// sprites.map(sprite =>{
			// 	if (sprite.dx == 0){
			// 		sprite.x = Math.round(sprite.x);
			// 	}
			// 	if (sprite.dy == 0){
			// 		sprite.y = Math.round(sprite.y);
			// 	}
			// })
		}
	},
	render: function(){
		if (gameScene == 0){
			renderSprites();

			drawLogo();
			drawText('PRESS SPACE TO START', 0.5, tilt ? 'orange' : 'brown', {
				x: 64,
				y: 130
			})
			drawText('PRESS ESC TO CREDITS', 0.5, tilt ? 'brown' : 'orange', {
				x: 64,
				y: 152
			})
			if (topScore > 0){
				drawTextShadowed('TOP SCORE ' + topScore.toString(), 0.5, 'orange', {
					x: 104,
					y: 192
				})
			}
			drawText('STEEM @mys', 0.4, 'orange', {
				x: 228,
				y: 224
			})
		} else if (gameScene == -1){
			renderSprites();

			drawLogo();
			let can = canvas.getContext("2d");
			can.fillStyle=levels[level]['background'];
			can.fillRect(3, 115, 314, 110);
			can.fillStyle=levels[level]['color'];
			can.fillRect(4, 116, 312, 108);
			drawTextShadowed('With credits to:', 0.5, 'orange', {
				x: 84,
				y: 122
			})
			drawTextShadowed('@steemmonsters team', 0.4, 'orange', {
				x: 78,
				y: 148
			})
			drawTextShadowed('@heraclio artist', 0.4, 'orange', {
				x: 96,
				y: 168
			})
			drawTextShadowed('Redshrike from opengameart.org', 0.4, 'orange', {
				x: 40,
				y: 188
			})
			drawTextShadowed('and @mys', 0.4, 'orange', {
				x: 126,
				y: 208
			})

		} else {
			renderSprites();
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