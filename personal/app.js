/* All selections belong to this page instance. */
(async () => {
  'use strict';
  const get = id => document.getElementById(id);
  try {
    const graph = location.protocol === 'file:' ? window.OFFLINE_TEACHING_FLOOR : await readFloor();
    async function readFloor() {
      const response = await fetch('./floor.json');
      if (!response.ok) throw Error('Could not load the floor data.');
      return response.json();
    }
    const rooms = graph.nodes.filter(n => n.kind === 'room').sort((a,b) => a.id.localeCompare(b.id));
    const exits = graph.nodes.filter(n => n.kind === 'exit');
    const doors = graph.edges.filter(e => e.kind === 'door');
    const corridors = graph.edges.filter(e => e.kind === 'corridor');
    const items = new Map([...exits, ...doors, ...corridors].map(item => [item.id, item]));
    const baseline = SampleRouting.run(graph);
    const state = {room:'', pending:'', results:baseline, closedEdges:new Set(), closedExits:new Set(), view:'2d', camera:0};
    const roomInput = get('room'), elementInput = get('element'), toggle = get('toggle');
    for (const room of rooms) roomInput.add(new Option(room.id + ' · ' + room.label, room.id));
    for (const [groupName, options] of [['Outdoor exits', exits], ['Corridors', corridors], ['Classroom doors', doors]]) {
      const group = document.createElement('optgroup');
      group.label = groupName;
      for (const item of options) group.append(new Option(item.label + ' · ' + item.id, item.id));
      elementInput.append(group);
    }
    const renderMap = TeachingMap.create(get('floor-map'), graph, chooseRoom, chooseItem);
    const exitLabel = id => items.get(id)?.label || '';
    const format = n => n.toLocaleString('en-GB', {maximumFractionDigits:2});
    function closures(id) { return items.get(id)?.kind === 'exit' ? state.closedExits : state.closedEdges; }
    function chooseRoom(id) {
      state.room = rooms.some(room => room.id === id) ? id : '';
      state.pending = '';
      roomInput.value = state.room;
      get('action-status').textContent = state.room ? 'Select a location to change its availability.' : 'Choose a starting room first.';
      update();
    }
    function chooseItem(id) {
      if (!state.room || (id && !items.has(id))) return;
      state.pending = id;
      get('action-status').textContent = id ? items.get(id).label + ' selected. Confirm the change to recalculate your route.' : 'Choose a location on the map or from the list.';
      update();
    }
    function recalculate(message) {
      state.results = SampleRouting.run(graph,{closed_edges:[...state.closedEdges], closed_exits:[...state.closedExits]});
      get('action-status').textContent = message;
      update();
    }
    function update() {
      const current = state.results.find(route => route.room_id === state.room);
      const base = baseline.find(route => route.room_id === state.room);
      const closed = [...state.closedEdges, ...state.closedExits];
      get('dest').textContent = !current ? 'Choose a room to see its nearest exit' : current.reachable ?
        state.room + ' → ' + exitLabel(current.endpoint_id) : state.room + ' · No reachable exit';
      get('distance').textContent = current?.reachable ? format(current.distance_m) : '—';
      get('units').textContent = current?.reachable ? 'm' : '';
      get('change').textContent = !current ? '' : !current.reachable ? 'No route is available with the current closures.' :
        closed.length ? '+' + format(current.distance_m-base.distance_m) + ' m · ' +
          (current.distance_m/base.distance_m).toFixed(2) + '× baseline distance' : 'All routes open';
      get('baseline').textContent = base ? 'Baseline walk to ' + exitLabel(base.endpoint_id) + ' · ' + format(base.distance_m) + ' m' : '';
      get('ties').textContent = current?.tied_endpoints.length > 1 ? 'Equally close exits · ' + current.tied_endpoints.map(exitLabel).join(', ') : '';
      get('v2').setAttribute('aria-pressed', String(state.view === '2d'));
      get('v3').setAttribute('aria-pressed', String(state.view === '3d'));
      get('rotate').hidden = state.view !== '3d';
      get('maphelp').textContent = state.room ? 'Tap a door, corridor or exit, then confirm below. Zoom in and drag to explore the plan.' : 'Tap a classroom on the plan or choose a starting room from the list.';
      elementInput.disabled = !state.room;
      elementInput.value = state.pending;
      toggle.disabled = !state.pending;
      toggle.textContent = state.pending && closures(state.pending).has(state.pending) ? 'Reopen location' : 'Close location';
      get('restore').disabled = !closed.length;
      get('chips').replaceChildren(...closed.map(id => {
        const button = document.createElement('button');
        button.textContent = items.get(id).label + ' ×';
        button.setAttribute('aria-label', 'Reopen ' + items.get(id).label);
        button.addEventListener('click', () => {
          closures(id).delete(id);
          recalculate(items.get(id).label + ' is open again.');
        });
        return button;
      }));
      const canvas = get('floor-map');
      canvas.setAttribute('aria-label', !current ? 'Fictional teaching floor. Choose a starting room.' : current.reachable ?
        state.room + ' to ' + exitLabel(current.endpoint_id) + ', ' + format(current.distance_m) + ' metres' :
        'No reachable exit from ' + state.room);
      renderMap(state);
    }
    roomInput.addEventListener('change', () => chooseRoom(roomInput.value));
    elementInput.addEventListener('change', () => chooseItem(elementInput.value));
    toggle.addEventListener('click', () => {
      if (!state.pending) return;
      const set = closures(state.pending), wasClosed = set.delete(state.pending);
      if (!wasClosed) set.add(state.pending);
      recalculate(items.get(state.pending).label + (wasClosed ? ' is open again.' : ' is closed.'));
    });
    get('restore').addEventListener('click', () => {
      state.closedEdges.clear(); state.closedExits.clear(); state.pending = '';
      recalculate('All locations are open again.');
    });
    for (const [button,view] of [['v2','2d'],['v3','3d']]) get(button).addEventListener('click', () => {
      state.view = view; update();
    });
    get('rotate').addEventListener('click', () => { state.camera = (state.camera + 1) % 4; update(); });
    get('zoom').addEventListener('click', () => {
      const viewport = get('viewport'), zoomed = viewport.classList.toggle('zoomed');
      get('zoom').textContent = zoomed ? 'Full floor' : 'Zoom in';
      get('zoom').setAttribute('aria-pressed', String(zoomed));
      viewport.scrollLeft = (viewport.scrollWidth-viewport.clientWidth)/2;
    });
    chooseRoom(new URL(location.href).searchParams.get('room'));
    get('work').setAttribute('aria-busy', 'false');
  } catch (error) {
    get('work').hidden = true;
    get('error').hidden = false;
    get('error').textContent = 'The floor data could not be loaded. Keep the exercise files together in one folder and refresh the page.';
    console.error(error);
  }
})();
