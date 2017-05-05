"use strict"
/*
    OpenAgar Client
    Copyright (C) 2017 Andrew S

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published
    by the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.


*/



(function(web,document,window,pixi) {
    // Variables
    
    var nodes = new HashBounds(),
        nodeCache = [],
        skinCache = [],
        customSkins = [],
        config = {
            
            
        };
    
    // System Variables
    
    var time = Date.now(),
        frameID = 0;
    
    // Classes
        
    class Node {
     constructor(id,x,y,size,mass) {
         this.id = id;
         this.x = x;
         this.y = y;
         this.oldX = x;
         this.maxX = x;
         this.oldY = y;
         this.maxY = y;
         this.angle = 0;
         this.oldSize = size;
         this.size = size;
         this.newSize = size;
         this.mass = mass;
         this.velocity = 0;
         this.posTime = time;
        }
        setPos(x,y) {
         this.x = x;
         this.y = y;
         this.oldX = x;
         this.maxX = x;
         this.oldY = y;
         this.maxY = y;
            this.posTime = time;
        }
        setMove(x,y,mx,my,velocity,angle) {
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
                   this.x = Math.min(this.maxX,this.x); 
                } else {
                    this.x = Math.max(this.maxX,this.x);
                }
                if (this.maxY > this.oldY) {
                   this.y = Math.min(this.maxY,this.y); 
                } else {
                    this.y = Math.max(this.maxY,this.y);
                }
                
            }
        }
        
        
    }
    
    
    function gameLoop() {
        time = Date.now();
        frameID = (frameID < 0xFFFFFFFF) ? frameID ++ : frameID = 0;
        
        // Draw stuff
        
        window.requestAnimationFrame(gameLoop);       
    }
    gameLoop();
    
    
})($,document,window,PIXI)
