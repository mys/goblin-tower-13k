kontra.init();

const WALLS_WIDTH = 64
const BLOCK = 16
const VELOCITY = 6
const DECELERATION = 0.1
let gameScene = 0
let sprites = [];
let score = 0;
let topScore = 0;
let highestScore = -10; // base is 0
let tilt = true;

let imageGoblin = new Image();
imageGoblin.src = '../src/img/goblin.png';

let spriteSheet;
let player;


function createWall(side='left'){
	let wall = kontra.sprite({
		width: kontra.canvas.width / 2,
		height: kontra.canvas.height,
		x: side == 'left' ? 0 : kontra.canvas.width / 2,
		y: 0,
		color: 'grey',
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
	sprites.push(wall);
}

function createPlatform(y=192, fullWidth=false){
	highestScore += 10;
	let width = fullWidth ? 192 : Math.floor((Math.random() * 3) + 2) * BLOCK;
	let platform = kontra.sprite({
		width: width,
		height: BLOCK,
		x: WALLS_WIDTH + Math.floor(
			Math.random() * (kontra.canvas.width - width -2 * WALLS_WIDTH)),
		y: y,
		color: 'green',
		type: 'platform',
		highestScore: highestScore
	});
	sprites.push(platform);
}

function createPlatforms(){
	for (let i = kontra.canvas.height - BLOCK; i > -2 * BLOCK; i -= BLOCK * 2){
		if (!sprites.find(sprite => 
			sprite.type === 'platform' && 
			sprite.y < i + BLOCK * 2))
		{
			createPlatform(y=i);
		}
	}
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
	TCTX.clearRect(0, 0, kontra.canvas.width, kontra.canvas.height);
	sprites = sprites.filter(function (sprite) {
		return sprite.type == 'wall';
	});
	sprites.map(sprite => sprite.open());
	createPlatform(y=kontra.canvas.height - BLOCK, true);
	createPlatforms();
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
	createWall('left');
	createWall('right');
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
				sprites.sort(sprite => sprite.type == 'wall');
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
					if (sprite.type === 'platform'){
						sprite.y -= player.y;
					}
				})
				player.y = 0;
				createPlatforms();
			}
		}
	},
	render: function(){
		if (gameScene == 0){
			sprites.map(sprite => sprite.render());

			drawTextShadowed('STEEM MONSTERS', 0.5, 'orange', {
				x: 88,
				y: 32
			})
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