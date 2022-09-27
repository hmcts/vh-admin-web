//  TODO: Test
export function convertToNumberArray(array: string[]) {
    const numberArray: number[] = [];

    array.forEach(element => {
        numberArray.push(parseInt(element, 10));
    });

    return numberArray;
}
