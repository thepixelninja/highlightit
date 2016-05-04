/*
 * A JQUERY HIGHLIGHT PLUGIN
 * BY ED FRYER
 */

$.fn.highlightIT = function(options){

	var defaults = {
		debug 		: true,
		editMode 	: true,
		fillColor	: "#ff0000",
		lineColor	: "#ff0000",
		lineWidth	: 1,
		opacity		: 0.8,
		shapes		: [],
		showShapes	: true,
		save		: function(){},
		hover		: function(){},
		click		: function(){},
		extend		: function(){}
	}
	var options = $.extend(defaults,options);
	var hl 		= {};

	if(options.editMode){
		options.fillColor = "red";
		options.lineColor = "red";
	}

	hl.events = function(){

		$(window).on("resize",function(){
			hl.resize();
		});

		hl.canvas.on("mousemove",function(e){
			hl.hoverShape = hl.shapeCollisionListener(e);
			if(typeof(options.hover) === "function"){
				options.hover(hl.hoverShape,hl,options,e);
			}
		});

		hl.canvas.on("click",function(e){
			hl.clear();
			hl.drawShapes();
			if(options.editMode){
				var position = hl.getMousePosition(e);
				hl.updatePath(position);
				hl.drawPath();
			}
			if(hl.hoverShape){
				hl.selectedShape = hl.hoverShape;
				hl.drawShape(hl.selectedShape);
				if(typeof(options.click) === "function"){
					options.click(hl.selectedShape,hl,options,e);
				}
			}else{
				hl.selectedShape = false;
			}
		});

		hl.canvas.on("dblclick",function(){
			if(options.editMode){
				hl.saveShape();
				hl.clear();
				hl.drawShapes();
			}
		});

		hl.buttons.save.on("click",function(){
			hl.saveShapes();
		});

		hl.buttons.clear.on("click",function(){
			hl.reset();
			hl.saveShapes();
		});

		hl.buttons.del.on("click",function(){
			var shapes 	     = [];
			hl.currentPath   = [];
			$.each(hl.shapes,function(i,shape){
				if(hl.selectedShape !== shape){
					shapes.push(shape);
				}
				if(i == hl.shapes.length-1){
					hl.shapes = shapes;
					hl.clear();
					hl.drawShapes();
				}
			});
		});

	}

	hl.drawShapes = function(ctx){

		if(!options.showShapes && !options.editMode){
			return false;
		}

		if(ctx === undefined){
			ctx = hl.ctx;
		}

		ctx.beginPath();
		$.each(hl.shapes,function(i,shape){
			hl.drawShapePath(shape);
			if(i === hl.shapes.length-1){
				hl.setCanvasStyles(options.opacity/2);
				ctx.fill();
				hl.setCanvasStyles(options.opacity);
				ctx.stroke();
				ctx.closePath();
			}
		});

	}

	hl.drawShapePath = function(shape,ctx){

		if(ctx === undefined){
			ctx = hl.ctx;
		}

		if(shape.path !== undefined){
			shape = shape.path;
		}

		if(options.debug && ctx === hl.ctx){
			console.log("drawing shape",shape);
		}

		hl.setCanvasStyles();

		ctx.moveTo(shape[0].x,shape[0].y);
		$.each(shape,function(i,point){
			ctx.lineTo(point.x,point.y);
		});

	}

	hl.drawShape = function(shape){

		hl.ctx.beginPath();
		hl.drawShapePath(shape);
		hl.setCanvasStyles(options.opacity/2);
		hl.ctx.fill();
		hl.setCanvasStyles(options.opacity);
		hl.ctx.stroke();
		hl.ctx.closePath();

	}

	hl.lineTo = function(position,positions,key,ctx){

		if(ctx === undefined){
			ctx = hl.ctx;
		}

		if(key === undefined){
			key = 1;
		}

		ctx.beginPath();

		hl.setCanvasStyles();

		var lastPoint = positions[key-1];
		if(lastPoint === undefined){
			lastPoint = position;
		}

		ctx.moveTo(lastPoint.x,lastPoint.y);
		ctx.lineTo(position.x,position.y);
		ctx.stroke();
		ctx.closePath();

	}

	hl.clear = function(ctx){

		if(ctx === undefined){
			ctx = hl.ctx;
		}

		ctx.clearRect(0,0,hl.naturalWidth,hl.naturalHeight);
		if(options.debug && ctx === hl.ctx){
			console.log("clearing canvas");
		}

	}

	hl.reset = function(){

		hl.clear();
		hl.shapes 		= [];
		hl.currentPath 	= [];

	}

	hl.setCanvasStyles = function(opacity){

		if(opacity === undefined){
			opacity = options.opacity;
		}

		hl.ctx.strokeStyle 	= options.lineColor;
		hl.ctx.fillStyle 	= options.fillColor;
		hl.ctx.lineWidth	= options.lineWidth;
		hl.ctx.globalAlpha  = opacity;

		hl.utilityCtx.strokeStyle 	= "#ffffff";
		hl.utilityCtx.fillStyle 	= "#ffffff";
		hl.utilityCtx.lineWidth		= options.lineWidth;

	}

	hl.drawPath = function(){

		$.each(hl.currentPath,function(i,line){
			hl.lineTo(line,hl.currentPath,i);
		});


	}

	hl.updatePath = function(position){

		hl.currentPath.push(position);
		if(options.debug){
			console.log("updating path",hl.currentPath);
		}

	}

	hl.saveShapes = function(){

		if(typeof(options.save) === "function"){
			options.save(hl.shapes);
		}

	}

	hl.saveShape = function(){

		var shape = {
			id 		: Math.round(Math.random()*100000),
			path 	: hl.currentPath
		}
		hl.shapes.push(shape);
		hl.currentPath = [];
		if(options.debug){
			console.log("saving shape",hl.shapes);
		}

	}

	hl.getMousePosition = function(e){

		var offset 	 = hl.el.offset();
		var diffX	 = (hl.naturalWidth-hl.el.width())/hl.el.width();
		var diffY	 = (hl.naturalHeight-hl.el.height())/hl.el.height();
		var pageX	 = Math.round(e.pageX-offset.left);
		var pageY	 = Math.round(e.pageY-offset.top);
		var position = {
			x : pageX+(pageX*diffX),
			y : pageY+(pageY*diffY)
		}
		return position;

	}

	hl.resize = function(){

		hl.clear();
		hl.canvas.add(hl.utilityCanvas)
			.attr("width",hl.naturalWidth)
			.attr("height",hl.naturalHeight)
		;
		clearTimeout(hl.resizeListener);
		hl.resizeListener = setTimeout(function(){
			hl.afterResize();
		},500)

	}

	hl.afterResize = function(){

		hl.drawShapes();

	}

	hl.setup = function(){

		hl.canvas = $("<canvas></canvas>");
		hl.el.append(hl.canvas);
		hl.ctx = hl.canvas.get(0).getContext("2d");

		hl.utilityCanvas = $("<canvas id='utilityCanvas'></canvas>");
		hl.el.append(hl.utilityCanvas);
		hl.utilityCtx = hl.utilityCanvas.get(0).getContext("2d");

		hl.selectedShape = false;
		hl.hoverShape 	 = false;

		hl.image = hl.el.find("img");
		if(hl.image.length == 0){
			alert("Error: The hlghlightIT container must contain an image");
		}
		if(hl.image.length > 1){
			alert("Error: The hlghlightIT container must only contain one image");
		}

		hl.naturalWidth  = hl.image.get(0).naturalWidth;
		hl.naturalHeight = hl.image.get(0).naturalHeight;

		hl.currentPath 	= [];
		hl.shapes 		= options.shapes;

		hl.buttons = {
			save 		: $("<button class='btn btn-default' id='save'>Save</button>"),
			del  		: $("<button class='btn btn-default' id='delete'>Delete Selected</button>"),
			clear		: $("<button class='btn btn-default' id='clear'>Clear</button>"),
			container 	: $("<div class='hlAdminButtons'></div>")
		};
		hl.buttons.container
			.append(hl.buttons.save)
			.append(hl.buttons.del)
			.append(hl.buttons.clear)
		;
		if(options.editMode){
			hl.el.after(hl.buttons.container);
		}

	}

	hl.style = function(){

		hl.el.css({
			position : "relative"
		});

		if(options.editMode){
			hl.el.css("cursor","crosshair");
		}

		hl.canvas.add(hl.utilityCanvas).css({
			position 	: "absolute",
			top			: 0,
			left		: 0,
			width		: "100%",
			height		: "100%",
			"z-index"	: 8
		});

        var opacity = 0;
		if(options.debug){
			opacity = 0.5;
		}

		hl.utilityCanvas.css({
			opacity 	: opacity,
			"z-index"	: 7
		});

		hl.buttons.container.css({
			background 		: "#ccc",
			padding			: "5px",
			"border-radius" : "5px",
			width			: "100%",
			float			: "left"
		});

		hl.buttons.container.find("button").css({
			margin : "0 5px 0 0"
		});

	}

	hl.shapeCollisionListener = function(e){

		var selected = false;

		var position = hl.getMousePosition(e);

		$.each(hl.shapes,function(i,shape){

			hl.clear(hl.utilityCtx);
			hl.utilityCtx.fillStyle = "#000000";
			hl.utilityCtx.fillRect(0,0,hl.naturalWidth,hl.naturalHeight);

			hl.utilityCtx.beginPath();

			hl.drawShapePath(shape,hl.utilityCtx);

			hl.utilityCtx.fill();
			hl.utilityCtx.stroke();
			hl.utilityCtx.closePath();

			var pixel = hl.utilityCtx.getImageData(position.x,position.y,1,1).data;

			if(pixel[0] !== 0){
				selected = shape;
			}

			hl.clear(hl.utilityCtx);

		});

		return selected;

	}

	return this.each(function(){

		hl.el = $(this);
		hl.setup();
		hl.style();
		hl.events();
		hl.resize();

		if(typeof(options.extend) === "function"){
			options.extend(hl,options);
		}

	});

}
