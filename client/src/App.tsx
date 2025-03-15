import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import NovelsPage from "@/pages/novels-page";
import NovelDetail from "@/pages/novel-detail";
import CharactersPage from "@/pages/characters-page";
import RelationshipsPage from "@/pages/relationships-page";
import AdminPanel from "@/pages/admin-panel";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/novels" component={NovelsPage} />
      <ProtectedRoute path="/novels/:id" component={NovelDetail} />
      <ProtectedRoute path="/characters" component={CharactersPage} />
      <ProtectedRoute path="/relationships" component={RelationshipsPage} />
      <ProtectedRoute path="/admin" component={AdminPanel} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
