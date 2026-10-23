import { type SubmitEvent, useState } from "react";
import { errorMessage } from "../utils/errorMessage";
import { useChangeDetails } from "./mutations/auth";
import { useAuth } from "./useAuth";

function detailsProblem(email: string, password: string, confirmation: string): string | null {
    if (email.trim() === "") {
        return "Enter the email address you want to log in with";
    }

    if (password.trim() === "") {
        return "Enter a new password";
    }

    if (password !== confirmation) {
        return "The passwords don't match. Type the same password in both fields.";
    }

    return null;
}

export function useChangeDetailsForm() {
    const { user } = useAuth();
    const changeDetails = useChangeDetails();
    const [email, setEmail] = useState(user?.email ?? "");
    const [password, setPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    async function submit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaved(false);

        const problem = detailsProblem(email, password, confirmation);
        if (problem !== null) {
            setError(problem);
            return;
        }

        setError(null);

        try {
            await changeDetails.mutateAsync({ email: email.trim(), password });
            setPassword("");
            setConfirmation("");
            setSaved(true);
        } catch (failure) {
            setError(errorMessage(failure, "Could not change your login details."));
        }
    }

    return {
        email,
        setEmail,
        password,
        setPassword,
        confirmation,
        setConfirmation,
        error,
        saved,
        saving: changeDetails.isPending,
        submit,
    };
}
