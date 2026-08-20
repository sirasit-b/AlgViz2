/* ==========================================================================
   NET renderer family — sequence (ladder) diagram + finite state machine
   Injected inside the engine IIFE, so it shares el/txt/W/H/RENDERERS.
   ========================================================================== */

/* ---- SEQUENCE / LADDER diagram (protocol handshakes, ARQ, request-reply) ---- */
RENDERERS.sequence = function(){
  var svg, cfg={actors:[],messages:[]};
  function mount(s){ svg=s; }
  function setup(c){ cfg=c||{actors:[],messages:[]}; }
  function colorFor(m, active){
    if(active) return 'var(--accent)';
    if(m.kind==='lost') return '#FF5C8A';
    if(m.kind==='ack')  return 'var(--text-3)';
    if(m.kind==='fin')  return '#A86BFF';
    return 'var(--line-2)';
  }
  function render(f){
    svg.innerHTML='';
    var actors=cfg.actors||[], msgs=cfg.messages||[], n=actors.length||1;
    var padX=150, gap=(W-2*padX)/((n-1)||1), topY=64, botY=H-30;
    var ax={}; actors.forEach(function(a,i){ ax[a.id] = (n===1)? W/2 : padX+i*gap; });
    // lifelines + actor headers
    actors.forEach(function(a){
      var x=ax[a.id];
      svg.appendChild(el('line',{x1:x,y1:topY+36,x2:x,y2:botY,stroke:'var(--line-2)','stroke-width':1.5,'stroke-dasharray':'3 6'}));
      svg.appendChild(el('rect',{x:x-72,y:topY,width:144,height:36,rx:10,'class':'n-box top'}));
      svg.appendChild(txt(x, topY+19, 'n-boxval', a.label));
    });
    var startY=topY+74, room=botY-startY-6, stepY=Math.min(52, room/((msgs.length)||1));
    var upto = (f.upto==null)? msgs.length-1 : f.upto;
    msgs.forEach(function(m,i){
      if(i>upto) return;
      var y=startY+i*stepY, x1=ax[m.from], x2=ax[m.to], active=(i===f.active);
      var col=colorFor(m,active), dash=(m.kind==='lost')?'5 5':'';
      if(x1===x2){ // self message (e.g. timeout) — small loop
        svg.appendChild(el('path',{d:'M'+x1+' '+y+' q 42 '+(stepY*0.5)+' 0 '+(stepY*0.7),fill:'none',stroke:col,'stroke-width':active?3:2,'stroke-dasharray':dash}));
        svg.appendChild(txt(x1+70, y+stepY*0.35, active?'n-ptr':'n-edgew', m.label));
        return;
      }
      var dir=x2>x1?1:-1;
      svg.appendChild(el('line',{x1:x1,y1:y,x2:x2,y2:y,stroke:col,'stroke-width':active?3.5:2,'stroke-dasharray':dash}));
      if(m.kind==='lost'){ // draw a red X on the line
        var mx=(x1+x2)/2; svg.appendChild(txt(mx, y+5, 'n-ptr', '✕'));
      } else {
        svg.appendChild(el('path',{d:'M'+x2+' '+y+' l'+(-9*dir)+' -5 v10 z',fill:col}));
      }
      svg.appendChild(txt((x1+x2)/2, y-9, active?'n-ptr':'n-edgew', m.label));
    });
  }
  return {mount:mount, render:render, setup:setup};
};

/* ---- FINITE STATE MACHINE (protocol states, automata, process states) ---- */
RENDERERS.statemachine = function(){
  var svg, cfg={states:[],trans:[]};
  function mount(s){ svg=s; }
  function setup(c){ cfg=c||{states:[],trans:[]}; }
  function render(f){
    svg.innerHTML='';
    var states=cfg.states||[], trans=cfg.trans||[], pos={};
    states.forEach(function(s){ pos[s.id]={x:s.x,y:s.y}; });
    // transitions (quadratic curve so back-edges don't overlap)
    trans.forEach(function(t,i){
      var a=pos[t.from], b=pos[t.to]; if(!a||!b) return;
      var active=(f.takenIdx===i);
      var dx=b.x-a.x, dy=b.y-a.y, len=Math.sqrt(dx*dx+dy*dy)||1;
      var bow=(t.bow!=null? t.bow : 34);
      var mx=(a.x+b.x)/2 - dy/len*bow, my=(a.y+b.y)/2 + dx/len*bow;
      var col=active?'var(--accent)':'var(--line-2)';
      svg.appendChild(el('path',{d:'M'+a.x+' '+a.y+' Q '+mx+' '+my+' '+b.x+' '+b.y,fill:'none',stroke:col,'stroke-width':active?3.5:1.8}));
      svg.appendChild(txt(mx, my-4, active?'n-ptr':'n-edgew', t.label));
    });
    // states (rounded rects to fit long labels like ESTABLISHED)
    states.forEach(function(s){
      var cur=(f.current===s.id), vis=(f.visited && f.visited.indexOf(s.id)>=0);
      var cls='n-node'+(cur?' current':(vis?' visited':''));
      svg.appendChild(el('rect',{x:s.x-62,y:s.y-21,width:124,height:42,rx:21,'class':cls}));
      svg.appendChild(txt(s.x, s.y+1, (cur||vis)?'n-nodeval ink':'n-nodeval', s.label));
    });
  }
  return {mount:mount, render:render, setup:setup};
};
