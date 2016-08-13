/*const fs = require('fs');

var _ = require('underscore-min.js');
for (var prop in _) 
  global[prop] = _[prop];


var dagitty = require('dagitty-alg.js');
for (var prop in dagitty) 
  global[prop] = dagitty[prop];



//eval( + 
//eval(fs.readFileSync("underscore-min.js")+fs.readFileSync("dagitty.js")+"")

console.log("loaded")
*/ 

/*
function setGraph(g) {
  new GraphLayouter.Spring( g ).layout()
  DAGitty.controllers[0].setGraph(g);  
}
*/

function serialize( g ){
	
	return "" +
		"[" + g.getSources().map(function(v){return v.id}).join(",") + "], " +
		"[" + g.getTargets().map(function(v){return v.id}).join(",") + "], " +
		"[" + g.getLatentNodes().map(function(v){return v.id}).join(",") + "], {" +
		g.vertices.values().map(function( v ){
		return v.id + ": [" + v.outgoingEdges.map(function(w){return w.v2.id}).join(",")+"]"
	} ).join(", ")+"}"
}

function parse( s ){
		var g = new Graph(), i, j
		
		//s = s.replace(/v([0-9]+)/g,"$1");
		s = s.replace(/(v[0-9]+)/g,"\"$1\"");
		var data = JSON.parse("["+s+"]");
		var n = data[0];
		
		var vertices = [null];
		for( var i = 0 ; i < n ; i ++ ) vertices.push(g.addVertex( "v" + (i+1) ));
    
    var props = ["Source", "Target", "LatentNode"];
    for (var i = 0; i < 3; i ++)
      for (var j = 0; j < data[data.length-1-3+i].length; j ++)
        g["add" +props[i]](data[data.length-1-3+i][j]);
		
		var edges = data[data.length - 1];
		for (var f in edges)
  		for (var i = 0; i < edges[f].length; i++)
    		//g.quickAddDirectedEdge( g.getVertex(f), g.getVertex(edges[f][i]) )
    		g.addEdge( f, edges[f][i] );
		
		g.setType("dag")
		return g
}

/*perkovic: Adjust(X, Y, G) = PossAn(X ∪ Y, G) \ (X ∪ Y ∪ Forb(X, Y, G)).

Forb(X, Y, G) = {W 0 ∈ V : W 0 ∈ PossDe(W, G), for some W ∈ / X  which lies on a proper possibly directed path from X to Yin G}.

Adjust(X, Y, D)\De(X, D)*/

/*function listMsasTotalEffectPearl(g)
{
  var sources = g.getSource();
  var targets = g.getTargets();
  for (var i=0;i<sources.length;i++) {
    var s = sources[i];
    var desc = g.descendantsOf([s]);
    if (_.intersection(desc, targets).length > 0 && _intersection(desc, sources).length > 1) 
    if (desc)
  }
}*/

function listMsasTotalEffectGunderline(g){
		/*var gtype = g.getType()
		if( gtype != "dag" && gtype != "pdag" && gtype != "mag" && gtype != "pag" ){
			throw( "Cannot compute total affect adjustment sets for graph of type "+gtype )
		}
		if( gtype == "pdag" ){
			g = GraphTransformer.cgToRcg( g )
		}	
		if( !g ){ return [] }
	
		if(GraphAnalyzer.violatesAdjustmentCriterion(g)){ return [] }*/
		
		var sources = g.getSources();
		var gback = g.clone();
		sources = gback.getVertex(_.pluck(sources, "id"));

		var adjusted_nodes = gback.getAdjustedNodes()
		var latent_nodes = gback.getLatentNodes().concat( gback.descendantsOf(sources) )

		_.each( sources, function(s){
  		_.each( _.without( s.getChildren(), sources ), function( c ){
    		gback.deleteEdge( s, c, Graph.Edgetype.Directed )
       });
     });
		
		
		var gam = GraphTransformer.moralGraph( GraphTransformer.ancestorGraph( gback ) )					
		return GraphAnalyzer.listMinimalSeparators( gam, adjusted_nodes, latent_nodes )
}

