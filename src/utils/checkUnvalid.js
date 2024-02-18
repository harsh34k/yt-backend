function checkUnvalid(value) {
    if (!(value === undefined) && !(value === null) && !(value === "")) {
        return value;
    }
    return false
}