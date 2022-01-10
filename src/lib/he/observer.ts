
// TODO: remove this class
/**
 * @category Halfedge
 */
export class CombelObserver<COMBEL> {
    notifiedRemove(c: COMBEL) {
        /* filled by derived classes */
    }
}

// TODO: replace registerObserver/unregisterObserver argument by a function
/**
 * @category Halfedge
 */
export class CombelObservable<COMBEL> {
    private list_: Array<CombelObserver<COMBEL>> = []
  
    registerObserver(c: CombelObserver<COMBEL>) {
        this.list_.push(c)
    }
    unregisterObserver(c: CombelObserver<COMBEL>) {
        const index = this.list_.indexOf(c)
        if (index > -1) {
            this.list_.splice(index, 1)
        }
	}
    notifyRemove(c: COMBEL) {
        this.list_.forEach( item => item.notifiedRemove(c))
    }
}
