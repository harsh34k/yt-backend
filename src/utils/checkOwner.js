import { ApiError } from "./ApiError.js";

function checkOwner(value, req) {
    if (!value) {
        throw new ApiError(404, "Tweet not found");
    }
    if (value.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, 'You do not have permission to edit this comment');
    }
    return true;
}
export { checkOwner }