const FPS = 60  // combine into one file

class GameEvent {
    constructor(type, time, props) {
        this.type = type
        this.time = time
        this.props = props
    }
}

class GameObject {
    constructor(pos, vel, w, h, img) {
        this.pos = pos
        this.vel = vel
        this.w = w
        this.h = h
        this.img = img;
    }

    tick() {
        this.pos[0] += this.vel[0]
        this.pos[1] += this.vel[1]

        if (this.pos[0] < 0 || this.pos[0] < 500) return false;
        if (this.pos[1] < 0 || this.pos[1] < 500) return false;
        return true;
    }

    render(canvas) {
        
    }

}

class RodObject extends GameObject {
    rod_vel = -.001;
    
    constructor(pos) {
        super(pos, [0, 0])
        this.vel[0] = this.rod_vel
    }

    render(canvas) {
        // TODO: RENDER THE ROD HERE
    }
    
}

class BirdObject extends GameObject {

    constructor(pos, vel, /* TODO: OTHER ARGUMENTS */) {
        super(pos, vel)
        // TODO: CONSTRUCTOR CODE
    }

    tick() {
        // TODO: UPDATE BIRD HERE
    }

    render(canvas) {
        // TODO: RENDER THE BIRD HERE
    }
}

function render_entities(entities, canvas) {
    for (entity of entities) entity.render(canvas)
}

function handleGameEvent(event, entities) {
    switch (event.type) {
    case 'Rod':
        entities.push(new RodObject([1.1, event.props.height]));
        break;
    }
}

function simulate(queue) {

    let start_time = event_generator(queue);

    let entities = []

    setInterval(function simulation_tick() {

        let now = new Date().getTime() - start_time;
        
        // TODO: change entities from events
        for (let event of queue) {
            let delta = event.time - now;
            if (delta < 10 && delta > -10) {
                handleGameEvent(event, entities);
                console.log(entities)
            }
        }
        
        
        // tick all entities
        let ended = []
        for (let rod_idx in entities) {
            let exists = entities[rod_idx].tick()
            // console.log(entities[rod_idx]);
            if (!exists) ended.push(rod_idx)
        }
        if (ended.length) console.log(ended, entities)

        // remove entities that won't be simulated anymore
        ended.reverse()
        for (let rod_idx of ended) {
            entities.splice(rod_idx, 1)
        }

        // console.log(entities, queue);

    }, 1000/FPS);

    return entities

}

function event_generator(queue) {  // imitates server and user sending events
    let rodN = 0;
    const ROD_INTERVAL = 6000;
    
    let start_time = new Date();
    setInterval(() => {
        let now = new Date() - start_time;
        queue.push(new GameEvent('Rod', now+ROD_INTERVAL, {
            height: Math.random()
        }));
        rodN++;
    }, ROD_INTERVAL);

    return start_time;

}