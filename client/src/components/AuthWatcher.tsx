import { useEffect } from "react";
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
    exp: number;
    role: "admin" | "worker" | "customer";
}

export default function AuthWatcher() {

    useEffect(() => {

        const interval = setInterval(() => {

            const token = localStorage.getItem("token");

            if (!token) return;

            try {

                const decoded = jwtDecode<JwtPayload>(token);

                if (decoded.exp * 1000 < Date.now()) {
                    const role = decoded.role;

                    localStorage.clear();

                    window.location.href = `/login/${role}`;
                }

            } catch {
                localStorage.clear();
                window.location.href = "/login";
            }

        }, 1000);

        return () => clearInterval(interval);

    }, []);

    return null;
}