
(function(){
 // ---- detail pages: Back returns to the list with its search/filter/scroll intact ----
 var back=document.querySelector('a.back');
 if(back){
  back.addEventListener('click',function(e){
   try{
    var ref=(document.referrer||'').split('#')[0];
    if(ref&&ref===back.href.split('#')[0]&&history.length>1){e.preventDefault();history.back();}
   }catch(x){}
  });
 }

 // ---- list pages ----
 var raw=document.getElementById('rows');
 if(!raw)return;
 var D=JSON.parse(raw.textContent), rows=D.rows;
 rows.forEach(function(r,i){r.x=i;});
 var tb=document.querySelector('tbody'), q=document.getElementById('q'),
     fSels=Array.prototype.slice.call(document.querySelectorAll('select.facet')),
     cnt=document.getElementById('cnt'),
     th=document.querySelector('th.sortable');
 var sortDir=0; // 0 = catalog order, 1 = A-Z, -1 = Z-A
 var KEY='mfwiki:'+location.pathname;

 function esc(s){return String(s).replace(/[&<>"]/g,function(c){
   return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
 function initials(s){var w=String(s).split(/\s+/).filter(Boolean);
   return ((w[0]||'?').charAt(0)+(w[1]?w[1].charAt(0):'')).toUpperCase();}

 function render(list){
  var out=[], gn=D.gn||0, counts={}, prev=[];
  // Group header counts reflect the current search/filter.
  for(var k=0;k<list.length;k++){
   for(var lv=0;lv<gn;lv++){
    var key=list[k].g.slice(0,lv+1).join('|');
    counts[key]=(counts[key]||0)+1;
   }
  }
  for(var i=0;i<list.length;i++){
   var r=list[i];
   for(var lv=0;lv<gn;lv++){
    var changed=false;
    for(var up=0;up<=lv;up++){if(prev[up]!==r.g[up]){changed=true;break;}}
    if(changed){
     var n=counts[r.g.slice(0,lv+1).join('|')];
     out.push('<tr class="gh gh'+(lv+1)+'"><td colspan="3">'+esc(r.g[lv])+
              '<span class="gc">'+n+(lv===0?' '+esc(D.unit||''):'')+'</span></td></tr>');
    }
   }
   prev=r.g||[];
   // Dark backdrop on a WRAPPER: a CSS filter on the <img> would also tint and
   // glow the img's own background, lighting up the tile instead of the icon.
   var img=r.i?'<img class="ico'+(D.holo?' holo':'')+'" loading="lazy" alt="" src="'+(D.ip||'')+encodeURIComponent(r.i)+'.png">':'';
   var pic=r.i?(D.dark?'<span class="icobox">'+img+'</span>':img)
              :'<div class="ph" aria-hidden="true">'+esc(initials(r.l))+'</div>';
   if(r.h){
    out.push('<tr data-h="'+esc(r.h)+'"><td>'+pic+'</td><td class="nm"><a href="'+esc(r.h)+'">'+
             esc(r.l)+'</a></td><td><div class="ds">'+(r.dh||esc(r.d))+'</div></td></tr>');
   }else{
    out.push('<tr class="nolink"><td>'+pic+'</td><td class="nm"><span>'+esc(r.l)+
             '</span></td><td><div class="ds">'+(r.dh||esc(r.d))+'</div></td></tr>');
   }
  }
  tb.innerHTML=out.length?out.join(''):'<tr><td colspan="3" class="empty">No matches.</td></tr>';
  cnt.textContent=list.length+' of '+rows.length;
 }

 function apply(){
  var term=(q.value||'').toLowerCase().trim();
  var fv=fSels.map(function(s){return s.value;});
  var list=rows.filter(function(r){
   for(var j=0;j<fv.length;j++){if(fv[j]&&r.f[j]!==fv[j])return false;}
   return !term||r.s.indexOf(term)>=0;
  });
  if(sortDir||D.gn){
   list=list.slice().sort(function(a,b){
    for(var j=0;j<(D.gn||0);j++){if(a.o[j]!==b.o[j])return a.o[j]-b.o[j];}
    if(sortDir){
     var x=a.l.toLowerCase(), y=b.l.toLowerCase();
     if(x!==y)return (x<y?-1:1)*sortDir;
    }
    if((a.k||0)!==(b.k||0))return (a.k||0)-(b.k||0);
    return a.x-b.x;
   });
  }
  if(th)th.className='sortable'+(sortDir?' sorted'+(sortDir<0?' desc':''):'');
  render(list);
 }

 function save(){
  try{sessionStorage.setItem(KEY,JSON.stringify({q:q.value,f:fSels.map(function(s){return s.value;}),
    s:sortDir,y:window.scrollY}));}catch(e){}
 }
 var saved=null;
 try{saved=JSON.parse(sessionStorage.getItem(KEY)||'null');}catch(e){}
 if(saved){
  q.value=saved.q||'';
  if(saved.f&&saved.f.map)saved.f.forEach(function(v,j){if(fSels[j])fSels[j].value=v;});
  sortDir=saved.s||0;
 }

 q.addEventListener('input',apply);
 fSels.forEach(function(s){s.addEventListener('change',apply);});
 if(th)th.addEventListener('click',function(){sortDir=sortDir===0?1:sortDir===1?-1:0;apply();});
 tb.addEventListener('click',function(e){
  save();
  if(e.target.closest('a'))return;
  var tr=e.target.closest('tr[data-h]');
  if(!tr)return;
  if(e.ctrlKey||e.metaKey){window.open(tr.getAttribute('data-h'));return;}
  location.href=tr.getAttribute('data-h');
 });
 window.addEventListener('pagehide',save);
 apply();
 if(saved&&saved.y)window.scrollTo(0,saved.y);
})();
