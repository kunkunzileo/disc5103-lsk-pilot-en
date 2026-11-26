/* Dijkstra on the independent, undirected teaching graph. Distances are metres. */
((scope) => {
  'use strict';
  const cmp=(a,b)=>a<b?-1:a>b?1:0;
  function run(graph, {closed_edges=[],closed_exits=[]}={}) {
    if (graph.fictional !== true || graph.directed !== false || graph.units !== 'm')
      throw new Error('Expected an undirected teaching graph in metres.');
    const skipEdges=new Set(closed_edges), skipExits=new Set(closed_exits);
    const adj=new Map(graph.nodes.map(n=>[n.id,[]]));
    if (adj.size!==graph.nodes.length) throw new Error('Duplicate node ID');
    for (const e of graph.edges) {
      if (!adj.has(e.from)||!adj.has(e.to)||!Number.isFinite(e.length_m)||e.length_m<=0)
        throw new Error('Invalid edge '+e.id);
      if (skipEdges.has(e.id)||skipExits.has(e.from)||skipExits.has(e.to)) continue;
      adj.get(e.from).push({to:e.to,id:e.id,m:e.length_m});
      adj.get(e.to).push({to:e.from,id:e.id,m:e.length_m});
    }
    const exits=graph.nodes.filter(n=>n.kind==='exit'&&!skipExits.has(n.id)).map(n=>n.id).sort(cmp);
    return graph.nodes.filter(n=>n.kind==='room').map(origin=>{
      const best=new Map([[origin.id,{m:0,key:'',prev:null,edge:null}]]);
      const done=new Set();
      for (;;) {
        let next=null;
        for (const [id,item] of best) {
          if (done.has(id)) continue;
          if (!next || item.m<next.m || (item.m===next.m && cmp(item.key,next.key)<0)) next={id,...item};
        }
        if (!next) break;
        done.add(next.id);
        for (const edge of adj.get(next.id)) {
          if (done.has(edge.to)) continue;
          const m=next.m+edge.m, key=next.key+'/'+edge.id, old=best.get(edge.to);
          if (!old || m<old.m || (m===old.m && cmp(key,old.key)<0))
            best.set(edge.to,{m,key,prev:next.id,edge:edge.id});
        }
      }
      const distance=Math.min(...exits.map(id=>best.get(id)?.m??Infinity));
      const tied=Number.isFinite(distance)?exits.filter(id=>best.get(id)?.m===distance):[];
      const endpoint=tied[0]??null, path_nodes=[],path_edges=[];
      for (let id=endpoint;id!==null;) {
        path_nodes.unshift(id);
        const step=best.get(id);
        if (step.edge!==null) path_edges.unshift(step.edge);
        id=step.prev;
      }
      return {room_id:origin.id,reachable:endpoint!==null,endpoint_id:endpoint,
        distance_m:endpoint===null?null:distance,path_nodes,path_edges,tied_endpoints:tied};
    });
  }
  const api={run};
  if (typeof module!=='undefined' && module.exports) module.exports=api;
  scope.SampleRouting=api;
})(globalThis);
