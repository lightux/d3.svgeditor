
var nbshape = 8;
var theme = 'Spectral';
var margin = 100;
var type = d3.scale.ordinal().range(d3.svg.symbolTypes);
var width = parseInt(d3.select("#render").style('width'));
var height = parseInt(d3.select("#render").style('height'));
var bbpadding = 4;
var radius = 3;
var induration = 100;
var outduration = 400;
colorbrewer[theme][nbshape].sort(function(a,b) { return Math.random()-.5; })
var symbols = d3.range(nbshape).map(function(i) {
  return {
    x: margin+(Math.random()*(width-margin*2)),
    y: margin+(Math.random()*(height-margin*2)),
    size: Math.random()*5000+500,
    color: colorbrewer[theme][nbshape][i],
    type: type(i),
    selected: false,
    timeout: false
  };
});

//var x = d3.scale.linear().range([0, width]);
//var y = d3.scale.linear().range([height, 0]);

function display() {
    function dragstart(d,i) { 
      d.moved = true;
      d3.select(this).select('path').attr("fill", d3.rgb(d.color)); 
    }
    
    function dragmove(d,i) {
      d.x = Math.max(margin, Math.min(width-margin, d3.event.x));
      d.y = Math.max(margin, Math.min(height-margin, d3.event.y));
      d3.select('.symbol-'+i).attr("transform", "translate(" + d.x + "," + d.y + ")");
    }
    
    function dragend(d,i) {
      d.moved = false;
      d3.select(this).select('path').attr("fill", d3.rgb(d.color).brighter());
    }
    
    function adragstart(d,i) { 
      d.parent.resized = true;
      d3.select(this).attr("fill", d.color); 
    }
    
    function adragmove(d,i) {
      var anchors = d.anchors;
      var b = d3.select('.background-'+d.num);
      
      d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y)
    
      if( i==0 ) { // top-left
        b.select('.anchor-1').attr('cy', anchors[1].y = d.y)
        b.select('.anchor-2').attr('cx', anchors[2].x = d.x)
      }
      else if( i==1 ) { // top-right
        b.select('.anchor-0').attr('cy', anchors[0].y = d.y)
        b.select('.anchor-3').attr('cx', anchors[3].x = d.x)
      }
      else if( i==2 ) { // bottom-left
        b.select('.anchor-3').attr('cy', anchors[3].y = d.y)
        b.select('.anchor-0').attr('cx', anchors[0].x = d.x)
      }
      else if( i==3 ) { // bottom-right
        b.select('.anchor-2').attr('cy', anchors[2].y = d.y)
        b.select('.anchor-1').attr('cx', anchors[1].x = d.x)
      }
      
      b.select('rect')
        .attr('width', Math.abs(anchors[1].x-anchors[0].x))
        .attr('height', Math.abs(anchors[1].y-anchors[2].y))
        .attr('x', anchors[0].x).attr('y', anchors[0].y)
    }
    
    function adragend(d,i) {
      d.parent.resized = false;
      d3.select(this).select('path').attr("fill", 'white');
    }
    
    var render = d3.select('#render').append('svg')
      .attr('class', 'render')
      .attr('width', width)
      .attr('height', height);
    
    render.selectAll('.header').data([0]).enter().append('text')
        .attr('transform', 'translate(20,40)')
        .attr('class', 'header')
        .text('d3.svgeditor');
    
    var drag = d3.behavior.drag()
      .origin(function(d) { return d; })
      .on("dragstart", dragstart)
      .on("drag", dragmove)
      .on("dragend", dragend);
    
    var renderEnter = render.selectAll('.symbol').data(symbols).enter()
      .append('g').attr('class', function(d,i) { return 'symbol-'+i })
        .on('mouseover', function(d,i) { 
          if( !d.moved && !d.resized ) {
            if( d.timeout ) clearTimeout(d.timeout);
            d.selected = true;
            d3.select(this).select('path').transition().duration(induration).attr("fill", d3.rgb(d.color).brighter())
            d3.select(this).selectAll('rect, circle').transition().duration(induration).style('opacity', 1)
          }
        })
        .on('mouseout', function(d,i) { 
          if( !d.moved && !d.resized ) {
            var obj = d3.select(this);
            d.timeout = setTimeout(function() {
              d.selected = false;
              obj.select('path').transition().duration(outduration).attr("fill", 'white')
              obj.selectAll('rect, circle').transition().duration(outduration).style('opacity', 1e-6)
            }, 300)
          }
        })
        .call(drag) // important :)
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
    
    renderEnter
      .append('path')
        .attr("stroke", function(d) { return d.color; })
        .attr('stroke-width', 2+'px')
        .attr("fill", 'white')
        .attr("d", function(d) { return d3.svg.symbol().type(d.type).size(d.size)(); })
        .each(function(d,i) {
          var bbox = d3.select(this)[0][0].getBBox()
          d.bbox = {
            x: bbox.x-bbpadding/2, y: bbox.y-bbpadding/2,
            width: bbox.width+bbpadding, height: bbox.height+bbpadding
          }
        })
    
    var backgroundEnter = renderEnter.insert('g', ':first-child').attr('class', function(d,i) { return 'background-'+i });
    
    backgroundEnter
      .append('rect')
        .attr('width', function(d) { return d.bbox.width })
        .attr('height', function(d) { return d.bbox.height })
        .attr('x', function(d) { return d.bbox.x }).attr('y', function(d) { return d.bbox.y })
        .attr('fill', 'transparent')
        .attr('stroke', function(d) { return d.color; })
        .style('opacity', 1e-6)
    
    var adrag = d3.behavior.drag()
      .origin(function(d) { return d; })
      .on("dragstart", adragstart)
      .on("drag", adragmove)
      .on("dragend", adragend);
    
    // north - south - east - west
    backgroundEnter
      .selectAll('.anchor').data(function(p,i) { 
        var anchors = [
          {x: p.bbox.x, y: p.bbox.y}, // top-left
          {x: p.bbox.x+p.bbox.width, y: p.bbox.y}, // top-right
          {x: p.bbox.x, y: p.bbox.y+p.bbox.height}, // bottom-left
          {x: p.bbox.x+p.bbox.width, y: p.bbox.y+p.bbox.height} // bottom-right
        ];
        var parent = p;
        anchors = anchors.map(function(d) {
          d.parent = parent;
          d.anchors = anchors;
          d.color = p.color;
          d.num = i;
          return d;
        })
        return anchors;
      }).enter()
        .append('circle')
          .attr('class', function(d,i) { return 'anchor-'+i })
          .attr('r', radius)
          .attr('cx', function(d) { return d.x })
          .attr('cy', function(d) { return d.y })
          .attr('stroke', function(d) { return d.color; })
          .attr('fill', 'white')
          .on('mouseover', function(d) { 
            d3.select(this)
              .attr('fill', function(d) { return d3.rgb(d.color).brighter() })
              .attr('r', radius*2)
          })
          .on('mouseout', function(d) {
            d3.select(this)
              .attr('fill', 'white')
              .attr('r', radius)
          })
          .call(adrag)
          .style('opacity', 1e-6)
}

display();