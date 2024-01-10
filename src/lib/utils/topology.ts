import { BufferAttribute } from 'three'

export function getAdjacentFaces(
    index: BufferAttribute,
    v1: number,
    v2: number,
) {
    const array = index.array
    const faces = []

    // Find the 2 adjacent faces
    for (let i = 0; i < array.length; i += 3) {
        const I = array[i] // vertex 1
        const J = array[i + 1] // vertex 2
        const K = array[i + 2] // vertex 3
        if (I === J || I === K || J === K) continue // grrrr, sometime topology is bad
        const contains = (I) => I === v1 || I === v2
        if (contains(I) && contains(J)) faces.push(i)
        if (contains(J) && contains(K)) faces.push(i)
        if (contains(K) && contains(I)) faces.push(i)
    }

    return faces
}
