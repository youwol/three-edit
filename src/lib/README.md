# Main design

## [Controler](./controlers/Controler.ts)

Allows to control the camera using a specific user-defined controler (`Orbit`, `Trackball`...)

## [Modifier](./modifiers/Modifier.ts)

Allows to modify gloablly or locally the geometry or topology of a given picked object:

-   Globally:

    -   translate
    -   scale
    -   rotate
    -   ffd
    -   ...

-   locally:
    -   move-vertex/selection
    -   move face/selection
    -   delete vertex/selection
    -   delete face/selection
    -   fill hole
    -   flip-edge
    -   lasso select vertices/faces
    -   ruller (see [this-link](https://github.com/bytezeroseven/GLB-Viewer)) and also using [Text2D](https://github.com/gamestdio/three-text2d)
    -   ...

## [Action](./actions/Action.ts)

When a `Modifier` modifies an object, it sends a corresponding action which can be done (`do`) or undone (`undo`)

# Raycast Design

When picking an object, it is the main selected object from the [Modifier](./modifiers/Modifier.ts) which will be modified.

According to the given selected [Modifier](./modifiers/Modifier.ts), local or global modifications will be done.

# See

-   [AutoDesk](https://adndevblog.typepad.com/cloud_and_mobile/2016/07/rotate-component-control-for-the-viewer.html)

-   Own Trackball control: http://projects.defmech.com/ThreeJSObjectRotationWithQuaternion/

# Visualization

-   [Edges according to a threshold](https://github.com/bytezeroseven/THREE.RegionGeometry)
-   [Viewer à la AutoDesk](https://github.com/bytezeroseven/GLB-Viewer)
