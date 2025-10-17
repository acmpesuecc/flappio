const FPS = 60  // combine into one file
const GRAVITY = .0981/FPS
// const GRAVITY = 0.00000

const DEBUG = false
// const D_MOVING_BIRD = false
const D_MOVING_BIRD = true

const BIRD_SPAWN_X = .13
const BIRD_SPAWN_Y = .40

const ROD_VEL = -.013;
// const ROD_VEL = 0;
// const ROD_SPAWN_X = .2
const ROD_SPAWN_X = 1
// const ROD_SPAWN_Y = () => .25
// const ROD_SPAWN_Y = () => .63
const ROD_SPAWN_Y = () => Math.random()*(.63-.25)+.25

var game_score = 0;
var last_rod_id = null;

var url = 'localhost:3001/'
var post_path = 'leaderboard'

function simulate(queue, start_time) {
    game_score = 0; // Reset the score at the start of each game.
    const MAX_EVENT_DELAY = 1200

    event_generator(queue, start_time);
    
    // Play game start sound
    playGameStartSound();

    let entities = []
    let birds = []

    console.log('Bird Object:', (new BirdObject()).tap_speed)
    // birds.push(new BirdObject([.2, 1], [0, (new BirdObject()).tap_speed]))
    birds.push(new BirdObject([BIRD_SPAWN_X, BIRD_SPAWN_Y], [0, (new BirdObject()).tap_speed]))
    // birds.push(new BirdObject([.5, .5], [0, -.032]))
    // birds.push(new BirdObject([.4, .6], [0, -.033]))
    // birds.push(new BirdObject([.3, .7], [0, -.034]))
    // birds.push(new BirdObject([.2, .8], [0, -.035]))
    // birds.push(new BirdObject([.1, .9], [0, -.036]))
    for (let bird of birds)
        entities.push(bird)

    setInterval(function simulation_tick() {
        let now = new Date().getTime() - start_time;
        // console.log("SIMULATION TICK", now)
        
        // TODO: change entities from events
        let ended_events = [];
        // if (queue.length) console.log('NEW HANDLING')
        for (let event_idx in queue) {
            let event = queue[event_idx];
            let delta = event.time - now;
            if (-11 < delta && delta < 13) {
                handleGameEvent(event, entities, birds);
                // console.log("HANDLING EVENT", entities)
            } else if (delta < -MAX_EVENT_DELAY) {
                ended_events.push(event_idx);
            }
        }

        ended_events.reverse()
        if (queue.length > 150) console.log('Q', queue.length)
        for (let event_idx of ended_events) {
            queue.splice(event_idx, 1)
        }

        // tick all entities
        let ended = []
        for (let rod_idx in entities) {
            let exists = entities[rod_idx].tick(queue, now, birds)
            // console.log(entities[rod_idx]);
            if (!exists) ended.push(rod_idx)
        }
        // console.log("ELEN", entities.length)
        // if (ended.length) console.log("DELETED THINGS")

        // remove entities that won't be simulated anymore
        ended.reverse()
        for (let rod_idx of ended) {
            entities.splice(rod_idx, 1)
        }

        // console.log(entities)
        // console.log(queue);

    }, 1000/FPS);

    // setInterval(() => {
    //     console.log("ENTITIES", entities)
    // }, 1000);
    
    return entities
}

function event_generator(queue, start_time) {  // imitates server and user sending events
    const ROD_INTERVAL = 1500
    const ROD_DELAY = 50
    
    setInterval(() => {
        // console.log("NEW ROD EVENT")
        let now = new Date() - start_time;
        queue.push(new GameEvent('Rod', now + ROD_DELAY, {
            // height: Math.random()*.7+.5
            height: ROD_SPAWN_Y()
        }));
        // console.log(queue.length)
        // console.log("QUEUE", queue)
    }, ROD_INTERVAL);

    document.onkeydown = (e) => {
        // if (e.repeat) return;
        let now = new Date() - start_time
        console.log(e, queue)
        switch (e.code) {
            case 'Space':
                queue.push(new GameEvent('Bird', now + BIRD_INTERVAL)); break;
            // case 'Enter':
            //     queue.push(new GameEvent('Freeze', now + BIRD_INTERVAL)); break;

        }
    }
}

function send_score(score) {
    console.log('ADD SCORE', score)
    console.log(game_score)
    return fetch(`http://${url+post_path}`, {
        method: "POST",
        headers: {'Content-Type': 'text/plain'},
        body: game_score.toString(),
    })
}

