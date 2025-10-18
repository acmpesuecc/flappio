const FPS = 60;
const GRAVITY = .0981/FPS;
const DEBUG = false;

const BIRD_SPAWN_X = .13;
const BIRD_SPAWN_Y = .40;
const ROD_VEL = -.013;
const ROD_SPAWN_X = 1;
const ROD_SPAWN_Y = () => Math.random()*(.63-.25)+.25;

var game_score = 0;
var last_rod_id = null;
var multiplayerSocket = null;
var currentRoomId = null;
var currentPlayerName = null;
var myBird = null;
var otherBirds = {};

function initMultiplayerGame(socket, roomId, playerName) {
    multiplayerSocket = socket;
    currentRoomId = roomId;
    currentPlayerName = playerName;
    
    game_score = 0;
    const start_time = new Date();
    let event_queue = [];
    let entities = simulate(event_queue, start_time);
    
    slide_bg();
    
    let canvas = document.querySelector('#game-canvas');
    canvas.height = screen.height;
    canvas.width  = screen.width;
    let ctx = canvas.getContext("2d", {willReadFrequently: true});
    
    let Buff = new OffscreenCanvas(screen.width, screen.height);
    let b_ctx = Buff.getContext('2d', {willReadFrequently: true});
    
    playGameStartSound();
    
    // Listen for rod spawns from server
    socket.on('gameStateUpdate', (gameState) => {
        if (gameState.rods) {
            syncRods(entities, gameState.rods);
        }
        if (gameState.players) {
            syncPlayers(gameState.players);
        }
    });
    
    setInterval(() => {
        render_entities(entities, b_ctx);
        
        // Render other players
        for (let playerId in otherBirds) {
            if (otherBirds[playerId]) {
                otherBirds[playerId].render(b_ctx);
            }
        }
        
        // Change the color of the score to red
        b_ctx.fillStyle = 'red';
        b_ctx.font = '40px Fascinate, cursive';
        b_ctx.textAlign = 'center';
        b_ctx.fillText(game_score, canvas.width / 2, 50);
        
        let data = b_ctx.getImageData(0, 0, canvas.width, canvas.height);
        requestAnimationFrame(() => {
            ctx.putImageData(data, 0, 0);
            b_ctx.clearRect(0, 0, screen.width, screen.height);
        });
    }, 1000/FPS);
    
    return event_queue;
}

function syncRods(entities, serverRods) {
    // Remove rods that no longer exist
    const rodEntities = entities.filter(e => e instanceof RodObject);
    const serverRodIds = new Set(serverRods.map(r => r.id));
    
    for (let i = entities.length - 1; i >= 0; i--) {
        if (entities[i] instanceof RodObject && !serverRodIds.has(entities[i].serverId)) {
            entities.splice(i, 1);
        }
    }
    
    // Add new rods from server
    for (let serverRod of serverRods) {
        const exists = entities.some(e => e instanceof RodObject && e.serverId === serverRod.id);
        if (!exists) {
            const rod = new RodObject([serverRod.x, serverRod.y]);
            rod.serverId = serverRod.id;
            entities.push(rod);
        }
    }
}

function syncPlayers(players) {
    for (let player of players) {
        if (player.name === currentPlayerName) {
            // This is us, skip
            continue;
        }
        
        if (!otherBirds[player.id]) {
            // Create a new bird for this player
            otherBirds[player.id] = new BirdObject(player.position, [0, 0]);
            otherBirds[player.id].isOtherPlayer = true;
            otherBirds[player.id].playerName = player.name;
        } else {
            // Update existing bird
            otherBirds[player.id].pos = player.position;
        }
        
        // Remove birds for players who left
        if (!player.alive) {
            delete otherBirds[player.id];
        }
    }
}

