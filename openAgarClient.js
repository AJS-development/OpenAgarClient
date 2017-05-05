"use strict";
/*
    Copyright © Andrew S 2017
    
    ALL RIGHTS RESERVED
*/



(function (web, document, window, PIXI) {
    // Variables

    var nodes = new HashBounds(),
        allNodes = [],
        virusNodes = [],
        nodeCache = [],
        playerCells = [],
        players = [],
        skinCache = [],
        customSkins = [],
        config = {
        },
        renderOptions = {
            autoResize: true,
            resolution: 1,
            clearBeforeRender: true,
            roundPixels: true
        };

    // System Variables

    var time = Date.now(),
        frameID = 0;

    // Visual Variables

    var renderer,
        stage,
        viewZoom = 0;

    // Classes

    class Node {
        constructor(id, x, y, size, mass, color) {
            this.id = id;
            this.x = x;
            this.y = y;
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
    allNodes.push(new Node(1, 100, 100, 200, 100))
        // Main Graphics Setup/loop
    playerCells.push(allNodes[0])

    function getScreen(){
        return {
            x: window.innerWidth,
            y: window.innerHeight
        }
    }

    function setUp() {

        //Create the renderer
        //renderer = PIXI.autoDetectRenderer(256, 256);

        let win = getScreen();
        if(PIXI.utils.isWebGLSupported()) renderer = new PIXI.WebGLRenderer(win.x,win.y; renderOptions);
        else renderer = new Engine.CanvasRenderer(win.x,win.y,renderOptions);
        
        (!renderer) return alert("Could not establish renderer");
        
        renderer.backgroundColor = 0xFFFFFF;
        
        //Add the canvas to the HTML document
        document.body.appendChild(renderer.view);

        //Create a container object called the `stage`
        stage = new PIXI.Container();

        //Tell the `renderer` to `render` the `stage`
        renderer.render(stage);

        // CSS
        renderer.view.style.position = "absolute";
        renderer.view.style.display = "block";

        // Resize to fit screen
        renderer.resize(window.innerWidth, window.innerHeight);
    }

    function gameLoop() {
        time = Date.now();
        frameID = (frameID < 0xFFFFFFFF) ? frameID++ : frameID = 0;

        allNodes.sort(function (a, b) { // sort by size for overlap rules
            return a.size - b.size;
        })

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
        camera()
            // Draw stuff
        renderer.render(stage);
        window.requestAnimationFrame(gameLoop);

    }
    setUp()
    gameLoop();



    function camera() {
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
        newViewZoom = Math.pow(Math.min(64 / newViewZoom, 1), .4) * viewRange();
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
            //stage.pivot.set(x, y)
        console.log(viewZoom, stage.position, renderer.width)
    }

    function viewRange() {
        var ratio;
        ratio = Math.max(renderer.height / 300, renderer.width / 300);
        return ratio;
    }

    function drawNode(node) {
        var circle = new PIXI.Graphics();
        node.node = circle;
        circle.beginFill(node.color);
        circle.drawCircle(0, 0, node.size);
        circle.position.set(node.x, node.y)
        circle.endFill();
        stage.addChild(circle);
    }

    function updateNode(node) {
        var circle = node.node;
        circle.position.set(node.x, node.y);
        circle.width = node.size >> 2;
        circle.height = node.size >> 2;
    }


})($, document, window, PIXI)
