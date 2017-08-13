var readline = require('readline');
var fs = require('fs');

var oldResultFile = process.argv[2];
var newOutputFile = process.argv[3];

if (!oldResultFile || !newOutputFile) {
  console.log("Need 2 args");
  process.exit(2)
}


function parseExperimentGraph( s ){
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

function isGraphObservableDestructive(graph) {
  var sources = graph.getSources();
  for (var i=0;i<sources.length;i++) {
    while (sources[i].incomingEdges && sources[i].incomingEdges.length > 0) {
      var e = sources[i].incomingEdges[sources[i].incomingEdges.length - 1];
      graph.deleteEdge(e.v1,e.v2,Graph.Edgetype.Directed);
    }
  }
  return !GraphAnalyzer.dConnected( graph, sources, graph.getTargets(), [] );
}

var fs = require('fs');
var output = fs.createWriteStream(newOutputFile);
output.once('open', function(fd) {
  var buffer = []; var bufferlen = 0;
  var finalbuffer = [];
  function myFlush(){
    output.write(buffer.join(""));
    buffer = "";
    bufferlen = 0;
  }
  function myWriteLine(line){
    buffer.push(line);
    buffer.push("\n");
    bufferlen += line.length + 1;
    if (bufferlen > 1000*1024) myFlush;
  }
  
  
  
  var reader = readline.createInterface({
    input: fs.createReadStream(oldResultFile)
  });
  
  var emptyAdj = 0;
  var observation = 0;
  var both = 0;
 
  function closeGroup(){
    var temp = "/** p(y|x), p(y), both: "+emptyAdj + " "+ observation + " "+ both+"**/";
    myWriteLine(temp);
    finalbuffer.push(temp);
    emptyAdj = observation = both = 0;
  }

  reader.on('close', function () {
    closeGroup();
    myWriteLine("\n\n");
    for (var i=0;i<finalbuffer.length;i++) myWriteLine(finalbuffer[i]);
    myFlush();
    output.end();
  });
  
  
  reader.on('line', function (line) {
    if ( /^ *[0-9]/.test(line)) {
      //var temp = /^( *[-0-9]+ *,){5} (\[[v0-9,]+\]) *, *(\[[v0-9,]+\]) *, (\[[v0-9,]+\]) *, .*/.exec(line);
      //if (!temp) throw "Failed to parse " + temp;
      var graph = parseExperimentGraph(line);
      var hasEmpty = GraphAnalyzer.isAdjustmentSet(graph, []);
      var isObservable =  isGraphObservableDestructive(graph);
      if (hasEmpty) emptyAdj++;
      if (isObservable) observation++;
      if (hasEmpty && isObservable) both++;
      myWriteLine("p(y|x): " + (hasEmpty ? 1 : 0) + " p(y): "+ (isObservable ? 1 : 0) );
    } else if (/\/\*OPTIONS/.test(line))
    { 
      closeGroup();
      myWriteLine(line);
      finalbuffer.push(line);
    }
  });
});