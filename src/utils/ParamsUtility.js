function ParamsUtility(value) {
    if (value.startsWith(':')) {
        value = value.slice(1);
    }
    return value;
}
export { ParamsUtility };
