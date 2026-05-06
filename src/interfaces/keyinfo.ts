import type { Collection } from "mongoose"

interface keyInfo {
    key: string,
    owner: string,
    history: Collection
}

export type {keyInfo}