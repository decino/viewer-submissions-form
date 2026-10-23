import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import "@fontsource/jersey-10";
import "@fontsource/chakra-petch/400.css";
import "@fontsource/chakra-petch/600.css";
import App from "./App";
import { queryClient } from "./api/queryClient";
import { RealtimeSync } from "./api/realtime/sync/RealtimeSync";
import { RootErrorBoundary } from "./components/RootErrorBoundary/RootErrorBoundary";
import { WadFileProvider } from "./context/WadFileContext";
import "./styles/variables.css";
import "./styles/global.css";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <RootErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <WadFileProvider>
                    <RealtimeSync />
                    <App />
                </WadFileProvider>
            </QueryClientProvider>
        </RootErrorBoundary>
    </StrictMode>,
);
