import { Tool, ToolParameters } from "./Tool"

type ToolCreator = (params: ToolParameters) => Tool

export class ToolFactory {
    private static _map: Map<string, ToolCreator> = new Map

    static register(name: string, creator: ToolCreator) {
        ToolFactory._map.set(name, creator)
    }

    static get(name: string, params: ToolParameters): Tool {
        const creator = ToolFactory._map.get(name)
        if (creator) {
            return creator(params)
        }
        return undefined
    }
}