//this test Pearl's adjustment criterion, is there a source X\in\bX d-connected to \bY through an edge into X
//Note that this is not the same as a d-connection between \bX and \bY not using edges out of \bX (e.g. X1 <- X2 -> Y is adjusted by the empty set, yet it fails Pearl criterion)
function isAdjustmentPearl(g, Z){
  var sources = g.getSources();
  var targets = g.getTargets();
  var result = true;
  for (var i=0;i<sources.length;i++) {
    var s = sources[i];
    var children = s.getChildren(s);
    _.each( children,  function(c) { g.deleteEdge( s, c, Graph.Edgetype.Directed ) } );
    result =  !GraphAnalyzer.dConnected( g, [s], targets, Z );
    _.each( children,  function(c) { g.quickAddDirectedEdge( s, c ) } );
    if (!result) return result;
  }
  return result;
}


var rep = 30;
var options = [
  {"n": 10, "pEdge": 2/9, "minSource": 1, "minTarget": 1, "pLatentNode": 0.1},
  {"n": 25, "pEdge": 2/24, "minSource": 1, "minTarget": 1, "pLatentNode": 0.1},
  {"n": 25, "pEdge": 2/24, "minSource": 3, "minTarget": 3, "pLatentNode": 0.1},
  {"n": 50, "pEdge": 2/49, "minSource": 1, "minTarget": 1, "pLatentNode": 0.1},
  {"n": 50, "pEdge": 2/49, "minSource": 5, "minTarget": 5, "pLatentNode": 0.1},
  {"n": 100, "pEdge": 2/99, "minSource": 1, "minTarget": 1, "pLatentNode": 0.1},
  {"n": 100, "pEdge": 2/99, "minSource": 10, "minTarget": 10, "pLatentNode": 0.1},
  {"n": 250, "pEdge": 2/249, "minSource": 1, "minTarget": 1, "pLatentNode": 0.1},
  {"n": 250, "pEdge": 2/249, "minSource": 25, "minTarget": 25, "pLatentNode": 0.1},
  {"n": 500, "pEdge": 2/499, "minSource": 1, "minTarget": 1, "pLatentNode": 0.1},
  {"n": 500, "pEdge": 2/499, "minSource": 50, "minTarget": 50, "pLatentNode": 0.1},
  {"n": 1000, "pEdge": 2/999, "minSource": 1, "minTarget": 1, "pLatentNode": 0.1},
  {"n": 1000, "pEdge": 2/999, "minSource": 100, "minTarget": 100, "pLatentNode": 0.1},
];

var results = [];

function summary(){
  console.log("/* " + rep);
  for (var i=0;i<results.length;i++) {
    console.log(JSON.stringify(options[i]));
    console.log(JSON.stringify(results[i]));
  }
  console.log("*/");
}

for (var o=0;o < options.length;o++) {
var n = options[o].n;
var curres = {"pearl": 0, "cbc": 0, "pearlcounts": {}, "cbccounts": {} };
console.log("\n\n\n\n/*OPTIONS: " + JSON.stringify(options[o])+"*/");
for (var r=0;r < rep;r++) {
  var g = GraphGenerator.randomDAG(n, options[o]);/*
      "pEdge": 0.2, 
      //"pSource": 0.1, "pTarget": 0.1, "pLatentNode": 0.1,
      //"minSource": 1, "minTarget": 1, "minLatentNode": 4,
      //"pSource": 0.1, "pTarget": 0.2, "pLatentNode": 0.9,
      //"maxLatentNode": 3
      "minSource": 1, "minTarget": 1, "pLatentNode": 0.1,
      });*/
  var canonical = GraphAnalyzer.canonicalAdjustmentSet(g);
  var pearlOk = false;
  if (canonical.length > 0) pearlOk = isAdjustmentPearl(g, _.without(canonical[0], g.descendantsOf(g.getSources()) ));
  
  var gunder = listMsasTotalEffectGunderline(g).length;
  var total = GraphAnalyzer.listMsasTotalEffect(g).length;
  
  var res = n + ", " + 
            (pearlOk ? "1, " : "0, ") + 
            canonical.length + ", " + 
            gunder + ", " +
            total +  ", " + serialize(g)
  
  if (pearlOk) curres["pearl"]++;
  if (canonical.length) curres["cbc"]++;
  if (curres.pearlcounts[gunder]) curres.pearlcounts[gunder]++;
  else curres.pearlcounts[gunder] = 1;
  if (curres.cbccounts[total]) curres.cbccounts[total]++; 
  else curres.cbccounts[total] = 1;
  
  console.log(res)
}
results.push(curres);
summary();
}
