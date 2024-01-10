import { Mesh } from 'three'

/**
 * Interface for an action than can undone and redone
 */
export abstract class Action {
    abstract do(): void
    abstract undo(): void
    abstract name(): string
    abstract serialize(): any
}

/**
 * Interface for executing an action parameterized in json (string)
 * and without any undo/redo
 */
export type executeAction = (
    mesh: Mesh,
    json: string,
    isAction: boolean,
) => boolean
