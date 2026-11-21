(function(){
"use strict";
var CFG=window.PK_CONFIG||{};

/* ---------- 大会データ（進行表・予選リーグ表・決勝トーナメント表と同じ） ---------- */
var BLK={
  A:{div:'OF',nm:'Aブロック',t:["長久手ALL BLACKS","Genki Kids","TOYOTA KATTZ","JOUSEI EAGLE","GOLDENWINGS","SOUL MAX池田"]},
  B:{div:'OF',nm:'Bブロック',t:["サザン’97","春明D・C","Soul West","島デビルズ","ガンバベアーズ"]},
  JA:{div:'JR',nm:'JAブロック',t:["KATTZ Jr","NABくろすけ","SOUL MAX池田Jr","JOUSEI EAGLE Jr","ひだ闘球Monsters"]},
  JB:{div:'JR',nm:'JBブロック',t:["NABまっくろ","Merveille☆Star","島デビチビターズ","TRICK SQUARE","ガンバレクマサン"]},
  JC:{div:'JR',nm:'JCブロック',t:["J Soul","Catching☆Star Jr.","ガンバベアーズjr","わくわくソウル","プラネット"]}
};
var DIV={OF:{nm:'オフィシャルの部',sh:'オフィシャル',blocks:['A','B'],note:'小学3〜6年生・試合人数12名'},JR:{nm:'ジュニアの部',sh:'ジュニア',blocks:['JA','JB','JC'],note:'小学1〜4年生・試合人数8名'}};
// 予選 [開始時刻, Aコート(左-右), Bコート(左-右)]　左右はオフィシャル席から見て
var PRE=[["9:30","JA1-JA2","A1-A2"],["","JB1-JB2","B1-B2"],["9:47","JC1-JC2","A3-A4"],["","JA3-JA4","A5-A6"],["10:04","JB3-JB4","B3-B4"],["","JC3-JC4","A1-A3"],
 ["10:21","JA5-JA1","B5-B1"],["","JB5-JB1","A4-A5"],["10:38","JC5-JC1","A6-A2"],["","JA2-JA3","B2-B3"],["10:55","JB2-JB3","A1-A4"],["","JC2-JC3","B4-B5"],
 ["11:12","JA4-JA5","A5-A2"],["","JB4-JB5","A3-A6"],["11:29","JC4-JC5","B1-B3"],["","JA1-JA3","A5-A1"],["11:46","JB1-JB3","B2-B4"],["","JC1-JC3","A2-A3"],
 ["12:03","JA2-JA4","A4-A6"],["","JB2-JB4","B3-B5"],["12:20","JC2-JC4","A3-A5"],["","JA3-JA5","B4-B1"],["12:37","JB3-JB5","A2-A4"],["","JC3-JC5","A6-A1"],
 ["12:54","JA4-JA1","B5-B2"],["","JB4-JB1","JC4-JC1"],["13:11","JA5-JA2","JB5-JB2"],["","JC5-JC2",null]];
// 決勝トーナメント（id＝コート＋試合番号、row＝進行表の順序）。@＝ブロック順位、W:/L:＝その試合の勝者/敗者
var TOUR=[
 {id:'A1',row:1,div:'JR',a:'JC@2',b:'JB@3',r:'1回戦'},
 {id:'B1',row:1,div:'OF',a:'B@3',b:'A@2',r:'1回戦'},
 {id:'A2',row:2,div:'JR',a:'JB@1',b:'JC@3',r:'準々決勝'},
 {id:'B2',row:2,div:'OF',a:'A@3',b:'B@2',r:'1回戦'},
 {id:'A3',row:3,div:'JR',a:'JB@2',b:'JA@2',r:'準々決勝'},
 {id:'B3',row:3,div:'JR',a:'JC@1',b:'JA@3',r:'準々決勝'},
 {id:'A4',row:4,div:'JR',a:'W:A1',b:'JA@1',r:'準々決勝'},
 {id:'B4',row:4,div:'OF',a:'W:B1',b:'B@1',r:'準決勝'},
 {id:'A5',row:5,div:'JR',a:'W:A3',b:'W:B3',r:'準決勝'},
 {id:'B5',row:5,div:'OF',a:'W:B2',b:'A@1',r:'準決勝'},
 {id:'A6',row:6,div:'JR',a:'W:A4',b:'W:A2',r:'準決勝'},
 {id:'B6',row:7,div:'JR',a:'L:A6',b:'L:A5',r:'3位決定戦'},
 {id:'A7',row:8,div:'JR',a:'W:A6',b:'W:A5',r:'決勝戦',fin:true},
 {id:'B7',row:8,div:'OF',a:'W:B4',b:'W:B5',r:'決勝戦',fin:true}];
var TD={};TOUR.forEach(function(t){t.c=t.id[0];TD[t.id]=t});
var TTIME={1:'14:30',3:'14:47',5:'15:04',7:'15:21',8:'15:30頃'};
var ROOT={OF:'B7',JR:'A7'};

function team(code){var m=/^(J?[A-C])(\d)$/.exec(code||'');return m&&BLK[m[1]]?BLK[m[1]].t[+m[2]-1]:null}
function blockOf(code){var m=/^(J?[A-C])\d$/.exec(code||'');return m?m[1]:null}
function divOf(code){var b=blockOf(code);return b?BLK[b].div:null}

/* ---------- 状態 ---------- */
var state={scores:{},adj:{}}, sb=null, cred=null, loaded=false, online=false, loadError='', VIS=null, lastSync='';
function ss(k,v){try{if(v===undefined)return sessionStorage.getItem(k);if(v===null)sessionStorage.removeItem(k);else sessionStorage.setItem(k,v)}catch(e){return null}}
function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(e){return null}}
try{cred=JSON.parse(ls('pk26-cred')||'null')}catch(e){cred=null}
var tab=ss('pk-tab')||'sched', filter=ls('pk-filter')||'', dview=ls('pk-div')||'', lview=ls('pk-ldiv')||'OF', tview=ls('pk-tdiv')||'OF', cursor=+(ss('pk-cursor')||0);
function isAdmin(){return !!cred}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function sc(k){var v=state.scores[k];return v&&typeof v.a==='number'&&typeof v.b==='number'?v:null}
function finalV(id){
  var sets=[1,2,3].map(function(i){return sc('t'+id+'s'+i)}),wa=0,wb=0;
  sets.forEach(function(v){var aw=winA(v);if(aw===true)wa++;else if(aw===false)wb++});
  if(!sets[0])return null;
  return {a:wa,b:wb,w:null,sets:sets,done:wa>=2||wb>=2};
}
function mv(m){if(m.fin){var f=finalV(m.id);return f&&f.done?f:null}return sc(m.key)}
function winA(v){if(!v)return null;return v.a>v.b?true:v.b>v.a?false:(v.w==='a'?true:v.w==='b'?false:null)}

/* ---------- 計算 ---------- */
function prelims(){
  var out=[];
  PRE.forEach(function(r,i){[['A',r[1]],['B',r[2]]].forEach(function(c){if(!c[1])return;var p=c[1].split('-');
    out.push({key:'p'+(i+1)+c[0],kind:'pre',row:i+1,court:c[0],time:r[0],ca:p[0],cb:p[1],a:team(p[0]),b:team(p[1]),blk:blockOf(p[0]),div:divOf(p[0])})})});
  return out;
}
var PM=prelims();
function compute(){
  var st={},h2h={},cnt={},fin={};
  Object.keys(BLK).forEach(function(b){cnt[b]=0;fin[b]=0;BLK[b].t.forEach(function(n,i){st[b+(i+1)]={code:b+(i+1),n:n,b:b,p:0,w:0,l:0,d:0,pts:0,inn:0,opp:0}})});
  var played={OF:0,JR:0},total={OF:0,JR:0};
  PM.forEach(function(m){cnt[m.blk]++;total[m.div]++;var v=sc(m.key);if(!v)return;fin[m.blk]++;played[m.div]++;
    var a=st[m.ca],b=st[m.cb];a.p++;b.p++;a.inn+=v.a;a.opp+=v.b;b.inn+=v.b;b.opp+=v.a;
    if(v.a>v.b){a.w++;b.l++}else if(v.b>v.a){b.w++;a.l++}else{a.d++;b.d++}
    h2h[m.ca+'|'+m.cb]=[v.a,v.b];h2h[m.cb+'|'+m.ca]=[v.b,v.a]});
  Object.keys(st).forEach(function(k){var r=st[k];r.pts=r.w*2+r.d});
  function base(x,y){return (y.pts-x.pts)||(y.inn-x.inn)||(x.opp-y.opp)}
  function hh(x,y){var r=h2h[x.code+'|'+y.code];return r&&r[0]!==r[1]?(r[0]>r[1]?-1:1):0}
  var lg={},seed={},bdone={};
  Object.keys(BLK).forEach(function(b){
    var arr=BLK[b].t.map(function(_,i){return st[b+(i+1)]});
    arr.sort(function(x,y){return base(x,y)||hh(x,y)||((+state.adj[y.code]||0)-(+state.adj[x.code]||0))||(x.code<y.code?-1:1)});
    arr.forEach(function(r,i){r.rank=i+1;r.tied=r.p>0&&arr.some(function(o){return o!==r&&!base(o,r)&&!hh(o,r)})});
    bdone[b]=cnt[b]>0&&fin[b]===cnt[b];
    if(bdone[b])arr.forEach(function(r,i){seed[b+'@'+(i+1)]=r.code});
    lg[b]=arr;
  });
  var T={};
  function res(code){
    if(!code)return null;
    if(/@/.test(code))return seed[code]?team(seed[code]):null;
    var m=/^([WL]):(\w+)$/.exec(code);if(m){var t=T[m[2]];return t?(m[1]==='W'?t.win:t.lose)||null:null}
    return null;
  }
  TOUR.forEach(function(d){var o={id:d.id,d:d,a:res(d.a),b:res(d.b),v:d.fin?mv({fin:true,id:d.id}):sc('t'+d.id)};
    if(o.a&&o.b&&o.v){var aw=winA(o.v);if(aw!==null){o.aw=aw;o.win=aw?o.a:o.b;o.lose=aw?o.b:o.a}}
    T[d.id]=o});
  return {st:st,lg:lg,bdone:bdone,T:T,played:played,total:total,h2h:h2h};
}
function seedLabel(code){
  if(!code)return '';
  var m=/^(J?[A-C])@(\d)$/.exec(code);if(m)return BLK[m[1]].nm+m[2]+'位';
  m=/^([WL]):(\w+)$/.exec(code);if(m)return m[2]+'の'+(m[1]==='W'?'勝者':'敗者');
  return code;
}
function tourMatches(C){return TOUR.map(function(d){var t=C.T[d.id];return {key:'t'+d.id,kind:'tour',id:d.id,row:d.row,court:d.c,time:TTIME[d.row]||'',a:t.a,b:t.b,pa:seedLabel(d.a),pb:seedLabel(d.b),div:d.div,r:d.r,fin:d.fin}})}

/* ---------- 部品 ---------- */
var ICON={
  bingo:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3h8l5 5v8l-5 5H8l-5-5V8z"/><circle cx="12" cy="12" r="3.2"/></svg>',
  sun:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>',
  moon:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a8.6 8.6 0 1 0 11.1 11.1z"/></svg>',
  sched:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4M7.5 14h3M13.5 14h3M7.5 17.5h3"/></svg>',
  league:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18M3 14.5h18M9 4v16"/></svg>',
  tour:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h5v5H3M3 14h5v5H3M8 7.5h3v9H8M11 12h4"/><path d="M15 9h6v6h-6z"/></svg>',
  info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5l2.4 3.6 4.2-.4-1.4 4 3 3-4 1.3-.6 4.2-3.6-2.3-3.6 2.3-.6-4.2-4-1.3 3-3-1.4-4 4.2.4z"/><path d="M12 10v4"/></svg>',
  entry:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>',
  gift:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v4.5h-4.5"/></svg>'
};
function daysLeft(){var now=new Date(),d=new Date(2026,10,21);var t=new Date(now.getFullYear(),now.getMonth(),now.getDate());return Math.round((d-t)/864e5)}
function countChip(){var n=daysLeft();if(n>0)return '<span class="count">大会まで あと<b>'+n+'</b>日</span>';if(n===0)return '<span class="count">🎄 本日開催！</span>';return '<span class="count">ご来場ありがとうございました</span>'}
function stars(){var p=[[8,12],[22,8],[40,15],[62,6],[80,14],[92,30],[88,62],[70,88],[50,92],[14,80],[6,52],[30,40]],h='';p.forEach(function(q,i){h+='<i style="left:'+q[0]+'%;top:'+q[1]+'%;animation-delay:-'+(i*0.37).toFixed(2)+'s"></i>'});return h}
function cover(){
  return '<section class="cover" aria-label="大会表紙"><img class="t1 ttl-img" src="img/title.webp" alt="ぴょこたんカップ2026" width="1344" height="216"><img class="t2" src="img/sub.webp" alt="クリスマスパーティ" width="832" height="134">'+
   '<div class="art"><img src="img/cover-art.webp" alt="サンタ姿のぴょこたんとプレゼント袋のイラスト" width="1200" height="879">'+stars()+'</div>'+countChip()+
   '<dl><dt>開催日</dt><dd>2026年11月21日（土）</dd><dt>会場</dt><dd>OKBぎふ清流アリーナ</dd><dt>主催</dt><dd>岐阜県ドッジボール協会</dd><dt>協賛</dt><dd>株式会社人材Bank・株式会社アールエーピー</dd><dt>後援</dt><dd>岐阜新聞・岐阜放送</dd><dt>協力</dt><dd>株式会社河合寿司</dd></dl></section>';
}
function teamOpts(){
  return '<option value="">全チームを表示</option>'+Object.keys(BLK).map(function(b){return '<optgroup label="'+DIV[BLK[b].div].sh+' '+BLK[b].nm+'">'+BLK[b].t.map(function(n){return '<option'+(filter===n?' selected':'')+'>'+esc(n)+'</option>'}).join('')+'</optgroup>'}).join('');
}
function seg(id,cur,items){return '<div class="seg" role="group">'+items.map(function(it){return '<button type="button" data-seg="'+id+'" data-v="'+it[0]+'" class="'+it[0].toLowerCase()+'" aria-pressed="'+(cur===it[0])+'">'+it[1]+'</button>'}).join('')+'</div>'}

/* ---------- 試合進行 ---------- */
function rowHTML(name,ph,code,s,w,ex){return '<div class="row'+(w?' w':'')+(filter&&name===filter?' hl':'')+'"><span class="tn'+(name?'':' ph')+'">'+(code?'<small>'+esc(code)+'</small>':'')+(name?esc(name):esc(ph))+'</span><span class="sc">'+(s==null?'–':s)+(ex||'')+'</span></div>'}
function matchHTML(m,now){
  if(!m)return '<div class="match empty">－</div>';
  var fv=m.fin?finalV(m.id):null,v=m.fin?(fv?{a:fv.a,b:fv.b,w:null}:null):mv(m),aw=m.fin&&!(fv&&fv.done)?null:winA(v);
  var inv=(filter&&!(m.a===filter||m.b===filter))||(dview&&m.div!==dview);
  var vp=function(s){return v&&v.a===v.b&&v.w===s?'<small class="vp">V</small>':''};
  var tag=m.kind==='pre'?m.blk+'ブロック':m.r;
  return '<div class="match'+(m.court==='B'?' cb':'')+(inv?' dim':'')+(now?' now':'')+'"><div class="tags"><span class="dv '+m.div+'">'+DIV[m.div].sh+'</span><span class="bk">'+esc(tag)+(m.kind==='tour'?'（'+m.id+'）':'')+'</span>'+(now?'<span class="pill">次の試合</span>':'')+'</div>'+
    rowHTML(m.a,m.pa,m.kind==='pre'?m.ca:'',v?v.a:null,aw===true,vp('a'))+rowHTML(m.b,m.pb,m.kind==='pre'?m.cb:'',v?v.b:null,aw===false,vp('b'))+
    (v&&v.a===v.b&&!v.w&&!m.fin?'<div class="ref">引き分け</div>':'')+(v&&!m.fin&&v.a===v.b&&v.w?'<div class="ref">時間終了 '+v.a+'-'+v.b+' → Vポイントで '+esc(v.w==='a'?m.a:m.b)+' の勝ち</div>':'')+(m.fin?'<div class="ref">'+(fv?fv.sets.map(function(x,i){return x?'第'+(i+1)+'セット '+x.a+'-'+x.b+(x.a===x.b&&x.w?'（V：'+esc(x.w==='a'?m.a:m.b)+'）':''):''}).filter(Boolean).join('<br>')+'<br>':'')+'5分3セットマッチ（大きい数字は取ったセット数）'+(fv&&!fv.done?'・試合中':'')+'</div>':'')+'</div>';
}
function nextKeys(all){var n={};['A','B'].forEach(function(c){for(var i=0;i<all.length;i++){var m=all[i];if(m.court===c&&m.a&&m.b&&!mv(m)){n[m.key]=1;break}}});return n}
function viewSched(C){
  var tm=tourMatches(C),all=PM.concat(tm),nx=nextKeys(all);
  var h=cover();
  h+='<div style="display:grid;gap:8px"><h2>試合進行表</h2><p class="note">予選リーグと決勝トーナメント（準決勝まで）は5分1セットマッチ、決勝戦は5分3セットマッチ。数字は試合終了時の内野人数です。左右はオフィシャル席から見た並びです。</p>'+
    seg('dview',dview,[['','すべて'],['OF','オフィシャル'],['JR','ジュニア']])+
    '<select id="team-filter" class="sel" aria-label="チームで絞り込む">'+teamOpts()+'</select></div>';
  h+='<div class="courthead" aria-hidden="true"><span class="a">Aコート</span><span class="b">Bコート</span></div>';
  h+='<div class="stagehead"><span>予選リーグ</span></div>';
  function show(list){if(!filter&&!dview)return true;return list.some(function(m){return m&&(!filter||m.a===filter||m.b===filter)&&(!dview||m.div===dview)})}
  PRE.forEach(function(r,i){
    var A=PM.filter(function(m){return m.row===i+1&&m.court==='A'})[0]||null,B=PM.filter(function(m){return m.row===i+1&&m.court==='B'})[0]||null;
    if(!show([A,B]))return;
    h+='<section class="slot"><div class="slot-h"><span class="time">'+(r[0]||'')+'</span><span class="lbl">第'+(i+1)+'試合'+(r[0]?'':'（前の試合に続けて）')+'</span></div><div class="courts">'+matchHTML(A,A&&nx[A.key])+matchHTML(B,B&&nx[B.key])+'</div></section>';
  });
  h+='<div class="break"><div>🎅 集計・仮装コンテスト<small>予選リーグの結果をまとめて、決勝トーナメントの組み合わせが決まります</small></div></div>';
  h+='<div class="stagehead"><span>決勝トーナメント</span></div>';
  for(var r=1;r<=8;r++){
    var A=tm.filter(function(m){return m.row===r&&m.court==='A'})[0]||null,B=tm.filter(function(m){return m.row===r&&m.court==='B'})[0]||null;
    if(!show([A,B]))continue;
    h+='<section class="slot"><div class="slot-h"><span class="time">'+(TTIME[r]||'')+'</span><span class="lbl">'+(r===8?'第8〜10試合・決勝戦':'第'+r+'試合'+(TTIME[r]?'':'（前の試合に続けて）'))+'</span></div><div class="courts">'+matchHTML(A,A&&nx[A.key])+matchHTML(B,B&&nx[B.key])+'</div></section>';
  }
  h+='<div class="break"><div>🏆 閉会式<small>成績発表・表彰式・閉会宣言</small></div></div>';
  return h;
}

/* ---------- 予選リーグ ---------- */
function adjBtn(code){var a=+state.adj[code]||0;return '<span class="adj"><button type="button" class="mini" data-adj="'+code+'" data-d="0.1">上にする</button>'+(a?'<button type="button" class="mini" data-adj="'+code+'" data-d="0">戻す</button>':'')+'</span>'}
function viewLeague(C){
  var d=lview,D=DIV[d];
  var h='<div style="display:grid;gap:8px"><h2>予選リーグ</h2>'+seg('lview',d,[['OF','オフィシャル'],['JR','ジュニア']])+
   '<p class="note">'+D.nm+'（'+D.note+'）：'+C.played[d]+' / '+C.total[d]+' 試合終了。勝ち2点・引き分け1点・負け0点。勝点が同じときは ①内野人数の合計が多い ②相手の内野人数の合計が少ない ③直接対戦の勝者 の順で決め、それでも決まらなければ本部が判断します。各ブロック上位3チームが決勝トーナメントへ進みます。</p></div>';
  D.blocks.forEach(function(b){
    var arr=C.lg[b],n=arr.length,nums='①②③④⑤⑥';
    h+='<div class="card"><h3>'+BLK[b].nm+(C.bdone[b]?'<span class="done">確定</span>':'')+'</h3><div class="tbl-wrap"><table><colgroup><col style="width:11%"><col style="width:37%"><col><col><col><col style="width:10%"><col style="width:10%"><col style="width:11%"></colgroup><thead><tr><th>順位</th><th class="name">チーム</th><th>勝</th><th>分</th><th>負</th><th>勝点</th><th>内野</th><th>相手<br>内野</th></tr></thead><tbody>'+
     arr.map(function(r){var on=r.p>0;return '<tr class="'+(C.bdone[b]&&r.rank<=3?'adv':'')+'"><td class="rk'+(on&&r.rank===1?' rk1':'')+'">'+(on?r.rank:'–')+'</td><td class="name"><span class="no">'+r.code+'</span>'+esc(r.n)+(r.tied?'<span class="tie">同点・本部判断</span>':'')+(isAdmin()&&r.tied?adjBtn(r.code):'')+'</td><td>'+r.w+'</td><td>'+r.d+'</td><td>'+r.l+'</td><td><b>'+r.pts+'</b></td><td>'+r.inn+'</td><td>'+r.opp+'</td></tr>'}).join('')+'</tbody></table></div>';
    var ts=BLK[b].t;
    h+='<div class="tbl-wrap"><table class="mx"><colgroup><col style="width:'+(n>5?28:32)+'%">'+ts.map(function(){return '<col>'}).join('')+'</colgroup><thead><tr><th class="name">対戦</th>'+ts.map(function(_,i){return '<th>'+nums[i]+'</th>'}).join('')+'</tr></thead><tbody>'+
     ts.map(function(a,i){var ca=b+(i+1);return '<tr><td class="name"><span class="no">'+nums[i]+'</span>'+esc(a)+'</td>'+ts.map(function(_,j){var cb=b+(j+1);if(i===j)return '<td class="diag"></td>';var v=C.h2h[ca+'|'+cb];return v?'<td><span class="'+(v[0]>v[1]?'o':v[0]<v[1]?'x':'d')+'">'+(v[0]>v[1]?'〇':v[0]<v[1]?'×':'△')+'</span><small>'+v[0]+'-'+v[1]+'</small></td>':'<td><small>–</small></td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div></div>';
  });
  return h;
}

/* ---------- 決勝トーナメント（SVG） ---------- */
function est(s,z){var l=0;String(s).split('').forEach(function(c){l+=c.charCodeAt(0)>255?z*1.02:(/[A-Z0-9]/.test(c)?z*0.66:z*0.56)});return l}
function fitText(x,y,t,z,maxw,cls,anchor){var s=z;while(s>5.5&&est(t,s)>maxw)s-=0.25;return '<text x="'+x+'" y="'+y+'" font-size="'+s+'"'+(anchor?' text-anchor="'+anchor+'"':'')+(cls?' class="'+cls+'"':'')+'>'+esc(t)+'</text>'}
function line(p,k){if(k==='lose')k=null;var col=k==='win'?'var(--path-win)':k==='lose'?'var(--path-lose)':'var(--path-none)';return '<polyline'+(k==='win'?' class="glow" style="color:'+col+'"':'')+' points="'+p+'" fill="none" stroke="'+col+'" stroke-width="'+(k==='win'?4.5:k==='lose'?3:1.6)+'" stroke-linejoin="round" stroke-linecap="round"/>'}
function stag(x,y,v){return '<rect class="scbg" x="'+(x-9)+'" y="'+(y-11)+'" width="18" height="14" rx="3"/><text x="'+x+'" y="'+(y)+'" font-size="10" text-anchor="middle" class="sct">'+v+'</text>'}
function bracket(C,div){
  var T=C.T,root=ROOT[div];
  function build(code){var m=/^W:(\w+)$/.exec(code);if(m){var d=TD[m[1]];return {id:m[1],k:[build(d.a),build(d.b)]}}return {seed:code}}
  var tree={id:root,k:[build(TD[root].a),build(TD[root].b)]};
  var leaves=[];(function walk(n){if(n.seed)leaves.push(n);else n.k.forEach(walk)})(tree);
  function ht(n){return n.seed?0:1+Math.max(ht(n.k[0]),ht(n.k[1]))}
  var H=ht(tree),W=360,boxW=112,champW=70,colW=(W-boxW-champW-26)/H,gap=div==='JR'?38:46,top=12;
  leaves.forEach(function(l,i){l.y=top+18+i*gap});
  (function pos(n){if(n.seed){n.x=boxW;return}n.k.forEach(pos);n.y=(n.k[0].y+n.k[1].y)/2;n.x=boxW+ht(n)*colW})(tree);
  var h='';
  // 線
  (function draw(n){if(n.seed)return;var t=T[n.id];
    n.k.forEach(function(kid,i){var side=i===0?'a':'b',k=null;
      if(t&&t.aw!==undefined)k=((side==='a')===t.aw)?'win':'lose';
      h+=line(kid.x+','+kid.y+' '+n.x+','+kid.y+' '+n.x+','+n.y,k);
      if(t&&t.v){h+=stag(n.x-12,kid.y-3,t.v[side]);if(!TD[n.id].fin&&t.v.a===t.v.b&&t.v.w===side)h+='<text x="'+(n.x-24)+'" y="'+(kid.y-4)+'" font-size="8" text-anchor="end" class="vtx">V</text>'}
      draw(kid)});
    h+='<text x="'+(n.x+4)+'" y="'+(n.y+12)+'" font-size="8.5" class="sub">'+n.id+'</text>';
  })(tree);
  var rt=T[root];
  h+=line(tree.x+','+tree.y+' '+(W-champW-2)+','+tree.y,rt&&rt.win?'win':null);
  // 出場チームの枠
  leaves.forEach(function(l){var nmv=null,m=/^(J?[A-C])@(\d)$/.exec(l.seed),code=null;
    if(m){var ty=C.lg[m[1]];if(C.bdone[m[1]]){var r=ty[+m[2]-1];nmv=r.n;code=r.code}}
    var won=false;(function f(n){if(n.seed)return;var t=T[n.id];if(t&&t.win===nmv&&nmv)won=true;n.k.forEach(f)})(tree);
    h+='<rect class="box'+(nmv?' on':'')+(rt&&rt.win&&rt.win===nmv?' won':'')+'" x="2" y="'+(l.y-15)+'" width="'+(boxW-4)+'" height="30" rx="7"/>'+
      '<text x="9" y="'+(l.y-4)+'" font-size="8" class="sub">'+esc(seedLabel(l.seed))+'</text>'+fitText(9,l.y+10,nmv||'未確定',nmv?11:9.5,boxW-16,nmv?'':'sub')});
  // 優勝
  var cy=tree.y;
  h+='<rect class="champ" x="'+(W-champW)+'" y="'+(cy-22)+'" width="'+champW+'" height="44" rx="9"/><text x="'+(W-champW/2)+'" y="'+(cy-7)+'" font-size="9.5" text-anchor="middle" class="champtx">🏆 優勝</text>'+fitText(W-champW/2,cy+11,rt&&rt.win?rt.win:'—',11.5,champW-8,'champtx','middle');
  h+='<rect class="runner" x="'+(W-champW)+'" y="'+(cy+28)+'" width="'+champW+'" height="40" rx="9"/><text x="'+(W-champW/2)+'" y="'+(cy+42)+'" font-size="9" text-anchor="middle" class="runtx">🥈 準優勝</text>'+fitText(W-champW/2,cy+59,rt&&rt.lose?rt.lose:'—',11,champW-8,'runtx','middle');
  var fv=finalV(root);if(fv){h+='<text x="'+(W-champW/2)+'" y="'+(cy+82)+'" font-size="8.5" text-anchor="middle" class="sub">決勝のセット</text>';fv.sets.forEach(function(x,i){if(x)h+='<text x="'+(W-champW/2)+'" y="'+(cy+95+i*11)+'" font-size="9" text-anchor="middle" class="setx">'+(i+1)+') '+x.a+'-'+x.b+(x.a===x.b&&x.w?' V':'')+'</text>'})}
  var hgt=Math.max(top+18+(leaves.length-1)*gap+26,cy+95+(fv?33:0));
  return '<svg class="bk" viewBox="0 0 '+W+' '+hgt+'" role="img" aria-label="'+DIV[div].nm+'の決勝トーナメント表">'+h+'</svg>';
}
function podium(C,div){
  var T=C.T,rows;
  if(div==='JR'){var f=T.A7,t=T.B6;rows=[['p1','優勝',f.win],['p2','準優勝',f.lose],['p3','第3位',t.win],['','第4位',t.lose]]}
  else{var g=T.B7;rows=[['p1','優勝',g.win],['p2','準優勝',g.lose],['p3','第3位',T.B4.lose],['p3','第3位',T.B5.lose]]}
  return '<ol class="podium">'+rows.map(function(r){return '<li class="'+r[0]+'"><span class="pl">'+r[1]+'</span><span>'+(r[2]?esc(r[2]):'<span class="ph">未確定</span>')+'</span></li>'}).join('')+'</ol>';
}
function viewTour(C){
  var d=tview;
  var h='<div style="display:grid;gap:8px"><h2>決勝トーナメント</h2>'+seg('tview',d,[['OF','オフィシャル'],['JR','ジュニア']])+
   '<p class="note">'+(d==='OF'?'オフィシャルの部は各ブロック上位3チーム（6チーム）。3位決定戦はなく、準決勝で負けた2チームが第3位です。':'ジュニアの部は各ブロック上位3チーム（9チーム）。準決勝で負けた2チームで3位決定戦（B6）を行います。')+'準決勝までは5分1セット、決勝戦は5分3セットマッチ（2セット先取）。同数のときは延長Vポイントで決めます。</p>'+
   '<div class="legend"><span><i style="background:var(--path-win)"></i>勝ち上がり</span><span><small class="vp">V</small> Vポイントで勝利</span></div></div>';
  h+='<div class="card"><h3>最終順位</h3>'+podium(C,d)+'</div>';
  h+='<div class="card"><h3>'+DIV[d].nm+' トーナメント表</h3>'+bracket(C,d)+'</div>';
  var tm=tourMatches(C).filter(function(m){return m.div===d});
  h+='<div class="tlist">'+tm.map(function(m){return '<div class="slot"><div class="slot-h"><span class="time">'+(m.time||'')+'</span><span class="lbl">'+m.court+'コート '+esc(m.r)+'</span></div>'+matchHTML(m,false)+'</div>'}).join('')+'</div>';
  return h;
}

/* ---------- 要項 ---------- */
function viewInfo(){
  return cover()+
  '<div class="card"><h2>当日の流れ</h2><ol class="flow">'+
   [['7:50','県内役員・スタッフ・審判員 集合',''],['8:00','県外チーム帯同審判員 集合','到着しだい準備のお手伝いをお願いします'],['8:30','チーム受付','1階 正面玄関。参加費・弁当代をお支払いください（参加者名簿の提出は不要）'],['8:40','審判会議','審判控室'],['8:45','監督会議','アリーナ'],['9:00','開会式','主催者挨拶・来賓挨拶・競技説明・選手宣誓'],['9:30','予選リーグ開始','Aコート・Bコートで同時進行'],['13:20頃','集計・仮装コンテスト',''],['14:30','決勝トーナメント開始',''],['16:00頃','閉会式','成績発表・表彰式・閉会宣言']].map(function(r){return '<li><b>'+r[0]+'</b><span>'+r[1]+(r[2]?'<small>'+r[2]+'</small>':'')+'</span></li>'}).join('')+'</ol></div>'+
  '<div class="notice"><b>☔ 当日のお天気</b><span>21日の岐阜は雨の予報、最高気温は13℃の見込みです。防寒対策をしてお越しください。</span></div>'+
  '<div class="card"><h2>会場・駐車場</h2><dl class="info"><dt>会場</dt><dd>OKBぎふ清流アリーナ</dd><dt>駐車場</dt><dd>体育館<b>北側</b>の駐車場をご利用ください。東側・西側の駐車場は施設管理・役員・スポンサー専用です。</dd><dt>乗り降り</dt><dd>道路上での乗り降りは安全のため禁止です。駐車場の東側・西側の横断歩道を渡ってください。</dd><dt>高速道路</dt><dd>名神高速（静岡方面・関西方面）からは羽島IC か 安八スマートIC が近いです。東海北陸道（富山方面）からは岐阜各務原IC がいちばん近いです。</dd></dl></div>'+
  '<div class="card"><h2>座席表</h2><a class="seat" href="img/seat.webp" target="_blank" rel="noopener"><img src="img/seat.webp" alt="ぴょこたんカップ2026 座席表（コートA・B、各チームの応援席と待機場所）" loading="lazy" width="1100" height="1561"></a><p class="note">画像を押すと大きく表示できます。</p></div>'+
  '<div class="card"><h2>競技方法</h2><ul class="rules">'+
   ['オフィシャルの部：小学3〜6年生の男女20名までのチーム（試合人数12名）。3年生だけのチームは参加できません。','ジュニアの部：小学1〜4年生の男女15名までのチーム（試合人数8名）。4年生だけのチームは参加できません。','ルールはJ.D.B.A.公式ルールに沿って行います（一部ローカルルールあり）。','予選リーグは5分1セットマッチの総当たり戦。勝ち2点・引き分け1点・負け0点の勝点で順位を決めます。','勝点が同じときは ①内野人数の合計が多い ②相手の内野人数の合計が少ない ③直接対戦の勝者 ④順位決定戦（リーグ代表が決まらない場合のみ）の順で決めます。','各ブロック上位3チームが決勝トーナメントへ進みます。','決勝トーナメントは準決勝まで5分1セットマッチ。ジュニアのみ3位決定戦（5分1セット）があります。','決勝戦は5分3セットマッチで、2セット先取したチームの勝ちです。','セット終了時に内野人数が同じときは延長Vポイント（その状態からジャンプボールで再開し、最初にアウトを取ったチームの勝ち）。','フェアプレー精神で試合に臨みましょう。審判への抗議や相手チームへの中傷・挑発、応援席からの指示や抗議は禁止です。','試合球は MGJDB-L 公認球です。'].map(function(t){return '<li>'+t+'</li>'}).join('')+'</ul></div>'+
  '<div class="card"><h2>参加チーム（26チーム）</h2><div class="teams">'+Object.keys(BLK).map(function(b){return BLK[b].t.map(function(n){return '<span class="tm '+BLK[b].div+'">'+esc(n)+'</span>'}).join('')}).join('')+'</div><p class="note"><span class="tm OF">オフィシャルの部</span> 11チーム　<span class="tm JR">ジュニアの部</span> 15チーム</p></div>'+'<div class="card"><h2>大会役員</h2><dl class="info"><dt>大会会長</dt><dd>水野 吉近（岐阜県ドッジボール協会 会長）</dd><dt>実行委員長</dt><dd>間宮 嘉治（岐阜県ドッジボール協会 理事長）</dd><dt>事務局長</dt><dd>後藤 聖子（岐阜県ドッジボール協会 理事）</dd><dt>審判長</dt><dd>清水 裕子（岐阜県ドッジボール協会 競技委員長）</dd><dt>審判員</dt><dd>一般財団法人 日本ドッジボール協会公認審判員</dd></dl></div>';
}

/* ---------- 管理者 ---------- */
function allMatches(C){var out=PM.slice();tourMatches(C).forEach(function(m){if(!m.fin){out.push(m);return}
  var s1=sc(m.key+'s1'),s2=sc(m.key+'s2'),need3=!!(s1&&s2&&winA(s1)!==null&&winA(s2)!==null&&winA(s1)!==winA(s2));
  [1,2,3].forEach(function(i){var x={};for(var q in m)x[q]=m[q];x.key=m.key+'s'+i;x.fin=false;x.set=i;x.r='決勝戦 第'+i+'セット';x.off=i===3&&!need3&&!sc(x.key);out.push(x)})});
  return out}
function viewLogin(){
  return '<div class="card"><h2>管理者ログイン</h2><p class="note">本部で結果を入力する方だけが使います。</p><form id="login" class="card" style="box-shadow:none;padding:0;border:0"><div class="field"><label for="lid">ID</label><input id="lid" type="text" autocomplete="username" required></div><div class="field"><label for="lpw">パスワード</label><input id="lpw" type="password" autocomplete="current-password" required></div><button class="btn primary" type="submit">ログイン</button></form></div>';
}
var MOBILE=!!(window.matchMedia&&matchMedia('(pointer:coarse)').matches), drafts={}, efil=ss('pk-efil')||'all';
function maxOf(m){return m.fin?2:19}
function cellVal(m,s){var d=drafts[m.key];if(d&&d[s]!==undefined)return d[s];var v=sc(m.key);return v?String(v[s]):''}
function wVal(m){var d=drafts[m.key];if(d&&d.w!==undefined)return d.w;var v=sc(m.key);return v?v.w||'':''}
function rowState(m){var d=drafts[m.key],v=sc(m.key);if(d&&(d.a!==undefined||d.b!==undefined||d.w!==undefined)){var a=cellVal(m,'a'),b=cellVal(m,'b'),w=wVal(m);if(!v||String(v.a)!==a||String(v.b)!==b||(v.w||'')!==w)return 'dirty'}return v?'saved':'empty'}
function viewEntry(C){
  var ms=allMatches(C),n=ms.filter(function(m){return sc(m.key)}).length;
  var list=ms.filter(function(m){return efil==='pre'?m.kind==='pre':efil==='tour'?m.kind==='tour':efil==='todo'?(!sc(m.key)&&!m.off):true});
  var h='<div class="card"><h2>結果の入力</h2><div class="progress" aria-label="入力済み '+n+' / '+ms.length+'"><b style="width:'+(n/ms.length*100).toFixed(1)+'%"></b></div>'+
   '<p class="note">入力済み '+n+' / '+ms.length+' 試合。数字は試合終了時の内野人数（決勝戦は取ったセット数）です。'+(MOBILE?'<b>数字を2つ打つと自動で保存</b>され、次の試合に進みます。':'テンキーで <b>左の数字 → 右の数字 → Enter</b> で保存し、次の試合に進みます（2〜9と0は自動で右の欄へ移ります。10〜19は「1」に続けてもう1桁打ってください）。↑↓キーで試合を移動できます。')+'</p>'+
   seg('efil',efil,[['all','すべて'],['pre','予選'],['tour','決勝T'],['todo','未入力だけ']])+'</div>';
  h+='<div class="etbl-wrap"><table class="etbl"><colgroup><col style="width:170px"><col><col style="width:100px"><col style="width:22px"><col style="width:100px"><col><col style="width:170px"><col style="width:132px"></colgroup><thead><tr><th class="c-no">試合</th><th class="c-tm r">チーム（左）</th><th class="c-in" colspan="3">内野人数</th><th class="c-tm">チーム（右）</th><th class="c-v">Vポイント勝者</th><th class="c-op"></th></tr></thead><tbody>';
  var prevSec='';
  list.forEach(function(m){
    var sec=m.kind==='pre'?'予選リーグ':'決勝トーナメント';
    if(sec!==prevSec){h+='<tr class="sec"><td colspan="8">'+sec+'</td></tr>';prevSec=sec}
    var ok=!!(m.a&&m.b)&&!m.off,st=rowState(m),k=m.key,mx=maxOf(m);
    var no=m.kind==='pre'?'第'+m.row+'試合':m.id+' '+esc(m.r);
    var tie=m.kind==='tour'&&ok&&cellVal(m,'a')!==''&&cellVal(m,'a')===cellVal(m,'b');
    h+='<tr class="er '+st+(m.court==='B'?' cb':'')+'" data-row="'+k+'"><td class="c-no"><b>'+m.court+'</b> '+no+(m.time?'<small>'+m.time+'</small>':'')+'<span class="dv '+m.div+'">'+DIV[m.div].sh+(m.kind==='pre'?' '+m.blk:'')+'</span></td>'+
     '<td class="c-tm r">'+(ok?esc(m.a):'<span class="ph">'+(m.off?'第3セットは1-1のときだけ':esc(m.pa||'未確定'))+'</span>')+'</td>'+
     '<td class="c-in"><input class="num" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" autocomplete="off" id="in-'+k+'-a" data-k="'+k+'" data-s="a" data-max="'+mx+'" value="'+cellVal(m,'a')+'"'+(ok?'':' disabled')+' aria-label="'+esc(m.a||'左のチーム')+'の数字（0〜'+mx+'）"></td><td class="c-dash">−</td>'+
     '<td class="c-in"><input class="num" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" autocomplete="off" id="in-'+k+'-b" data-k="'+k+'" data-s="b" data-max="'+mx+'" value="'+cellVal(m,'b')+'"'+(ok?'':' disabled')+' aria-label="'+esc(m.b||'右のチーム')+'の数字（0〜'+mx+'）"></td>'+
     '<td class="c-tm">'+(ok?esc(m.b):'<span class="ph">'+esc(m.pb||'未確定')+'</span>')+'</td>'+
     '<td class="c-v">'+(m.kind==='tour'?'<select class="vsel" id="in-'+k+'-w" data-k="'+k+'" data-s="w"'+(tie?'':' disabled')+' aria-label="同点のときの勝者"><option value="">'+(tie?'1か2を押して選ぶ':'同点のときだけ')+'</option><option value="a"'+(wVal(m)==='a'?' selected':'')+'>1：'+esc(m.a||'左')+'</option><option value="b"'+(wVal(m)==='b'?' selected':'')+'>2：'+esc(m.b||'右')+'</option></select>':'')+'</td>'+
     '<td class="c-op"><button type="button" class="sv" data-save="'+k+'" tabindex="-1"'+(ok?'':' disabled')+'>'+(st==='saved'?'保存済み':'保存')+'</button>'+(sc(k)?'<button type="button" class="del" data-del="'+k+'" tabindex="-1" aria-label="この試合の結果を消す">消す</button>':'')+'</td></tr>';
  });
  h+='</tbody></table></div>';
  return h;
}
function findM(k){return allMatches(compute()).filter(function(m){return m.key===k})[0]}
function focusNext(k){
  var rows=[].slice.call(document.querySelectorAll('tr.er')),i=-1;rows.forEach(function(r,j){if(r.getAttribute('data-row')===k)i=j});
  for(var j=i+1;j<rows.length;j++){var inp=rows[j].querySelector('input.num:not([disabled])');if(inp){inp.focus();inp.select();var r=inp.getBoundingClientRect();if(r.top<120||r.bottom>window.innerHeight-120)inp.scrollIntoView({block:'center'});return}}
}
function saveRow(k,goNext){
  if(busy)return;var m=findM(k);if(!m||!m.a||!m.b)return;
  var as=cellVal(m,'a'),bs=cellVal(m,'b'),mx=maxOf(m);
  if(!/^\d{1,2}$/.test(as)||!/^\d{1,2}$/.test(bs)){toast('数字を2つとも入れてください');return}
  var a=+as,b=+bs;if(a>mx||b>mx){toast('0〜'+mx+'の数字を入れてください');return}
  var w=a===b?(wVal(m)||null):null;
  if(m.kind==='tour'&&a===b&&!w){toast('同点です。Vポイントで勝ったチームを選んでください');var sel=document.getElementById('in-'+k+'-w');if(sel)sel.focus();return}
  if(m.fin&&a===b){toast('決勝戦はセット数で入力してください（例：2-1）');return}
  once(rpc('pk26_save_result',{p_key:k,p_a:a,p_b:b,p_w:w}).then(function(r){if(r.error)throw r.error;state.scores[k]={a:a,b:b,w:w};delete drafts[k];render();
    toast('保存しました：'+m.a+' '+a+' - '+b+' '+m.b);if(goNext)focusNext(k)}).catch(werr));
}
/* ---------- BINGO ---------- */
function bingoList(){var a=[];Object.keys(state.scores).forEach(function(k){if(/^bg\d+$/.test(k)){var v=state.scores[k];a.push({n:v.a,seq:v.b,key:k})}});return a.sort(function(x,y){return x.seq-y.seq})}
var bingoSeen=null;
function checkBingo(){var L=bingoList(),mx=L.length?L[L.length-1].seq:0;if(bingoSeen===null){bingoSeen=mx;return}if(mx>bingoSeen){bingoSeen=mx;playBingo(L[L.length-1].n,L.length)}else bingoSeen=mx}
function col(n){return 'BINGO'[Math.min(4,Math.floor((n-1)/15))]}
function drumSVG(){
  var spokes='';for(var i=0;i<8;i++){var a=i*Math.PI/4;spokes+='<line x1="0" y1="0" x2="'+(Math.cos(a)*58).toFixed(1)+'" y2="'+(Math.sin(a)*58).toFixed(1)+'" stroke="#3A3A42" stroke-width="2"/>'}
  var oct='';for(var j=0;j<8;j++){var b=j*Math.PI/4+Math.PI/8;oct+=(j?' ':'')+(Math.cos(b)*70).toFixed(1)+','+(Math.sin(b)*70).toFixed(1)}
  return '<svg class="drum" viewBox="-110 -100 220 210" aria-hidden="true"><defs><radialGradient id="dg" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#55555F"/><stop offset=".45" stop-color="#1B1B21"/><stop offset="1" stop-color="#050507"/></radialGradient><linearGradient id="dl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8A6A3A"/><stop offset="1" stop-color="#4A3418"/></linearGradient></defs>'+
   '<path d="M-60 95 L-22 10 M60 95 L22 10" stroke="url(#dl)" stroke-width="9" stroke-linecap="round"/><rect x="-80" y="90" width="160" height="12" rx="6" fill="url(#dl)"/>'+
   '<path d="M-36 92 h40 l6 -10 h-40z" fill="#C8A24A" opacity=".0"/>'+
   '<g class="rot"><polygon points="'+oct+'" fill="url(#dg)" stroke="#000" stroke-width="3"/>'+spokes+'<polygon points="'+oct+'" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="1.5" transform="scale(.82)"/><circle r="9" fill="#C9A24C" stroke="#6B5220" stroke-width="2"/></g>'+
   '<g class="crank"><line x1="0" y1="0" x2="0" y2="-46" stroke="#B9BAC4" stroke-width="6" stroke-linecap="round"/><circle cy="-50" r="8" fill="#E1262B" stroke="#7A0F12" stroke-width="2"/></g>'+
   '<ellipse cx="-36" cy="94" rx="22" ry="6" fill="#3A2A10"/></svg>';
}
function viewBingo(){
  var L=bingoList(),last=L[L.length-1],called={};L.forEach(function(x){called[x.n]=x.seq});
  var h='<section class="bingo-stage"><div class="bg-title"><span>🎄</span> BINGO大会 <span>🎄</span></div><div class="bg-machine"><img class="chara c1" src="img/pyokotan.webp" alt="ぴょこたん" width="360" height="360"><div class="bg-drum">'+drumSVG()+'</div><img class="chara c2" src="img/joebull.webp" alt="ジョーブル" width="360" height="360"></div>'+
   '<div class="bg-names"><span>ぴょこたん</span><span>ジョーブル</span></div>'+
   '<div class="bg-latest">'+(last?'<small>いま出た番号（'+L.length+'個目）</small><div class="ball big"><i>'+col(last.n)+'</i><b>'+last.n+'</b></div>':'<small>まだ番号は出ていません</small><div class="ball big empty"><b>?</b></div>')+'</div></section>';
  if(isAdmin())h+='<div class="card bg-admin"><h3>番号を追加（管理者）</h3><form id="bingo-add" class="bg-form"><input id="bingo-num" class="num" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" autocomplete="off" placeholder="番号" aria-label="出た番号（1〜75）"><button class="btn primary" type="submit">追加して回す</button></form><p class="note">数字を入れて Enter でも追加できます。見ている全員の画面でガラガラの演出が流れます。</p>'+(last?'<button type="button" class="linkbtn" id="bingo-undo">最後の番号（'+last.n+'）を取り消す</button>':'')+'</div>';
  h+='<div class="card"><h3>出た番号（新しい順）<span class="done">'+L.length+'個</span></h3>'+(L.length?'<div class="bg-hist">'+L.slice().reverse().map(function(x,i){return '<span class="ball sm'+(i===0?' new':'')+'"><i>'+x.seq+'</i><b>'+x.n+'</b></span>'}).join('')+'</div>':'<p class="note">番号が出ると、ここに順番に並びます。聞き逃しても、ここで確認できます。</p>')+'</div>';
  h+='<div class="card"><h3>番号表</h3><div class="bg-grid">'+['B','I','N','G','O'].map(function(c,ci){var cells='<div class="bg-col"><div class="bg-h">'+c+'</div>';for(var n=ci*15+1;n<=ci*15+15;n++)cells+='<div class="bg-c'+(called[n]?' on':'')+(last&&last.n===n?' last':'')+'">'+n+'</div>';return cells+'</div>'}).join('')+'</div><p class="note">色が付いている番号が、すでに出た番号です。</p></div>';
  return h;
}
var bingoTimer=null;
function playBingo(n,cnt){
  var old=document.getElementById('bingo-show');if(old)old.remove();clearTimeout(bingoTimer);
  var el=document.createElement('div');el.id='bingo-show';el.setAttribute('role','dialog');el.setAttribute('aria-label','BINGO '+n+'番');
  var conf='';for(var i=0;i<26;i++)conf+='<i style="left:'+(Math.random()*100).toFixed(0)+'%;background:'+['#E1262B','#169A49','#F6B800','#fff','#6BB7E8'][i%5]+';--d:'+(Math.random()*.6).toFixed(2)+'s;--x:'+(Math.random()*120-60).toFixed(0)+'px"></i>';
  el.innerHTML='<div class="bs-in"><div class="bs-top">'+cnt+'個目の番号は…</div><div class="bg-machine spin"><img class="chara c1" src="img/pyokotan.webp" alt=""><div class="bg-drum">'+drumSVG()+'</div><img class="chara c2" src="img/joebull.webp" alt=""></div><div class="bs-ball"><div class="ball big"><i>'+col(n)+'</i><b>'+n+'</b></div></div><div class="bs-num">'+col(n)+' - '+n+' <small>番！</small></div><div class="conf">'+conf+'</div><button type="button" class="bs-close">閉じる</button></div>';
  document.body.appendChild(el);
  requestAnimationFrame(function(){el.classList.add('on')});
  setTimeout(function(){el.classList.add('reveal')},2300);
  function close(){el.classList.add('out');setTimeout(function(){el.remove()},400)}
  el.addEventListener('click',close);bingoTimer=setTimeout(close,8000);
  try{navigator.vibrate&&navigator.vibrate([30,60,30])}catch(e){}
}
function addBingo(){
  var inp=document.getElementById('bingo-num');if(!inp)return;var v=inp.value.replace(/[０-９]/g,function(c){return String.fromCharCode(c.charCodeAt(0)-65248)}).replace(/\D/g,'');
  var n=+v;if(!v||n<1||n>75){toast('1〜75の番号を入れてください');return}
  var L=bingoList();if(L.some(function(x){return x.n===n})){toast(n+'番はもう出ています');inp.select();return}
  var seq=(L.length?L[L.length-1].seq:0)+1,key='bg'+(n<10?'0':'')+n;
  once(rpc('pk26_save_result',{p_key:key,p_a:n,p_b:seq,p_w:null}).then(function(r){if(r.error)throw r.error;state.scores[key]={a:n,b:seq,w:null};bingoSeen=seq;render();playBingo(n,L.length+1);var i2=document.getElementById('bingo-num');if(i2){i2.value='';i2.focus()}}).catch(werr));
}
/* ---------- 画面 ---------- */
var toastT=null;
function toast(t){var el=document.querySelector('.toast');if(!el){el=document.createElement('div');el.className='toast';el.setAttribute('role','status');document.body.appendChild(el)}el.textContent=t;el.hidden=false;clearTimeout(toastT);toastT=setTimeout(function(){el.hidden=true},2600)}
function render(){
  var C;try{C=compute()}catch(e){console.error(e);return}
  if(tab==='entry'&&!isAdmin())tab='login';
  var th=document.documentElement.getAttribute('data-theme');
  var body=tab==='bingo'?viewBingo():tab==='league'?viewLeague(C):tab==='tour'?viewTour(C):tab==='info'?viewInfo():tab==='entry'?viewEntry(C):tab==='login'?viewLogin():viewSched(C);
  var tabs=[['info','要項',ICON.info],['sched','試合',ICON.sched],['league','予選',ICON.league],['tour','トーナメント',ICON.tour],['bingo','BINGO',ICON.bingo]];
  if(isAdmin())tabs.push(['entry','入力',ICON.entry]);
  var y=window.scrollY,ae=document.activeElement,aid=ae&&ae.id&&/^in-/.test(ae.id)?ae.id:null,sel0=aid&&ae.selectionStart!=null?[ae.selectionStart,ae.selectionEnd]:null;
  document.body.classList.toggle('wide',tab==='entry');
  document.getElementById('app').innerHTML=
   '<header class="top"><div class="wrap"><div class="logo"><img class="ttl-img" src="img/title.webp" alt="ぴょこたんカップ2026" width="1344" height="216"><div class="meta"><span class="live'+(online?' on':'')+'"></span>'+(online?'LIVE 速報中':'速報ページ')+(VIS?'<span class="visits" title="アクセス数">🎁 <b>'+Number(VIS.total).toLocaleString('ja-JP')+'</b>（今日 '+Number(VIS.today).toLocaleString('ja-JP')+'）</span>':'')+'</div></div>'+
   '<div class="themesw" role="group" aria-label="表示モード"><button type="button" data-th="light" aria-label="ライトモード" aria-pressed="'+(th!=='dark')+'">'+ICON.sun+'</button><button type="button" data-th="dark" aria-label="ダークモード" aria-pressed="'+(th==='dark')+'">'+ICON.moon+'</button></div></div></header>'+
   (isAdmin()?'<div class="adminbar"><div class="wrap"><span>管理者としてログイン中</span><button type="button" id="logout">ログアウト</button></div></div>':'')+
   '<main><div class="wrap">'+(loadError?'<div class="alert">'+esc(loadError)+'</div>':'')+body+'</div></main>'+
   '<footer><div class="wrap">'+(isAdmin()?'':'<button type="button" class="linkbtn" data-tab="login">管理者ログイン</button>')+'<span class="credit">主催：岐阜県ドッジボール協会</span></div></footer>'+
   '<nav class="bottomnav" aria-label="メニュー"><div class="in">'+tabs.map(function(t){return '<button type="button" data-tab="'+t[0]+'"'+(tab===t[0]?' aria-current="page"':'')+'>'+t[2]+'<span>'+t[1]+'</span></button>'}).join('')+'</div></nav>'+
   '<button type="button" class="refresh" id="refresh" aria-label="最新情報に更新">'+ICON.gift+'<span class="t"><span>最新情報に更新</span><small>'+(lastSync?'最終更新 '+lastSync:'押すと最新の結果を読み込みます')+'</small></span></button>';
  window.scrollTo(0,y);
  if(aid){var ne=document.getElementById(aid);if(ne&&!ne.disabled){ne.focus({preventScroll:true});if(sel0&&ne.setSelectionRange)try{ne.setSelectionRange(sel0[0],sel0[1])}catch(x){}}}
  try{var hd=document.querySelector('header.top');if(hd)document.documentElement.style.setProperty('--hh',hd.offsetHeight+'px')}catch(e){}
}

/* ---------- 通信 ---------- */
function stamp(){var d=new Date();lastSync=d.getHours()+':'+String(d.getMinutes()).padStart(2,'0')}
function loadAll(){if(!sb)return Promise.resolve(false);
  return Promise.all([sb.from('pk26_results').select('key,a,b,w'),sb.from('pk26_settings').select('adj').eq('id',1).maybeSingle()]).then(function(r){
    if(r[0].error)throw r[0].error;var s={};(r[0].data||[]).forEach(function(x){s[x.key]={a:x.a,b:x.b,w:x.w}});state.scores=s;setTimeout(checkBingo,30);
    state.adj=(r[1].data&&r[1].data.adj)||{};loaded=true;loadError='';stamp();if(tab!=='login')render();return true;
  }).catch(function(e){console.error(e);loadError=loaded?'':'結果の読み込みに失敗しました。電波の良い場所で「最新情報に更新」を押してください。';render();return false});
}
var tmr=null;function later(){clearTimeout(tmr);tmr=setTimeout(loadAll,400)}
function subscribe(){try{sb.channel('pk26-live').on('postgres_changes',{event:'*',schema:'public',table:'pk26_results'},later).on('postgres_changes',{event:'*',schema:'public',table:'pk26_settings'},later).subscribe(function(s){online=s==='SUBSCRIBED';render()})}catch(e){}}
function rpc(fn,a){var o={p_id:cred&&cred.id,p_pw:cred&&cred.pw};for(var k in a)o[k]=a[k];return sb.rpc(fn,o)}
var busy=false;function once(p){busy=true;return p.then(function(){busy=false},function(){busy=false})}
function werr(e){console.error(e);toast('保存できませんでした。電波を確認してもう一度押してください')}

/* ---------- 操作 ---------- */
document.addEventListener('click',function(e){
  var t=e.target.closest('[data-th]');if(t){var v=t.getAttribute('data-th');document.documentElement.setAttribute('data-theme',v);ls('pk-theme',v);render();return}
  t=e.target.closest('[data-tab]');if(t){tab=t.getAttribute('data-tab');ss('pk-tab',tab==='login'?'sched':tab);render();window.scrollTo(0,0);if(tab==='entry')focusFirst();return}
  t=e.target.closest('[data-seg]');if(t){var k=t.getAttribute('data-seg'),v2=t.getAttribute('data-v');if(k==='dview'){dview=v2;ls('pk-div',v2)}if(k==='lview'){lview=v2;ls('pk-ldiv',v2)}if(k==='tview'){tview=v2;ls('pk-tdiv',v2)}if(k==='efil'){efil=v2;ss('pk-efil',v2);render();focusFirst();return}render();return}
  var rb=e.target.closest('#refresh');if(rb){
    if(rb.classList.contains('busy'))return;rb.classList.add('busy');rb.querySelector('.t span').textContent='更新中…';
    try{navigator.vibrate&&navigator.vibrate(15)}catch(x){}
    Promise.all([loadAll(),new Promise(function(r){setTimeout(r,600)})]).then(function(res){
      var b=document.getElementById('refresh');
      if(res[0]){if(b){b.classList.remove('busy');b.classList.add('done');b.querySelector('.t span').textContent='更新しました'}toast('最新の結果を表示しています（'+lastSync+'）');setTimeout(render,1600)}
      else{if(b)b.classList.remove('busy');toast('読み込めませんでした。電波を確認してもう一度押してください')}});
    return}
  if(e.target.closest('#logout')){cred=null;ls('pk26-cred',null);tab='sched';render();toast('ログアウトしました');return}
  if(e.target.closest('#bingo-undo')&&isAdmin()&&!busy){var L=bingoList(),la=L[L.length-1];if(la&&window.confirm(la.n+'番を取り消しますか？')){once(rpc('pk26_delete_result',{p_key:la.key}).then(function(r){if(r.error)throw r.error;delete state.scores[la.key];bingoSeen=L.length>1?L[L.length-2].seq:0;render();toast(la.n+'番を取り消しました')}).catch(werr))}return}
  if(!isAdmin()||busy)return;
  t=e.target.closest('[data-save]');if(t){saveRow(t.getAttribute('data-save'),true);return}
  t=e.target.closest('[data-del]');if(t){var dk=t.getAttribute('data-del'),dm=findM(dk);if(!window.confirm((dm.a||'')+' × '+(dm.b||'')+' の結果を消しますか？'))return;once(rpc('pk26_delete_result',{p_key:dk}).then(function(r){if(r.error)throw r.error;delete state.scores[dk];delete drafts[dk];render();toast('結果を消しました')}).catch(werr));return}
  t=e.target.closest('[data-adj]');if(t){var code=t.getAttribute('data-adj'),adj={};for(var q in state.adj)adj[q]=state.adj[q];var dd=+t.getAttribute('data-d');if(dd)adj[code]=(+adj[code]||0)+dd;else delete adj[code];
    once(rpc('pk26_save_adj',{p_adj:adj}).then(function(r){if(r.error)throw r.error;state.adj=adj;render();toast('順位を調整しました')}).catch(werr));return}
});
document.addEventListener('change',function(e){
  if(e.target.id==='team-filter'){filter=e.target.value;ls('pk-filter',filter);render();return}
  if(e.target.classList&&e.target.classList.contains('vsel')){var k=e.target.getAttribute('data-k');drafts[k]=drafts[k]||{};drafts[k].w=e.target.value;markRow(k)}
});
function markRow(k){var tr=document.querySelector('tr[data-row="'+k+'"]');var m=findM(k);if(!tr||!m)return;var st=rowState(m);tr.classList.remove('saved','dirty','empty');tr.classList.add(st);var b=tr.querySelector('.sv');if(b)b.textContent=st==='saved'?'保存済み':'保存';
  var sel=document.getElementById('in-'+k+'-w');if(sel){var tie=cellVal(m,'a')!==''&&cellVal(m,'a')===cellVal(m,'b');sel.disabled=!tie;sel.options[0].textContent=tie?'1か2を押して選ぶ':'同点のときだけ'}}
document.addEventListener('input',function(e){var t=e.target;if(!t.classList||!t.classList.contains('num'))return;var v=t.value.replace(/[０-９]/g,function(c){return String.fromCharCode(c.charCodeAt(0)-65248)}).replace(/\D/g,'').slice(0,2);if(v!==t.value)t.value=v;var k=t.getAttribute('data-k'),sd=t.getAttribute('data-s');drafts[k]=drafts[k]||{};drafts[k][sd]=v;markRow(k);
  var mx=+t.getAttribute('data-max')||12,full=v!==''&&(v.length===2||v==='0'||(+v)*10>mx);if(!full)return;
  if(sd==='a'){var nb=document.getElementById('in-'+k+'-b');if(nb){nb.focus();nb.select()}return}
  if(MOBILE){var m=findM(k),ta=cellVal(m,'a');if(ta===''){var na=document.getElementById('in-'+k+'-a');if(na)na.focus();return}
    if(m.kind==='tour'&&ta===v){var sel=document.getElementById('in-'+k+'-w');if(sel)sel.focus();return}
    focusNext(k);saveRow(k,false)}});
document.addEventListener('keydown',function(e){var t=e.target;if(e.isComposing||!t.getAttribute||!t.getAttribute('data-k'))return;var k=t.getAttribute('data-k'),sd=t.getAttribute('data-s');
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();moveRow(k,sd,e.key==='ArrowDown'?1:-1);return}
  if(e.key!=='Enter')return;e.preventDefault();
  if(sd==='a'){var nb=document.getElementById('in-'+k+'-b');if(nb){nb.focus();nb.select()}return}
  if(sd==='b'){var m=findM(k);if(cellVal(m,'a')===''){var na=document.getElementById('in-'+k+'-a');if(na)na.focus();return}if(cellVal(m,'b')==='')return;
    if(m.kind==='tour'&&cellVal(m,'a')===cellVal(m,'b')&&!wVal(m)){var sel=document.getElementById('in-'+k+'-w');if(sel)sel.focus();toast('同点です。Vポイントで勝ったチームを選んでください');return}}
  saveRow(k,true)});
function moveRow(k,sd,d){var rows=[].slice.call(document.querySelectorAll('tr.er')),i=-1;rows.forEach(function(r,j){if(r.getAttribute('data-row')===k)i=j});
  for(var j=i+d;j>=0&&j<rows.length;j+=d){var inp=rows[j].querySelector('input.num[data-s="'+(sd==='w'?'a':sd)+'"]:not([disabled])');if(inp){inp.focus();inp.select();inp.scrollIntoView({block:'nearest'});return}}}
function focusFirst(){if(MOBILE)return;var rows=document.querySelectorAll('tr.er.empty,tr.er.dirty');for(var i=0;i<rows.length;i++){var inp=rows[i].querySelector('input.num:not([disabled])');if(inp){inp.focus();inp.select();inp.scrollIntoView({block:'center'});return}}}
document.addEventListener('focusin',function(e){if(e.target.classList&&e.target.classList.contains('num'))e.target.select()});
document.addEventListener('submit',function(e){if(e.target.id==='bingo-add'){e.preventDefault();if(isAdmin()&&!busy)addBingo();return}
  if(e.target.id!=='login')return;e.preventDefault();
  var id=document.getElementById('lid').value.trim(),pw=document.getElementById('lpw').value;
  if(!sb){toast('接続の準備ができていません');return}
  sb.rpc('pk26_login',{p_id:id,p_pw:pw}).then(function(r){
    if(r.error||!r.data){toast('IDかパスワードが違います');return}
    cred={id:id,pw:pw};ls('pk26-cred',JSON.stringify(cred));tab='entry';ss('pk-tab','entry');render();window.scrollTo(0,0);focusFirst();toast('ログインしました');
  },function(){toast('ログインできませんでした。電波を確認してください')});
});

/* ---------- 起動 ---------- */
render();if(tab==='entry')setTimeout(focusFirst,50);
if(!CFG.SUPABASE_URL||!window.supabase){loadError='接続の準備ができていません。';render()}
else{
  sb=window.supabase.createClient(CFG.SUPABASE_URL,CFG.SUPABASE_ANON_KEY,{auth:{persistSession:false}});
  var fresh=!ss('pk-visited');sb.rpc('pk26_hit',{p_inc:fresh}).then(function(r){if(r&&!r.error&&r.data){if(fresh)ss('pk-visited','1');VIS=r.data;render()}},function(){});
  loadAll();subscribe();
  document.addEventListener('visibilitychange',function(){if(!document.hidden)loadAll()});
  setInterval(function(){if(!document.hidden)loadAll()},30000);
}
})();
