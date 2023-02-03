/**
 * Remove empty query parameters from url by making them 'undefined', null will throw error.
 * **/
export function cleanQuery(parameter: any) {
    return (parameter === null || parameter === '' ? undefined : parameter);
}
