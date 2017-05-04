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



(function(web) {
    // Variables
    
    var nodes = new HashBounds(),
        nodeCache = [],
        skinCache = [],
        customSkins = [],
        config = {
            
            
        };
    
    
    // Classes
        
    class Node {
     constructor(x,y,velocity,accel,size,mass) {
         this.x = x;
         this.y = y;
         this.oldX = x;
         this.maxX = x;
         this.oldY = y;
         this.maxY = y;
         this.oldSize = size;
         this.size = size;
         this.newSize = size;
         this.mass = mass;
         this.velocity = velocity;
         this.acceleration = accel;
        }
        setPos(x,y) {
         this.x = x;
         this.y = y;
         this.oldX = x;
         this.maxX = x;
         this.oldY = y;
         this.maxY = y;
        }
        setSize(size) {
            this.oldSize = size;
            this.size = size;
            this.newSize = size;
        }
        
        
    }
    
    
    
    
})($)
