import { vec } from './vectors'

// See also https://github.com/vanruesc/math-ds/tree/master/src

const BBOX_FLATNESS_THRESHOLD = 1e-12

export class BBox {
    private min_ = [0,0,0]
    private max_ = [0,0,0]
    private empty_ = false

    constructor(p1?: vec.Vector3, p2?: vec.Vector3) {
        this.reset()
        //if (p1) this.grow(p1)
        //if (p2) this.grow(p2)
        if (p1 && p2) {
            for (let i=0; i<3; ++i) {
                const min = Math.min(p1[i], p2[i])
                const Max = Math.max(p1[i], p2[i])
                if (Math.abs(Max - min) >= BBOX_FLATNESS_THRESHOLD) {
                    vec.setCoord(this.min_, i, min)
                    vec.setCoord(this.max_, i, Max)
                } else {
                    vec.setCoord(this.min_, i, Max)
                    vec.setCoord(this.max_, i, Max)
                }
                if (Max < min)
                this.empty_ = true
            }
        }
    }
    reset() {
        this.empty_ = true
        vec.set(this.min_,  [1e32,  1e32,  1e32])
        vec.set(this.max_, [-1e32, -1e32, -1e32])
    }

    get empty() {return this.empty_}
    get min(): vec.Vector3 {return [...this.min_] as vec.Vector3}
    get max(): vec.Vector3 {return [...this.max_] as vec.Vector3}
    get xLength() {return this.max_[0] - this.min_[0]}
    get yLength() {return this.max_[1] - this.min_[1]}
    get zLength() {return this.max_[2] - this.min_[2]}
    get sizes() {return [this.xLength, this.yLength, this.zLength]}
    get center(): vec.Vector3 {
        let c = [...this.min_] as vec.Vector3
        vec.scale( vec.add(c, this.max_), 0.5 )
        return c
    }
    get radius(): number {
        return vec.norm(vec.create(this.min_, this.max_))/2
    }

    scale(s: number) {
        let r1 = vec.add( vec.scale(vec.create(this.center, this.min), s), this.center )
        let r2 = vec.add( vec.scale(vec.create(this.center, this.max), s), this.center )
        vec.set(this.min_, r1)
        vec.set(this.max_, r2)
    }

    grow(p: any) {
        this.empty_ = false
        for (let i = 0; i < 3; ++i) {
            if (p[i] < this.min_[i]) this.min_[i] = p[i]
            if (p[i] > this.max_[i]) this.max_[i] = p[i]
        }
    }

    /**
     * Check if a bbox or a Point (Vector3) is inside this (not strict)
     * @param param Either a BBox or a Vector3
     * @param tol The tolerence for the test
     */
    contains(param: any, tol = 0) : boolean {
        if (param instanceof BBox) {
            return (this.contains(param.min, tol) === true) && (this.contains(param.max, tol) === true)
        }

        const p = param.data // a Vector3
        for (let i = 0; i < 3; ++i) {
            if (p[i] < (this.min_[i] - tol) || p[i] > (this.max_[i] + tol)) {
                return false
            }
        }
        return true
    }

    /**
     * For compatibility
     * @deprecated
     * @see contains
     */
    inside(p: any, tol = 0): boolean {
        return this.contains(p, tol)
    }

    getIntersection(b: BBox): BBox {
        if (this.intersect(b) === false) {
          return new BBox()
        } 
    
        const new_min = [0,0,0] as vec.Vector3
        const new_max = [0,0,0] as vec.Vector3
    
        for (let i = 0; i<3; ++i) {
            if (this.min_[i] >= b.min_[i]) {
                new_min[i] = this.min_[i]
            } else {
                new_min[i] = b.min_[i]
            }
    
            if (this.max_[i] <= b.max_[i]) {
                new_max[i] = this.max_[i]
            } else {
                new_max[i] = b.max_[i]
            }
        }
        return new BBox(new_min, new_max)
    }
    
    
    intersect(b: BBox): boolean {
        let ok = true
        for (let i = 0; i<3; ++i) {
            ok = ok && (this.min_[i] <= b.max_[i] && b.min_[i] <= this.max_[i] )
        }
        return ok
    }
}

export function inflateBBox(bbox: BBox, flat_factor = 1.E-02): void {
    let change_box = false
    const new_min = bbox.min
    const new_max = bbox.max
    { 
        const rad = bbox.radius
        const delta_x = bbox.max[0] - bbox.min[0]
        const delta_y = bbox.max[1] - bbox.min[1]
        const delta_z = bbox.max[2] - bbox.min[2]
        const min_delta = rad * flat_factor
        const eps = min_delta / 2.
        if (delta_x < min_delta) {
            const mid_x = (bbox.max[0] + bbox.min[0])/2.
            new_min[0] = mid_x-eps
            new_max[0] = mid_x+eps
            change_box = true
        }
        if (delta_y < min_delta) {
            const mid_y = (bbox.max[1] + bbox.min[1])/2.
            new_min[1] = mid_y-eps
            new_max[1] = mid_y+eps
            change_box = true
        }
        if (delta_z < min_delta) {
            const mid_z = (bbox.max[2]+bbox.min[2])/2.
            new_min[2] = mid_z-eps
            new_max[2] = mid_z+eps
            change_box = true
        }
    }
    if (change_box === true) {
        bbox.reset()
        bbox.grow(new_min)
        bbox.grow(new_max)
    }
}
