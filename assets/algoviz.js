
/* ==========================================================================
   AlgoViz ENGINE — registry, helpers, Player, router, catalog
   ========================================================================== */
(function(){
'use strict';

var ROOT = document.querySelector('.btd-algoviz[data-av-root]');
if(!ROOT) return;
var REDUCE = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
var SVGNS = 'http://www.w3.org/2000/svg';

/* ---------- tiny helpers ---------- */
function $(sel, c){ return (c||ROOT).querySelector(sel); }
function $$(sel, c){ return Array.prototype.slice.call((c||ROOT).querySelectorAll(sel)); }
function el(tag, attrs){ var e=document.createElementNS(SVGNS, tag); if(attrs) for(var k in attrs) e.setAttribute(k, attrs[k]); return e; }
function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
function randInt(a,b){ return a + Math.floor(Math.random()*(b-a+1)); }
function animOK(){ return window.anime && !REDUCE; }

/* item helper: numbers -> [{v,id}] with stable ids for slide animation */
function toItems(arr){ return arr.map(function(v,i){ return {v:v, id:i}; }); }
function cloneItems(items){ return items.map(function(it){ return {v:it.v, id:it.id}; }); }

/* parse a comma/space list of integers */
function parseList(str, maxN, minV, maxV){
  var parts = String(str).split(/[\s,]+/).filter(Boolean).map(function(x){ return parseInt(x,10); }).filter(function(n){ return !isNaN(n); });
  if(minV!=null||maxV!=null) parts = parts.map(function(n){ return clamp(n, minV==null?-9999:minV, maxV==null?9999:maxV); });
  if(maxN) parts = parts.slice(0, maxN);
  return parts;
}

/* ---------- domains → fields (categories) → modules ---------- */
var DOMAINS = [
  { id:'cs',  th:'วิทยาการคอมพิวเตอร์', en:'Computer Science',      note:'อัลกอริทึม · โครงสร้างข้อมูล · ทฤษฎีการคำนวณ' },
  { id:'cpe', th:'วิศวกรรมคอมพิวเตอร์',  en:'Computer Engineering',  note:'เครือข่าย · ระบบปฏิบัติการ · ดิจิทัลลอจิก · สถาปัตยกรรม', hidden:true },
  { id:'se',  th:'วิศวกรรมซอฟต์แวร์',    en:'Software Engineering',  note:'ดีไซน์แพตเทิร์น · เวอร์ชันคอนโทรล · การทดสอบ' }
];
var DOMAINMAP = {}; DOMAINS.forEach(function(d){ DOMAINMAP[d.id]=d; });

var CATS = [
  { id:'sort',   domain:'cs',  nameTh:'การเรียงลำดับ',            nameEn:'Sorting',                cls:'cat-sort',   glyph:'bars' },
  { id:'search', domain:'cs',  nameTh:'การค้นหา',                 nameEn:'Searching',              cls:'cat-search', glyph:'search' },
  { id:'linear', domain:'cs',  nameTh:'โครงสร้างข้อมูลเชิงเส้น',   nameEn:'Linear Data Structures', cls:'cat-linear', glyph:'stack' },
  { id:'tree',   domain:'cs',  nameTh:'โครงสร้างข้อมูลแบบต้นไม้',  nameEn:'Tree Structures',        cls:'cat-tree',   glyph:'tree' },
  { id:'graph',  domain:'cs',  nameTh:'กราฟและเส้นทาง',           nameEn:'Graph & Pathfinding',    cls:'cat-graph',  glyph:'graph' },
  { id:'recur',  domain:'cs',  nameTh:'การเรียกซ้ำ',              nameEn:'Recursion',              cls:'cat-recur',  glyph:'recur' },
  { id:'net',    domain:'cpe', nameTh:'เครือข่ายคอมพิวเตอร์',     nameEn:'Networking',             cls:'cat-net',    glyph:'net' }
];
var CATMAP = {}; CATS.forEach(function(c){ CATMAP[c.id]=c; });

var ALGOS = [];          // registration order
var BYID = {};
var AlgoViz = window.AlgoViz = {
  register: function(m){ ALGOS.push(m); BYID[m.id]=m; },
  _cats: CATS, _catmap: CATMAP, _byid: BYID, _list: ALGOS,
  helpers: null   // filled below for modules
};

/* ---------- card glyph SVGs ---------- */
var GLYPHS = {
  bars:   '<rect x="3" y="12" width="4" height="9"/><rect x="10" y="7" width="4" height="14"/><rect x="17" y="3" width="4" height="18"/>',
  search: '<circle cx="10" cy="10" r="6"/><path d="m21 21-5.2-5.2"/>',
  stack:  '<rect x="4" y="4" width="16" height="4" rx="1"/><rect x="4" y="10" width="16" height="4" rx="1"/><rect x="4" y="16" width="16" height="4" rx="1"/>',
  queue:  '<rect x="3" y="8" width="5" height="8" rx="1"/><rect x="10" y="8" width="5" height="8" rx="1"/><rect x="17" y="8" width="4" height="8" rx="1"/>',
  list:   '<circle cx="5" cy="12" r="2.5"/><circle cx="13" cy="12" r="2.5"/><path d="M7.5 12H10.5"/><path d="M15.5 12H19"/><path d="M19 9v6"/>',
  hash:   '<path d="M9 3 7 21M17 3l-2 18M3 9h18M2 15h18"/>',
  tree:   '<circle cx="12" cy="5" r="2.5"/><circle cx="6" cy="14" r="2.5"/><circle cx="18" cy="14" r="2.5"/><path d="M12 7.3 6.8 11.8M12 7.3l5.2 4.5M6 16.5v2M18 16.5v2"/>',
  trav:   '<circle cx="12" cy="5" r="2.5"/><circle cx="6" cy="14" r="2.5"/><circle cx="18" cy="14" r="2.5"/><path d="M12 7.3 6.8 11.8M12 7.3l5.2 4.5"/><path d="M4 20h16" stroke-dasharray="2 2"/>',
  heap:   '<path d="M12 3 3 20h18L12 3z"/><path d="M12 3v17M7.5 11.5h9"/>',
  graph:  '<circle cx="5" cy="6" r="2.3"/><circle cx="19" cy="8" r="2.3"/><circle cx="8" cy="18" r="2.3"/><circle cx="18" cy="18" r="2.3"/><path d="M7 7 17 8M6.5 8 8 15.7M18.5 10 18 15.7M10 18h6"/>',
  route:  '<circle cx="5" cy="6" r="2.3"/><circle cx="19" cy="18" r="2.3"/><path d="M7 7c6 1 4 9 10 10" stroke-dasharray="3 2"/>',
  hanoi:  '<path d="M3 20h18"/><path d="M6 20V8M12 20V6M18 20V8"/><rect x="3.5" y="16" width="5" height="3" rx="1"/><rect x="9" y="13" width="6" height="3" rx="1"/>',
  recur:  '<path d="M20 12a8 8 0 1 1-3-6.2"/><path d="M20 4v5h-5"/>',
  net:    '<circle cx="12" cy="12" r="2.2"/><path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7M5.5 5.5a9 9 0 0 0 0 13M18.5 5.5a9 9 0 0 1 0 13"/>'
};
function glyphSvg(name){
  var body = GLYPHS[name] || GLYPHS.bars;
  return '<svg class="av-card-glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+body+'</svg>';
}
function stars(n){ var s=''; for(var i=0;i<3;i++) s += i<n ? '★' : '☆'; return s; }

/* ==========================================================================
   RENDERERS  (injected below)
   ========================================================================== */
var RENDERERS = {};
var W=960, H=540;
function txt(x,y,cls,s){ var t=el('text',{x:x,y:y,'class':cls}); t.textContent=s; return t; }

/* ---- BARS: sorting + heap sort (persistent bars keyed by id → slide on swap) ---- */
RENDERERS.bars = function(){
  var svg, axisG, barsG, bars={}, ids='', padX=70, baseY=470, topPad=90;
  function mount(s){ svg=s; axisG=el('g'); barsG=el('g'); svg.appendChild(axisG); svg.appendChild(barsG); bars={}; ids=''; }
  function classFor(k,f){
    var c='n-bar';
    if(f.sorted && f.sorted.indexOf(k)>=0) c+=' sorted';
    if(f.dim && f.dim.indexOf(k)>=0) c+=' dim';
    if(f.active && f.active.indexOf(k)>=0) c+=' active';
    if(f.pivot===k) c+=' pivot';
    if(f.compare && f.compare.indexOf(k)>=0) c+=' compare';
    if(f.swap && f.swap.indexOf(k)>=0) c+=' swap';
    return c;
  }
  function render(f, prev, animate){
    var items=f.array||[]; var N=items.length||1;
    var idlist=items.map(function(it){return it.id;}).join(',');
    var slotW=(W-2*padX)/N, gap=Math.min(16, slotW*0.24), barW=Math.max(6, slotW-gap);
    var maxV=1; items.forEach(function(it){ if(it.v>maxV) maxV=it.v; });
    var usableH=baseY-topPad;
    if(idlist!==ids){
      barsG.innerHTML=''; axisG.innerHTML=''; bars={};
      items.forEach(function(it,k){
        var g=el('g'); var barH=Math.max(8, it.v/maxV*usableH);
        var ix=padX+k*slotW+gap/2;
        var r=el('rect',{x:0,width:barW,y:baseY-barH,height:barH,rx:5,'class':'n-bar'});
        g.appendChild(r); g.appendChild(txt(barW/2, baseY-barH-8, 'n-barval', it.v));
        g.setAttribute('transform','translate('+ix+',0)');
        g._r=r; g._x=ix; g._st={x:ix}; barsG.appendChild(g); bars[it.id]=g;
      });
      for(var k=0;k<N;k++) axisG.appendChild(txt(padX+k*slotW+slotW/2, baseY+22, 'n-baridx', k));
      ids=idlist;
    }
    items.forEach(function(it,k){
      var g=bars[it.id]; if(!g) return;
      var x=padX+k*slotW+gap/2;
      if(animate && window.anime){
        anime.remove(g._st);
        var st=g._st;
        anime({targets:st, x:x, duration:300, easing:'easeInOutQuad', update:function(){ g.setAttribute('transform','translate('+st.x+',0)'); g._x=st.x; }});
      } else {
        if(window.anime) anime.remove(g._st);
        g.setAttribute('transform','translate('+x+',0)'); g._x=x; g._st.x=x;
      }
      g._r.setAttribute('class', classFor(k,f));
    });
  }
  return {mount:mount, render:render};
};

/* ---- ARRAY: linear / binary search (fixed cells + pointers) ---- */
RENDERERS.array = function(){
  var svg, padX=80, y=210;
  function mount(s){ svg=s; }
  function render(f){
    svg.innerHTML='';
    var arr=f.array||[]; var N=arr.length||1;
    var w=(W-2*padX)/N, cw=Math.min(78,w-12), ch=cw;
    var ptrByIdx={};
    if(f.ptrs) Object.keys(f.ptrs).forEach(function(lab){ var k=f.ptrs[lab]; if(k==null||k<0)return; (ptrByIdx[k]=ptrByIdx[k]||[]).push(lab); });
    arr.forEach(function(v,k){
      var cx=padX+k*w+w/2, cls='n-cell';
      if(f.dim&&f.dim.indexOf(k)>=0) cls+=' dim';
      if(f.range&&k>=f.range[0]&&k<=f.range[1]) cls+=' range';
      var act=(f.active&&f.active.indexOf(k)>=0), found=(f.found===k);
      if(act) cls+=' active'; if(found) cls+=' found';
      svg.appendChild(el('rect',{x:cx-cw/2,y:y,width:cw,height:ch,rx:9,'class':cls}));
      svg.appendChild(txt(cx, y+ch/2+1, (act||found)?'n-cellval on-active':'n-cellval', v));
      svg.appendChild(txt(cx, y+ch+24, 'n-baridx', k));
      if(ptrByIdx[k]){
        svg.appendChild(el('line',{x1:cx,y1:y-8,x2:cx,y2:y,'class':'n-ptrline'}));
        ptrByIdx[k].forEach(function(lab,pi){ svg.appendChild(txt(cx, y-16-pi*18, 'n-ptr', lab)); });
      }
    });
  }
  return {mount:mount, render:render};
};

/* ---- STACK (LIFO, vertical) ---- */
RENDERERS.stack = function(){
  var svg;
  function mount(s){ svg=s; }
  function render(f){
    svg.innerHTML='';
    var it=f.items||[]; var bw=180, bh=48, cx=W/2, baseY=470;
    svg.appendChild(txt(cx, 90, 'n-label', 'STACK · เข้าหลัง ออกก่อน (LIFO)'));
    if(!it.length) svg.appendChild(txt(cx, 300, 'n-label', 'ว่าง'));
    it.forEach(function(v,i){
      var y=baseY-(i+1)*(bh+6);
      var cls='n-box'+(i===it.length-1 ? (f.op==='pop'?' out':' top') : '');
      if(f.op==='push'&&i===it.length-1) cls='n-box new';
      svg.appendChild(el('rect',{x:cx-bw/2,y:y,width:bw,height:bh,rx:9,'class':cls}));
      svg.appendChild(txt(cx, y+bh/2+1, 'n-boxval', v));
      if(i===it.length-1) svg.appendChild(txt(cx+bw/2+34, y+bh/2+1, 'n-ptr', '← TOP'));
    });
    svg.appendChild(el('line',{x1:cx-bw/2-14,y1:baseY,x2:cx+bw/2+14,y2:baseY,'class':'n-peg'}));
  }
  return {mount:mount, render:render};
};

/* ---- QUEUE (FIFO, horizontal) ---- */
RENDERERS.queue = function(){
  var svg;
  function mount(s){ svg=s; }
  function render(f){
    svg.innerHTML='';
    var it=f.items||[]; var bw=76, bh=76, gap=12, y=232;
    var total=it.length*(bw+gap)-gap; var startX=(W-total)/2; if(total<0) startX=W/2;
    svg.appendChild(txt(W/2, 120, 'n-label', 'QUEUE · เข้าก่อน ออกก่อน (FIFO)'));
    if(!it.length) svg.appendChild(txt(W/2, 270, 'n-label', 'ว่าง'));
    it.forEach(function(v,i){
      var x=startX+i*(bw+gap);
      var cls='n-box';
      if(i===0){ cls+= (f.op==='dequeue'?' out':' top'); }
      if(f.op==='enqueue'&&i===it.length-1) cls='n-box new';
      svg.appendChild(el('rect',{x:x,y:y,width:bw,height:bh,rx:10,'class':cls}));
      svg.appendChild(txt(x+bw/2, y+bh/2+1, 'n-boxval', v));
      if(i===0) svg.appendChild(txt(x+bw/2, y-16, 'n-ptr', 'FRONT'));
      if(i===it.length-1) svg.appendChild(txt(x+bw/2, y+bh+24, 'n-ptr', 'REAR'));
    });
  }
  return {mount:mount, render:render};
};

/* ---- LINKED LIST (nodes + next arrows) ---- */
RENDERERS.linkedlist = function(){
  var svg;
  function mount(s){ svg=s; }
  function render(f){
    svg.innerHTML='';
    var nodes=f.nodes||[]; var bw=74, bh=52, gap=54, y=244;
    var total=nodes.length*(bw+gap); var startX=Math.max(70,(W-total)/2+20);
    svg.appendChild(txt(startX-10, y-26, 'n-ptr', 'HEAD'));
    if(!nodes.length) svg.appendChild(txt(W/2, 270, 'n-label', 'ว่าง (head → null)'));
    nodes.forEach(function(nd,i){
      var x=startX+i*(bw+gap);
      var cls='n-box';
      if(f.newIdx===i) cls='n-box new'; else if(f.outIdx===i) cls='n-box out'; else if(f.ptr===i) cls='n-box top';
      svg.appendChild(el('rect',{x:x,y:y,width:bw,height:bh,rx:9,'class':cls}));
      svg.appendChild(txt(x+bw/2, y+bh/2+1, 'n-boxval', nd.v));
      if(f.ptr===i) svg.appendChild(txt(x+bw/2, y-16, 'n-ptr', 'cur'));
      var ax=x+bw, ax2=x+bw+gap;
      svg.appendChild(el('line',{x1:ax,y1:y+bh/2,x2:ax2-8,y2:y+bh/2,'class':'n-edge'}));
      svg.appendChild(el('path',{d:'M'+(ax2-8)+' '+(y+bh/2)+' l-8 -5 v10 z',fill:'var(--line-2)'}));
    });
    var lastX=startX+nodes.length*(bw+gap);
    svg.appendChild(txt(lastX+2, y+bh/2+1, 'n-ptr', 'null'));
  }
  return {mount:mount, render:render};
};

/* ---- HASH TABLE (buckets + chaining) ---- */
RENDERERS.hash = function(){
  var svg;
  function mount(s){ svg=s; }
  function render(f){
    svg.innerHTML='';
    var b=f.buckets||[]; var m=b.length||1; var rowH=Math.min(52,(H-120)/m), y0=70, bx=150, bw=64, cw=56, gap=14;
    svg.appendChild(txt(bx+bw/2, 46, 'n-label', 'INDEX'));
    svg.appendChild(txt(bx+bw+120, 46, 'n-label', 'CHAIN (list)'));
    b.forEach(function(chain,i){
      var y=y0+i*rowH;
      var active=(f.active===i);
      svg.appendChild(el('rect',{x:bx,y:y,width:bw,height:rowH-8,rx:7,'class':'n-cell'+(active?' active':'')}));
      svg.appendChild(txt(bx+bw/2, y+(rowH-8)/2+1, active?'n-cellval on-active':'n-cellval', i));
      chain.forEach(function(v,j){
        var x=bx+bw+30+j*(cw+gap);
        var hit=(active && f.hitKey!=null && v===f.hitKey);
        svg.appendChild(el('line',{x1:x-gap-2,y1:y+(rowH-8)/2,x2:x,y2:y+(rowH-8)/2,'class':'n-edge'}));
        svg.appendChild(el('rect',{x:x,y:y+2,width:cw,height:rowH-12,rx:7,'class':'n-box'+(hit?' new':(active&&f.scan===j?' top':''))}));
        svg.appendChild(txt(x+cw/2, y+(rowH-8)/2, 'n-boxval', v));
      });
    });
  }
  return {mount:mount, render:render};
};

/* ---- TREE (BST, traversal, heap) : in-order x layout ---- */
RENDERERS.tree = function(){
  var svg;
  function mount(s){ svg=s; }
  function inSet(s,id){ return !!s && (s.indexOf(id)>=0 || s.indexOf(Number(id))>=0 || s.indexOf(String(id))>=0); }
  function eq(a,id){ return a!=null && (a===id || a===Number(id) || String(a)===String(id)); }
  function toNodes(f){
    if(f.heap){ var arr=f.heap, nodes={}; for(var i=0;i<arr.length;i++) nodes[i]={v:arr[i], l:(2*i+1<arr.length?2*i+1:null), r:(2*i+2<arr.length?2*i+2:null)}; return {root:arr.length?0:null, nodes:nodes}; }
    return {root:f.root, nodes:f.nodes||{}};
  }
  function render(f){
    svg.innerHTML='';
    var t=toNodes(f); var nodes=t.nodes; if(t.root==null){ svg.appendChild(txt(W/2, H/2, 'n-label', 'ต้นไม้ว่าง')); return; }
    var pos={}, xi=0, maxD=0;
    (function place(id,d){ if(id==null)return; var n=nodes[id]; place(n.l,d+1); pos[id]={ix:xi++,d:d}; if(d>maxD)maxD=d; place(n.r,d+1); })(t.root,0);
    var cnt=xi; var padX=80, topY=70, levelH=Math.min(96,(H-140)/(maxD||1));
    function X(id){ return cnt<=1 ? W/2 : padX + pos[id].ix*(W-2*padX)/(cnt-1); }
    function Y(id){ return topY + pos[id].d*levelH; }
    // edges
    Object.keys(pos).forEach(function(id){ var n=nodes[id];
      ['l','r'].forEach(function(side){ var c=n[side]; if(c!=null){
        var onPath=f.path && f.path.indexOf(String(id))<0 && false;
        svg.appendChild(el('line',{x1:X(id),y1:Y(id),x2:X(c),y2:Y(c),'class':'n-edge'})); } });
    });
    // nodes
    var R=22;
    Object.keys(pos).forEach(function(id){
      var cls='n-node';
      if(eq(f.newId,id)) cls+=' newn';
      else if(eq(f.active,id)) cls+=' current';
      else if(inSet(f.compare,id)) cls+=' compare';
      else if(inSet(f.path,id)) cls+=' path';
      else if(inSet(f.visited,id)) cls+=' visited';
      var ink=(eq(f.active,id)||inSet(f.compare,id)||eq(f.newId,id)||inSet(f.visited,id)||inSet(f.path,id));
      svg.appendChild(el('circle',{cx:X(id),cy:Y(id),r:R,'class':cls}));
      svg.appendChild(txt(X(id), Y(id), ink?'n-nodeval ink':'n-nodeval', nodes[id].v));
    });
    // heap array strip
    if(f.heap){
      var arr=f.heap, N=arr.length||1, aw=Math.min(56,(W-160)/N), y=H-52, sx=(W-N*aw)/2;
      arr.forEach(function(v,i){
        var hi=inSet(f.compare,i)||eq(f.active,i);
        svg.appendChild(el('rect',{x:sx+i*aw,y:y,width:aw-6,height:38,rx:6,'class':'n-cell'+(hi?' active':'')}));
        svg.appendChild(txt(sx+i*aw+(aw-6)/2, y+20, hi?'n-cellval on-active':'n-cellval', v));
        svg.appendChild(txt(sx+i*aw+(aw-6)/2, y+52, 'n-baridx', i));
      });
    }
    if(f.order) svg.appendChild(txt(W/2, 40, 'n-ptr', f.order));
  }
  return {mount:mount, render:render};
};

/* ---- GRAPH (BFS / DFS / Dijkstra) ---- */
RENDERERS.graph = function(){
  var svg, G=null, weighted=false;
  function mount(s){ svg=s; }
  function setGraph(g, w){ G=g; weighted=!!w; }
  function render(f){
    if(!G){ return; } svg.innerHTML='';
    var pos={}; G.nodes.forEach(function(n){ pos[n.id]={x:n.x,y:n.y}; });
    var pathSet={}; if(f.pathEdges) f.pathEdges.forEach(function(e){ pathSet[e[0]+'|'+e[1]]=1; pathSet[e[1]+'|'+e[0]]=1; });
    G.edges.forEach(function(e){
      var a=pos[e.u], b=pos[e.v]; var onPath=pathSet[e.u+'|'+e.v];
      svg.appendChild(el('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,'class':'n-edge'+(onPath?' path':'')}));
      if(weighted){ var mx=(a.x+b.x)/2, my=(a.y+b.y)/2;
        svg.appendChild(el('circle',{cx:mx,cy:my,r:13,fill:'var(--code-bg)',stroke:'var(--line)'}));
        svg.appendChild(txt(mx, my+4, 'n-edgew', e.w)); }
    });
    var R=24;
    G.nodes.forEach(function(n){
      var cls='n-node';
      if(f.current===n.id) cls+=' current';
      else if(f.path && f.path.indexOf(n.id)>=0) cls+=' path';
      else if(f.visited && f.visited.indexOf(n.id)>=0) cls+=' visited';
      else if(f.frontier && f.frontier.indexOf(n.id)>=0) cls+=' frontier';
      var ink=(f.current===n.id)||(f.path&&f.path.indexOf(n.id)>=0)||(f.visited&&f.visited.indexOf(n.id)>=0);
      svg.appendChild(el('circle',{cx:n.x,cy:n.y,r:R,'class':cls}));
      svg.appendChild(txt(n.x, n.y+1, ink?'n-nodeval ink':'n-nodeval', n.label));
      if(f.dist){ var d=f.dist[n.id]; svg.appendChild(txt(n.x, n.y-R-8, 'n-dist', d==null||d===Infinity?'∞':d)); }
    });
  }
  return {mount:mount, render:render, setGraph:setGraph};
};

/* ---- HANOI ---- */
RENDERERS.hanoi = function(){
  var svg; var PAL=['#FFC000','#30D158','#0A84FF','#A86BFF','#FF5C8A','#D97757','#5AC8FF'];
  function mount(s){ svg=s; }
  function render(f){
    svg.innerHTML='';
    var pegs=f.pegs||[[],[],[]]; var baseY=440, pegH=250, maxW=250;
    var pegX=[W*0.22, W*0.5, W*0.78]; var names=['A','B','C'];
    var maxDisk=1; pegs.forEach(function(p){ p.forEach(function(d){ if(d>maxDisk)maxDisk=d; }); });
    svg.appendChild(el('rect',{x:60,y:baseY,width:W-120,height:16,rx:6,'class':'n-base'}));
    pegX.forEach(function(px,pi){
      svg.appendChild(el('line',{x1:px,y1:baseY,x2:px,y2:baseY-pegH,'class':'n-peg'}));
      svg.appendChild(txt(px, baseY+40, 'n-label', 'หลัก '+names[pi]));
      pegs[pi].forEach(function(size,di){
        var dw=40+ (size/maxDisk)*maxW, dh=30;
        var y=baseY-(di+1)*(dh+4);
        svg.appendChild(el('rect',{x:px-dw/2,y:y,width:dw,height:dh,rx:8,'class':'n-disk',fill:PAL[(size-1)%PAL.length]}));
        svg.appendChild(txt(px, y+dh/2+1, 'n-boxval', size));
      });
    });
  }
  return {mount:mount, render:render};
};

/* ---- CALL TREE (Fibonacci recursion) ---- */
RENDERERS.calltree = function(){
  var svg;
  function mount(s){ svg=s; }
  function render(f){
    svg.innerHTML='';
    var nodes=f.nodes||{}; var layout=f.layout; if(!layout){ return; }
    var revealed=f.revealed||{};
    var cnt=layout.count, maxD=layout.maxD;
    var padX=60, topY=60, levelH=Math.min(92,(H-120)/(maxD||1));
    function X(id){ return cnt<=1?W/2: padX + layout.x[id]*(W-2*padX)/(cnt-1); }
    function Y(id){ return topY + layout.d[id]*levelH; }
    // edges (only to revealed)
    Object.keys(revealed).forEach(function(id){ var p=nodes[id].parent; if(p!=null && revealed[p]!=null){
      svg.appendChild(el('line',{x1:X(p),y1:Y(p),x2:X(id),y2:Y(id),'class':'n-edge'})); } });
    var R=20;
    Object.keys(revealed).forEach(function(id){
      var nd=nodes[id]; var cls='n-node';
      if(nd.memo) cls+=' memo'; else if(nd.val!=null) cls+=' visited';
      if(f.active===id) cls+=' current';
      var ink=(f.active===id)||nd.memo||(nd.val!=null);
      svg.appendChild(el('circle',{cx:X(id),cy:Y(id),r:R,'class':cls}));
      svg.appendChild(txt(X(id), Y(id)-3, ink?'n-nodeval ink':'n-nodeval', nd.k));
      if(nd.val!=null) svg.appendChild(txt(X(id), Y(id)+11, ink?'n-nodeval ink':'n-nodeval', '='+nd.val));
    });
    svg.appendChild(txt(90, 34, 'n-ptr', 'fib(k)'));
  }
  return {mount:mount, render:render};
};

/* ==========================================================================
   EXTENSION RENDERERS  (net/, sys/ … — injected by build from src/renderers/*)
   ========================================================================== */

/* ===== src/renderers/net.js ===== */
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



/* ==========================================================================
   PLAYER
   ========================================================================== */
function Player(){
  this.frames=[]; this.i=0; this.playing=false; this.timer=null; this.speed=5;
  this.renderer=null; this.pseudo=[];
  this.svg = $('[data-svg]');
  this.cap = $('[data-caption]');
  this.statsEl = $('[data-stats]');
  this.pseudoEl = $('[data-pseudo]');
  this.scrub = $('[data-scrub]');
  this.scrubLbl = $('[data-scrub-lbl]');
  this.playIcon = $('[data-play-icon]');
  var self=this;
  $('[data-t="play"]').addEventListener('click', function(){ self.toggle(); });
  $('[data-t="next"]').addEventListener('click', function(){ self.pause(); self.go(self.i+1); });
  $('[data-t="prev"]').addEventListener('click', function(){ self.pause(); self.go(self.i-1); });
  $('[data-t="first"]').addEventListener('click', function(){ self.pause(); self.go(0); });
  $('[data-t="last"]').addEventListener('click', function(){ self.pause(); self.go(self.frames.length-1); });
  this.scrub.addEventListener('input', function(){ self.pause(); self.go(parseInt(self.scrub.value,10)); });
  var sp = $('[data-speed]');
  sp.addEventListener('input', function(){ self.speed=parseInt(sp.value,10); self.updateSpeedLabel(); });
  this.speedInput = sp; this.updateSpeedLabel();
}
Player.prototype.updateSpeedLabel=function(){
  var lbl = ['ช้ามาก','ช้า','ช้า','ค่อนข้างช้า','ปกติ','ปกติ','ค่อนข้างเร็ว','เร็ว','เร็วมาก','เร็วสุด'][this.speed-1]||'ปกติ';
  $('[data-speed-val]').textContent = lbl;
};
Player.prototype.delay=function(){ return 1150 - this.speed*100; };
Player.prototype.setRenderer=function(name){
  this.renderer = RENDERERS[name] ? RENDERERS[name]() : RENDERERS.bars();
  this.svg.innerHTML='';
  this.renderer.mount(this.svg);
};
Player.prototype.setPseudo=function(lines){
  this.pseudo = lines||[];
  this.pseudoEl.innerHTML = this.pseudo.map(function(t,i){
    return '<div class="ln" data-ln="'+i+'"><span class="no">'+(i+1)+'</span><span>'+esc(t)+'</span></div>';
  }).join('');
};
Player.prototype.setFrames=function(frames){
  this.frames = frames && frames.length ? frames : [{note:'ไม่มีข้อมูล', array:[]}];
  this.i=0; this.pause();
  this.scrub.max = this.frames.length-1;
  this.draw(false);
};
Player.prototype.go=function(i){
  i = clamp(i, 0, this.frames.length-1);
  var animate = Math.abs(i - this.i) === 1;
  this.i = i;
  this.draw(animate);
};
Player.prototype.draw=function(animate){
  var f = this.frames[this.i]; if(!f) return;
  this.renderer.render(f, this.frames[this.i-1], animate && animOK());
  this.cap.textContent = f.note || '';
  // pseudocode highlight
  $$('.ln', this.pseudoEl).forEach(function(n){ n.classList.remove('on'); });
  if(f.line!=null && f.line>=0){ var ln=$('[data-ln="'+f.line+'"]', this.pseudoEl); if(ln) ln.classList.add('on'); }
  // stats
  if(f.stats){
    this.statsEl.innerHTML = Object.keys(f.stats).map(function(k){
      return '<div class="av-stat"><b>'+esc(f.stats[k])+'</b><span>'+esc(k)+'</span></div>';
    }).join('');
  } else this.statsEl.innerHTML='';
  // scrub
  this.scrub.value = this.i;
  this.scrubLbl.textContent = (this.i+1)+' / '+this.frames.length;
};
Player.prototype.toggle=function(){ this.playing ? this.pause() : this.play(); };
Player.prototype.play=function(){
  if(this.i >= this.frames.length-1) this.go(0);
  this.playing=true; this.playIcon.innerHTML='<rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/>';
  var self=this;
  (function loop(){
    if(!self.playing) return;
    if(self.i >= self.frames.length-1){ self.pause(); return; }
    self.go(self.i+1);
    self.timer = setTimeout(loop, self.delay());
  })();
};
Player.prototype.pause=function(){
  this.playing=false; clearTimeout(this.timer);
  if(this.playIcon) this.playIcon.innerHTML='<path d="M8 5v14l11-7z"/>';
};

var PLAYER = new Player();

/* ==========================================================================
   VIEW MANAGER + ROUTER (namespaced hash #av=<id>)
   ========================================================================== */
var catalogView = $('[data-view="catalog"]');
var vizView = $('[data-view="viz"]');
var compareView = $('[data-view="compare"]');
var vizWrap = $('.av-viz');
var vizBar = $('.av-vizbar');
var curCatCls = '';

function showView(which){
  catalogView.classList.toggle('is-active', which==='catalog');
  vizView.classList.toggle('is-active', which==='viz');
  compareView.classList.toggle('is-active', which==='compare');
  if(which==='catalog'){ try{ window.scrollTo({top:0,behavior:'auto'}); }catch(e){} }
}

function openAlgo(id){
  var m = BYID[id]; if(!m){ goHome(); return; }
  PLAYER.pause();
  var cat = CATMAP[m.cat];
  // category accent
  if(curCatCls){ vizView.classList.remove(curCatCls); }
  curCatCls = cat.cls; vizView.classList.add(curCatCls);
  // header
  $('[data-viz-cat]').textContent = cat.nameEn + ' · ' + cat.nameTh;
  $('[data-viz-name]').textContent = m.nameTh;
  $('[data-time]').textContent = m.time||'—';
  $('[data-space]').textContent = m.space||'—';
  $('[data-explain]').innerHTML = m.explain||'';
  $('[data-note]').innerHTML = m.note ? ('<b>แนวคิดหลัก:</b> '+m.note) : '';
  PLAYER.setPseudo(m.pseudocode);
  PLAYER.setRenderer(m.renderer);
  // controls
  var host = $('[data-controls]'); host.innerHTML='';
  var ctx = {
    root: ROOT,
    renderer: PLAYER.renderer,
    load: function(frames){ PLAYER.setFrames(frames); }
  };
  m.mountControls(host, ctx);
  // prev/next
  var idx = ALGOS.indexOf(m);
  $('[data-viz-prev]').onclick=function(){ navTo(ALGOS[(idx-1+ALGOS.length)%ALGOS.length].id); };
  $('[data-viz-next]').onclick=function(){ navTo(ALGOS[(idx+1)%ALGOS.length].id); };
  try{ document.title = m.nameEn + ' · ' + m.nameTh + ' | DevSpark by BorntoDev'; }catch(e){}
  showView('viz');
  try{ window.scrollTo({top:0,behavior:'auto'}); }catch(e){}
}

/* ==========================================================================
   COMPARE VIEW — race any 2 sorting algorithms on the SAME array, synced
   (scoped to sorting: those 6 topics share the bars renderer + build(arr)
   signature, so a side-by-side comparison is actually apples-to-apples —
   other categories use different renderers/inputs and wouldn't compare cleanly)
   ========================================================================== */
var SORT_IDS = ['bubble-sort','selection-sort','insertion-sort','merge-sort','quick-sort','heap-sort'];
var cmpArr = [], cmpPlaying = false, cmpTimer = null, cmpSpeed = 5, cmpWired = false;
var cmpA, cmpB, cmpPlayIcon;

function CompareSide(key){
  this.key = key;
  this.svg = $('[data-cmp-svg="'+key+'"]');
  this.capEl = $('[data-cmp-caption="'+key+'"]');
  this.statsEl = $('[data-cmp-stats="'+key+'"]');
  this.selectEl = $('[data-cmp-select="'+key+'"]');
  this.id = null; this.frames = []; this.i = 0;
}
CompareSide.prototype.populateOptions = function(selectedId){
  this.selectEl.innerHTML = SORT_IDS.filter(function(id){ return BYID[id]; }).map(function(id){
    return '<option value="'+id+'"'+(id===selectedId?' selected':'')+'>'+esc(BYID[id].nameEn)+'</option>';
  }).join('');
};
CompareSide.prototype.setAlgo = function(id, arr){
  this.id = id;
  this.renderer = RENDERERS.bars(); this.renderer.mount(this.svg); /* fresh persistent-bar state per algo */
  this.frames = BYID[id].build(arr.slice()); this.i = 0; this.draw(false);
};
CompareSide.prototype.draw = function(animate){
  var f = this.frames[this.i]; if(!f) return;
  this.renderer.render(f, this.frames[this.i-1], animate && animOK());
  this.capEl.textContent = f.note || '';
  if(f.stats){
    this.statsEl.innerHTML = Object.keys(f.stats).map(function(k){
      return '<div class="av-stat"><b>'+esc(f.stats[k])+'</b><span>'+esc(k)+'</span></div>';
    }).join('');
  } else this.statsEl.innerHTML = '';
};
CompareSide.prototype.go = function(i){ this.i = clamp(i, 0, this.frames.length-1); this.draw(true); };
CompareSide.prototype.atEnd = function(){ return this.i >= this.frames.length-1; };

function cmpDelay(){ return 1150 - cmpSpeed*100; }
function cmpUpdateSpeedLabel(){
  var lbl = ['ช้ามาก','ช้า','ช้า','ค่อนข้างช้า','ปกติ','ปกติ','ค่อนข้างเร็ว','เร็ว','เร็วมาก','เร็วสุด'][cmpSpeed-1]||'ปกติ';
  $('[data-cmp-speed-val]').textContent = lbl;
}
function cmpStatLine(stats){
  var keys = stats ? Object.keys(stats) : [];
  if(!keys.length) return '';
  return ' · ' + keys.map(function(k){ return k+' '+stats[k]; }).join(' · ');
}
function cmpUpdateSummary(){
  var host = $('[data-cmp-summary]'); if(!host || !cmpA || !cmpB) return;
  var fa = cmpA.frames[cmpA.i], fb = cmpB.frames[cmpB.i];
  var doneA = cmpA.atEnd(), doneB = cmpB.atEnd();
  var note = '';
  if(doneA || doneB){
    note = (doneA && doneB) ? 'เรียงเสร็จพร้อมกันทั้งคู่ ✓'
      : (doneA ? esc(BYID[cmpA.id].nameEn)+' เรียงเสร็จก่อน 🏆' : esc(BYID[cmpB.id].nameEn)+' เรียงเสร็จก่อน 🏆');
  }
  host.innerHTML = '<div class="av-cmp-summary-row">'
    + '<div class="av-cmp-summary-side'+(doneA&&!doneB?' is-winner':'')+'"><b>'+esc(BYID[cmpA.id].nameEn)+'</b><span>ขั้นตอน '+(cmpA.i+1)+' / '+cmpA.frames.length+cmpStatLine(fa&&fa.stats)+'</span></div>'
    + '<div class="av-cmp-summary-side'+(doneB&&!doneA?' is-winner':'')+'"><b>'+esc(BYID[cmpB.id].nameEn)+'</b><span>ขั้นตอน '+(cmpB.i+1)+' / '+cmpB.frames.length+cmpStatLine(fb&&fb.stats)+'</span></div>'
    + '</div>'
    + (note ? '<div class="av-cmp-summary-note">'+note+'</div>' : '');
}
function cmpFirst(){ cmpA.go(0); cmpB.go(0); cmpUpdateSummary(); }
function cmpStep(delta){ cmpA.go(cmpA.i+delta); cmpB.go(cmpB.i+delta); cmpUpdateSummary(); }
function cmpPause(){
  cmpPlaying = false; clearTimeout(cmpTimer);
  if(cmpPlayIcon) cmpPlayIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
}
function cmpPlay(){
  if(cmpA.atEnd() && cmpB.atEnd()){ cmpA.go(0); cmpB.go(0); }
  cmpPlaying = true;
  if(cmpPlayIcon) cmpPlayIcon.innerHTML = '<rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/>';
  (function loop(){
    if(!cmpPlaying) return;
    var advA = !cmpA.atEnd(), advB = !cmpB.atEnd();
    if(!advA && !advB){ cmpPause(); return; }
    if(advA) cmpA.go(cmpA.i+1);
    if(advB) cmpB.go(cmpB.i+1);
    cmpUpdateSummary();
    cmpTimer = setTimeout(loop, cmpDelay());
  })();
}
function cmpSetArray(arr){
  cmpArr = arr.slice();
  $('[data-cmp-arr]').value = cmpArr.join(', ');
  cmpPause();
  if(cmpA.id) cmpA.setAlgo(cmpA.id, cmpArr);
  if(cmpB.id) cmpB.setAlgo(cmpB.id, cmpArr);
  cmpUpdateSummary();
}
function cmpRegen(){ var arr=[]; for(var i=0;i<9;i++) arr.push(randInt(5,99)); cmpSetArray(arr); }
function cmpApply(){
  var arr = parseList($('[data-cmp-arr]').value, 14, 1, 999);
  if(arr.length<2){ cmpRegen(); return; }
  cmpSetArray(arr);
}
function cmpOnSelectChange(side){
  var s = side==='a'?cmpA:cmpB;
  cmpPause(); s.setAlgo(s.selectEl.value, cmpArr); cmpUpdateSummary();
}
function wireCompareControls(){
  if(cmpWired) return; cmpWired = true;
  cmpPlayIcon = $('[data-cmp-play-icon]');
  $('[data-cmp-select="a"]').addEventListener('change', function(){ cmpOnSelectChange('a'); });
  $('[data-cmp-select="b"]').addEventListener('change', function(){ cmpOnSelectChange('b'); });
  $('[data-cmp-rand]').addEventListener('click', cmpRegen);
  $('[data-cmp-apply]').addEventListener('click', cmpApply);
  $('[data-cmp-t="play"]').addEventListener('click', function(){ cmpPlaying?cmpPause():cmpPlay(); });
  $('[data-cmp-t="first"]').addEventListener('click', function(){ cmpPause(); cmpFirst(); });
  $('[data-cmp-t="prev"]').addEventListener('click', function(){ cmpPause(); cmpStep(-1); });
  $('[data-cmp-t="next"]').addEventListener('click', function(){ cmpPause(); cmpStep(1); });
  var speedEl = $('[data-cmp-speed]');
  speedEl.addEventListener('input', function(){ cmpSpeed=parseInt(speedEl.value,10); cmpUpdateSpeedLabel(); });
  cmpUpdateSpeedLabel();
}
function openCompare(idA, idB){
  if(!BYID[idA] || SORT_IDS.indexOf(idA)<0) idA = SORT_IDS[0];
  if(!BYID[idB] || SORT_IDS.indexOf(idB)<0 || idB===idA) idB = SORT_IDS.filter(function(id){ return id!==idA; })[0];
  if(!cmpA){ cmpA = new CompareSide('a'); cmpB = new CompareSide('b'); }
  wireCompareControls();
  cmpA.populateOptions(idA); cmpB.populateOptions(idB);
  if(!cmpArr.length){ var arr=[]; for(var i=0;i<9;i++) arr.push(randInt(5,99)); cmpArr=arr; }
  cmpPause();
  $('[data-cmp-arr]').value = cmpArr.join(', ');
  cmpA.setAlgo(idA, cmpArr); cmpB.setAlgo(idB, cmpArr);
  cmpUpdateSummary();
  try{ document.title = 'เปรียบเทียบอัลกอริทึม · Compare | DevSpark by BorntoDev'; }catch(e){}
  showView('compare');
  try{ window.scrollTo({top:0,behavior:'auto'}); }catch(e){}
}

/* ---------- navigation: History API (pretty URLs) + hash fallback ---------- */
var AV_BASE = (window.AV_BASE!=null) ? String(window.AV_BASE).replace(/\/+$/,'') : null;
var USE_HISTORY = (AV_BASE!=null) && location.protocol!=='file:' && !!(window.history && window.history.pushState);
var DEFAULT_TITLE = document.title;
function currentId(){
  if(USE_HISTORY){
    var p = decodeURIComponent(location.pathname||'');
    if(AV_BASE && p.indexOf(AV_BASE)===0) p = p.slice(AV_BASE.length);
    return p.replace(/^\/+|\/+$/g,'');
  }
  var m = /(?:^|&)av=([\w\-\/]+)/.exec(location.hash.replace(/^#/,''));
  return m ? m[1] : '';
}
function navTo(id){
  if(USE_HISTORY){ window.history.pushState({id:id}, '', AV_BASE + '/' + (id||'')); route(); }
  else if(id){ location.hash='av='+id; }
  else if(location.hash){ location.hash=''; }
  else { route(); }
}
function goHome(){ navTo(''); }
function route(){
  var id = currentId();
  var cm = /^compare\/([\w-]+)\/([\w-]+)$/.exec(id||'');
  if(cm) openCompare(cm[1], cm[2]);
  else if(id && BYID[id]) openAlgo(id);
  else { showView('catalog'); try{ document.title = DEFAULT_TITLE; }catch(e){} }
}
window.addEventListener('popstate', route);
window.addEventListener('hashchange', function(){ if(!USE_HISTORY) route(); });

/* home / open / in-page scroll links */
$$('[data-av-home]').forEach(function(a){ a.addEventListener('click', function(e){ e.preventDefault(); navTo(''); }); });
$$('[data-av-open]').forEach(function(a){ a.addEventListener('click', function(e){ e.preventDefault(); navTo(a.getAttribute('data-av-open')); }); });
$$('[data-av-compare]').forEach(function(a){ a.addEventListener('click', function(e){ e.preventDefault(); navTo('compare/'+SORT_IDS[0]+'/'+SORT_IDS[4]); }); });
function scrollToSection(id){
  var t = document.getElementById(id); if(!t) return;
  setTimeout(function(){ t.scrollIntoView({behavior: REDUCE?'auto':'smooth', block:'start'}); }, 30);
}
$$('[data-av-scroll]').forEach(function(a){ a.addEventListener('click', function(e){
  e.preventDefault(); closeMobilePanel();
  var id=a.getAttribute('data-av-scroll');
  if(catalogView.classList.contains('is-active')) scrollToSection(id);
  else { navTo(''); scrollToSection(id); }
}); });

/* mobile menu */
var mobileToggle = $('[data-mobile-toggle]'), mobilePanel = $('[data-mobile-panel]');
function closeMobilePanel(){
  if(!mobilePanel) return;
  mobilePanel.classList.remove('is-open');
  if(mobileToggle){ mobileToggle.setAttribute('aria-expanded','false'); }
}
if(mobileToggle && mobilePanel){
  mobileToggle.addEventListener('click', function(){
    var open = mobilePanel.classList.toggle('is-open');
    mobileToggle.setAttribute('aria-expanded', open?'true':'false');
  });
}

/* header search: jump to the real catalog search box instead of duplicating search state */
var searchToggle = $('[data-search-toggle]');
if(searchToggle){ searchToggle.addEventListener('click', function(){
  closeMobilePanel();
  function focusSearch(){ var inp=$('[data-search]'); if(inp) inp.focus({preventScroll:true}); }
  if(catalogView.classList.contains('is-active')){ scrollToSection('explore'); setTimeout(focusSearch, REDUCE?40:420); }
  else { navTo(''); scrollToSection('explore'); setTimeout(focusSearch, REDUCE?40:420); }
}); }

/* keyboard shortcuts (only in viz view) */
document.addEventListener('keydown', function(e){
  if(!vizView.classList.contains('is-active')) return;
  var tag=(e.target.tagName||'').toLowerCase();
  if(tag==='input'||tag==='textarea') return;
  if(e.key===' '){ e.preventDefault(); PLAYER.toggle(); }
  else if(e.key==='ArrowRight'){ e.preventDefault(); PLAYER.pause(); PLAYER.go(PLAYER.i+1); }
  else if(e.key==='ArrowLeft'){ e.preventDefault(); PLAYER.pause(); PLAYER.go(PLAYER.i-1); }
});

/* ==========================================================================
   CATALOG RENDER + FILTER
   ========================================================================== */
var catsHost = $('[data-cats]');
var filterState = { q:'', diff:0, intent:'' };

function renderChips(){
  var host = $('[data-filter-chips]');
  var chips = [{k:'diff',v:0,l:'ทุกระดับ'},{k:'diff',v:1,l:'★ เริ่มต้น'},{k:'diff',v:2,l:'★★ กลาง'},{k:'diff',v:3,l:'★★★ ขั้นสูง'}];
  host.innerHTML = chips.map(function(c){
    var on = filterState.diff===c.v;
    return '<button class="av-chip'+(on?' is-active':'')+'" data-diff="'+c.v+'">'+c.l+'</button>';
  }).join('');
  $$('[data-diff]', host).forEach(function(b){ b.addEventListener('click', function(){ filterState.diff=parseInt(b.getAttribute('data-diff'),10); renderChips(); renderCatalog(); }); });
}

function matches(m){
  var mcat = CATMAP[m.cat];
  if(mcat && DOMAINMAP[mcat.domain] && DOMAINMAP[mcat.domain].hidden) return false;
  if(filterState.diff && m.difficulty!==filterState.diff) return false;
  if(filterState.intent){
    var okCat = filterState.intent==='tree-graph' ? (m.cat==='tree'||m.cat==='graph') : m.cat===filterState.intent;
    if(!okCat) return false;
  }
  var q = filterState.q.trim().toLowerCase();
  if(!q) return true;
  return (m.nameTh+' '+m.nameEn+' '+(m.blurb||'')+' '+m.cat+' '+CATMAP[m.cat].nameEn).toLowerCase().indexOf(q)>=0;
}

function cardHtml(m){
  var cat = CATMAP[m.cat];
  return '<div class="av-card '+cat.cls+'" data-open="'+m.id+'" tabindex="0" role="link" aria-label="'+esc(m.nameTh)+'">'
    + '<div class="av-card-glow"></div>'
    + '<div class="av-card-visual">'+glyphSvg(m.glyph||cat.glyph)+'</div>'
    + '<div class="av-card-body">'
      + '<div class="av-card-en">'+esc(m.nameEn)+'</div>'
      + '<h3>'+esc(m.nameTh)+'</h3>'
      + '<div style="font-size:12.5px;color:var(--text-3);line-height:1.5">'+esc(m.blurb||'')+'</div>'
      + '<div class="av-card-meta"><span class="av-stars" title="ระดับความยาก">'+stars(m.difficulty)+'</span><span class="av-cx">'+esc(m.time||'')+'</span></div>'
    + '</div></div>';
}

function renderCatalog(){
  var html='';
  DOMAINS.forEach(function(d){
    if(d.hidden) return;
    var fieldsHtml='', domCount=0;
    CATS.filter(function(c){ return c.domain===d.id; }).forEach(function(c){
      var list = ALGOS.filter(function(m){ return m.cat===c.id && matches(m); });
      if(!list.length) return;
      domCount += list.length;
      fieldsHtml += '<section class="av-cat '+c.cls+'" id="cat-'+c.id+'" data-cat-sec="'+c.id+'">'
        + '<div class="av-cat-head"><div>'
          + '<div class="av-cat-bar"></div>'
          + '<span class="eyebrow">'+esc(c.nameEn)+'</span>'
          + '<h2>'+esc(c.nameTh)+'</h2>'
        + '</div><div class="av-cat-count">'+list.length+' หัวข้อ</div></div>'
        + '<div class="av-grid">'+list.map(cardHtml).join('')+'</div></section>';
    });
    if(!fieldsHtml) return;
    html += '<div class="av-domain '+('cat-'+d.id)+'" id="dom-'+d.id+'" data-dom-sec="'+d.id+'">'
      + '<div class="av-domain-head"><span class="av-domain-tag">'+esc(d.en)+'</span>'
        + '<div><h2 class="av-domain-title">'+esc(d.th)+'</h2>'
        + '<div class="av-domain-note">'+esc(d.note)+' · '+domCount+' หัวข้อ</div></div></div>'
      + fieldsHtml + '</div>';
  });
  if(!html) html = '<div class="av-empty">ไม่พบหัวข้อที่ตรงกับการค้นหา ลองพิมพ์คำอื่น</div>';
  catsHost.innerHTML = html;
  $$('[data-open]', catsHost).forEach(function(card){
    var id = card.getAttribute('data-open');
    card.addEventListener('click', function(){ navTo(id); });
    card.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); navTo(id); } });
  });
  var countEl = $('[data-intent-count]');
  if(countEl) countEl.textContent = ALGOS.filter(matches).length+' หัวข้อ';
}

$('[data-search]').addEventListener('input', function(e){ filterState.q=e.target.value; renderCatalog(); });

/* expose helpers to modules */
AlgoViz.helpers = {
  el:el, esc:esc, clamp:clamp, randInt:randInt, toItems:toItems, cloneItems:cloneItems,
  parseList:parseList, animOK:animOK, REDUCE:REDUCE, RENDERERS:RENDERERS, SVGNS:SVGNS
};

/* ==========================================================================
   ALGORITHM MODULES  (injected below)
   ========================================================================== */
/* ---- shared control builders ---- */
function sortControls(host, ctx, build, opts){
  opts=opts||{}; var min=opts.min||5, max=opts.max||14, def=opts.size||9;
  host.innerHTML =
    '<div class="av-field"><label>ขนาดข้อมูล <span class="av-range-val" data-sz></span></label><input type="range" data-size min="'+min+'" max="'+max+'" value="'+def+'"></div>'
   +'<div class="av-field"><label>ข้อมูล (คั่นด้วย , )</label><input class="av-input" data-arr></div>'
   +'<div class="av-btn-row"><button class="btn btn-accent btn-sm" data-rand>สุ่มใหม่</button><button class="btn btn-ghost btn-sm" data-apply>ใช้ข้อมูลนี้</button></div>'
   +'<div style="font-size:11.5px;color:var(--text-3);margin-top:12px;line-height:1.5">กด <b style="color:var(--text-2)">Play</b> ▶ เพื่อดูทีละสเต็ป · เว้นวรรค = เล่น/หยุด · ←/→ = เดินสเต็ป</div>';
  var sizeI=host.querySelector('[data-size]'), arrI=host.querySelector('[data-arr]'), szl=host.querySelector('[data-sz]');
  function setArr(a){ arrI.value=a.join(', '); }
  function load(a){ ctx.load(build(a)); }
  function gen(){ var nn=parseInt(sizeI.value,10); szl.textContent=nn; var a=[]; for(var i=0;i<nn;i++)a.push(randInt(5,99)); setArr(a); load(a); }
  function apply(){ var a=parseList(arrI.value, max, 1, 999); if(a.length<2){ gen(); return; } sizeI.value=clamp(a.length,min,max); szl.textContent=a.length; setArr(a); load(a); }
  sizeI.addEventListener('input', function(){ szl.textContent=sizeI.value; });
  sizeI.addEventListener('change', gen);
  host.querySelector('[data-rand]').addEventListener('click', gen);
  host.querySelector('[data-apply]').addEventListener('click', apply);
  szl.textContent=def;
  var init=opts.initial||[]; if(!init.length){ for(var i=0;i<def;i++) init.push(randInt(5,99)); }
  setArr(init); load(init);
}
function rangeArr(lo,hi){ var a=[]; for(var q=lo;q<=hi;q++) a.push(q); return a; }

/* ================= SORTING ================= */
AlgoViz.register({
  id:'bubble-sort', cat:'sort', nameTh:'Bubble Sort · เรียงแบบฟองอากาศ', nameEn:'Bubble Sort',
  difficulty:1, time:'O(n²)', space:'O(1)', renderer:'bars', glyph:'bars',
  blurb:'เทียบคู่ที่อยู่ติดกันแล้วสลับ ตัวมากสุดจะ “ลอย” ไปขวาสุดทีละรอบ',
  explain:'เปรียบเทียบสมาชิกที่อยู่ติดกันทีละคู่ ถ้าซ้ายมากกว่าขวาก็สลับ วนซ้ำจนไม่มีการสลับ ตัวที่ใหญ่ที่สุดจะไหลไปอยู่ท้ายสุดก่อนเสมอ',
  note:'ง่ายที่สุดในการเข้าใจ แต่ช้าเมื่อข้อมูลใหญ่ (O(n²)) เหมาะสำหรับเรียนพื้นฐาน',
  pseudocode:['for i = 0 → n-1:','  swapped = false','  for j = 0 → n-2-i:','    if a[j] > a[j+1]:','      swap(a[j], a[j+1])','  if not swapped: break'],
  mountControls:function(h,c){ var self=this; sortControls(h,c,function(a){return self.build(a);}); },
  build:function(arr){
    var items=toItems(arr),n=items.length,F=[],cmp=0,sw=0,sorted=[];
    function snap(o){o.array=cloneItems(items);o.sorted=sorted.slice();o.stats={'เปรียบเทียบ':cmp,'สลับ':sw};F.push(o);}
    snap({line:0,note:'เริ่มต้น — อาร์เรย์ที่ยังไม่เรียง'});
    for(var i=0;i<n-1;i++){
      var swapped=false;
      for(var j=0;j<n-1-i;j++){
        cmp++; snap({line:3,note:'เทียบ a['+j+']='+items[j].v+' กับ a['+(j+1)+']='+items[j+1].v,compare:[j,j+1]});
        if(items[j].v>items[j+1].v){ var t=items[j];items[j]=items[j+1];items[j+1]=t; sw++; swapped=true; snap({line:4,note:'ซ้ายมากกว่า → สลับตำแหน่ง',swap:[j,j+1]}); }
      }
      sorted.unshift(n-1-i); snap({line:2,note:'ตำแหน่ง '+(n-1-i)+' ลงตัวแล้ว'});
      if(!swapped){ break; }
    }
    snap({line:5,note:'เรียงเสร็จสมบูรณ์ ✓',sorted:rangeArr(0,n-1)});
    return F;
  }
});

AlgoViz.register({
  id:'selection-sort', cat:'sort', nameTh:'Selection Sort · เรียงแบบเลือก', nameEn:'Selection Sort',
  difficulty:1, time:'O(n²)', space:'O(1)', renderer:'bars', glyph:'bars',
  blurb:'หาค่าน้อยที่สุดในส่วนที่เหลือ แล้วสลับมาไว้ด้านหน้าทีละตำแหน่ง',
  explain:'ในแต่ละรอบจะกวาดหาค่าที่น้อยที่สุดของช่วงที่ยังไม่เรียง แล้วสลับมาไว้ตำแหน่งหน้าสุดของช่วงนั้น จำนวนการสลับน้อย (ไม่เกิน n ครั้ง)',
  note:'จำนวนการสลับน้อยมาก แต่ยังต้องเปรียบเทียบ O(n²) เสมอ ไม่ว่าข้อมูลจะเรียงมาแล้วหรือไม่',
  pseudocode:['for i = 0 → n-1:','  min = i','  for j = i+1 → n-1:','    if a[j] < a[min]: min = j','  swap(a[i], a[min])'],
  mountControls:function(h,c){ var self=this; sortControls(h,c,function(a){return self.build(a);}); },
  build:function(arr){
    var items=toItems(arr),n=items.length,F=[],cmp=0,sw=0,sorted=[];
    function snap(o){o.array=cloneItems(items);o.sorted=sorted.slice();o.stats={'เปรียบเทียบ':cmp,'สลับ':sw};F.push(o);}
    snap({line:0,note:'เริ่มต้น'});
    for(var i=0;i<n-1;i++){
      var mn=i; snap({line:1,note:'ตั้ง a['+i+'] เป็นค่าน้อยสุดชั่วคราว',active:[i],pivot:mn});
      for(var j=i+1;j<n;j++){
        cmp++; snap({line:3,note:'เทียบ a['+j+']='+items[j].v+' กับค่าน้อยสุด ('+items[mn].v+')',compare:[j],pivot:mn});
        if(items[j].v<items[mn].v){ mn=j; snap({line:3,note:'พบค่าน้อยกว่า → min = '+j,pivot:mn}); }
      }
      if(mn!==i){ var t=items[i];items[i]=items[mn];items[mn]=t; sw++; }
      snap({line:4,note:'สลับค่าน้อยสุดมาไว้ตำแหน่ง '+i,swap:[i,mn]});
      sorted.push(i);
    }
    snap({line:4,note:'เรียงเสร็จสมบูรณ์ ✓',sorted:rangeArr(0,n-1)});
    return F;
  }
});

AlgoViz.register({
  id:'insertion-sort', cat:'sort', nameTh:'Insertion Sort · เรียงแบบแทรก', nameEn:'Insertion Sort',
  difficulty:1, time:'O(n²)', space:'O(1)', renderer:'bars', glyph:'bars',
  blurb:'หยิบทีละตัวมาแทรกลงในส่วนที่เรียงแล้วให้อยู่ถูกที่ เหมือนจัดไพ่ในมือ',
  explain:'ไล่จากซ้ายไปขวา หยิบสมาชิก (key) ทีละตัว แล้วเลื่อนสมาชิกที่มากกว่าไปทางขวาเพื่อเปิดช่องแทรก key ลงตำแหน่งที่ถูกต้อง',
  note:'เร็วมากเมื่อข้อมูลเกือบเรียงแล้ว (เข้าใกล้ O(n)) นิยมใช้กับข้อมูลชุดเล็ก',
  pseudocode:['for i = 1 → n-1:','  key = a[i]','  j = i-1','  while j ≥ 0 and a[j] > key:','    a[j+1] = a[j]   // เลื่อนขวา','    j = j-1','  a[j+1] = key'],
  mountControls:function(h,c){ var self=this; sortControls(h,c,function(a){return self.build(a);}); },
  build:function(arr){
    var items=toItems(arr),n=items.length,F=[],cmp=0,sw=0;
    function sortedTo(k){ return rangeArr(0,k); }
    function snap(o){o.array=cloneItems(items);o.stats={'เปรียบเทียบ':cmp,'ย้าย':sw};F.push(o);}
    snap({line:0,note:'เริ่มต้น — ถือว่า a[0] เรียงแล้ว',sorted:[0]});
    for(var i=1;i<n;i++){
      snap({line:1,note:'หยิบ key = a['+i+'] = '+items[i].v,active:[i],sorted:sortedTo(i-1)});
      var j=i;
      while(j>0){
        cmp++; snap({line:3,note:'เทียบ a['+(j-1)+']='+items[j-1].v+' กับ key '+items[j].v,compare:[j-1,j],sorted:sortedTo(i)});
        if(items[j-1].v>items[j].v){ var t=items[j];items[j]=items[j-1];items[j-1]=t; sw++; j--; snap({line:4,note:'มากกว่า key → เลื่อนไปทางขวา',swap:[j,j+1],sorted:sortedTo(i)}); }
        else { break; }
      }
      snap({line:6,note:'วาง key ลงตำแหน่ง '+j,active:[j],sorted:sortedTo(i)});
    }
    snap({line:6,note:'เรียงเสร็จสมบูรณ์ ✓',sorted:sortedTo(n-1)});
    return F;
  }
});

AlgoViz.register({
  id:'merge-sort', cat:'sort', nameTh:'Merge Sort · เรียงแบบผสาน', nameEn:'Merge Sort',
  difficulty:2, time:'O(n log n)', space:'O(n)', renderer:'bars', glyph:'bars',
  blurb:'แบ่งครึ่งไปเรื่อย ๆ จนเหลือตัวเดียว แล้วผสาน (merge) กลับแบบเรียงแล้ว',
  explain:'ใช้แนวคิด Divide & Conquer แบ่งอาร์เรย์ออกเป็นครึ่งซ้าย–ขวาซ้ำ ๆ จนเหลือชิ้นละ 1 ตัว จากนั้นผสานสองฝั่งที่เรียงแล้วเข้าด้วยกันจนกลับมาเป็นก้อนเดียว',
  note:'เร็วสม่ำเสมอ O(n log n) ทุกกรณี และ stable แต่ต้องใช้หน่วยความจำเสริม O(n)',
  pseudocode:['mergeSort(a, lo, hi):','  mid = (lo + hi) / 2','  mergeSort(a, lo, mid)','  mergeSort(a, mid+1, hi)','  merge(a, lo, mid, hi)'],
  mountControls:function(h,c){ var self=this; sortControls(h,c,function(a){return self.build(a);}, {max:12}); },
  build:function(arr){
    var items=toItems(arr),n=items.length,F=[],cmp=0,mov=0;
    function snap(o){o.array=cloneItems(items);o.stats={'เปรียบเทียบ':cmp,'ผสาน':mov};F.push(o);}
    snap({line:0,note:'เริ่มต้น — จะแบ่งครึ่งไปเรื่อย ๆ'});
    function ms(lo,hi){
      if(lo>=hi) return;
      var mid=(lo+hi)>>1;
      snap({line:1,note:'แบ่งช่วง [ '+lo+' .. '+hi+' ] ที่กลาง = '+mid,range:[lo,hi],active:rangeArr(lo,hi)});
      ms(lo,mid); ms(mid+1,hi);
      var left=items.slice(lo,mid+1), right=items.slice(mid+1,hi+1), merged=[], i=0, j=0;
      while(i<left.length&&j<right.length){ cmp++; if(left[i].v<=right[j].v) merged.push(left[i++]); else merged.push(right[j++]); }
      while(i<left.length) merged.push(left[i++]);
      while(j<right.length) merged.push(right[j++]);
      for(var k=0;k<merged.length;k++){ items[lo+k]=merged[k]; mov++; }
      snap({line:4,note:'ผสานสองฝั่งที่เรียงแล้ว → [ '+lo+' .. '+hi+' ]',range:[lo,hi],active:rangeArr(lo,hi)});
    }
    ms(0,n-1);
    snap({line:4,note:'เรียงเสร็จสมบูรณ์ ✓',sorted:rangeArr(0,n-1)});
    return F;
  }
});

AlgoViz.register({
  id:'quick-sort', cat:'sort', nameTh:'Quick Sort · เรียงแบบเร็ว', nameEn:'Quick Sort',
  difficulty:2, time:'O(n log n)', space:'O(log n)', renderer:'bars', glyph:'bars',
  blurb:'เลือก pivot แล้วแบ่งข้อมูลเป็นฝั่งน้อยกว่า/มากกว่า จากนั้นทำซ้ำแต่ละฝั่ง',
  explain:'เลือกตัว pivot (ในที่นี้ใช้ตัวขวาสุด) แล้วจัดให้ค่าที่น้อยกว่า pivot อยู่ซ้าย ค่ามากกว่าอยู่ขวา (partition) จากนั้นเรียกซ้ำกับสองฝั่ง',
  note:'เร็วมากในทางปฏิบัติ เฉลี่ย O(n log n) แต่กรณีแย่สุด O(n²) หากเลือก pivot ไม่ดี',
  pseudocode:['quickSort(a, lo, hi):','  if lo ≥ hi: return','  pivot = a[hi]','  i = lo','  for j = lo → hi-1:','    if a[j] < pivot: swap(a[i],a[j]); i++','  swap(a[i], a[hi])   // วาง pivot','  quickSort ซ้าย + ขวา'],
  mountControls:function(h,c){ var self=this; sortControls(h,c,function(a){return self.build(a);}); },
  build:function(arr){
    var items=toItems(arr),n=items.length,F=[],cmp=0,sw=0,done=[];
    function snap(o){o.array=cloneItems(items);o.sorted=done.slice();o.stats={'เปรียบเทียบ':cmp,'สลับ':sw};F.push(o);}
    snap({line:0,note:'เริ่มต้น'});
    function qs(lo,hi){
      if(lo>hi) return;
      if(lo===hi){ if(done.indexOf(lo)<0) done.push(lo); snap({line:1,note:'ช่วงเหลือ 1 ตัว → ลงตัว',sorted:done.slice()}); return; }
      var pivot=items[hi].v, i=lo;
      snap({line:2,note:'เลือก pivot = a['+hi+'] = '+pivot,pivot:hi,range:[lo,hi]});
      for(var j=lo;j<hi;j++){
        cmp++; snap({line:4,note:'เทียบ a['+j+']='+items[j].v+' กับ pivot '+pivot,compare:[j],pivot:hi});
        if(items[j].v<pivot){ if(i!==j){ var t=items[i];items[i]=items[j];items[j]=t; sw++; } snap({line:5,note:'น้อยกว่า pivot → ย้ายไปฝั่งซ้าย',swap:[i,j],pivot:hi}); i++; }
      }
      var t2=items[i];items[i]=items[hi];items[hi]=t2; sw++;
      snap({line:6,note:'วาง pivot ลงตำแหน่งที่ถูกต้อง = '+i,swap:[i,hi]});
      done.push(i); snap({line:6,note:'a['+i+'] ลงตัวแล้ว',sorted:done.slice()});
      qs(lo,i-1); qs(i+1,hi);
    }
    qs(0,n-1);
    snap({line:7,note:'เรียงเสร็จสมบูรณ์ ✓',sorted:rangeArr(0,n-1)});
    return F;
  }
});

/* ================= SEARCHING ================= */
function searchControls(host, ctx, build, sorted){
  var min=6,max=14,def=10;
  host.innerHTML =
    '<div class="av-field"><label>ขนาดข้อมูล <span class="av-range-val" data-sz></span></label><input type="range" data-size min="'+min+'" max="'+max+'" value="'+def+'"></div>'
   +'<div class="av-field"><label>ข้อมูล'+(sorted?' (จะเรียงให้อัตโนมัติ)':'')+'</label><input class="av-input" data-arr></div>'
   +'<div class="av-field"><label>ค่าที่ค้นหา (target)</label><input class="av-input" data-target></div>'
   +'<div class="av-btn-row"><button class="btn btn-accent btn-sm" data-rand>สุ่มใหม่</button><button class="btn btn-ghost btn-sm" data-apply>ค้นหา</button></div>';
  var sizeI=host.querySelector('[data-size]'), arrI=host.querySelector('[data-arr]'), tI=host.querySelector('[data-target]'), szl=host.querySelector('[data-sz]');
  function prep(a){ if(sorted) a=a.slice().sort(function(x,y){return x-y;}); return a; }
  function load(a,t){ ctx.load(build(prep(a),t)); }
  function gen(){ var nn=parseInt(sizeI.value,10); szl.textContent=nn; var a=[]; for(var i=0;i<nn;i++)a.push(randInt(1,99)); a=prep(a); arrI.value=a.join(', '); var t=Math.random()<0.6? a[randInt(0,a.length-1)] : randInt(1,99); tI.value=t; load(a,t); }
  function apply(){ var a=parseList(arrI.value,max,1,999); if(a.length<2){ gen(); return; } a=prep(a); sizeI.value=clamp(a.length,min,max); szl.textContent=a.length; arrI.value=a.join(', '); var t=parseInt(tI.value,10); if(isNaN(t)) t=a[0]; tI.value=t; load(a,t); }
  sizeI.addEventListener('input',function(){szl.textContent=sizeI.value;});
  sizeI.addEventListener('change',gen);
  host.querySelector('[data-rand]').addEventListener('click',gen);
  host.querySelector('[data-apply]').addEventListener('click',apply);
  gen();
}

AlgoViz.register({
  id:'linear-search', cat:'search', nameTh:'Linear Search · ค้นหาแบบเชิงเส้น', nameEn:'Linear Search',
  difficulty:1, time:'O(n)', space:'O(1)', renderer:'array', glyph:'search',
  blurb:'ไล่ดูทีละช่องจากซ้ายไปขวา จนกว่าจะเจอค่าที่ต้องการ',
  explain:'วิธีค้นหาที่ตรงไปตรงมาที่สุด — ตรวจทีละตำแหน่งตั้งแต่ต้นจนเจอ target หรือหมดอาร์เรย์ ใช้ได้กับข้อมูลที่ไม่ได้เรียง',
  note:'ไม่ต้องเรียงข้อมูลก่อน แต่ช้าเมื่อข้อมูลเยอะ เพราะแย่สุดต้องดูครบทุกตัว (O(n))',
  pseudocode:['for i = 0 → n-1:','  if a[i] == target:','    return i   // เจอแล้ว','return -1   // ไม่พบ'],
  mountControls:function(h,c){ var self=this; searchControls(h,c,function(a,t){return self.build(a,t);}, false); },
  build:function(arr,target){
    var F=[], seen=0;
    function snap(o){o.array=arr.slice();o.stats={'ตรวจแล้ว':seen,'เป้าหมาย':target};F.push(o);}
    snap({line:0,note:'ค้นหาค่า '+target+' ตั้งแต่ตำแหน่งแรก'});
    var found=-1;
    for(var i=0;i<arr.length;i++){
      seen++; snap({line:1,note:'ดู a['+i+'] = '+arr[i]+' ตรงกับ '+target+' ไหม?',active:[i],ptrs:{i:i}});
      if(arr[i]===target){ found=i; snap({line:2,note:'พบ '+target+' ที่ตำแหน่ง '+i+' ✓',found:i,ptrs:{i:i}}); break; }
    }
    if(found<0) snap({line:3,note:'ดูครบทุกตำแหน่งแล้วไม่พบ '+target+' → -1'});
    return F;
  }
});

AlgoViz.register({
  id:'binary-search', cat:'search', nameTh:'Binary Search · ค้นหาแบบทวิภาค', nameEn:'Binary Search',
  difficulty:1, time:'O(log n)', space:'O(1)', renderer:'array', glyph:'search',
  blurb:'บนข้อมูลที่เรียงแล้ว ตัดครึ่งช่วงค้นหาทุกครั้ง เร็วสุด ๆ',
  explain:'ใช้ได้เมื่อข้อมูลเรียงแล้ว ดูตัวกลาง (mid) ถ้าตรงก็จบ ถ้า target มากกว่าก็ตัดครึ่งซ้ายทิ้ง ถ้าน้อยกว่าก็ตัดครึ่งขวาทิ้ง เหลือครึ่งเดียวทุกครั้ง',
  note:'ต้องเรียงข้อมูลก่อน แต่เร็วมาก O(log n) — ข้อมูลล้านตัวใช้แค่ ~20 ครั้ง',
  pseudocode:['lo = 0 ,  hi = n-1','while lo ≤ hi:','  mid = (lo + hi) / 2','  if a[mid] == target: return mid','  else if a[mid] < target: lo = mid+1','  else: hi = mid-1','return -1'],
  mountControls:function(h,c){ var self=this; searchControls(h,c,function(a,t){return self.build(a,t);}, true); },
  build:function(arr,target){
    var F=[], lo=0, hi=arr.length-1, steps=0;
    function dim(){ var d=[]; for(var i=0;i<arr.length;i++) if(i<lo||i>hi) d.push(i); return d; }
    function snap(o){o.array=arr.slice();o.stats={'รอบที่':steps,'เป้าหมาย':target};F.push(o);}
    snap({line:0,note:'เริ่มด้วยช่วงทั้งหมด lo=0, hi='+hi,ptrs:{lo:lo,hi:hi},range:[lo,hi]});
    var found=-1;
    while(lo<=hi){
      steps++;
      var mid=(lo+hi)>>1;
      snap({line:2,note:'กลางช่วงคือ mid='+mid+' (a['+mid+']='+arr[mid]+')',active:[mid],ptrs:{lo:lo,mid:mid,hi:hi},range:[lo,hi],dim:dim()});
      if(arr[mid]===target){ found=mid; snap({line:3,note:'a[mid] == '+target+' → พบที่ตำแหน่ง '+mid+' ✓',found:mid,ptrs:{lo:lo,mid:mid,hi:hi},range:[lo,hi],dim:dim()}); break; }
      else if(arr[mid]<target){ snap({line:4,note:'a[mid]='+arr[mid]+' น้อยกว่า '+target+' → ตัดครึ่งซ้ายทิ้ง (lo='+(mid+1)+')',ptrs:{lo:lo,mid:mid,hi:hi},range:[lo,hi],dim:dim()}); lo=mid+1; }
      else { snap({line:5,note:'a[mid]='+arr[mid]+' มากกว่า '+target+' → ตัดครึ่งขวาทิ้ง (hi='+(mid-1)+')',ptrs:{lo:lo,mid:mid,hi:hi},range:[lo,hi],dim:dim()}); hi=mid-1; }
    }
    if(found<0) snap({line:6,note:'ช่วงค้นหาหมดแล้วไม่พบ '+target+' → -1'});
    return F;
  }
});

/* ================= LINEAR DATA STRUCTURES ================= */
function opUI(host, buttons, note){
  host.innerHTML =
    '<div class="av-field"><label>ค่า (value)</label><input class="av-input" data-val type="number" value="'+randInt(10,90)+'"></div>'
   +'<div class="av-btn-row">'+buttons+'</div>'
   +(note?'<div style="font-size:11.5px;color:var(--text-3);margin-top:12px;line-height:1.5">'+note+'</div>':'');
  return host.querySelector('[data-val]');
}
function getVal(host){ var v=parseInt(host.querySelector('[data-val]').value,10); return isNaN(v)?null:v; }

AlgoViz.register({
  id:'stack', cat:'linear', nameTh:'Stack · สแตก (LIFO)', nameEn:'Stack',
  difficulty:1, time:'O(1)', space:'O(n)', renderer:'stack', glyph:'stack',
  blurb:'เข้าหลังออกก่อน — เพิ่ม/ลบได้ที่ปลายบนสุดเท่านั้น (push / pop)',
  explain:'โครงสร้างแบบ LIFO (Last In, First Out) ทำงานที่ปลายเดียวคือ “บนสุด (top)” เท่านั้น เหมือนกองจานที่วางซ้อนกัน จานที่วางล่าสุดถูกหยิบก่อน',
  note:'ใช้ในระบบ Undo, การเรียกฟังก์ชัน (call stack), ตรวจวงเล็บ ทุกการทำงาน O(1)',
  pseudocode:['push(x):  a[top] = x ; top++','pop():    top-- ; return a[top]','peek():   return a[top-1]'],
  mountControls:function(host,ctx){
    var items=[5,8,3]; var MAX=6;
    var v=opUI(host,'<button class="btn btn-accent btn-sm" data-push>push ↑</button><button class="btn btn-ghost btn-sm" data-pop>pop ↓</button><button class="btn btn-ghost btn-sm" data-clear>ล้าง</button>','กด push เพื่อวางค่าใหม่บนสุด, pop เพื่อดึงตัวบนสุดออก (สูงสุด '+MAX+' ตัว)');
    function st(){ return {'ขนาด':items.length}; }
    function idle(n){ ctx.load([{items:items.slice(),note:n||'สแตกปัจจุบัน — '+items.length+' ตัว',stats:st()}]); }
    function push(){ var x=getVal(host); if(x==null)return; if(items.length>=MAX){ idle('สแตกเต็มแล้ว (สูงสุด '+MAX+' ตัว) — pop ก่อนถึงจะ push ได้'); return; } var F=[{items:items.slice(),note:'จะ push('+x+')',stats:st()}]; items.push(x); F.push({items:items.slice(),op:'push',line:0,note:'push('+x+') → วางไว้บนสุด',stats:st()}); ctx.load(F); }
    function pop(){ if(!items.length){ idle('สแตกว่าง — pop ไม่ได้'); return; } var top=items[items.length-1]; var F=[{items:items.slice(),op:'pop',line:1,note:'pop() → ดึงตัวบนสุด ('+top+') ออก',stats:st()}]; items.pop(); F.push({items:items.slice(),note:'หลัง pop เหลือ '+items.length+' ตัว',stats:st()}); ctx.load(F); }
    host.querySelector('[data-push]').onclick=push;
    host.querySelector('[data-pop]').onclick=pop;
    host.querySelector('[data-clear]').onclick=function(){ items=[]; idle('ล้างสแตกแล้ว'); };
    idle();
  }
});

AlgoViz.register({
  id:'queue', cat:'linear', nameTh:'Queue · คิว (FIFO)', nameEn:'Queue',
  difficulty:1, time:'O(1)', space:'O(n)', renderer:'queue', glyph:'queue',
  blurb:'เข้าก่อนออกก่อน — เพิ่มท้าย (rear) ลบหน้า (front) เหมือนต่อคิว',
  explain:'โครงสร้างแบบ FIFO (First In, First Out) เพิ่มสมาชิกที่ท้ายแถว (enqueue) และนำออกจากหน้าแถว (dequeue) เหมือนคนต่อคิวซื้อของ',
  note:'ใช้ในระบบคิวงาน, BFS, บัฟเฟอร์ ทุกการทำงาน O(1)',
  pseudocode:['enqueue(x): a[rear] = x ; rear++','dequeue():  x = a[front] ; front++ ; return x'],
  mountControls:function(host,ctx){
    var items=[4,9,1]; var MAX=10;
    opUI(host,'<button class="btn btn-accent btn-sm" data-enq>enqueue →</button><button class="btn btn-ghost btn-sm" data-deq>dequeue →</button><button class="btn btn-ghost btn-sm" data-clear>ล้าง</button>','enqueue เพิ่มที่ท้าย, dequeue นำออกจากหน้าแถว (สูงสุด '+MAX+' ตัว)');
    function st(){ return {'ขนาด':items.length}; }
    function idle(n){ ctx.load([{items:items.slice(),note:n||'คิวปัจจุบัน — '+items.length+' ตัว',stats:st()}]); }
    function enq(){ var x=getVal(host); if(x==null)return; if(items.length>=MAX){ idle('คิวเต็มแล้ว (สูงสุด '+MAX+' ตัว) — dequeue ก่อนถึงจะ enqueue ได้'); return; } var F=[{items:items.slice(),note:'จะ enqueue('+x+')',stats:st()}]; items.push(x); F.push({items:items.slice(),op:'enqueue',line:0,note:'enqueue('+x+') → ต่อท้ายแถว',stats:st()}); ctx.load(F); }
    function deq(){ if(!items.length){ idle('คิวว่าง — dequeue ไม่ได้'); return; } var fr=items[0]; var F=[{items:items.slice(),op:'dequeue',line:1,note:'dequeue() → นำ '+fr+' ออกจากหน้าแถว',stats:st()}]; items.shift(); F.push({items:items.slice(),note:'หลัง dequeue เหลือ '+items.length+' ตัว',stats:st()}); ctx.load(F); }
    host.querySelector('[data-enq]').onclick=enq;
    host.querySelector('[data-deq]').onclick=deq;
    host.querySelector('[data-clear]').onclick=function(){ items=[]; idle('ล้างคิวแล้ว'); };
    idle();
  }
});

AlgoViz.register({
  id:'linked-list', cat:'linear', nameTh:'Singly Linked List · ลิสต์เชื่อมโยง', nameEn:'Singly Linked List',
  difficulty:2, time:'O(n)', space:'O(n)', renderer:'linkedlist', glyph:'list',
  blurb:'โหนดแต่ละตัวเก็บค่าและตัวชี้ (next) ไปโหนดถัดไป ต่อกันเป็นสาย',
  explain:'ข้อมูลแบบเชื่อมโยง แต่ละโหนดเก็บค่า + pointer ชี้ไปโหนดถัดไป การเพิ่มหน้าสุดทำได้ทันที (O(1)) แต่การค้นหา/เพิ่มท้าย/ลบต้องเดินไล่จาก head (O(n))',
  note:'ยืดหยุ่นกว่าอาร์เรย์เรื่องการแทรก/ลบตรงกลาง แต่เข้าถึงแบบสุ่ม (random access) ไม่ได้ ต้องเดินทีละโหนด',
  pseudocode:['insertHead(x): new.next = head ; head = new','insertTail(x): เดินไปโหนดท้าย ; last.next = new','search(x):     เดินจาก head จนเจอ x','delete(x):     หา x แล้วข้าม (prev.next = cur.next)'],
  mountControls:function(host,ctx){
    var nodes=[{v:7},{v:3},{v:9}]; var MAX=7;
    host.innerHTML =
      '<div class="av-field"><label>ค่า (value)</label><input class="av-input" data-val type="number" value="'+randInt(10,90)+'"></div>'
     +'<div class="av-btn-row" style="margin-bottom:8px"><button class="btn btn-accent btn-sm" data-ih>+ หน้า</button><button class="btn btn-accent btn-sm" data-it>+ ท้าย</button></div>'
     +'<div class="av-btn-row"><button class="btn btn-ghost btn-sm" data-search>ค้นหา</button><button class="btn btn-ghost btn-sm" data-del>ลบ</button></div>'
     +'<div style="font-size:11.5px;color:var(--text-3);margin-top:12px;line-height:1.5">แทรกได้สูงสุด '+MAX+' โหนด</div>';
    function st(){ return {'จำนวนโหนด':nodes.length}; }
    function idle(n){ ctx.load([{nodes:nodes.slice(),note:n||'ลิสต์ปัจจุบัน — '+nodes.length+' โหนด',stats:st()}]); }
    function val(){ var v=parseInt(host.querySelector('[data-val]').value,10); return isNaN(v)?null:v; }
    function full(){ if(nodes.length>=MAX){ idle('ลิสต์เต็มแล้ว (สูงสุด '+MAX+' โหนด) — ลบก่อนถึงจะแทรกเพิ่มได้'); return true; } return false; }
    function ih(){ var x=val(); if(x==null)return; if(full())return; nodes.unshift({v:x}); ctx.load([{nodes:nodes.slice(),note:'จะแทรกหน้าสุด',stats:st(),ptr:0},{nodes:nodes.slice(),newIdx:0,line:0,note:'แทรก '+x+' ที่ head → O(1)',stats:st()}]); }
    function it(){ var x=val(); if(x==null)return; if(full())return; var F=[]; for(var i=0;i<nodes.length;i++) F.push({nodes:nodes.slice(),ptr:i,line:1,note:'เดินหา node ท้ายสุด… ตอนนี้ที่ '+i,stats:st()}); nodes.push({v:x}); F.push({nodes:nodes.slice(),newIdx:nodes.length-1,line:1,note:'ต่อ '+x+' ที่ท้ายสุด',stats:st()}); ctx.load(F); }
    function search(){ var x=val(); if(x==null)return; var F=[], found=-1; for(var i=0;i<nodes.length;i++){ F.push({nodes:nodes.slice(),ptr:i,line:2,note:'ดูโหนดที่ '+i+' = '+nodes[i].v+' == '+x+' ?',stats:st()}); if(nodes[i].v===x){ found=i; F.push({nodes:nodes.slice(),newIdx:i,line:2,note:'พบ '+x+' ที่โหนด '+i+' ✓',stats:st()}); break; } } if(found<0) F.push({nodes:nodes.slice(),line:2,note:'เดินจนสุดไม่พบ '+x,stats:st()}); ctx.load(F); }
    function del(){ var x=val(); if(x==null)return; var F=[], found=-1; for(var i=0;i<nodes.length;i++){ F.push({nodes:nodes.slice(),ptr:i,line:3,note:'หา '+x+' … โหนดที่ '+i+' = '+nodes[i].v,stats:st()}); if(nodes[i].v===x){ found=i; break; } } if(found<0){ F.push({nodes:nodes.slice(),line:3,note:'ไม่พบ '+x+' จึงลบไม่ได้',stats:st()}); ctx.load(F); return; } F.push({nodes:nodes.slice(),outIdx:found,line:3,note:'พบ '+x+' → ข้ามโหนดนี้ (prev.next = cur.next)',stats:st()}); nodes.splice(found,1); F.push({nodes:nodes.slice(),note:'ลบแล้ว เหลือ '+nodes.length+' โหนด',stats:st()}); ctx.load(F); }
    host.querySelector('[data-ih]').onclick=ih;
    host.querySelector('[data-it]').onclick=it;
    host.querySelector('[data-search]').onclick=search;
    host.querySelector('[data-del]').onclick=del;
    idle();
  }
});

AlgoViz.register({
  id:'hash-table', cat:'linear', nameTh:'Hash Table · ตารางแฮช (chaining)', nameEn:'Hash Table',
  difficulty:2, time:'O(1) เฉลี่ย', space:'O(n)', renderer:'hash', glyph:'hash',
  blurb:'แปลงค่าเป็นดัชนีด้วยฟังก์ชันแฮช เก็บของชนกันไว้เป็นลิสต์ (chaining)',
  explain:'ใช้ฟังก์ชันแฮช h(key) = key mod m เพื่อกระโดดไปช่องเก็บทันที ถ้าหลายค่าตกช่องเดียวกัน (collision) จะต่อกันเป็นลิสต์ในช่องนั้น (separate chaining)',
  note:'เฉลี่ยเพิ่ม/ค้นหา O(1) เร็วมาก แต่ถ้าชนกันเยอะจะกลายเป็น O(n) การเลือก m และฟังก์ชันแฮชที่ดีจึงสำคัญ',
  pseudocode:['insert(key): i = key mod m ; bucket[i].push(key)','search(key): i = key mod m ; ไล่ดูใน bucket[i]'],
  mountControls:function(host,ctx){
    var m=7, buckets=[]; for(var i=0;i<m;i++) buckets.push([]);
    [23,10,45,17,31].forEach(function(k){ buckets[k%m].push(k); });
    var v=opUI(host,'<button class="btn btn-accent btn-sm" data-ins>insert</button><button class="btn btn-ghost btn-sm" data-search>search</button><button class="btn btn-ghost btn-sm" data-clear>ล้าง</button>','ขนาดตาราง m = 7 · h(key) = key mod 7');
    function count(){ var c=0; buckets.forEach(function(b){c+=b.length;}); return c; }
    function st(){ return {'m':m,'จำนวนคีย์':count()}; }
    function copy(){ return buckets.map(function(b){return b.slice();}); }
    function idle(n){ ctx.load([{buckets:copy(),note:n||'ตารางแฮชปัจจุบัน',stats:st()}]); }
    function ins(){ var x=getVal(host); if(x==null)return; var i=((x%m)+m)%m; var F=[{buckets:copy(),active:i,line:0,note:'h('+x+') = '+x+' mod '+m+' = '+i,stats:st()}]; buckets[i].push(x); F.push({buckets:copy(),active:i,hitKey:x,line:0,note:'ใส่ '+x+' ต่อท้าย bucket['+i+']',stats:st()}); ctx.load(F); }
    function search(){ var x=getVal(host); if(x==null)return; var i=((x%m)+m)%m; var F=[{buckets:copy(),active:i,line:1,note:'h('+x+') = '+i+' → ไปดู bucket['+i+']',stats:st()}]; var chain=buckets[i], found=false; for(var j=0;j<chain.length;j++){ F.push({buckets:copy(),active:i,scan:j,line:1,note:'ดูตัวที่ '+j+' ใน bucket = '+chain[j],stats:st()}); if(chain[j]===x){ found=true; F.push({buckets:copy(),active:i,hitKey:x,line:1,note:'พบ '+x+' ✓',stats:st()}); break; } } if(!found) F.push({buckets:copy(),active:i,line:1,note:'ไม่พบ '+x+' ใน bucket['+i+']',stats:st()}); ctx.load(F); }
    host.querySelector('[data-ins]').onclick=ins;
    host.querySelector('[data-search]').onclick=search;
    host.querySelector('[data-clear]').onclick=function(){ buckets=[]; for(var i=0;i<m;i++)buckets.push([]); idle('ล้างตารางแล้ว'); };
    idle();
  }
});

/* ================= TREE STRUCTURES ================= */
function cloneMap(nodes){ var o={}; for(var k in nodes) o[k]={v:nodes[k].v,l:nodes[k].l,r:nodes[k].r}; return o; }

AlgoViz.register({
  id:'bst', cat:'tree', nameTh:'Binary Search Tree · ต้นไม้ค้นหาทวิภาค', nameEn:'Binary Search Tree',
  difficulty:2, time:'O(log n) เฉลี่ย', space:'O(n)', renderer:'tree', glyph:'tree',
  blurb:'ต้นไม้ที่ลูกซ้าย < พ่อ < ลูกขวา ทำให้ค้นหา/เพิ่ม/ลบเร็ว',
  explain:'ต้นไม้ทวิภาคที่ทุกโหนดมีสมบัติ: ค่าในซับทรีซ้ายน้อยกว่าโหนด และซับทรีขวามากกว่า ทำให้ค้นหาได้แบบตัดครึ่งเหมือน Binary Search',
  note:'เฉลี่ย O(log n) แต่ถ้าใส่ข้อมูลเรียงมาแล้วต้นไม้จะเอียงเป็นเส้นตรง (O(n)) จึงมี Self-balancing BST เช่น AVL / Red-Black',
  pseudocode:['insert(x):  cur = root','while cur != null:','  if x < cur.val: ไปทางซ้าย','  else:           ไปทางขวา','วางโหนดใหม่ที่ช่องว่างที่เจอ'],
  mountControls:function(host,ctx){
    var nodes={}, root=null, seq=1;
    function addSilent(x){ var id=String(seq++); nodes[id]={v:x,l:null,r:null}; if(root==null){root=id;return;} var cur=root; while(true){ if(x<nodes[cur].v){ if(nodes[cur].l==null){nodes[cur].l=id;return;} cur=nodes[cur].l; } else { if(nodes[cur].r==null){nodes[cur].r=id;return;} cur=nodes[cur].r; } } }
    function reset(vals){ nodes={}; root=null; seq=1; vals.forEach(addSilent); }
    reset([50,30,70,20,40,60,80]);
    function cnt(){ return Object.keys(nodes).length; }
    function st(){ return {'จำนวนโหนด':cnt()}; }
    function idle(n){ ctx.load([{nodes:cloneMap(nodes),root:root,note:n||'BST ปัจจุบัน',stats:st()}]); }
    function val(){ var v=parseInt(host.querySelector('[data-val]').value,10); return isNaN(v)?null:v; }
    function insert(){ var x=val(); if(x==null)return; var F=[];
      if(root==null){ var id0=String(seq++); nodes[id0]={v:x,l:null,r:null}; root=id0; F.push({nodes:cloneMap(nodes),root:root,newId:id0,line:4,note:'ต้นไม้ว่าง → '+x+' เป็นราก',stats:st()}); ctx.load(F); return; }
      var cur=root; F.push({nodes:cloneMap(nodes),root:root,compare:[root],line:0,note:'แทรก '+x+' — เริ่มที่ราก '+nodes[root].v});
      while(true){ F.push({nodes:cloneMap(nodes),root:root,compare:[cur],line:1,note:'เทียบ '+x+' กับ '+nodes[cur].v});
        if(x<nodes[cur].v){ if(nodes[cur].l==null){ var idl=String(seq++); nodes[idl]={v:x,l:null,r:null}; nodes[cur].l=idl; F.push({nodes:cloneMap(nodes),root:root,newId:idl,line:4,note:x+' < '+nodes[cur].v+' และซ้ายว่าง → วางเป็นลูกซ้าย',stats:st()}); break; } F.push({nodes:cloneMap(nodes),root:root,compare:[cur],line:2,note:x+' < '+nodes[cur].v+' → ไปทางซ้าย'}); cur=nodes[cur].l; }
        else { if(nodes[cur].r==null){ var idr=String(seq++); nodes[idr]={v:x,l:null,r:null}; nodes[cur].r=idr; F.push({nodes:cloneMap(nodes),root:root,newId:idr,line:4,note:x+' ≥ '+nodes[cur].v+' และขวาว่าง → วางเป็นลูกขวา',stats:st()}); break; } F.push({nodes:cloneMap(nodes),root:root,compare:[cur],line:3,note:x+' ≥ '+nodes[cur].v+' → ไปทางขวา'}); cur=nodes[cur].r; }
      }
      ctx.load(F);
    }
    function search(){ var x=val(); if(x==null)return; var F=[], cur=root, found=false;
      while(cur!=null){ F.push({nodes:cloneMap(nodes),root:root,compare:[cur],line:1,note:'เทียบ '+x+' กับ '+nodes[cur].v}); if(x===nodes[cur].v){ found=true; F.push({nodes:cloneMap(nodes),root:root,active:cur,note:'พบ '+x+' ✓',stats:st()}); break; } cur = x<nodes[cur].v? nodes[cur].l : nodes[cur].r; }
      if(!found) F.push({nodes:cloneMap(nodes),root:root,note:'ไม่พบ '+x+' ในต้นไม้',stats:st()}); ctx.load(F);
    }
    function delRec(id,x){ if(id==null)return null; var nd=nodes[id]; if(x<nd.v){ nd.l=delRec(nd.l,x); return id; } if(x>nd.v){ nd.r=delRec(nd.r,x); return id; } if(nd.l==null){ var r=nd.r; delete nodes[id]; return r; } if(nd.r==null){ var l=nd.l; delete nodes[id]; return l; } var s=nd.r; while(nodes[s].l!=null) s=nodes[s].l; nd.v=nodes[s].v; nd.r=delRec(nd.r, nodes[s].v); return id; }
    function del(){ var x=val(); if(x==null)return; var F=[], cur=root, found=false;
      while(cur!=null){ F.push({nodes:cloneMap(nodes),root:root,compare:[cur],line:1,note:'หา '+x+' … ที่ '+nodes[cur].v}); if(nodes[cur].v===x){ found=true; F.push({nodes:cloneMap(nodes),root:root,active:cur,note:'พบ '+x+' → เตรียมลบและจัดต้นไม้ใหม่'}); break; } cur = x<nodes[cur].v? nodes[cur].l : nodes[cur].r; }
      if(!found){ F.push({nodes:cloneMap(nodes),root:root,note:'ไม่พบ '+x+' จึงลบไม่ได้',stats:st()}); ctx.load(F); return; }
      root=delRec(root,x); F.push({nodes:cloneMap(nodes),root:root,note:'ลบ '+x+' เสร็จ จัดต้นไม้ใหม่แล้ว',stats:st()}); ctx.load(F);
    }
    host.innerHTML =
      '<div class="av-field"><label>ค่า (value)</label><input class="av-input" data-val type="number" value="'+randInt(10,90)+'"></div>'
     +'<div class="av-btn-row" style="margin-bottom:8px"><button class="btn btn-accent btn-sm" data-ins>insert</button><button class="btn btn-ghost btn-sm" data-search>search</button></div>'
     +'<div class="av-btn-row"><button class="btn btn-ghost btn-sm" data-del>delete</button><button class="btn btn-ghost btn-sm" data-rand>สุ่มต้นไม้</button></div>';
    host.querySelector('[data-ins]').onclick=insert;
    host.querySelector('[data-search]').onclick=search;
    host.querySelector('[data-del]').onclick=del;
    host.querySelector('[data-rand]').onclick=function(){ var vals=[], used={}; for(var i=0;i<7;i++){ var x; do{x=randInt(5,99);}while(used[x]); used[x]=1; vals.push(x); } reset(vals); idle('สุ่มต้นไม้ใหม่'); };
    idle();
  }
});

AlgoViz.register({
  id:'tree-traversal', cat:'tree', nameTh:'Tree Traversal · การท่องต้นไม้', nameEn:'Tree Traversal',
  difficulty:2, time:'O(n)', space:'O(h)', renderer:'tree', glyph:'trav',
  blurb:'ท่องทุกโหนด 4 แบบ: Pre / In / Post / Level-order เห็นลำดับต่างกันชัด ๆ',
  explain:'การเดินเยี่ยมทุกโหนดในต้นไม้ · In-order (ซ้าย-ราก-ขวา) ให้ค่าที่เรียงจากน้อยไปมากใน BST · Pre-order (ราก-ซ้าย-ขวา) · Post-order (ซ้าย-ขวา-ราก) · Level-order เดินทีละชั้นด้วยคิว',
  note:'Pre/In/Post ใช้ recursion (DFS) ลึก O(h) ส่วน Level-order ใช้ Queue (BFS) — เลือกใช้ตามงาน เช่น In-order เพื่อดึงค่าที่เรียงแล้ว',
  pseudocode:['traverse(node):','  if node == null: return','  // In-order:','  traverse(node.left)','  visit(node)','  traverse(node.right)'],
  mountControls:function(host,ctx){
    var nodes={}, root=null, seq=1;
    function addSilent(x){ var id=String(seq++); nodes[id]={v:x,l:null,r:null}; if(root==null){root=id;return;} var cur=root; while(true){ if(x<nodes[cur].v){ if(nodes[cur].l==null){nodes[cur].l=id;return;} cur=nodes[cur].l; } else { if(nodes[cur].r==null){nodes[cur].r=id;return;} cur=nodes[cur].r; } } }
    function reset(vals){ nodes={}; root=null; seq=1; vals.forEach(addSilent); }
    reset([50,30,70,20,40,65,85]);
    function seqFor(kind){ var s=[];
      function pre(id){ if(id==null)return; s.push(id); pre(nodes[id].l); pre(nodes[id].r); }
      function ino(id){ if(id==null)return; ino(nodes[id].l); s.push(id); ino(nodes[id].r); }
      function post(id){ if(id==null)return; post(nodes[id].l); post(nodes[id].r); s.push(id); }
      function lvl(){ var q=[root]; while(q.length){ var id=q.shift(); if(id==null)continue; s.push(id); if(nodes[id].l)q.push(nodes[id].l); if(nodes[id].r)q.push(nodes[id].r); } }
      if(kind==='pre')pre(root); else if(kind==='in')ino(root); else if(kind==='post')post(root); else lvl(); return s;
    }
    function run(kind,label){ var s=seqFor(kind), F=[{nodes:cloneMap(nodes),root:root,order:label,note:'เริ่ม '+label,stats:{'เยี่ยมแล้ว':0}}]; var vis=[], res=[];
      s.forEach(function(id){ res.push(nodes[id].v); F.push({nodes:cloneMap(nodes),root:root,order:label,active:id,visited:vis.slice(),line:4,note:'เยี่ยม '+nodes[id].v+'  →  ['+res.join(', ')+']',stats:{'เยี่ยมแล้ว':res.length}}); vis.push(id); });
      F.push({nodes:cloneMap(nodes),root:root,order:label,visited:vis.slice(),note:label+' เสร็จ: '+res.join(', '),stats:{'เยี่ยมแล้ว':res.length}}); ctx.load(F);
    }
    host.innerHTML =
      '<div class="av-btn-row" style="margin-bottom:8px"><button class="btn btn-accent btn-sm" data-pre>Pre-order</button><button class="btn btn-accent btn-sm" data-in>In-order</button></div>'
     +'<div class="av-btn-row" style="margin-bottom:8px"><button class="btn btn-accent btn-sm" data-post>Post-order</button><button class="btn btn-accent btn-sm" data-lvl>Level-order</button></div>'
     +'<div class="av-btn-row"><button class="btn btn-ghost btn-sm" data-rand>สุ่มต้นไม้ใหม่</button></div>'
     +'<div style="font-size:11.5px;color:var(--text-3);margin-top:12px;line-height:1.5">เลือกวิธีท่อง แล้วกด Play ดูลำดับการเยี่ยมทีละโหนด</div>';
    host.querySelector('[data-pre]').onclick=function(){ run('pre','Pre-order (ราก-ซ้าย-ขวา)'); };
    host.querySelector('[data-in]').onclick=function(){ run('in','In-order (ซ้าย-ราก-ขวา)'); };
    host.querySelector('[data-post]').onclick=function(){ run('post','Post-order (ซ้าย-ขวา-ราก)'); };
    host.querySelector('[data-lvl]').onclick=function(){ run('level','Level-order (ทีละชั้น)'); };
    host.querySelector('[data-rand]').onclick=function(){ var vals=[], used={}; for(var i=0;i<7;i++){ var x; do{x=randInt(5,99);}while(used[x]); used[x]=1; vals.push(x); } reset(vals); run('in','In-order (ซ้าย-ราก-ขวา)'); };
    run('in','In-order (ซ้าย-ราก-ขวา)');
  }
});

AlgoViz.register({
  id:'binary-heap', cat:'tree', nameTh:'Binary Heap · ฮีปทวิภาค (Priority Queue)', nameEn:'Binary Heap',
  difficulty:3, time:'O(log n)', space:'O(n)', renderer:'tree', glyph:'heap',
  blurb:'ต้นไม้ที่พ่อ ≤ ลูกเสมอ (min-heap) หยิบค่าน้อยสุดได้เร็ว ใช้ทำ Priority Queue',
  explain:'Complete binary tree ที่เก็บในอาร์เรย์ · min-heap: พ่อมีค่าน้อยกว่าลูกเสมอ ค่าน้อยสุดจึงอยู่ราก · insert ดันขึ้น (sift-up) · extract-min ย้ายตัวท้ายมาราก แล้วดันลง (sift-down)',
  note:'หัวใจของ Priority Queue และ Heap Sort · index i มีลูกที่ 2i+1, 2i+2 และพ่อที่ (i−1)/2 — ทั้ง insert และ extract เป็น O(log n)',
  pseudocode:['insert(x): วางที่ท้าย','while a[i] < a[parent]:','  swap ; i = parent      // sift-up','extractMin: min=a[0]; a[0]=a.pop()','sift-down: สลับกับลูกที่น้อยกว่า'],
  mountControls:function(host,ctx){
    var heap=[];
    function insS(x){ heap.push(x); var i=heap.length-1; while(i>0){ var p=(i-1)>>1; if(heap[i]<heap[p]){ var t=heap[i];heap[i]=heap[p];heap[p]=t; i=p; } else break; } }
    [30,15,40,10,22,35].forEach(insS);
    function st(){ return {'ขนาด':heap.length,'ค่าน้อยสุด':heap.length?heap[0]:'—'}; }
    function idle(n){ ctx.load([{heap:heap.slice(),note:n||'binary min-heap ปัจจุบัน',stats:st()}]); }
    function ins(){ var x=getVal(host); if(x==null)return; var F=[]; heap.push(x); var i=heap.length-1;
      F.push({heap:heap.slice(),active:i,line:0,note:'ใส่ '+x+' ที่ท้าย (index '+i+')',stats:st()});
      while(i>0){ var p=(i-1)>>1; F.push({heap:heap.slice(),compare:[i,p],line:1,note:'เทียบกับพ่อ a['+p+']='+heap[p]});
        if(heap[i]<heap[p]){ var t=heap[i];heap[i]=heap[p];heap[p]=t; F.push({heap:heap.slice(),active:p,line:2,note:heap[p]+' น้อยกว่าพ่อเดิม → สลับขึ้น (sift-up)'}); i=p; }
        else { F.push({heap:heap.slice(),active:i,line:1,note:'ไม่น้อยกว่าพ่อ → หยุด'}); break; }
      }
      F.push({heap:heap.slice(),note:'insert เสร็จ',stats:st()}); ctx.load(F);
    }
    function ext(){ if(!heap.length){ idle('heap ว่าง'); return; } var F=[], mn=heap[0];
      F.push({heap:heap.slice(),active:0,line:3,note:'ดึงค่าน้อยสุด = '+mn+' (ราก)',stats:st()});
      var last=heap.pop();
      if(heap.length){ heap[0]=last; F.push({heap:heap.slice(),active:0,line:3,note:'ย้ายตัวท้าย ('+last+') มาไว้ราก แล้วเริ่ม sift-down'});
        var i=0, n=heap.length;
        while(true){ var l=2*i+1, r=2*i+2, sm=i; if(l<n&&heap[l]<heap[sm])sm=l; if(r<n&&heap[r]<heap[sm])sm=r;
          F.push({heap:heap.slice(),compare:[i,l<n?l:i,r<n?r:i],line:4,note:'หาลูกที่น้อยกว่าพ่อ a['+i+']='+heap[i]});
          if(sm===i){ F.push({heap:heap.slice(),active:i,line:4,note:'พ่อน้อยกว่าลูกทั้งคู่ → หยุด'}); break; }
          var t=heap[i];heap[i]=heap[sm];heap[sm]=t; F.push({heap:heap.slice(),active:sm,line:4,note:'สลับลงกับลูกที่น้อยกว่า'}); i=sm;
        }
      }
      F.push({heap:heap.slice(),note:'เอา '+mn+' ออกแล้ว',stats:st()}); ctx.load(F);
    }
    opUI(host,'<button class="btn btn-accent btn-sm" data-ins>insert</button><button class="btn btn-ghost btn-sm" data-ext>extract-min</button><button class="btn btn-ghost btn-sm" data-clear>ล้าง</button>','พ่อ ≤ ลูกเสมอ · ด้านล่างคืออาร์เรย์จริงที่ใช้เก็บ heap');
    host.querySelector('[data-ins]').onclick=ins;
    host.querySelector('[data-ext]').onclick=ext;
    host.querySelector('[data-clear]').onclick=function(){ heap=[]; idle('ล้าง heap แล้ว'); };
    idle();
  }
});

AlgoViz.register({
  id:'heap-sort', cat:'tree', nameTh:'Heap Sort · เรียงด้วยฮีป', nameEn:'Heap Sort',
  difficulty:3, time:'O(n log n)', space:'O(1)', renderer:'bars', glyph:'heap',
  blurb:'สร้าง max-heap แล้วดึงตัวมากสุดไปไว้ท้ายทีละตัว จนเรียงครบ',
  explain:'ขั้นแรกจัดอาร์เรย์ให้เป็น max-heap (ตัวมากสุดขึ้นเป็นราก = ตำแหน่ง 0) จากนั้นสลับรากไปไว้ท้ายสุด ลดขนาด heap แล้ว sift-down ซ่อมรากใหม่ ทำซ้ำจนเหลือตัวเดียว',
  note:'เรียงในที่ (in-place) ใช้หน่วยความจำ O(1) และเร็ว O(n log n) ทุกกรณี แต่ไม่ stable',
  pseudocode:['buildMaxHeap(a)','// ราก a[0] = ค่ามากสุด','siftDown: เทียบพ่อกับลูก','  ถ้าลูกมากกว่า → สลับลง','swap(a[0], a[end]) ; end--','done'],
  mountControls:function(h,c){ var self=this; sortControls(h,c,function(a){return self.build(a);}, {max:12}); },
  build:function(arr){
    var items=toItems(arr), n=items.length, F=[], cmp=0, sw=0, sorted=[];
    function snap(o){o.array=cloneItems(items);o.sorted=sorted.slice();o.stats={'เปรียบเทียบ':cmp,'สลับ':sw};F.push(o);}
    function sift(i,size){ while(true){ var l=2*i+1,r=2*i+2,big=i; if(l<size){cmp++; if(items[l].v>items[big].v)big=l;} if(r<size){cmp++; if(items[r].v>items[big].v)big=r;} var comp=[i]; if(l<size)comp.push(l); if(r<size)comp.push(r); snap({line:2,note:'เทียบพ่อ a['+i+'] กับลูก',compare:comp,active:[i]}); if(big===i)break; var t=items[i];items[i]=items[big];items[big]=t; sw++; snap({line:3,note:'ลูกมากกว่าพ่อ → สลับลง',swap:[i,big]}); i=big; } }
    snap({line:0,note:'เริ่ม — สร้าง max-heap จากอาร์เรย์'});
    for(var i=(n>>1)-1;i>=0;i--) sift(i,n);
    snap({line:1,note:'ได้ max-heap แล้ว (ตัวมากสุดอยู่หน้าสุด)'});
    for(var e=n-1;e>0;e--){ var t=items[0];items[0]=items[e];items[e]=t; sw++; sorted.unshift(e); snap({line:4,note:'สลับตัวมากสุดไปไว้ท้าย (ตำแหน่ง '+e+')',swap:[0,e]}); sift(0,e); }
    snap({line:5,note:'เรียงเสร็จสมบูรณ์ ✓',sorted:rangeArr(0,n-1)});
    return F;
  }
});

/* ================= GRAPH & PATHFINDING ================= */
var GBASE = {
  nodes:[{id:'A',label:'A',x:140,y:270},{id:'B',label:'B',x:320,y:110},{id:'C',label:'C',x:320,y:430},{id:'D',label:'D',x:510,y:80},{id:'E',label:'E',x:510,y:270},{id:'F',label:'F',x:510,y:460},{id:'G',label:'G',x:730,y:170},{id:'H',label:'H',x:730,y:390}],
  edges:[{u:'A',v:'B',w:4},{u:'A',v:'C',w:3},{u:'B',v:'E',w:2},{u:'B',v:'D',w:5},{u:'C',v:'E',w:6},{u:'C',v:'F',w:4},{u:'D',v:'G',w:3},{u:'E',v:'G',w:5},{u:'E',v:'F',w:1},{u:'F',v:'H',w:7},{u:'G',v:'H',w:2}]
};
function cloneGraph(){ return {nodes:GBASE.nodes.map(function(n){return {id:n.id,label:n.label,x:n.x,y:n.y};}), edges:GBASE.edges.map(function(e){return {u:e.u,v:e.v,w:e.w};})}; }
function adjOf(G){ var a={}; G.nodes.forEach(function(n){a[n.id]=[];}); G.edges.forEach(function(e){ a[e.u].push({to:e.v,w:e.w}); a[e.v].push({to:e.u,w:e.w}); }); Object.keys(a).forEach(function(k){ a[k].sort(function(x,y){return x.to<y.to?-1:1;}); }); return a; }
function graphControls(host, ctx, build, weighted, extraBtn){
  var G=cloneGraph();
  ctx.renderer.setGraph(G, weighted);
  var opts = G.nodes.map(function(n){ return '<option value="'+n.id+'">'+n.label+'</option>'; }).join('');
  host.innerHTML =
    '<div class="av-field"><label>โหนดเริ่มต้น (start)</label><select class="av-input" data-start>'+opts+'</select></div>'
   +'<div class="av-btn-row"><button class="btn btn-accent btn-sm" data-run>เล่นใหม่</button>'+(extraBtn||'')+'</div>'
   +'<div style="font-size:11.5px;color:var(--text-3);margin-top:12px;line-height:1.5">'+(weighted?'ตัวเลขบนเส้น = น้ำหนัก (ระยะทาง)':'กราฟไม่มีน้ำหนัก เดินตามชื่อโหนด A→H')+'</div>';
  function run(){ var s=host.querySelector('[data-start]').value; ctx.renderer.setGraph(G, weighted); ctx.load(build(G, s)); }
  host.querySelector('[data-start]').addEventListener('change', run);
  host.querySelector('[data-run]').addEventListener('click', run);
  if(extraBtn){ host.querySelector('[data-rw]') && host.querySelector('[data-rw]').addEventListener('click', function(){ G.edges.forEach(function(e){ e.w=randInt(1,9); }); ctx.renderer.setGraph(G, weighted); run(); }); }
  run();
}

AlgoViz.register({
  id:'graph-bfs', cat:'graph', nameTh:'Graph BFS · ค้นหาตามแนวกว้าง', nameEn:'Breadth-First Search',
  difficulty:2, time:'O(V + E)', space:'O(V)', renderer:'graph', glyph:'graph',
  blurb:'สำรวจกราฟทีละชั้นจากจุดเริ่ม โดยใช้คิว (Queue) เยี่ยมใกล้ก่อนไกล',
  explain:'เริ่มจากโหนดต้นทาง ใส่ลงคิว แล้ววนหยิบออกทีละตัว เยี่ยมเพื่อนบ้านที่ยังไม่เคยเยี่ยมและใส่คิวต่อ ทำให้สำรวจจากใกล้ไปไกลทีละระดับ',
  note:'ใช้ Queue · ได้เส้นทางสั้นที่สุด (จำนวนขอบน้อยที่สุด) บนกราฟไม่มีน้ำหนัก · โหนดวงเหลือง = frontier ในคิว',
  pseudocode:['queue = [start] ; visited = {start}','while queue ไม่ว่าง:','  u = queue.dequeue()','  for v ใน neighbors(u):','    if v ยังไม่ visited: enqueue(v)'],
  mountControls:function(h,c){ var self=this; graphControls(h,c,function(G,s){return self.build(G,s);}, false); },
  build:function(G,start){
    var adj=adjOf(G), F=[], vis={}, order=[], q=[start]; vis[start]=1;
    F.push({visited:[],frontier:q.slice(),line:0,note:'เริ่มที่ '+start+' — ใส่ลงคิว',stats:{'เยี่ยม':0}});
    while(q.length){
      var u=q.shift();
      F.push({visited:order.slice(),frontier:q.slice(),current:u,line:2,note:'หยิบ '+u+' ออกจากคิว → เยี่ยม',stats:{'เยี่ยม':order.length+1}});
      order.push(u);
      adj[u].forEach(function(e){ if(!vis[e.to]){ vis[e.to]=1; q.push(e.to); F.push({visited:order.slice(),frontier:q.slice(),current:u,line:4,note:u+' → พบเพื่อนบ้าน '+e.to+' ใส่คิว',stats:{'เยี่ยม':order.length}}); } });
    }
    F.push({visited:order.slice(),frontier:[],note:'BFS เสร็จ — ลำดับเยี่ยม: '+order.join(' → '),stats:{'เยี่ยม':order.length}});
    return F;
  }
});

AlgoViz.register({
  id:'graph-dfs', cat:'graph', nameTh:'Graph DFS · ค้นหาตามแนวลึก', nameEn:'Depth-First Search',
  difficulty:2, time:'O(V + E)', space:'O(V)', renderer:'graph', glyph:'graph',
  blurb:'ดำดิ่งไปให้ลึกที่สุดก่อน แล้วค่อยถอยกลับ (backtrack) ใช้ Stack/Recursion',
  explain:'เดินลึกตามเส้นทางหนึ่งไปเรื่อย ๆ จนสุด (ไม่มีเพื่อนบ้านใหม่) แล้วถอยกลับไปหาทางแยกที่ยังไม่ได้ไป ทำงานด้วย recursion หรือ stack',
  note:'ใช้ Stack/Recursion · เหมาะกับงานตรวจการเชื่อมต่อ, หาวงจร, topological sort · ต่างจาก BFS ที่เดินทีละชั้น',
  pseudocode:['DFS(u):','  visit(u)','  for v ใน neighbors(u):','    if v ยังไม่ visited:','      DFS(v)   // ดำดิ่งต่อ'],
  mountControls:function(h,c){ var self=this; graphControls(h,c,function(G,s){return self.build(G,s);}, false); },
  build:function(G,start){
    var adj=adjOf(G), F=[], vis={}, order=[], stack=[];
    function dfs(u){
      vis[u]=1; order.push(u); stack.push(u);
      F.push({visited:order.slice(),frontier:stack.slice(),current:u,line:1,note:'เยี่ยม '+u+' (ดำดิ่งลงลึก)',stats:{'เยี่ยม':order.length}});
      adj[u].forEach(function(e){ if(!vis[e.to]){ F.push({visited:order.slice(),frontier:stack.slice(),current:u,line:4,note:u+' → ไปต่อที่ '+e.to,stats:{'เยี่ยม':order.length}}); dfs(e.to); } });
      stack.pop();
      F.push({visited:order.slice(),frontier:stack.slice(),current:stack.length?stack[stack.length-1]:null,line:0,note:'ที่ '+u+' ไม่เหลือทางใหม่ → ถอยกลับ (backtrack)',stats:{'เยี่ยม':order.length}});
    }
    F.push({visited:[],frontier:[],line:0,note:'เริ่ม DFS ที่ '+start,stats:{'เยี่ยม':0}});
    dfs(start);
    F.push({visited:order.slice(),frontier:[],note:'DFS เสร็จ — ลำดับเยี่ยม: '+order.join(' → '),stats:{'เยี่ยม':order.length}});
    return F;
  }
});

AlgoViz.register({
  id:'dijkstra', cat:'graph', nameTh:'Dijkstra · หาเส้นทางสั้นสุด', nameEn:"Dijkstra's Shortest Path",
  difficulty:3, time:'O((V+E) log V)', space:'O(V)', renderer:'graph', glyph:'route',
  blurb:'หาเส้นทางสั้นที่สุดจากจุดเริ่มไปทุกโหนด บนกราฟที่มีน้ำหนักไม่ติดลบ',
  explain:'เก็บระยะทางสั้นสุดที่รู้ (dist) ของทุกโหนด เริ่มที่ 0 ที่ต้นทาง ที่เหลือ ∞ · เลือกโหนดที่ dist น้อยสุดที่ยังไม่ยืนยัน มายืนยัน แล้ว “ผ่อนคลาย (relax)” ระยะทางของเพื่อนบ้าน ทำซ้ำจนครบ',
  note:'ใช้ได้เฉพาะน้ำหนักไม่ติดลบ · ตัวเลขเหนือโหนด = ระยะสั้นสุดจากต้นทาง · เส้นไฮไลต์ = ต้นไม้เส้นทางสั้นสุด',
  pseudocode:['dist[start]=0 ; ที่เหลือ = ∞','while ยังมีโหนดไม่ยืนยัน:','  u = โหนด dist น้อยสุด (ยังไม่ยืนยัน)','  ยืนยัน u','  for (u,v,w): if dist[u]+w < dist[v]:','    dist[v]=dist[u]+w ; prev[v]=u'],
  mountControls:function(h,c){ var self=this; graphControls(h,c,function(G,s){return self.build(G,s);}, true, '<button class="btn btn-ghost btn-sm" data-rw>สุ่มน้ำหนัก</button>'); },
  build:function(G,start){
    var adj=adjOf(G), F=[], dist={}, prev={}, done={};
    G.nodes.forEach(function(n){ dist[n.id]=Infinity; }); dist[start]=0;
    function pathEdges(){ var pe=[]; for(var k in prev){ pe.push([prev[k],k]); } return pe; }
    function snap(o){ o.dist={}; for(var k in dist) o.dist[k]=dist[k]; o.visited=Object.keys(done); F.push(o); }
    snap({line:0,note:'ตั้ง dist['+start+']=0 ที่เหลือเป็น ∞',current:null,stats:{'ยืนยันแล้ว':0}});
    while(true){
      var u=null, best=Infinity; G.nodes.forEach(function(n){ if(!done[n.id] && dist[n.id]<best){ best=dist[n.id]; u=n.id; } });
      if(u==null) break;
      done[u]=1;
      snap({line:2,note:'เลือกโหนด dist น้อยสุดที่ยังไม่ยืนยัน = '+u+' (ระยะ '+best+')',current:u,pathEdges:pathEdges(),stats:{'ยืนยันแล้ว':Object.keys(done).length}});
      adj[u].forEach(function(e){ if(done[e.to]) return; var nd=dist[u]+e.w;
        if(nd<dist[e.to]){ dist[e.to]=nd; prev[e.to]=u; snap({line:5,note:u+' → '+e.to+': '+best+'+'+e.w+' = '+nd+' ดีกว่าเดิม → อัปเดต',current:u,pathEdges:pathEdges(),stats:{'ยืนยันแล้ว':Object.keys(done).length}}); }
        else { snap({line:4,note:u+' → '+e.to+': '+(best+e.w)+' ไม่ดีกว่าเดิม → ข้าม',current:u,pathEdges:pathEdges(),stats:{'ยืนยันแล้ว':Object.keys(done).length}}); }
      });
    }
    var res=G.nodes.map(function(n){ return n.id+'='+(dist[n.id]===Infinity?'∞':dist[n.id]); }).join('  ');
    snap({line:1,note:'เสร็จ — ระยะสั้นสุดจาก '+start+':  '+res,current:null,pathEdges:pathEdges(),path:Object.keys(done),stats:{'ยืนยันแล้ว':Object.keys(done).length}});
    return F;
  }
});

/* ================= RECURSION ================= */
AlgoViz.register({
  id:'tower-of-hanoi', cat:'recur', nameTh:'Tower of Hanoi · หอคอยฮานอย', nameEn:'Tower of Hanoi',
  difficulty:2, time:'O(2ⁿ)', space:'O(n)', renderer:'hanoi', glyph:'hanoi',
  blurb:'ย้ายจานทั้งกองไปอีกหลัก ครั้งละ 1 แผ่น ห้ามวางแผ่นใหญ่ทับแผ่นเล็ก',
  explain:'ปัญหา recursion คลาสสิก: ย้าย n แผ่นจากหลัก A ไป C โดยใช้ B เป็นตัวช่วย · เคล็ดลับคือ “ย้าย n-1 แผ่นบนไปพักที่ B, ย้ายแผ่นล่างสุดไป C, แล้วย้าย n-1 แผ่นจาก B ไป C”',
  note:'จำนวนครั้งขั้นต่ำ = 2ⁿ − 1 · เป็นตัวอย่างชั้นดีของการแตกปัญหาใหญ่เป็นปัญหาย่อยที่เหมือนกัน (divide & conquer)',
  pseudocode:['hanoi(n, from, to, via):','  if n == 0: return','  hanoi(n-1, from, via, to)','  ย้ายแผ่น n:  from → to','  hanoi(n-1, via, to, from)'],
  mountControls:function(host,ctx){
    var self=this;
    host.innerHTML =
      '<div class="av-field"><label>จำนวนแผ่น <span class="av-range-val" data-dn></span></label><input type="range" data-disks min="2" max="6" value="3"></div>'
     +'<div class="av-btn-row"><button class="btn btn-accent btn-sm" data-run>เริ่มใหม่</button></div>'
     +'<div style="font-size:11.5px;color:var(--text-3);margin-top:12px;line-height:1.5">กด Play เพื่อดูการย้ายทีละแผ่น · ขั้นต่ำ 2ⁿ−1 ครั้ง</div>';
    var dI=host.querySelector('[data-disks]'), dn=host.querySelector('[data-dn]');
    function run(){ var n=parseInt(dI.value,10); dn.textContent=n; ctx.load(self.build(n)); }
    dI.addEventListener('input',function(){ dn.textContent=dI.value; });
    dI.addEventListener('change',run);
    host.querySelector('[data-run]').onclick=run;
    dn.textContent=dI.value; run();
  },
  build:function(n){
    var names=['A','B','C']; var pegs=[[],[],[]]; for(var d=n; d>=1; d--) pegs[0].push(d);
    function clone(){ return pegs.map(function(p){return p.slice();}); }
    var F=[{pegs:clone(),line:0,note:'เริ่ม — แผ่นทั้ง '+n+' อยู่หลัก A',stats:{'ย้าย':0}}], moves=0;
    function mv(from,to){ var d=pegs[from].pop(); pegs[to].push(d); moves++; F.push({pegs:clone(),line:3,note:'ย้ายแผ่น '+d+' :  '+names[from]+' → '+names[to],stats:{'ย้าย':moves}}); }
    function solve(k,from,to,via){ if(k===0)return; solve(k-1,from,via,to); mv(from,to); solve(k-1,via,to,from); }
    solve(n,0,2,1);
    F.push({pegs:clone(),note:'เสร็จ! ย้ายครบใน '+moves+' ครั้ง (ขั้นต่ำ = 2^'+n+' − 1 = '+(Math.pow(2,n)-1)+')',stats:{'ย้าย':moves}});
    return F;
  }
});

AlgoViz.register({
  id:'fibonacci-recursion', cat:'recur', nameTh:'Recursion & Memoization · ต้นไม้การเรียกซ้ำ', nameEn:'Recursion (Fibonacci)',
  difficulty:2, time:'O(2ⁿ) → O(n)', space:'O(n)', renderer:'calltree', glyph:'recur',
  blurb:'ดูต้นไม้การเรียกซ้ำของ fib(n) และเห็นว่า Memoization ตัดงานซ้ำได้มหาศาล',
  explain:'fib(n) = fib(n-1) + fib(n-2) · แบบไม่มี memo จะเรียกซ้ำจำนวนมหาศาล (ต้นไม้บานเป็น O(2ⁿ)) · เปิด Memoization เพื่อจำผลลัพธ์ที่เคยคำนวณ ทำให้แต่ละค่าเรียกแค่ครั้งเดียว (O(n))',
  note:'สังเกตจำนวน “เรียก” ระหว่างเปิด/ปิด memo · โหนดม่วง = พบใน memo แล้วคืนค่าทันที (ไม่ต้องแตกต่อ) — นี่คือหัวใจของ Dynamic Programming',
  pseudocode:['fib(n):','  if n < 2: return n','  if memo[n] มีค่า: return memo[n]   // เมื่อเปิด memo','  r = fib(n-1) + fib(n-2)','  memo[n] = r ; return r'],
  mountControls:function(host,ctx){
    var self=this;
    host.innerHTML =
      '<div class="av-field"><label>n <span class="av-range-val" data-nn></span></label><input type="range" data-n min="3" max="8" value="5"></div>'
     +'<div class="av-field" style="margin-bottom:10px"><label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" data-memo style="width:16px;height:16px;accent-color:var(--accent)"> เปิด Memoization</label></div>'
     +'<div class="av-btn-row"><button class="btn btn-accent btn-sm" data-run>สร้างใหม่</button></div>'
     +'<div style="font-size:11.5px;color:var(--text-3);margin-top:12px;line-height:1.5">ลองสลับเปิด/ปิด memo ที่ n เดิม แล้วดูจำนวนครั้งที่เรียก</div>';
    var nI=host.querySelector('[data-n]'), nn=host.querySelector('[data-nn]'), memo=host.querySelector('[data-memo]');
    function run(){ var n=parseInt(nI.value,10); nn.textContent=n; ctx.load(self.build(n, memo.checked)); }
    nI.addEventListener('input',function(){ nn.textContent=nI.value; });
    nI.addEventListener('change',run);
    memo.addEventListener('change',run);
    host.querySelector('[data-run]').onclick=run;
    nn.textContent=nI.value; run();
  },
  build:function(n, useMemo){
    var nodes={}, idc=0, memo={}, order=[], children={};
    function fib(k,parent){ var id=String(idc++); nodes[id]={k:k,parent:parent,val:null,memo:false}; if(parent!=null){(children[parent]=children[parent]||[]).push(id);} order.push({t:'call',id:id});
      if(k<2){ order.push({t:'ret',id:id,val:k}); return k; }
      if(useMemo && memo[k]!==undefined){ order.push({t:'memo',id:id,val:memo[k]}); return memo[k]; }
      var a=fib(k-1,id), b=fib(k-2,id), r=a+b; if(useMemo) memo[k]=r; order.push({t:'ret',id:id,val:r}); return r;
    }
    fib(n,null);
    var x={}, d={}, xc=0, maxD=0;
    (function assign(id,depth){ d[id]=depth; if(depth>maxD)maxD=depth; var kids=children[id]||[]; if(!kids.length){ x[id]=xc++; } else { kids.forEach(function(c){assign(c,depth+1);}); x[id]=(x[kids[0]]+x[kids[kids.length-1]])/2; } })('0',0);
    var layout={x:x,d:d,count:xc||1,maxD:maxD};
    var disp={}; for(var k in nodes) disp[k]={k:nodes[k].k,parent:nodes[k].parent,val:null,memo:false};
    function cp(o){ var r={}; for(var q in o) r[q]=o[q]; return r; }
    function cn(){ var o={}; for(var q in disp) o[q]={k:disp[q].k,parent:disp[q].parent,val:disp[q].val,memo:disp[q].memo}; return o; }
    var F=[], revealed={}, calls=0, hits=0;
    order.forEach(function(ev){
      if(ev.t==='call'){ revealed[ev.id]=1; calls++; F.push({nodes:cn(),layout:layout,revealed:cp(revealed),active:ev.id,line:0,note:'เรียก fib('+disp[ev.id].k+')',stats:{'เรียกทั้งหมด':calls,'memo hit':hits}}); }
      else if(ev.t==='ret'){ disp[ev.id].val=ev.val; F.push({nodes:cn(),layout:layout,revealed:cp(revealed),active:ev.id,line:(disp[ev.id].k<2?1:3),note:'fib('+disp[ev.id].k+') คืนค่า = '+ev.val,stats:{'เรียกทั้งหมด':calls,'memo hit':hits}}); }
      else { disp[ev.id].val=ev.val; disp[ev.id].memo=true; hits++; F.push({nodes:cn(),layout:layout,revealed:cp(revealed),active:ev.id,line:2,note:'fib('+disp[ev.id].k+') พบใน memo → คืน '+ev.val+' ทันที (ไม่แตกต่อ)',stats:{'เรียกทั้งหมด':calls,'memo hit':hits}}); }
    });
    F.push({nodes:cn(),layout:layout,revealed:cp(revealed),note:'fib('+n+') = '+F[F.length-1].nodes['0'].val+'  ·  เรียกทั้งหมด '+calls+' ครั้ง'+(useMemo?' (มี memo)':' (ไม่มี memo)'),stats:{'เรียกทั้งหมด':calls,'memo hit':hits}});
    return F;
  }
});

/* ==========================================================================
   EXTENSION CONTENT  (cpe/, se/ … — injected by build from src/content/**)
   ========================================================================== */

/* ===== src/content/cpe/networking.js ===== */
/* ==========================================================================
   CPE · Networking — TCP & reliable-transfer visualizers
   Injected inside the engine IIFE (shares AlgoViz, randInt, esc, …).
   ========================================================================== */

/* ---- TCP 3-Way Handshake (sequence / ladder diagram) ---- */
AlgoViz.register({
  id:'tcp-handshake', cat:'net', nameTh:'TCP 3-Way Handshake · การจับมือ 3 ทาง', nameEn:'TCP 3-Way Handshake',
  difficulty:2, time:'1.5 RTT', space:'—', renderer:'sequence', glyph:'net',
  blurb:'เปิดการเชื่อมต่อ TCP: SYN → SYN-ACK → ACK แล้วรับ-ส่งข้อมูล จนปิดด้วย FIN',
  explain:'TCP ต้อง “จับมือ” ก่อนส่งข้อมูลจริง เพื่อตกลงหมายเลขลำดับ (sequence number) ของทั้งสองฝั่ง: Client ส่ง <b>SYN</b>, Server ตอบ <b>SYN-ACK</b>, Client ยืนยันด้วย <b>ACK</b> → สถานะ ESTABLISHED จากนั้นรับ-ส่งข้อมูลแบบมี ACK และปิดการเชื่อมต่อด้วย FIN สี่ทาง',
  note:'seq/ack number กันข้อมูลซ้ำ/สลับลำดับ · การเปิดใช้ 3 ข้อความ (1.5 RTT) การปิดใช้ 4 ข้อความ เพราะแต่ละฝั่งปิดแยกกัน (half-close)',
  pseudocode:['Client → SYN (seq=x)','Server → SYN-ACK (seq=y, ack=x+1)','Client → ACK (ack=y+1)  → ESTABLISHED','รับ-ส่ง DATA + ACK (ใช้ seq/ack)','ปิดการเชื่อมต่อ: FIN / ACK ทั้งสองฝั่ง'],
  mountControls:function(host,ctx){
    var actors=[{id:'c',label:'Client'},{id:'s',label:'Server'}];
    var M=[
      {from:'c',to:'s',label:'SYN  seq=100',kind:'syn',line:0,note:'Client เปิดการเชื่อมต่อ → ส่ง SYN (seq=100)'},
      {from:'s',to:'c',label:'SYN-ACK  seq=300, ack=101',kind:'syn',line:1,note:'Server ตอบ SYN-ACK: ยืนยัน (ack=101) พร้อมขอ sync กลับ (seq=300)'},
      {from:'c',to:'s',label:'ACK  ack=301',kind:'ack',line:2,note:'Client ส่ง ACK (ack=301) → การเชื่อมต่อ ESTABLISHED ✓'},
      {from:'c',to:'s',label:'DATA  "GET /"  seq=101',kind:'data',line:3,note:'ส่งข้อมูลจริง พร้อมหมายเลข seq'},
      {from:'s',to:'c',label:'ACK  ack=106',kind:'ack',line:3,note:'Server ตอบรับข้อมูล (ACK)'},
      {from:'s',to:'c',label:'DATA  "200 OK"  seq=301',kind:'data',line:3,note:'Server ส่งข้อมูลตอบกลับ'},
      {from:'c',to:'s',label:'ACK',kind:'ack',line:3,note:'Client ตอบรับ'},
      {from:'c',to:'s',label:'FIN',kind:'fin',line:4,note:'Client ขอปิดการเชื่อมต่อ (FIN)'},
      {from:'s',to:'c',label:'ACK',kind:'ack',line:4,note:'Server ตอบรับ FIN ของ Client'},
      {from:'s',to:'c',label:'FIN',kind:'fin',line:4,note:'Server ปิดฝั่งตนเอง (FIN)'},
      {from:'c',to:'s',label:'ACK',kind:'ack',line:4,note:'Client ตอบรับ → ปิดการเชื่อมต่อสมบูรณ์'}
    ];
    ctx.renderer.setup({actors:actors, messages:M});
    var F=[{upto:-1,active:-1,note:'พร้อมเริ่ม — Client กำลังจะเปิดการเชื่อมต่อกับ Server',stats:{'ข้อความ':0,'สถานะ':'CLOSED'}}];
    var state=['CLOSED','SYN_SENT','SYN_SENT','ESTABLISHED','ESTABLISHED','ESTABLISHED','ESTABLISHED','ESTABLISHED','FIN_WAIT','FIN_WAIT','TIME_WAIT'];
    M.forEach(function(m,i){ F.push({upto:i,active:i,line:m.line,note:m.note,stats:{'ข้อความ':i+1,'สถานะ':state[i]}}); });
    host.innerHTML='<div style="font-size:12.5px;color:var(--text-3);line-height:1.6">กด <b style="color:var(--text-2)">Play</b> ▶ ดูการจับมือ (handshake) → รับ-ส่งข้อมูล → ปิดการเชื่อมต่อ ทีละก้าว<br>เว้นวรรค = เล่น/หยุด · ←/→ = เดินสเต็ป</div>';
    ctx.load(F);
  }
});

/* ---- TCP Connection State Machine ---- */
AlgoViz.register({
  id:'tcp-states', cat:'net', nameTh:'TCP State Machine · สถานะการเชื่อมต่อ', nameEn:'TCP Connection States',
  difficulty:3, time:'—', space:'—', renderer:'statemachine', glyph:'net',
  blurb:'ไดอะแกรมสถานะของ TCP ฝั่งที่เปิด/ปิดการเชื่อมต่อเอง (active open & close)',
  explain:'การเชื่อมต่อ TCP หนึ่งฝั่งจะเดินผ่านสถานะต่าง ๆ ตามเหตุการณ์ที่รับ/ส่ง · เส้นทางนี้คือฝั่งที่ “เปิดเอง (active open)” และ “ปิดเอง (active close)”: CLOSED → SYN_SENT → ESTABLISHED → FIN_WAIT_1 → FIN_WAIT_2 → TIME_WAIT → CLOSED',
  note:'TIME_WAIT รอ 2·MSL เพื่อให้แน่ใจว่า ACK ตัวสุดท้ายถึงปลายทางและแพ็กเก็ตเก่าหมดอายุ ก่อนกลับสู่ CLOSED — เป็นสาเหตุที่พอร์ตยัง “ค้าง” อยู่ชั่วครู่หลังปิด',
  pseudocode:['CLOSED --ส่ง SYN--> SYN_SENT','SYN_SENT --รับ SYN-ACK / ส่ง ACK--> ESTABLISHED','ESTABLISHED --ส่ง FIN--> FIN_WAIT_1','FIN_WAIT_1 --รับ ACK--> FIN_WAIT_2','FIN_WAIT_2 --รับ FIN / ส่ง ACK--> TIME_WAIT','TIME_WAIT --หมดเวลา 2·MSL--> CLOSED'],
  mountControls:function(host,ctx){
    var states=[
      {id:'CLOSED',label:'CLOSED', x:150,y:430},
      {id:'SYN_SENT',label:'SYN_SENT', x:150,y:180},
      {id:'ESTAB',label:'ESTABLISHED', x:420,y:110},
      {id:'FW1',label:'FIN_WAIT_1', x:690,y:180},
      {id:'FW2',label:'FIN_WAIT_2', x:810,y:360},
      {id:'TW',label:'TIME_WAIT', x:500,y:440}
    ];
    var T=[
      {from:'CLOSED',to:'SYN_SENT',label:'ส่ง SYN'},
      {from:'SYN_SENT',to:'ESTAB',label:'รับ SYN-ACK / ส่ง ACK'},
      {from:'ESTAB',to:'FW1',label:'ส่ง FIN'},
      {from:'FW1',to:'FW2',label:'รับ ACK'},
      {from:'FW2',to:'TW',label:'รับ FIN / ส่ง ACK'},
      {from:'TW',to:'CLOSED',label:'หมดเวลา 2·MSL', bow:-70}
    ];
    ctx.renderer.setup({states:states, trans:T});
    var seq=['CLOSED','SYN_SENT','ESTAB','FW1','FW2','TW','CLOSED'];
    var notes=['เริ่มต้นที่ CLOSED (ยังไม่มีการเชื่อมต่อ)',
      'แอปสั่ง connect → ส่ง SYN → เข้าสู่ SYN_SENT',
      'ได้รับ SYN-ACK และส่ง ACK → ESTABLISHED (รับ-ส่งข้อมูลได้)',
      'แอปสั่งปิด → ส่ง FIN → FIN_WAIT_1',
      'ได้รับ ACK ของ FIN → FIN_WAIT_2',
      'ได้รับ FIN ของอีกฝั่ง ส่ง ACK → TIME_WAIT',
      'ครบ 2·MSL → กลับสู่ CLOSED ✓'];
    var F=[{current:'CLOSED',visited:[],line:0,note:notes[0],stats:{'สถานะ':'CLOSED'}}];
    for(var i=0;i<T.length;i++){
      F.push({current:seq[i+1], visited:seq.slice(0,i+1), takenIdx:i, line:i, note:notes[i+1], stats:{'สถานะ':states.filter(function(s){return s.id===seq[i+1];})[0].label}});
    }
    host.innerHTML='<div style="font-size:12.5px;color:var(--text-3);line-height:1.6">กด <b style="color:var(--text-2)">Play</b> ▶ เดินตามสถานะของการเชื่อมต่อ TCP หนึ่งฝั่ง (เปิดเอง + ปิดเอง)</div>';
    ctx.load(F);
  }
});

/* ---- Stop-and-Wait ARQ (reliable transfer with timeout / retransmit) ---- */
AlgoViz.register({
  id:'stop-and-wait', cat:'net', nameTh:'Stop-and-Wait ARQ · ส่งเชื่อถือได้', nameEn:'Stop-and-Wait ARQ',
  difficulty:2, time:'—', space:'—', renderer:'sequence', glyph:'net',
  blurb:'ส่งทีละเฟรมแล้วรอ ACK ถ้าหาย/หมดเวลา ก็ส่งซ้ำ — พื้นฐานความน่าเชื่อถือของ TCP',
  explain:'ผู้ส่งส่งเฟรมทีละอันแล้ว “หยุดรอ” ACK ก่อนส่งอันถัดไป ถ้าเฟรมหรือ ACK หายไป ตัวจับเวลา (timeout) จะครบแล้วส่งซ้ำ ใช้หมายเลขลำดับ (0/1) กันเฟรมซ้ำ — เป็นแนวคิดพื้นฐานของการส่งข้อมูลแบบเชื่อถือได้',
  note:'ข้อดี: ง่ายและเชื่อถือได้ · ข้อเสีย: ช้า เพราะรอทีละเฟรม (utilization ต่ำเมื่อ RTT สูง) จึงพัฒนาเป็น Sliding Window / Go-Back-N ที่ส่งหลายเฟรมพร้อมกัน',
  pseudocode:['ส่ง Frame(seq) แล้วเริ่มจับเวลา','ถ้าได้ ACK(seq) ก่อน timeout → ส่งเฟรมถัดไป','ถ้า timeout (เฟรม/ACK หาย) → ส่งเฟรมเดิมซ้ำ','ใช้ seq 0/1 สลับกัน กันเฟรมซ้ำ'],
  mountControls:function(host,ctx){
    var actors=[{id:'a',label:'Sender'},{id:'b',label:'Receiver'}];
    var M=[
      {from:'a',to:'b',label:'Frame 0',kind:'data',line:0,note:'ส่ง Frame 0 แล้วเริ่มจับเวลา'},
      {from:'b',to:'a',label:'ACK 0',kind:'ack',line:1,note:'Receiver ได้ Frame 0 → ตอบ ACK 0'},
      {from:'a',to:'b',label:'Frame 1',kind:'lost',line:0,note:'ส่ง Frame 1 … แต่เฟรมนี้ “สูญหาย” ระหว่างทาง ✕'},
      {from:'a',to:'a',label:'timeout!',kind:'timeout',line:2,note:'รอ ACK 1 ไม่มา จน timeout → ต้องส่งซ้ำ'},
      {from:'a',to:'b',label:'Frame 1 (ส่งซ้ำ)',kind:'data',line:2,note:'ส่ง Frame 1 ซ้ำอีกครั้ง'},
      {from:'b',to:'a',label:'ACK 1',kind:'ack',line:1,note:'คราวนี้ Receiver ได้รับ → ตอบ ACK 1 ✓'}
    ];
    ctx.renderer.setup({actors:actors, messages:M});
    var F=[{upto:-1,active:-1,note:'พร้อมเริ่ม — ส่งทีละเฟรมแล้วรอ ACK',stats:{'ส่งซ้ำ':0}}];
    var rt=0;
    M.forEach(function(m,i){ if(m.kind==='timeout') rt++; F.push({upto:i,active:i,line:m.line,note:m.note,stats:{'ส่งซ้ำ':rt}}); });
    host.innerHTML='<div style="font-size:12.5px;color:var(--text-3);line-height:1.6">กด <b style="color:var(--text-2)">Play</b> ▶ ดูการส่งแบบเชื่อถือได้ — สังเกตเฟรมที่หาย แล้วถูกส่งซ้ำหลัง timeout</div>';
    ctx.load(F);
  }
});



/* ==========================================================================
   HERO — live mini Bubble Sort demo (reuses the real bars renderer + the
   real bubble-sort step-generator registered above; independent tiny
   controller so it can never interfere with the full Player on /topic pages)
   ========================================================================== */
function initHeroDemo(){
  var host = $('[data-hero-demo]'); if(!host) return;
  var svg = $('[data-hero-svg]', host); if(!svg || !BYID['bubble-sort']) return;
  var capEl = $('[data-hero-caption]', host);
  var stepEl = $('[data-hero-step]', host);
  var playBtn = $('[data-hero-play]', host), playIcon = $('[data-hero-play-icon]', host);
  var prevBtn = $('[data-hero-prev]', host), nextBtn = $('[data-hero-next]', host), resetBtn = $('[data-hero-reset]', host);
  var speedSel = $('[data-hero-speed]', host);
  var renderer = RENDERERS.bars(); renderer.mount(svg);
  var frames=[], i=0, playing=false, timer=null;
  function delay(){ return 1300 - (speedSel?(parseInt(speedSel.value,10)||5):5)*110; }
  function draw(animate){
    var f=frames[i]; if(!f) return;
    renderer.render(f, frames[i-1], animate && animOK());
    if(capEl) capEl.textContent = f.note||'';
    if(stepEl) stepEl.textContent = (i+1)+' / '+frames.length;
  }
  function go(n){ i=clamp(n,0,frames.length-1); draw(true); }
  function pause(){ playing=false; clearTimeout(timer); if(playIcon) playIcon.innerHTML='<path d="M8 5v14l11-7z"/>'; }
  function play(){
    if(i>=frames.length-1) i=0;
    playing=true; if(playIcon) playIcon.innerHTML='<rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/>';
    (function loop(){ if(!playing) return; if(i>=frames.length-1){ pause(); return; } i++; draw(true); timer=setTimeout(loop, delay()); })();
  }
  function load(){
    var arr=[]; for(var k=0;k<7;k++) arr.push(randInt(20,90));
    frames = BYID['bubble-sort'].build(arr); i=0; draw(false);
  }
  if(playBtn) playBtn.addEventListener('click', function(){ playing?pause():play(); });
  if(prevBtn) prevBtn.addEventListener('click', function(){ pause(); go(i-1); });
  if(nextBtn) nextBtn.addEventListener('click', function(){ pause(); go(i+1); });
  if(resetBtn) resetBtn.addEventListener('click', function(){ pause(); load(); });
  load();
  if(!REDUCE) play(); /* only auto-play when motion isn't reduced; manual Play always works */
}

/* ==========================================================================
   HOME — Quick Intent Selector: a real filter on the full topic catalog
   (sets filterState.intent + re-renders the same renderCatalog() the search
   box and difficulty chips already drive — no separate preview list)
   ========================================================================== */
var intentHost = $('[data-intent-list]');
if(intentHost){
  $$('[data-intent]', intentHost).forEach(function(b){
    var bcat = b.getAttribute('data-intent');
    if(bcat && CATMAP[bcat] && DOMAINMAP[CATMAP[bcat].domain] && DOMAINMAP[CATMAP[bcat].domain].hidden){ b.remove(); return; }
    b.addEventListener('click', function(){
      $$('[data-intent]', intentHost).forEach(function(x){ x.classList.remove('is-active'); x.setAttribute('aria-pressed','false'); });
      b.classList.add('is-active'); b.setAttribute('aria-pressed','true');
      filterState.intent = b.getAttribute('data-intent');
      renderCatalog();
    });
  });
}

/* ---------- BOOT ---------- */
renderChips();
renderCatalog();
initHeroDemo();
route();

})();
