"use strict";
/*
 *  Copyright © Andrew S 2017, LegitSoulja
 *
 *  ALL RIGHTS RESERVED : 2017
 */
(function (window) {
    var events = {}

    window.addEvent = function (name, func) {
        events[name] = func;
    }
    window.callEvent = function (name, a, b, c, d, e, f) {
        return events[name](a, b, c, d, e, f);
    }
})(window);


(function (web, document, window, PIXI) {
    var dev = 1;


    // Variables
    var nodes = new HashBounds(),
        allNodes = [],
        virusNodes = [],
        nodeCache = [],
        playerCells = [],
        players = [],
        customSkins = [],
        skinCache = [],
        isTyping = false,
        started = false,
        config = {},
        renderOptions = {
            autoResize: true,
            resolution: 1,
            clearBeforeRender: true,
            roundPixels: true
        },
        keys = [];

    // Connectivity variables
    var socket;

    // Skins array
    var skins = [];

    // System Variables

    var time = Date.now(),
        frameID = 0;

    // Visual Variables
    var renderer,
        stage,
        camera,
        chat = {
            container: null,
            graphics: null,
            input: null,
        },
        leaderBoard = {
            container: null,
            graphics: null,
            title: null,
            content: null,
            nodes: null
        },
        score = {
            container: null,
            graphics: null,
            text: null
        },
        viewZoom = 0;


    if (!dev) {
        window.console = {};
        window.console.log = function () {

        }

    }
    console.log("Dev Mode")
        // Classes

    class Player {
        constructor(id) {
            this.id = id;
            this.cells = new QuickMapV2();

        }
        addNode(node) {
            this.cells.set(node.id, node)

        }
        removeNode(node) {
            this.cells.delete(node.id)
        }
    }



    class Node {
        constructor(id, x, y, size, mass, color) {
            this.id = id;
            this.x = x;
            this.y = y;
            this.order = 0;
            this.oldX = x;
            this.maxX = x;
            this.oldY = y;
            this.maxY = y;
            this.color = 0xFFF
            this.angle = 0;
            this.oldSize = size;
            this.size = size;
            this.newSize = size;
            this.mass = mass;
            this.velocity = 0;
            this.posTime = time;
        }
        setPos(x, y) {
            this.x = x;
            this.y = y;
            this.oldX = x;
            this.maxX = x;
            this.oldY = y;
            this.maxY = y;
            this.posTime = time;
        }
        setMove(x, y, mx, my, velocity, angle) {
            this.x = x;
            this.y = y;
            this.angle = angle;
            this.velocity = velocity;
            this.oldX = x;
            this.maxX = mx;
            this.oldY = y;
            this.maxY = my;
            this.angle = angle;
            this.cos = Math.cos(angle)
            this.sin = Math.sin(angle)
        }
        setSize(size) {
            this.oldSize = size;
            this.size = size;
            this.newSize = size;
        }
        updatePos() {
            if (!this.velocity) { // Older servers
                var a = (time - this.posTime) / 120;
                this.x = a * (this.maxX - this.oldX) + this.oldX;
                this.y = a * (this.maxY - this.oldY) + this.oldY;

            } else { // OpenAgar
                var step = (time - this.posTime) * this.velocity;
                this.x = this.oldX + (this.cos * step);
                this.y = this.oldY + (this.sin * step);

                if (this.maxX > this.oldX) { // maximum
                    this.x = Math.min(this.maxX, this.x);
                } else {
                    this.x = Math.max(this.maxX, this.x);
                }
                if (this.maxY > this.oldY) {
                    this.y = Math.min(this.maxY, this.y);
                } else {
                    this.y = Math.max(this.maxY, this.y);
                }

            }
        }
        getBounds() {
            return {
                x: this.x - this.size,
                y: this.y - this.size,
                width: this.size >> 1,
                height: this.size >> 1
            }

        }


    }
    allNodes.push(new Node(1, 1, 1, 100, 100))
        // Main Graphics Setup/loop
        //  allNodes[0].setMove(1,1,800,800,.6,0)
    playerCells.push(allNodes[0])



    // Functions


    function getScreen() {
        return {
            x: window.innerWidth,
            y: window.innerHeight
        }
    }

    function setUp(_skins) {
        if (started) return;
        started = true;
        /*
                         +-----------+
                         |  Camera   |
                         |           |
                         +-----+-----+
                               |
      +----------------------------------------------+
      |                        |                     |
      |                        |                     |
      |                        |                     |
+-----+-----+            +-----+-----+        +------+------+
|           |            |           |        |             |
|   Game    |            |Leaderboard|        |    Chat     |
|           |            |           |        |             |
+-----------+            +-----------+        +-------------+
        */

        //Create the renderer
        //renderer = PIXI.autoDetectRenderer(256, 256);

        if (_skins instanceof Array) {
            skins = _skins;
            if (dev) console.log(`Loaded ${_skins.length} skins`);
        }

        let win = getScreen();
        renderer = new PIXI.autoDetectRenderer(win.x, win.y, renderOptions);

        if (!renderer) return alert("Could not establish renderer");

        renderer.backgroundColor = 0xFFFFFF;

        //Add the canvas to the HTML document
        document.body.appendChild(renderer.view);

        //Create a container object called the `stage`
        stage = new PIXI.Container();

        // Create camera
        camera = new PIXI.Container();

        // Create Chat
        chat.container = new PIXI.Container();
        chat.graphics = new PIXI.Graphics();
        chat.graphics.alpha = .8;
        chat.graphics.beginFill(0xCCCCCC);
        chat.graphics.drawRect(0, 0, 300, 30);
        chat.graphics.endFill();

        chat.container.addChild(chat.graphics);
        // chat.container.addChild(chat.input);
        camera.addChild(chat.container);

        // Create Leaderboard
        leaderBoard.container = new PIXI.Container();
        leaderBoard.title = new PIXI.Text("", new PIXI.TextStyle({
            fontfamily: 'Ubuntu',
            fontSize: 25,
            align: "center",
            breakWords: true,
            fontWeight: "bold",
            fill: 0xFFFFFF,
        }));

        leaderBoard.content = new PIXI.Text("", new PIXI.TextStyle({
            fontfamily: 'Ubuntu',
            fontSize: 18,
            align: "left",
            breakWords: true,
            fill: 0xFFAAAA,
            fontWeight: "bold",
        }));


        leaderBoard.graphics = new PIXI.Graphics();
        leaderBoard.graphics.alpha = .8;
        leaderBoard.graphics.beginFill(0xCCCCCC);
        leaderBoard.graphics.drawRect(0, 0, 200, 345);
        leaderBoard.graphics.endFill();
        leaderBoard.container.addChild(leaderBoard.graphics);

        leaderBoard.title.anchor.x = leaderBoard.title.anchor.y = 0.5

        leaderBoard.container.addChild(leaderBoard.title);
        leaderBoard.container.addChild(leaderBoard.content);

        // score

        score.container = new PIXI.Container();
        score.graphics = new PIXI.Graphics();

        score.text = new PIXI.Text("Score: 100", new PIXI.TextStyle({
            fontfamily: 'Ubuntu',
            fontSize: 24,
            align: "center",
            breakWords: true,
            fill: 0xFFFFFF,
            fontWeight: "bold",
        }));

        score.graphics.alpha = .8;
        score.graphics.beginFill(0xCCCCCC);
        score.graphics.drawRect(0, 0, score.text.width + 10, 35); // re-sizes via text with + 10
        score.graphics.endFill();

        score.container.addChild(score.graphics);
        score.container.addChild(score.text);
        camera.addChild(score.container);
        camera.addChild(leaderBoard.container);
        camera.addChild(stage)

        //Tell the `renderer` to `render` the `stage`
        renderer.render(camera)

        // CSS
        renderer.view.style.position = "absolute";
        renderer.view.style.display = "block";

        // Resize to fit screen
        resize();
        gameLoop();
    }

    function resize() {
        if (renderer instanceof Object) {
            let win = getScreen();
            renderer.resize(win.x, win.y);
            chat.graphics.position.set(10, renderer.height - (chat.graphics.height + 10));
            leaderBoard.graphics.position.set(renderer.width - (leaderBoard.graphics.width + 10), 10);
            leaderBoard.title.position.set(leaderBoard.graphics.x + leaderBoard.graphics.width / 2, leaderBoard.graphics.y + 20);
            score.graphics.position.set(10, 10);
            score.text.position.set(score.graphics.x + 5, score.graphics.y + 3);
            return;
        }
    }

    function gameLoop() {
        time = Date.now();


        frameID = (frameID < 0xFFFFFFFF) ? (frameID += 1) : frameID = 0;

        if ((frameID % 6) == 0) sendMouse(renderer.plugins.interaction.mouse.global)

        allNodes.forEach((node) => {
            node.updatePos();
            if (node.node) updateNode(node);
            else drawNode(node);
        })

        virusNodes.forEach((node) => { // viruses have overlap priority
            node.updatePos();
            if (node.node) updateNode(node);
            else drawNode(node);
        })
        stage.children.sort(function (a, b) { // sort by size for overlap rules
            return (a.order || a.size - b.size);
        })
        moveCamera()
            // Draw stuff
        updateLeaderBoard([
            {
                name: "Bot"
            },
            {
                name: "Bot1"
            },
            {
                name: "•?((¯°·._.• $ɨяµ$ •._.·°¯))؟•"
            }
		])

        renderer.render(camera);
        window.requestAnimationFrame(gameLoop);
    }


    function sendChat(msg) {
        alert(msg);
    }


    function updateLeaderBoard(nodes, title = "Leaderboard") {
        // update leaderboard title, if different.
        if (leaderBoard.title.text != title) leaderBoard.title.text = title;

        if (!(nodes instanceof Array)) return;

        // check if nodes exist
        if (nodes.length < 1) return;

        // rows to store each username, which will fit into table.
        var rows = [],
            maxRows = 10; // max rows allowed for leaderboard.

        // position.
        var pos = 1;

        for (var i = 0; i < nodes.length; i++) {
            if (i > (maxRows - 1)) break; // 
            rows.push(pos.toString() + ": " + (nodes[i].name).slice(0, 21));
            pos++;
        }

        // update content
        leaderBoard.content.text = rows.join("\r\n");
        rows = null; // clear mem

        // re-draw graphics, and reposition content.
        leaderBoard.graphics.clear();
        leaderBoard.graphics.beginFill(0xCCCCCC);
        leaderBoard.graphics.drawRect(0, 0, 200, leaderBoard.content.height + 50);
        leaderBoard.graphics.endFill();
        leaderBoard.content.position.set(leaderBoard.title.x - (leaderBoard.title.width / 2) - 10, (leaderBoard.title.y + leaderBoard.title.height) - 10);
    }

    function moveCamera() {
        var total = 0;
        var tX = 0,
            tY = 0;
        playerCells.forEach((node) => {
            total += node.size
            tX += node.x;
            tY += node.y;
        })

        tX = tX / playerCells.length
        tY = tY / playerCells.length
        var newViewZoom = total;
        newViewZoom = Math.pow(Math.min(64 / newViewZoom, .0001), .4) * viewRange();
        viewZoom = (9 * viewZoom + newViewZoom) / 10;
        //var x = Math.floor((stage.pivot.x + tX) / 2);
        // var y = Math.floor((stage.pivot.y + tY) / 2)

        //(0,0) for us is center of the screen
        stage.position.x = renderer.width / 2;
        stage.position.y = renderer.height / 2;
        // scale
        stage.scale.set(viewZoom, viewZoom);

        // remember, center anchor/origon is 0.5 

        stage.pivot.set(tX, tY)

        stage.pivot.x = (stage.pivot.x + tX) >> 1;
        stage.pivot.y = (stage.pivot.y + tY) >> 1;
        //stage.pivot.set(x, y)
        // console.log(viewZoom, stage.position, renderer.width)
    }


    function viewRange() {
        var ratio;
        ratio = Math.max(renderer.height / 64, renderer.width / 64);
        return ratio;
    }

    function drawNode(node) {
        var circle = new PIXI.Graphics();
        circle.beginFill(node.color);
        circle.drawCircle(0, 0, node.size);
        circle.endFill();

        // is it possible to attatch this to the node itself? This is a memory leak, creating a new Text object every frame.
        var name = new PIXI.Text(node.name, new PIXI.TextStyle({
            fontfamily: 'Ubuntu',
            fontSize: 20,
            align: "center",
            breakWords: true,
            fill: 0xFFFFFF,
        }));

        name.anchor.x = name.anchor.y = 0.5;
        name.position.set(circle.x, circle.y);
        circle.addChild(name);
        node.node = circle;
        node.nameGraphics = name;
        stage.addChild(circle);
    }

    function updateNode(node) {
        var circle = node.node;
        //console.log(node.x,node.y)
        circle.position.set(node.x, node.y);
        circle.width = node.size << 1; // - Radius * 2
        circle.height = node.size << 1;
    }

    function sendKey(key) {

    }

    function onKeyUp(key) {
        if (!keys[key]) return;

        keys[key] = false;
    }

    function removeCustomSkins() {
        for (var i in skins)
            if (skins[i].id < 0) skins.splice(i, 1);
        window.callEvent('remove_custom_skins');
    }

    function gen(min, max) {
        return (Math.random() * (max - min) + min);
    }

    function updateCustomSkins(skins) {
        removeCustomSkins();
        let c = []; // stores used id's

        // so, if a server has custom skins, parse into an array as so
        var a = [{
            name: "undefined", // needs name,
            url: "undefined", // needs url
            id: null, // id's are randomly generated.
		}];

        function g() {
            let _ = ~~(gen(-1E3, -1));
            if (c.indexOf(_) > 0) return gen();
            c.push(_);
            return _;
        }

        for (var i in a) {
            a[i].id = g(); // generate id, 
            skins.push(a[i]); // push custom skin to game skins
        }

        // send custom skins to UI, so they can be searched.
        window.callEvent('add_custom_skins', a)
    }

    function onKeyDown(key) {
        if (keys[key]) return;

        keys[key] = true;

        switch (key) {
        case 32: // space
            break;
        case 87: // w
            break;
        case 81: // q
            break;
        case 70: // f
            break;
        case 69: // e
            break;
        case 82: // r
            break;
        case 84: // t
            break;
        case 27: // esc
            break;
        }


    }

    function connect(url) {
        nodes = new HashBounds();
        allNodes = []
        virusNodes = []
        nodeCache = []
        playerCells = []
        players = []
        customSkins = []

        socket = io(url);
        socket.on('error', function () {

        })
        socket.on('reconnect_error', function () {


        })
        socket.on('reconnect_failed', function () {


        })
        socket.on('disconnect', function () {

        })
        socket.on('connect', function () {

        });
        socket.on('hello', function () {

        })
        socket.on('infop', function () {

        })
        socket.on('accepted', function () {

        })
        socket.on('kicked', function () {

        })
        socket.on('ddos', function () {

        })
        socket.on('ddosover', function () {

        })
        socket.on('mes', function () {

        })
        socket.on('updatepos', function () {

        })
        socket.on('cpacket', function () {

        })
        socket.on('rip', function () {

        })
        socket.on('killer', function () {

        })
        socket.on('nodes', function () {

        })
        socket.on('delnodes', function () {

        })
        socket.on('lb', function () {

        })
        socket.on('chat', function () {

        })
    }


    function sendMouse(pos) {

        pos = stage.toLocal(pos)
        var x = pos.x,
            y = pos.y;

    }

    // Events
    window.addEventListener('resize', resize);
    window.addEventListener("keyup", function (e) {
        onKeyUp(e.keyCode);
    });
    window.addEventListener("keydown", function (e) {
        onKeyDown(e.keyCode);
    })

    if (typeof (ajs) != "undefined") {
        window.addEvent('skins_loaded', function (e) {
            return setUp(e.detail.skins); // skins are passed when all skins are loaded.
            // close/open ui using
            // ajs.hide_ui(), ajs.show_ui()
        });
        window.addEvent('option_change', function (e) {
            e = e.detail;
            // e.state : true = checked, false = unchecked
            switch (e.option.toLowerCase()) {
            case "no_skins":
            case "no_names":
            case "dark_theme":
            case "no_colors":
            case "show_mass":
            case "hide_chat":
            case "smooth_render":
            case "acid_mode":
            case "hide_grid":
            default:
                return alert("Unknown option " + e.option)
            }
        });
        window.addEvent('skins_failed', function () {
            // callback from ui, if skins failed to load.
        });

        window.addEvent('onPlay', function (e) {
            e = e.detail;
            // e.name = (string)
            // e.skin = (object)
            // skin id = e.skin.id;
            // skin url = e.skin.url
            // skin name = e.skin.name
            // etc
            console.log(e.skin);
            // hide ui
            ajs.hide_ui();
        });
    } else {
        if (dev) return setUp();
        return alert("Failed to start engines");
    }

})($, document, window, PIXI)