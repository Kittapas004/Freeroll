'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
    const [countdown, setCountdown] = useState(10);
    const router = useRouter();

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);

        if (countdown === 0) {
            clearInterval(timer);
            router.push("/dashboard");
        }

        return () => clearInterval(timer);
    }, [countdown, router]);

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-2xl font-semibold text-red-500">You are not authorized to access this page.</h1>
            <p className="mt-4 text-lg">Redirecting to the dashboard in {countdown} seconds...</p>
        </div>
    );
}