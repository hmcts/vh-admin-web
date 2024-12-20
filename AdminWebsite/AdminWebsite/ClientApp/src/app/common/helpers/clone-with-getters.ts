export function cloneWithGetters<T extends object>(obj: T): T {
    return Object.defineProperties({}, Object.getOwnPropertyDescriptors(obj)) as T;
}
