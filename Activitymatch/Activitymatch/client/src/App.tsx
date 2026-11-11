import { useEffect } from "react";
import { useLanguage } from "@/lib/i18n";
import { LanguageSwitch } from "@/components/language-switch";
import EmailAction from "@/pages/email-action";
import ManageListing from "@/pages/manage-listing";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import CreateListing from "@/pages/create-listing";
import ListingDetail from "@/pages/listing-detail";
import Admin from "@/pages/admin";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/create" component={CreateListing} />
      <Route path="/listing/:id" component={ListingDetail} />
      <Route path="/email-action" component={EmailAction} />
      <Route path="/manage/:id" component={ManageListing} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const language=useLanguage();
  useEffect(()=>{
    document.documentElement.lang=language;
    document.title=language==="en"?"ActivityMatch – Find people for activities":"ActivityMatch – Finde Leute für gemeinsame Aktivitäten";
  },[language]);
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <LanguageSwitch />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
