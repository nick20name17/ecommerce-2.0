import { isAxiosError } from "axios";

const FALLBACK_ERROR_MESSAGE = "Щось пішло не так";

export const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) {
        return error.message;
    }

    if (isAxiosError(error)) {
        return error.response?.data?.detail;
    }

    return FALLBACK_ERROR_MESSAGE;
};
