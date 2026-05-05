import { AppShell } from "./layouts/app-shell";
import { TooltipProvider } from "./components/ui/tooltip";
import { HomePage } from "./pages/home-page";

export function App() {
  return (
    <TooltipProvider>
      <AppShell>
        <HomePage />
      </AppShell>
    </TooltipProvider>
  );
}
