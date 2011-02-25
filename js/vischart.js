var chart;
var barHeight = 8;
var lcy = 0;
var rcy = 0;
var mid = w/2;

var leftWidth = "ratio";
var rightWidth = "buy";

var getHeight = function(d) { 
	return Math.floor(Math.sqrt(d / 2000)); 
};

var getWidth = function(d, type) { 
	switch(type) {
		case "rent":
			return Math.sqrt(d.rent) * 40;
		case "buy":
			return Math.sqrt(d.buy/100)*18;
		case "ratio":
			return d.ratio * 10;
		case "foreclosure":
			return d.foreclosure * 300 + 20;
		case "unemployment":
			return d.unemployment * 20;
		case "jobgrowth":
			return d.jobgrowth * 75;
		default: 
			return 0;
	}
};

var getY = function(d, side) {
	var h = getHeight(d.pop),
		cy = side == "right" ? rcy : lcy;

	// increment for later
	if (side == "right") {
		rcy += h + 1;
	} else {
		lcy += h + 1;
	}

	return cy;
};

var getTextSize = function(d) {
	return "bold " + (5*Math.log(numToRad(d.pop)/2)).toFixed(0) + "px sans-serif";
}

function initializeChart() {
	// sort on rent vs buy ratio
	nodes = nodes.sort(function(a,b) {return a.ratio - b.ratio} );
	
	chart = new pv.Panel()
		.width(w)
		.height(1480)
		.top(50)
		.bottom(50);
		
	chart.add(pv.Bar)
		.def("active", -1)
		.data(nodes)
		.width(function(d) { return getWidth(d, rightWidth); })
		.height(function(d) { return getHeight(d.pop); })
		.top(function(d) { return getY(d, "right"); })
		.left(mid + 2)
		.fillStyle(function(d) { return col(5 + d.ratio, "price_rent_ratio"); })
		.text(function(d) { return getTooltip(d, "w"); })
		.event("mouseover", pv.Behavior.tipsy())
	  .anchor("left").add(pv.Label)	
	    // .visible(function(d) { return d.r < 15 ? "" : true; })
	    .text(function(d) { return getText(d[rightWidth], rightWidth); })
		.textStyle("#000")
		.textAlign("left")
		.font(function(d) { return getTextSize(d); })
		.textBaseline("middle");
	
	chart.add(pv.Bar)
		.def("active", -1)
		.data(nodes)
		.width(function(d) { return getWidth(d, leftWidth); })
		.height(function(d) { return getHeight(d.pop); })
		.top(function(d) { return getY(d, "left"); })
		.left(function(d) { return mid - 2 - getWidth(d, leftWidth); })
		.fillStyle(function(d) { return col(5 + d.ratio, "price_rent_ratio"); })
		.text(function(d) { return getTooltip(d, "e"); })
		.event("mouseover", pv.Behavior.tipsy())
	  .anchor("right").add(pv.Label)	
	    // .visible(function(d) { return d.r < 15 || (d.name == "Jacksonville") ? "" : true; })
	    .text(function(d) { return d.name; })
		.textStyle("#000")
		.textAlign("right")
		.font(function(d) { return getTextSize(d); })
		.textBaseline("middle")
	.root.render();
}