class GameEvent {
    constructor(type, time, props) {
        this.type = type
        this.time = time
        this.props = props
    }
}

function handleGameEvent(event, entities, birds) {
    switch (event.type) {
    case 'Rod':
        // console.log("Inserted new rod from event")
        entities.push(new RodObject(
            [ROD_SPAWN_X, event.props.height]));
        break;
    case 'Bird':
        // console.log("Bird Tap!")
        playJumpSound(); // Play jump sound when bird flaps
        for (let bird of birds) {
            bird.vel[1] = bird.tap_speed
            // bird.vel[1] += .001
            // bird.vel[1] = -bird.vel[1] 
            // console.log(bird.tap_speed)
        }
        break;
    case 'Freeze':
        for (let bird of birds)
            // if (bird.vel[1]) bird.vel[1] = 0;
            // else bird.vel[1] = bird.tap_speed;
            bird.vel[1] -= .001;
        break;
    case 'Hit':
        console.log("COLLISION")
        playCollisionSound(); // Play collision sound
        playGameOverSound(); // Play game over sound
        if (D_MOVING_BIRD) {
            entities.push(new BlankObject());
            send_score(game_score).then(()=>{
                window.location.href = 'leaderboard.html'
            }).catch(()=>{
                window.location.href = 'leaderboard.html'
            })
        }
        break;
        
    case 'Miss':
        if (last_rod_id === event.props.rod_id) return;
        game_score++;
        playPointSound(); // Play point sound when scoring
        playWhooshSound(); // Play whoosh sound when passing through pipes
        console.log("POINT!", game_score)
        console.log("UNEQUAL ROD ID", last_rod_id, event.props.rod_id)
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
        entity.render(canvas_context)
        if (entity instanceof BlankObject) break;
    }
}

function getImage(path){
    // conver image loading from async to synchronous using a Promise
    return new Promise(ret => {
        let img = new Image();
        img.src = path;
        img.onload = () => ret(img);  // return when img is loaded
    })

    // let canvas = document.createElement('canvas');
    // canvas.width= w*scale;
    // canvas.height= h*scale;
    // context = canvas.getContext("2d", {willReadFrequently: true});

    // // console.error(canvas.getBoundingClientRect());
    
    // // return img1;
    // context.scale(scale, scale)
    // context.drawImage(img1, 0, 0);
    // context.setTransform(1, 0, 0, 1, 0, 0)
    // // context.fillStyle = '#00ff0080'
    // // context.fillRect(0, 0, 1e4, 1e4)
    // // console.error(context.width)
    // return [canvas, w*scale, h*scale];
}

class GameObject {
    constructor(pos, vel) {
        this.pos = pos
        this.vel = vel
        this.id = new Date()
        this.set_canvas = this.set_canvas.bind(this)
    }

    set_canvas(img) {
        // console.log("Trying to set canvas for", this)
        // let [canvas, w, h] = props
        this.img = img
        // this.ctx = canvas.getContext('2d')
        // this.w = w
        // this.h = h
        // this.ctx = canvas.getContext('2d', {willReadFrequently: true})
    }
    
    tick() {
        this.pos[0] += this.vel[0]
        this.pos[1] += this.vel[1]

        // console.log("OBJ", screen.width*this.pos[0], screen.height*this.pos[1])
        
        if (this.pos[0] < -.6 || 1.6 < this.pos[0]) return false;
        if (this.pos[1] < -.6 || 1.6 < this.pos[1]) return false;
        return true;
    }

    render(canvas_context) {
        let offscreenRod = this.img
        let pos = [this.pos[0]*screen.width,this.pos[1]*screen.height];
        if (DEBUG) {
            canvas_context.fillStyle = "#fff"
            canvas_context.fillRect(...pos, 5, 5);
            canvas_context.fillStyle = "#000"
            canvas_context.fillRect(...pos, 4, 4);
        }
        canvas_context.drawImage(offscreenRod, pos[0], pos[1]);
    }

}

class RodObject extends GameObject {
    rod_gap = 650  // TODO convert to fraction
    rod_scale = .4

    img_promise = getImage("../Sprites/rod.png")
    
    constructor(pos) {
        super(pos, [0, 0], 10, 10)
        this.vel[0] = ROD_VEL
        this.img_promise.then(this.set_canvas)
    }

    get_corridor() {
        return [
            this.pos[0]-.06, this.pos[1]-.23,  // x1, y1
            this.pos[0]+.10, this.pos[1]+.03,     // x2, y2
        ]
    }

