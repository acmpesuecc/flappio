function init() {
    if (!window.screen.width){
        return [];
    }
    const start_time = new Date()
    let event_queue = []
    let entities = simulate(event_queue, start_time);  // simulate() is asynchronous

    // entities.push(new RodObject([.6, .56]));
    // entities.push(new BlankObject([.4, .4], 602, 144))
    // entities.push(new RodObject([.3, .2]));
    // entities.push(new BirdObject([.1, .3], [0, 1.2], 512, 512))
    // entities.push(new BirdObject([.2, .3], [0, 1.3], 512, 512))
    // entities.push(new BirdObject([.3, .3], [0, 1.4], 512, 512))
    // entities.push(new BirdObject([.4, .3], [0, 1.5], 512, 512))
    // entities.push(new BirdObject([.5, .3], [0, 1.6], 512, 512))
    // entities.push(new BirdObject([.6, .3], [0, 1.7], 512, 512))
    slide_bg()

    let canvas = document.querySelector('#game-canvas')
    canvas.height = screen.height
    canvas.width  = screen.width
    let ctx = canvas.getContext("2d", {willReadFrequently: true});

    console.log(screen.width, screen.height)
    let Buff = new OffscreenCanvas(screen.width, screen.height);
    let b_ctx = Buff.getContext('2d', {willReadFrequently: true})

    // ctx.scale(.5, .5)
    // ctx.fillStyle = "#FF0000";
    // ctx.fillRect(450, 450, 150, 75);
    // ctx.setTransform(1, 0, 0, 1, 0, 0)

    // getImage("sprites/rod.png").then(img => {
    //     // let rodCtx = canvas.getContext('2d');
        
    //     // let data = rodCtx.getImageData(0, 0, w, h);
    //     // ctx.putImageData(data, 0, 500)
    //     ctx.scale(.5, .5)
    //     ctx.drawImage(img, 0, 550)
    //     ctx.scale(1, -1)
    //     ctx.drawImage(img, 0, -450)
    //     ctx.setTransform(1, 0, 0, 1, 0, 0)
    // });  // canvas

    setInterval(() => {
        render_entities(entities, b_ctx)
        
        // Change the color of the score to red
        b_ctx.fillStyle = 'red';
        b_ctx.font = '40px Fascinate, cursive';
        b_ctx.textAlign = 'center';
        b_ctx.fillText(game_score, canvas.width / 2, 50);

        let data = b_ctx.getImageData(0, 0, canvas.width, canvas.height);
        requestAnimationFrame(() => {
            ctx.putImageData(data, 0, 0)
            b_ctx.clearRect(0, 0, screen.width, screen.height)
        });
    }, 1000/FPS);

    console.log("INIT ENDED, returning", event_queue)
    return event_queue
}

function slide_bg() {
    const cloudSpeed = .2
    const bgGrassSpeed = 1
    const fgGrassSpeed = 1.5
    
    let cloudPos = 0
    let bgGrassPos = 0
    let fgGrassPos = 0
    setInterval(() => {
        document.querySelector('.clouds1').style.transform = "translate("+cloudPos+"px, 0px)"
        document.querySelector('.bgGrass1').style.transform = "translate("+bgGrassPos+"px, 0px)"
        document.querySelector('.fgGrass1').style.transform = "translate("+fgGrassPos+"px, 0px)"
        document.querySelector('.clouds2').style.transform = "translate("+(cloudPos+screen.width)+"px, 0px)"
        document.querySelector('.bgGrass2').style.transform = "translate("+(bgGrassPos+screen.width)+"px, 0px)"
        document.querySelector('.fgGrass2').style.transform = "translate("+(fgGrassPos+screen.width)+"px, 0px)"
        
        cloudPos = (cloudPos-cloudSpeed)%screen.width
        bgGrassPos = (bgGrassPos-bgGrassSpeed)%screen.width
        fgGrassPos = (fgGrassPos-fgGrassSpeed)%screen.width
        // console.log(bgGrassPos)
    }, 1000/FPS)
}