/**
 * @category Halfedge
 */
export class Stack<T> {
    private items: Array<T> = []

    /**
     * Add a new element at the end of the stack
     */
    push(element: T) { 
        this.items.push(element)
    }

    /**
     * Remove and return the last element
     */
    pop(): any {
        if (this.items.length === 0) {
            return undefined
        }
        return this.items.pop()
    }

    /**
     * Remove and return the first element
     */
    shift(): any {
        if (this.items.length === 0) {
            return undefined
        }
        return this.items.shift()
    }

    clear() {
        this.items = []
    }

    /**
     * Get the first element
     */
    get first() {
        return this.items.length === 0 ? undefined : this.items[0]
    }

    /**
     * Get the last element
     */
    get top() {
        return this.items.length === 0 ? undefined : this.items[this.items.length-1]
    }
    /**
     * Same as top()
     */
    get last() {
        return this.top
    }

    get isEmpty() { 
        return this.items.length === 0
    }

    get count() {
        return this.items.length
    }

    toString() {
        let str = ""
        for (var i = 0; i < this.items.length; i++) {
            str += this.items[i] + " "
        }
        return str
    }

    forEach( cb: (item: any, index: number) => any ) {
        return this.items.forEach(cb, this)
    }

    map( cb: (item: any, index: number) => Array<any> ) {
        return this.items.map(cb, this)
    }
}
