export const provide = (type, value) => {
    return { provide: type, useValue: value };
};
