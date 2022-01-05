import { Box3, Object3D, Sphere } from "three"

/**
 * Get an idea of the point size and Raycaster threshold for given object.
 * This can used, for example, in
 * ```ts
 * const size = getSize(object, 3)
 * raycaster.params.Points.threshold        = value
 * (points.material as PointsMaterial).size = value
 * ```
 * @param o The object
 * @param percent The percent of the object radius. Default is 3%
 */
export function getSize(o: Object3D, percent=3) {
    const bbox = new Box3().setFromObject(o)
    const sphere = bbox.getBoundingSphere(new Sphere)
    return sphere.radius*percent/100
}
