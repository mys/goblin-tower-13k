kontra.init();

const WALLS_WIDTH = 64
const BLOCK = 16
const VELOCITY = 4
const DECELERATION = 0.1
let sprites = [];

let player = kontra.sprite({
	x: 320 / 2 - 8,
	y: 240 / 2 - 8,
	ddy: DECELERATION,
	width: BLOCK,
	height: BLOCK,
	color: 'red',
	type: 'player',
	onPlatform: false,

	update(){
		if (kontra.keys.pressed('up') || kontra.keys.pressed('space')){
			if (player.dy == 0){
				this.dy = -(1 + Math.abs(this.dx));
				this.ddy = DECELERATION;
				this.onPlatform = false;
			}
		}
		if (kontra.keys.pressed('left') || kontra.keys.pressed('right')){
			if (kontra.keys.pressed('left')){
				if (this.dx > 0){
					this.dx = 0;
				}
				this.dx -= 0.1;
				this.dx = Math.max(this.dx, -VELOCITY);
			}
			if (kontra.keys.pressed('right')){
				if (this.dx < 0){
					this.dx = 0;
				}
				this.dx += 0.1;
				this.dx = Math.min(this.dx, VELOCITY);
			}
		}
		else {
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
		this.advance();

		// max speed of fall
		this.dy = Math.min(this.dy, VELOCITY);
	}
})

function createWall(side='left'){
	let wall = kontra.sprite({
		width: WALLS_WIDTH,
		height: kontra.canvas.height,
		x: side == 'left' ? 0 : kontra.canvas.width - WALLS_WIDTH,
		y: 0,
		color: 'grey',
		type: 'wall',
		side: side
	});
	sprites.push(wall);
}

function createPlatform(){
	let width = Math.floor((Math.random() * 3 + 1)) * 32;
	let platform = kontra.sprite({
		width: width,
		height: BLOCK,
		x: WALLS_WIDTH + Math.floor(Math.random() * (kontra.canvas.width - width- 2 * WALLS_WIDTH)),
		y: 192,
		color: 'green',
		type: 'platform'
	});
	sprites.push(platform);
}

createWall('left');
createWall('right');
createPlatform();

let loop = kontra.gameLoop({
	update: function(){
		sprites.map(sprite => sprite.update());
		player.update();

		// collide with ground
		if (player.dy > 0 &&
			Math.floor(player.y + player.height) >= kontra.canvas.height)
		{
			player.y = kontra.canvas.height - player.height;
			player.dy = player.ddy = 0;
			player.onPlatform = true;
		}

		// collide with platforms
		if (player.dy > 0){
			for (let i = 0; i < sprites.length; i++){
				if (sprites[i].type === 'platform' &&
					player.y + player.height >= sprites[i].y &&
					player.y + player.height <= sprites[i].y + 4 &&
					player.x + player.width > sprites[i].x &&
					player.x < sprites[i].x + sprites[i].width)
				{
					player.y = sprites[i].y - player.height;
					player.dy = player.ddy = 0;
					player.onPlatform = true;
					break;
				}
			}
		}
	},
	render: function(){
		sprites.map(sprite => sprite.render());
		player.render();
	}
});
loop.start();

console.log(sprites);