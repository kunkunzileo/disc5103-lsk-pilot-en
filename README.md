# BIM-Based Campus Evacuation Resilience and Interactive 2D/3D Web Rerouting Prototype

English edition · DISC 5103 · Group 4 · HKUST Lee Shau Kee Business Building

[Open the LSK ground-floor map](https://kunkunzileo.github.io/disc5103-lsk-pilot-en/)

Select a room on the full-floor plan to zoom to its walking route. At each of the five starting points, the first line leads to the closest available exit among the walks checked for that room. Tap the coloured line to mark a location, or tap the selected exit to mark it unavailable. The browser immediately compares the remaining checked routes and displays the new exit, walking distance and change. Clearing the mark restores the initial route. The **Full plan** button returns to the overview. Each phone runs its own simulation.

| Starting point | All reviewed routes available | Initial exit marked unavailable | Extra walk |
| --- | --- | --- | ---: |
| G041 | campus-side vestibule · 27.09 m | opposite vestibule · 31.36 m | +4.26 m |
| G042 | opposite vestibule · 27.72 m | campus-side vestibule · 29.98 m | +2.26 m |
| G005 | opposite vestibule · 21.68 m | campus-side vestibule · 33.69 m | +12.01 m |
| G003 | opposite vestibule · 18.44 m | Door 4 · 28.50 m | +10.06 m |
| Pacific Coffee | Door 4 · 17.28 m | opposite vestibule · 36.76 m | +19.48 m |

Lengths follow walking polylines from the room origin to the outdoor threshold. The G003 and Pacific Coffee cases passed 702 fixed-element intersection checks in the Revit working model. The group confirmed ordinary visitor access along the café approach to Door 4. For G003 and Pacific Coffee, each initial walk is shorter than the straight-line distance to any of the other four registered exit groups. This confirms which of the five groups is closest at baseline. The comparison covers the reviewed routes for each origin. If a mark also affects every reviewed alternative, the interface reports that another route still needs checking. Independent on-site distance measurements remain pending.

**G005** is a teaching recording venue with two internal doors. Marking the current room door switches the walk to the other room door (30.80 m, +9.11 m). Distance changes use unrounded lengths. Marking the outdoor exit rules out every reviewed walk to that exit group, including walks that start through the other room door. The 8 verified G005 walks passed 846 fixed-element intersection checks. A straight-line lower-bound check against all five registered exit groups confirms the closest group both initially and when the initial group is closed.

### The two discussion rooms

The Revit recheck for **G041** and **G042** covers ten walking polylines to two vestibules and Door 4. Distances include the walk from the room origin to the outdoor threshold. All 1,359 checks against fixed model elements passed. Door 3 is recorded as an exterior door. A continuous public indoor walk to it from these rooms has not been verified.

All five rooms passed map-tap tests at phone and desktop widths (320, 390 and 1,120 pixels). The tests selected rooms, marked route points and exits, and restored the initial walks.

### Fictional 2D/3D exercise

The separate teaching floor has 18 fictional rooms. Select a room, simulate a closure and switch between 2D and 3D to compare the route and distance. [Open the teaching exercise](https://kunkunzileo.github.io/disc5103-lsk-pilot-en/personal/index.html).

### Run locally

Download the repository and open `index.html`. Keep the `personal` folder alongside it for the 2D/3D exercise.