function simulate(queue, start_time) {
    game_score = 0;
    const MAX_EVENT_DELAY = 1200;
    
    let entities = [];
    let birds = [];
    
    myBird = new BirdObject([BIRD_SPAWN_X, BIRD_SPAWN_Y], [0, (new BirdObject()).tap_speed]);
    birds.push(myBird);
    
    for (let bird of birds) {
        entities.push(bird);
    }
    
    setInterval(function simulation_tick() {
        let now = new Date().getTime() - start_time;
        
        let ended_events = [];
        for (let event_idx in queue) {
            let event = queue[event_idx];
            let delta = event.time - now;
            if (-11 < delta && delta < 13) {
                handleGameEvent(event, entities, birds);
            } else if (delta < -MAX_EVENT_DELAY) {
                ended_events.push(event_idx);
            }
        }
        
        ended_events.reverse();
        for (let event_idx of ended_events) {
            queue.splice(event_idx, 1);
        }
        
        let ended = [];
        for (let rod_idx in entities) {
            let exists = entities[rod_idx].tick(queue, now, birds);
            if (!exists) ended.push(rod_idx);
        }
        
        ended.reverse();
        for (let rod_idx of ended) {
            entities.splice(rod_idx, 1);
        }
        
        // Send position update to server
        if (myBird && multiplayerSocket) {
            multiplayerSocket.emit('playerUpdate', {
                roomId: currentRoomId,
                position: myBird.pos,
                velocity: myBird.vel,
                score: game_score,
                alive: myBird.alive !== false
            });
        }
        
    }, 1000/FPS);
    
    // Event generator for user input only
    document.onkeydown = (e) => {
        let now = new Date() - start_time;
        switch (e.code) {
            case 'Space':
                queue.push(new GameEvent('Bird', now + 20));
                if (multiplayerSocket) {
                    multiplayerSocket.emit('playerJump', { roomId: currentRoomId });
                }
                break;
        }
    };
    
    return entities;
}

class GameEvent {
    constructor(type, time, props) {
        this.type = type;
        this.time = time;
        this.props = props;
    }
}

function handleGameEvent(event, entities, birds) {
    switch (event.type) {
    case 'Bird':
        playJumpSound();
        for (let bird of birds) {
            bird.vel[1] = bird.tap_speed;
        }
        break;
    case 'Hit':
        console.log("COLLISION");
        playCollisionSound();
        playGameOverSound();
        
        if (myBird) {
            myBird.alive = false;
        }
        
        if (multiplayerSocket) {
            multiplayerSocket.emit('playerDied', {
                roomId: currentRoomId,
                finalScore: game_score
            });
        }
        
        entities.push(new BlankObject());
        break;
        
    case 'Miss':
        if (last_rod_id === event.props.rod_id) return;
        game_score++;
        playPointSound();
        playWhooshSound();
        console.log("POINT!", game_score);
        last_rod_id = event.props.rod_id;
    }
}

function render_entities(entities, canvas_context) {
    let rendered_bird = false;
    for (entity of entities) {
        if (entity instanceof BirdObject) {
            if (rendered_bird) break;
            rendered_bird = true;
        }
        entity.render(canvas_context);
        if (entity instanceof BlankObject) break;
    }
}

function getImage(path){
    return new Promise(ret => {
        let img = new Image();
        img.src = path;
        img.onload = () => ret(img);
    });
}

class GameObject {
    constructor(pos, vel) {
        this.pos = pos;
        this.vel = vel;
        this.id = new Date();
        this.set_canvas = this.set_canvas.bind(this);
    }
    
    set_canvas(img) {
        this.img = img;
    }
    
    tick() {
        this.pos[0] += this.vel[0];
        this.pos[1] += this.vel[1];
        
        if (this.pos[0] < -.6 || 1.6 < this.pos[0]) return false;
        if (this.pos[1] < -.6 || 1.6 < this.pos[1]) return false;
        return true;
    }
    
    render(canvas_context) {
        let offscreenRod = this.img;
        let pos = [this.pos[0]*screen.width,this.pos[1]*screen.height];
        if (DEBUG) {
            canvas_context.fillStyle = "#fff";
            canvas_context.fillRect(...pos, 5, 5);
            canvas_context.fillStyle = "#000";
            canvas_context.fillRect(...pos, 4, 4);
        }
        canvas_context.drawImage(offscreenRod, pos[0], pos[1]);
    }
}

class RodObject extends GameObject {
    rod_gap = 650;
    rod_scale = .4;
    img_promise = getImage("../Sprites/rod.png");
    
    constructor(pos) {
        super(pos, [0, 0], 10, 10);
        this.vel[0] = ROD_VEL;
        this.img_promise.then(this.set_canvas);
        this.serverId = null;
    }
    
    get_corridor() {
        return [
            this.pos[0]-.06, this.pos[1]-.23,
            this.pos[0]+.10, this.pos[1]+.03,
        ];
    }
    
    tick(queue, now, birds) {
        const HIT_INTERVAL = 15;
        
        this.pos[0] += this.vel[0];
        this.pos[1] += this.vel[1];
        
        if (this.pos[0] < -.6 || 1.6 < this.pos[0]) return false;
        if (this.pos[1] < -.6 || 1.6 < this.pos[1]) return false;
        
        let [x1, y1, x2, y2] = this.get_corridor();
        for (let bird of birds) {
            if (x1 < bird.pos[0] && bird.pos[0] < x2) {
                if (y1 < bird.pos[1] && bird.pos[1] < y2) {
                    queue.push(new GameEvent('Miss', now + HIT_INTERVAL, {
                        bird: bird,
                        rod_pos: this.pos[1],
                        rod_id: this.id.toString(),
                    }));
                } else {
                    queue.push(new GameEvent('Hit', now + HIT_INTERVAL, {
                        bird: bird
                    }));
                }
            }
        }
        
        return true;
    }
    
