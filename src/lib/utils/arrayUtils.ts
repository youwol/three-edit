
export type TypedArray =
    | Int8Array
    | Uint8Array
    | Uint8ClampedArray
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | Float32Array
    | Float64Array

export function cloneArray(array: TypedArray | number[]) {
    if (Array.isArray(array)) {
        return [...array]
    }
    return array.slice()
}

// From https://stackoverflow.com/a/32233690
export function splice(arr: TypedArray | Array<number>, starting: number, deleteCount: number): TypedArray | Array<number> {
    if (arguments.length === 1) {
      return arr
    }

    if (Array.isArray(arr)) {
        arr.splice(starting, deleteCount)
        return arr
    }

    starting = Math.max(starting, 0)
    deleteCount = Math.max(deleteCount, 0)
    const elements = []

    const newSize = arr.length - deleteCount + elements.length
    const splicedArray = cloneTA(arr, newSize)
  
    splicedArray.set(arr.subarray(0, starting))
    splicedArray.set(elements, starting)
    splicedArray.set(arr.subarray(starting + deleteCount), starting + elements.length)

    return splicedArray
}

// ------------ PRIVATE -------------

function cloneTA(array: TypedArray, size: number): TypedArray {
    if (array instanceof Int8Array)         return new Int8Array(size)
    if (array instanceof Uint8Array)        return new Uint8Array(size)
    if (array instanceof Uint8ClampedArray) return new Uint8ClampedArray(size)
    if (array instanceof Int16Array)        return new Int16Array(size)
    if (array instanceof Uint16Array)       return new Uint16Array(size)
    if (array instanceof Int32Array)        return new Int32Array(size)
    if (array instanceof Uint32Array)       return new Uint32Array(size)
    if (array instanceof Float32Array)      return new Float32Array(size)
    if (array instanceof Float64Array)      return new Float64Array(size)
    return undefined
}
