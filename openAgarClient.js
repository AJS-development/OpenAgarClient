"use strict";
/*
  *  Copyright © Andrew S 2017, LegitSoulja
  *
  *  ALL RIGHTS RESERVED : 2017
*/

(function(web, document, window, PIXI) {
  // Variables

  var nodes = new HashBounds(),
    allNodes = [],
    virusNodes = [],
    nodeCache = [],
    playerCells = [],
    players = [],
    skinCache = [],
    customSkins = [],
    config = {},
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
    camera,
    chat = {
      container: null,
      graphics: null,
      placeholder: null,
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

  // Classes

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
  playerCells.push(allNodes[0])

  function getScreen() {
    return {
      x: window.innerWidth,
      y: window.innerHeight
    }
  }

  function setUp() {
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

    let win = getScreen();
    if (PIXI.utils.isWebGLSupported()) renderer = new PIXI.WebGLRenderer(win.x, win.y, renderOptions);
    else renderer = new PIXI.CanvasRenderer(win.x, win.y, renderOptions);

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
    chat.graphics.position.set(10, renderer.height - (chat.graphics.height + 10))
	  
    chat.placeholder = new PIXI.Text("Press ENTER to Chat!", new PIXI.TextStyle({
      fontfamily: 'Ubuntu',
      fontSize: 15,
      align: "center",
      breakWords: true,
      fill: 0x000000,
    }));
    chat.placeholder.alpha = .7;
    chat.placeholder.position.set(chat.graphics.x + 10, chat.graphics.y + 6);
	  
    chat.container.addChild(chat.graphics);
    chat.container.addChild(chat.placeholder);
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
    leaderBoard.graphics.position.set(renderer.width - (leaderBoard.graphics.width + 10), 10);
    leaderBoard.container.addChild(leaderBoard.graphics);
	
    leaderBoard.title.position.set(leaderBoard.graphics.x + leaderBoard.graphics.width / 2,leaderBoard.graphics.y + 20);
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
    score.graphics.drawRect(0,0,score.text.width + 10, 35); // re-sizes via text with + 10
    score.graphics.endFill();
    score.graphics.position.set(10,10);
    score.text.position.set(score.graphics.x + 5, score.graphics.y + 3);
	  
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

  function gameLoop() {
	  
    time = Date.now();
    frameID = (frameID < 0xFFFFFFFF) ? frameID++ : frameID = 0;

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
    stage.children.sort(function(a, b) { // sort by size for overlap rules
      return (a.order || a.size - b.size);
    })
    moveCamera()
    // Draw stuff
    updateLeaderBoard([
		{name: "Bot"},
		{name: "Bot1"},
		{name: "•?((¯°·._.• $ɨяµ$ •._.·°¯))؟•"},
		{name: "Bot3"},
		{name: "Bot4"},
		{name: "Bot4"},
		{name: "Bot4"},
		{name: "Bot4"},
		{name: "Bot4"},
		{name: "Bot4"},
		{name: "Bot4"},
		{name: "Bot4"},
		{name: "Bot4"},
		{name: "Bot4"},
		{name: "Bot4"},
		{name: "Bot4"},
		{name: "Bot4"},
		{name: "Bot4"},
		
	])


    renderer.render(camera);
    window.requestAnimationFrame(gameLoop);
  }

  //
  window.addEventListener('resize', resize);
  //
  function resize() {
    if (renderer !== null) {
      let win = getScreen();
      renderer.resize(win.x, win.y);
    }
  }

  function updateLeaderBoard(nodes, title = "Leaderboard") {
    if (!(nodes instanceof Array)) return;
	
	// update leaderboard title, if different.
    leaderBoard.title.text = title;
	
	// check if nodes exist
    if (nodes.length < 1) return;
	
	// rows to store each username, which will fit into table.
	var rows = [];
	
	// max rows allowed for leaderboard.
	var maxLeaderBoardRows = 10;
	
	// leaderboard offset.
	maxLeaderBoardRows--;
	
	// positions.
	var place = 1;
	
    for (var i = 0; i < nodes.length; i++) {
		if(i > maxLeaderBoardRows) continue;
		rows.push(place.toString() + ": " + (nodes[i].name).slice(0,21));
		place++;
    }
	
	// join rows
	var d = rows.join("\r\n");
	rows = [];
	// update content
	leaderBoard.content.text = d;
	
	// re-draw graphics, and reposition content.
	leaderBoard.graphics.clear();
    leaderBoard.graphics.beginFill(0xCCCCCC);
    leaderBoard.graphics.drawRect(0, 0, 200, leaderBoard.content.height + 50);
    leaderBoard.graphics.endFill();
	leaderBoard.content.position.set(leaderBoard.title.x - (leaderBoard.title.width / 2) - 10,(leaderBoard.title.y + leaderBoard.title.height) - 10);
	
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
    //stage.pivot.set(x, y)
    // console.log(viewZoom, stage.position, renderer.width)
  }



  // Functions

  function viewRange() {
    var ratio;
    ratio = Math.max(renderer.height / 7, renderer.width / 7);
    return ratio;
  }



  function drawNode(node) {
    var circle = new PIXI.Graphics();
    circle.beginFill(node.color);
    circle.drawCircle(0, 0, node.size);
    circle.endFill();

    var name = new PIXI.Text("AJS", new PIXI.TextStyle({
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
    stage.addChild(circle);
  }

  function updateNode(node) {
    var circle = node.node;
    circle.position.set(node.x, node.y);
    circle.width = node.size >> 2;
    circle.height = node.size >> 2;
  }


  setUp()
})($, document, window, PIXI)