    tick(queue, now, birds) {
        const HIT_INTERVAL = 15
        
        this.pos[0] += this.vel[0]
        this.pos[1] += this.vel[1]

        // console.log("OBJ", screen.width*this.pos[0], screen.height*this.pos[1])
        
        if (this.pos[0] < -.6 || 1.6 < this.pos[0]) return false;
        if (this.pos[1] < -.6 || 1.6 < this.pos[1]) return false;

        let [x1, y1, x2, y2] = this.get_corridor();
        for (let bird of birds) {
            if (x1 < bird.pos[0] && bird.pos[0] < x2) {
                // console.log(this.pos[1]-bird.pos[1])
                if (y1 < bird.pos[1] && bird.pos[1] < y2) {
                    queue.push(new GameEvent('Miss', now + HIT_INTERVAL, {
                        bird: bird,
                        rod_pos: this.pos[1],
                        rod_id: this.id.toString(),
                    }))
                } else {
                    queue.push(new GameEvent('Hit', now + HIT_INTERVAL, {
                        bird: bird
                    }))
                }
            }
        }
        
        return true;
    }


    render(canvas_context) {
        // console.log(this.ctx)
        if (this.img === undefined) return;
        let offscreenRod = this.img
        let pos = [this.pos[0]*screen.width/this.rod_scale,this.pos[1]*screen.height/this.rod_scale];

        let [x1, y1, x2, y2] = this.get_corridor();
        let d_pos = [x1*screen.width,y1*screen.height];
        let d_dim = [(x2-x1)*screen.width,(y2-y1)*screen.height];
        
        if (DEBUG) {
            canvas_context.fillStyle = "#ff9088"
            canvas_context.fillRect(d_pos[0], 0, d_dim[0], screen.height)
            // canvas_context.fillStyle = "#ff9088"
            canvas_context.clearRect(...d_pos, ...d_dim)
        }
        canvas_context.scale(this.rod_scale, this.rod_scale)
        canvas_context.drawImage(offscreenRod, pos[0], +pos[1]+this.rod_gap/2);
        // // console.log(pos[0], pos[0]+this.w/2, this.w)
        // canvas_context.fillStyle = "#ffffff"
        // canvas_context.fillRect(...pos, 12, 12)
        // canvas_context.fillStyle = "#1b1b1b"
        // canvas_context.fillRect(...pos, 10, 10)
        canvas_context.scale(1, -1)
        canvas_context.drawImage(offscreenRod, pos[0], -pos[1]+this.rod_gap/2);

        canvas_context.setTransform(1, 0, 0, 1, 0, 0)
    }
}

class BirdObject extends GameObject {
    auto_thresh = .9
    tap_speed = -.026
    // tap_speed = -.006

    img_promise = getImage("../Sprites/bird not angry big.png")

    constructor(pos, vel) {
        super(pos, vel)
        // if (vel) this.tap_speed = vel[1]
        this.img_promise.then(this.set_canvas)
    }

    tick(queue, now) {
        if (D_MOVING_BIRD) {
            this.pos[0] += this.vel[0]
            this.pos[1] += this.vel[1]
        }

        this.vel[1] += GRAVITY
        // console.log("BIRD p & v", this.pos[1], this.vel[1])
        if (this.pos[1] > 1.0) {
            queue.push(new GameEvent('Hit', now + 15, {
                bird: this
            }))
        }
        // console.log("OBJ", screen.width*this.pos[0], screen.height*this.pos[1])
        
        if (this.pos[1] > this.auto_thresh) {
            // Bird hit the ground, play a subtle thud sound
            if (this.vel[1] > 0) { // Only play sound when bird is moving downward
                soundManager.playSound('collision'); // Reuse collision sound for ground hit
            }
            this.vel[1] = this.tap_speed;
        }
        // if (this.pos[1] > this.auto_thresh) this.vel[1] = -Math.abs(this.vel[1]);
        // if (this.pos[1] < 0) this.vel[1] = Math.abs(this.vel[1]);
        return true;
    }
}

class BlankObject extends GameObject {
    // img_promise = getImage('Sprites/blank.png')
    
    constructor() {
        super([0, 0], [0, 0])
        // this.img_promise.then(this.set_canvas)
    }
    
    render(canvas_context) {
        canvas_context.clearRect(0, 0, screen.width, screen.height)
        // console.log(this, ":- Image has been drawn")
    }
}