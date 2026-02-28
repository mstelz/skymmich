import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import EquipmentCatalog from "@/pages/equipment";
import NotFound from "@/pages/not-found";
import AdminPage from "./pages/admin";
import PlateSolvingPage from "./pages/plate-solving";
import SkyMapPage from "./pages/sky-map";
import LocationsPage from "./pages/locations";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/equipment" component={EquipmentCatalog} />
      <Route path="/plate-solving" component={PlateSolvingPage} />
      <Route path="/sky-map" component={SkyMapPage} />
      <Route path="/locations" component={LocationsPage} />
      <Route path="/admin" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="dark min-h-screen bg-background text-foreground">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
