var vis;
var legend;
var legendText;
var sim;

var i = 0,
    w = 940,
    h = 760,
    mapMargin = 30,
	currentColorScale = "price_rent_ratio",
	currentSizeScale = "scale_population";

var nodes = [],
    codeToNode = [],
    links = [];

var scale = pv.Geo.scale()
    .domain({lng: 74, lat: 17}, {lng: 140, lat: 52})
    .range({x: mapMargin, y: mapMargin}, {x: w-mapMargin, y: h-mapMargin});
	
var legendMargin = 20,
    ease = null;

function initializeMap() {
	var collisionConstraint = pv.Constraint.collision(function(d) { return d.r + 1; }),
	    positionConstraint = pv.Constraint.position(function(d) { return d.p; }),
	    linkConstraint = pv.Force.spring(100).links(links),
		legendRange = pv.range(5,30.1,5);

	var legendScale = pv.Scale.linear()
	    .domain(14, 35)
	    .range(legendMargin, w - legendMargin);
	
	sim = pv.simulation(nodes)
	    .constraint(collisionConstraint)
	    .constraint(positionConstraint)
	    .constraint(linkConstraint)
	    .force(pv.Force.drag());

	vis = new pv.Panel()
	    .width(w)
	    .height(h)
		.left(10)
	    .top(30)
	    .bottom(40);

	vis.add(pv.Dot)
		.def("active", -1)
	    .data(nodes)
	    .left(function(d) 	{ return d.x; })
	    .top( function(d) 	{ return d.y; })
	    .radius(function(d) { return d.r; })
	    .fillStyle(function(d) { return col(city_stats[d.name][currentColorScale]); })
	    .strokeStyle(null)
		// .event("mouseover", function() { return this.active(this.index).parent;})
	    // .event("mouseout", 	function() { return this.active(-1).parent;})
		.text(function(d) { return getTooltip(d, "s"); })
		.event("mouseover", pv.Behavior.tipsy())
	  .anchor("center").add(pv.Label)	
	    .visible(function(d) { return d.r < 20 ? this.anchorTarget().active() == this.index : true; })
	    .text(function(d) 	 { return d.name; })
		.textStyle("#000")
		.font(function(d) 	 { return "bold " + (4*Math.log(d.r)).toFixed(0) + "px sans-serif";})
		.textAlign("center")
		.textBaseline("middle");

	// Add the color bars for the color legend
	legend = vis.add(pv.Bar)
	    .data(legendRange)
	    .bottom(function(d) { return this.index * 15 - 35; })
	    .height(10)
	    .width(10)
	    .left(20)
	    .fillStyle(function(d) { return col(d); })
	    .lineWidth(null);

	legendText = legend.anchor("right").add(pv.Label)
	    .textAlign("left");
	
	updateLegend();

	ease = setInterval(function() {
	  if (i++ > 140) {
	    clearInterval(ease);
	    ease = null;
	  }
	  sim.step();
	  positionConstraint.alpha(Math.pow(.7, i + 2) + .03);
	  linkConstraint.damping(Math.pow(.7, i + 2) + .03);
	  vis.render();
	}, 42);	
}

// recalculate the scaling metric
function updateMetric() {
	nodes.forEach(function(n) {
		switch (currentSizeScale) {
			case "scale_annual_rent":
				n.r = city_stats[n.name].annual_rent / 1000;
				break;
			case "scale_list_price":
				n.r = Math.sqrt(city_stats[n.name].list_price / 700);
				break;
			case "scale_population":
			default:
				n.r = numToRad(city_stats[n.name].population);
				break;
		}
	});
	
	links.forEach(function(l) { return l.length = (l.sourceNode.r + l.targetNode.r + 2); });
	i = 0;
	var stepSome = setInterval(function() {
		if (i++ > 50) clearInterval(stepSome);
		sim.step();
		vis.render();
	}, 20);
};

// update the little legend in the lower left
function updateLegend() {
	
	switch (currentColorScale) {
		case "price_rent_ratio":
		    legend.data(pv.range(5,30.1,5))
		    	.fillStyle(function(d) { return col(d); });
			
			legendText
			    .text(function(d) { 
					var stub =  (d+1) + " - " + (d+5);
					if (d < 10) {
						return stub + " More affordable to buy";
					} else if (d > 25) {
						return stub + " More affordable to rent";
					} else if (d >= 15 && d < 20) {
						return stub + " Renting less expensive, but buying might be better";
					} else {
						return stub;
					}
				});
			
			break;
			
		case "annual_rent": 
		    legend.data(pv.range(500, 3500, 500))
		    	.fillStyle(function(d) { return col(d * 12); });
			
			legendText
			    .text(function(d) { return "$" + (d) + " - $" + (d + 500); });
			break;
		case "list_price":
		
		    legend.data(pv.range(100000, 700000, 100000))
			    .fillStyle(function(d) { return col(d); });
			
			legendText
			    .text(function(d) { return monetize(d) + " - " + monetize(d + 100000); });
			break;
	}
	
	vis.render();
};

function numToRad(n) {
	return Math.sqrt(n)/100;
};