kontra.init();

const WALLS_WIDTH = 64
const BLOCK = 16
let sprites = [];

let player = kontra.sprite({
	x: 320 / 2 - 8,
	y: 240 / 2 - 8,
	dy: 2,
	width: 16,
	height: 16,
	color: 'red',
	type: 'player'
})

function createWall(side='left'){
	let wall = kontra.sprite({
		width: WALLS_WIDTH,
		height: kontra.canvas.height,
		x: side == 'left' ? 0 : kontra.canvas.width - WALLS_WIDTH,
		y: 0,
		color: 'grey',
		type: 'wall'
	});
	sprites.push(wall);
}

function createPlatform(){
	let width = Math.floor((Math.random() * 3 + 1)) * 32;
	let platform = kontra.sprite({
		width: width,
		height: 16,
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

console.log(sprites);

let loop = kontra.gameLoop({
	update: function(){
		sprites.map(sprite => sprite.update());
		player.update();

		// collide with ground
		if (player.dy > 0 &&
			player.y + player.height >= kontra.canvas.height)
		{
			player.dy = 0;
		}

		// collide with platforms
		for (let i = 0; i < sprites.length; i++){
			if (player.dy > 0 && 
				sprites[i].type === 'platform' && 
				player.y + player.height >= sprites[i].y &&
				player.x + player.width > sprites[i].x &&
				player.x < sprites[i].x + sprites[i].width)
			{
				player.dy = 0;
				break;
			}
		};
	},
	render: function(){
		sprites.map(sprite => sprite.render());
		player.render();
	}
});
loop.start();