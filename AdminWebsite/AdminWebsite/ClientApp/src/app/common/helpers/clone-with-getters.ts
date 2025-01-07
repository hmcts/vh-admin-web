import { cloneDeep } from 'lodash';

export function cloneWithGetters<T extends object>(obj: T): T {
    return cloneDeep(obj);
}
