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
