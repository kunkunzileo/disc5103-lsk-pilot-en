/* The two projections share every node, room anchor, polyline and availability state. */
(() => {
  'use strict';
  function create(canvas,graph,selectRoom,selectElement) {
    const ctx=canvas.getContext('2d'),nodes=new Map(graph.nodes.map(n=>[n.id,n]));
    const rooms=graph.nodes.filter(n=>n.kind==='room'),exits=graph.nodes.filter(n=>n.kind==='exit');
    const edges=new Map(graph.edges.map(e=>[e.id,e]));
    const pos=n=>[n.x,n.y];
    const hinges=new Map(rooms.map(r=>{const e=graph.edges.find(e=>e.kind==='approach'&&(e.from===r.id||e.to===r.id));return [r.id,nodes.get(e.from===r.id?e.to:e.from)];}));
    let current=null, targets=[];
    function paint(state) {
      current=state;
      const dataRect=canvas.getBoundingClientRect(),w=dataRect.width,h=dataRect.height, dpr=Math.min(2,devicePixelRatio||1);
      if (!w||!h) return;
      canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
      const is3D=state.view==='3d', angle=is3D?[-.39,.39,2.75,-2.75][state.camera%4]:0;
      const co=Math.cos(angle),si=Math.sin(angle),pitch=is3D?.68:1,lift=is3D?.95:0;
      function raw(x,y,z=0) {return [co*x-si*y,(si*x+co*y)*pitch-z*lift];}
      const xs=graph.nodes.map(n=>n.x),ys=graph.nodes.map(n=>n.y);
      const xmin=Math.min(...xs)-1.8,xmax=Math.max(...xs)+1.8,ymin=Math.min(...ys)-3.6,ymax=Math.max(...ys)+3.6;
      const corners=[raw(xmin,ymin),raw(xmax,ymin),raw(xmax,ymax),raw(xmin,ymax),raw(xmin,ymin,2.2),raw(xmax,ymax,2.2)];
      const xMin=Math.min(...corners.map(p=>p[0])),xMax=Math.max(...corners.map(p=>p[0]));
      const yMin=Math.min(...corners.map(p=>p[1])),yMax=Math.max(...corners.map(p=>p[1]));
      const scale=Math.min((w-24)/(xMax-xMin),(h-26)/(yMax-yMin));
      const ox=(w-scale*(xMin+xMax))/2,oy=(h-scale*(yMin+yMax))/2;
      const project=(x,y,z=0)=>{const [u,v]=raw(x,y,z);return [ox+scale*u,oy+scale*v];};
      function polygon(points,fill,stroke=null,width=1) {
        ctx.beginPath(); points.forEach((p,i)=>{const xy=project(...p);if(!i)ctx.moveTo(...xy);else ctx.lineTo(...xy);});
        ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
      }
      function rect(x1,y1,x2,y2,z=0){return [[x1,y1,z],[x2,y1,z],[x2,y2,z],[x1,y2,z]];}
      function line(points,color,width,dash=[]) {
        ctx.beginPath();points.forEach((p,i)=>{const q=project(...p);if(i===0)ctx.moveTo(...q);else ctx.lineTo(...q);});
        ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]);
      }
      function dot(x,y,z,r,color,border) {
        const q=project(x,y,z);ctx.beginPath();ctx.arc(...q,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
        if(border){ctx.strokeStyle=border;ctx.lineWidth=1.5;ctx.stroke();}
      }
      function textAt(x,y,z,label,color,fontSize,dy=0,halo=true) {
        const q=project(x,y,z);ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.font='650 '+fontSize+'px system-ui, sans-serif';
        if(halo){ctx.lineWidth=3;ctx.strokeStyle='#fcfcf4';ctx.strokeText(label,q[0],q[1]+dy);}
        ctx.fillStyle=color;ctx.fillText(label,q[0],q[1]+dy);
      }
      const gradient=ctx.createLinearGradient(0,0,w,h);gradient.addColorStop(0,'#f5f6ee');gradient.addColorStop(1,'#e4ece2');
      ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
      if(is3D) polygon([[xmin,ymin,-.5],[xmax,ymin,-.5],[xmax,ymax,-.5],[xmin,ymax,-.5]],'#b7c5b5');
      polygon(rect(xmin,ymin,xmax,ymax),'#e3e5d7','#afbbab',1);
      const cc=graph.edges.filter(e=>e.kind==='corridor');
      for(const e of cc) line(e.polyline,'#d1cdbd',Math.max(6,scale*2.45));
      for(const e of cc) line(e.polyline,'#f8f4e7',Math.max(4,scale*2.1));
      const chosen=state.results.find(r=>r.room_id===state.room);
      const missing=new Set(chosen && !chosen.reachable ? [state.room] : []);
      const orderedRooms=[...rooms].sort((a,b)=>raw(...pos(a))[1]-raw(...pos(b))[1]);
      for(const room of orderedRooms) {
        const d=hinges.get(room.id), outward=Math.sign(room.y-d.y);
        const wall=d.y+outward*6, face=d.y, x1=room.x-2.74,x2=room.x+2.74;
        const fill=missing.has(room.id)?'#ecc9bf':room.id===state.room?'#c0e2d5':'#e3ddc9';
        polygon(rect(x1,wall,x2,face),fill,'#b1b2a3',1);
        if (is3D) {
          polygon([[x1,wall],[x2,wall],[x2,wall,1.25],[x1,wall,1.25]],missing.has(room.id)?'#d9aaa0':'#c7c6ae','#a3a895',.6);
          polygon([[x1,wall],[x1,face],[x1,face,.75],[x1,wall,1.25]],'#ccd0b9','#a3a895',.6);
          polygon(rect(room.x-.94,room.y+outward*1.1,room.x+.94,room.y+outward*2,.47),'#aa936e','#958061',.6);
        } else {
          line([[x1,face],[x1,wall],[x2,wall],[x2,face]],'#8a9682',Math.max(1,scale*.15));
          line([[x1,face],[d.x-.65,face]],'#8a9682',Math.max(1,scale*.15));
          line([[d.x+.65,face],[x2,face]],'#8a9682',Math.max(1,scale*.15));
        }
      }
      for(const e of graph.edges.filter(e=>e.kind==='door'))line(e.polyline,'#a5b4a5',Math.max(1.0,scale*.14));
      const pendingEdge=edges.get(state.pending);
      if (pendingEdge) line(pendingEdge.polyline,'#b16a19',Math.max(6,scale*.92),[4,3]);
      if(chosen?.path_edges.length) {
        const pts=[];
        chosen.path_edges.forEach((id,i)=>{
          const e=edges.get(id);
          const ordered=e.from===chosen.path_nodes[i]?e.polyline:[...e.polyline].reverse();
          (i?ordered.slice(1):ordered).forEach(([x,y])=>pts.push([x,y,.20]));
        });
        line(pts,'#f8fffa',Math.max(5.4,scale*.65));
        line(pts,'#007c6d',Math.max(2.4,scale*.34));
      }
      for(const id of state.closedEdges) {
        const e=edges.get(id);
        line(e.polyline.map(([x,y])=>[x,y,.24]),'#a64435',Math.max(2,scale*.28),[4,4]);
        const s=e.polyline[Math.floor((e.polyline.length-1)/2)],t=e.polyline[Math.ceil((e.polyline.length-1)/2)];
        textAt((s[0]+t[0])/2,(s[1]+t[1])/2,.3,'×','#a13529',Math.max(13,scale*1.35));
      }
      const font=Math.max(8,Math.min(13,scale*1.25));
      targets=[];
      for (const edge of cc) targets.push({id:edge.id,line:edge.polyline.map(([x,y])=>project(x,y)),rad:Math.max(5,scale*.9)});
      for (const edge of graph.edges.filter(e=>e.kind==='door')) {
        const hinge=nodes.get(edge.from), xy=project(hinge.x,hinge.y,.14);
        const size=Math.max(4,Math.min(10,scale*.76));
        ctx.fillStyle=state.closedEdges.has(edge.id)?'#a84438':'#f6e9cd';
        ctx.strokeStyle=state.pending===edge.id?'#b46412':'#78623d';
        ctx.lineWidth=state.pending===edge.id?2.5:1.3;
        ctx.fillRect(xy[0]-size/2,xy[1]-size/2,size,size);
        ctx.strokeRect(xy[0]-size/2,xy[1]-size/2,size,size);
        targets.push({id:edge.id,xy,rad:Math.max(6,scale*.95)});
      }
      for(const room of rooms) {
        const selected=room.id===state.room;
        const xy=project(room.x,room.y,.20);
        targets.push({id:room.id,room:true,xy,rad:Math.max(9,scale*1.6)});
        if(selected)dot(room.x,room.y,.22,Math.max(3.7,scale*.41),missing.has(room.id)?'#ae4936':'#096755','white');
        textAt(room.x,room.y,.2,room.id,missing.has(room.id)?'#922d23':'#324e44',font,selected?-font:0);
      }
      for(const node of exits) {
        const off=state.closedExits.has(node.id);
        if(state.pending===node.id)dot(node.x,node.y,.20,Math.max(8,scale*.83),'#f2cc87','#a96517');
        dot(node.x,node.y,.20,Math.max(4,scale*.48),off?'#a83b31':'#c68a33','white');
        textAt(node.x,node.y,.20,node.id.slice(2),off?'#9b372a':'#654611',font,-font-1);
        if(off)textAt(node.x,node.y,.22,'×','#fff',10,0,false);
        targets.push({id:node.id,xy:project(node.x,node.y,.20),rad:Math.max(10,scale*1.3)});
      }
    }
    function segmentDistance(x,y,[ax,ay],[bx,by]) {
      const dx=bx-ax,dy=by-ay;
      const ratio=Math.min(1,Math.max(0,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1)));
      return Math.hypot(x-ax-ratio*dx,y-ay-ratio*dy);
    }
    function pick(event) {
      const bounds=canvas.getBoundingClientRect(),x=event.clientX-bounds.left,y=event.clientY-bounds.top;
      const available=targets.filter(t=>current.room || t.room);
      const choices=available.map(t=>{
        const dist=t.xy?Math.hypot(t.xy[0]-x,t.xy[1]-y):Math.min(...t.line.slice(1).map((b,i)=>segmentDistance(x,y,t.line[i],b)));
        // Markers sit directly on a corridor's end. Give their visible centre priority.
        const score=t.xy && dist<=5 ? dist-6 : dist;
        return {target:t,dist,score};
      }).filter(hit=>hit.dist<=hit.target.rad).sort((a,b)=>a.score-b.score);
      const hit=choices[0]?.target;
      if(hit) (hit.room?selectRoom:selectElement)(hit.id);
    }
    let gesture=null;
    canvas.addEventListener('pointerdown',event=>{
      if(!event.isPrimary||event.button!==0){gesture=null;return;}
      gesture={id:event.pointerId,x:event.clientX,y:event.clientY};
    });
    canvas.addEventListener('pointermove',event=>{
      if(gesture?.id===event.pointerId && Math.hypot(event.clientX-gesture.x,event.clientY-gesture.y)>6)gesture=null;
    });
    canvas.addEventListener('pointercancel',()=>{gesture=null;});
    canvas.addEventListener('pointerup',event=>{
      if(gesture?.id===event.pointerId && Math.hypot(event.clientX-gesture.x,event.clientY-gesture.y)<=6)pick(event);
      gesture=null;
    });
    new ResizeObserver(()=>{if(current)paint(current);}).observe(canvas);
    return paint;
  }
  window.TeachingMap={create};
})();