    render(canvas_context) {
        if (this.img === undefined) return;
        let offscreenRod = this.img;
        let pos = [this.pos[0]*screen.width/this.rod_scale,this.pos[1]*screen.height/this.rod_scale];
        
        let [x1, y1, x2, y2] = this.get_corridor();
        let d_pos = [x1*screen.width,y1*screen.height];
        let d_dim = [(x2-x1)*screen.width,(y2-y1)*screen.height];
        
        if (DEBUG) {
            canvas_context.fillStyle = "#ff9088";
            canvas_context.fillRect(d_pos[0], 0, d_dim[0], screen.height);
            canvas_context.clearRect(...d_pos, ...d_dim);
        }
        canvas_context.scale(this.rod_scale, this.rod_scale);
        canvas_context.drawImage(offscreenRod, pos[0], +pos[1]+this.rod_gap/2);
        canvas_context.scale(1, -1);
        canvas_context.drawImage(offscreenRod, pos[0], -pos[1]+this.rod_gap/2);
        canvas_context.setTransform(1, 0, 0, 1, 0, 0);
    }
}

class BirdObject extends GameObject {
    auto_thresh = .9;
    tap_speed = -.026;
    img_promise = getImage("../Sprites/bird not angry big.png");
    
    constructor(pos, vel) {
        super(pos, vel);
        this.img_promise.then(this.set_canvas);
        this.isOtherPlayer = false;
        this.playerName = '';
        this.alive = true;
    }
    
    tick(queue, now) {
        if (!this.isOtherPlayer) {
            this.pos[0] += this.vel[0];
            this.pos[1] += this.vel[1];
            this.vel[1] += GRAVITY;
            
            if (this.pos[1] > 1.0) {
                queue.push(new GameEvent('Hit', now + 15));
                return false;
            }
        }
        
        return true;
    }
    
    render(canvas_context) {
        if (this.img === undefined) return;
        let pos = [this.pos[0]*screen.width, this.pos[1]*screen.height];
        canvas_context.drawImage(this.img, pos[0], pos[1]);
        
        // Show player name above bird
        if (this.isOtherPlayer && this.playerName) {
            canvas_context.fillStyle = 'rgba(0, 0, 0, 0.7)';
            canvas_context.font = '14px Arial';
            canvas_context.textAlign = 'center';
            const textWidth = canvas_context.measureText(this.playerName).width;
            canvas_context.fillRect(pos[0] - textWidth/2 - 5, pos[1] - 25, textWidth + 10, 20);
            canvas_context.fillStyle = 'white';
            canvas_context.fillText(this.playerName, pos[0], pos[1] - 10);
        }
    }
}

class BlankObject extends GameObject {
    constructor() {
        super([0, 0], [0, 0]);
    }
    
    render(canvas_context) {
        canvas_context.clearRect(0, 0, screen.width, screen.height);
    }
}

function slide_bg() {
    const cloudSpeed = .2;
    const bgGrassSpeed = 1;
    const fgGrassSpeed = 1.5;
    
    let cloudPos = 0;
    let bgGrassPos = 0;
    let fgGrassPos = 0;
    setInterval(() => {
        document.querySelector('.clouds1').style.transform = "translate("+cloudPos+"px, 0px)";
        document.querySelector('.bgGrass1').style.transform = "translate("+bgGrassPos+"px, 0px)";
        document.querySelector('.fgGrass1').style.transform = "translate("+fgGrassPos+"px, 0px)";
        document.querySelector('.clouds2').style.transform = "translate("+(cloudPos+screen.width)+"px, 0px)";
        document.querySelector('.bgGrass2').style.transform = "translate("+(bgGrassPos+screen.width)+"px, 0px)";
        document.querySelector('.fgGrass2').style.transform = "translate("+(fgGrassPos+screen.width)+"px, 0px)";
        
        cloudPos = (cloudPos-cloudSpeed)%screen.width;
        bgGrassPos = (bgGrassPos-bgGrassSpeed)%screen.width;
        fgGrassPos = (fgGrassPos-fgGrassSpeed)%screen.width;
    }, 1000/FPS);
}