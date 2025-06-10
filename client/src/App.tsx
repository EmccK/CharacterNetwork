import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import PWAInstallButton from "./components/PWAInstallButton";
import { AppLayout } from "@/components/layout/app-layout";
import { ErrorBoundary } from "@/components/error-boundary";

import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import NovelsPage from "@/pages/novels-page";
import NovelDetail from "@/pages/novel-detail";
import NovelGenresPage from "@/pages/novel-genres-page";
import CharactersPage from "@/pages/characters-page";
import RelationshipsPage from "@/pages/relationships-page";
import AdminPanel from "@/pages/admin-panel";
import SettingsPage from "@/pages/settings-page";
import ImportBookPage from "@/pages/import-book-page";
import TimelinePage from "@/pages/timeline-page";

function Router() {
  return (
    <Switch>
      <Route path="/">
        <HomePage />
      </Route>
      <Route path="/auth">
        <AuthPage />
      </Route>
      <Route path="/novels">
        <NovelsPage />
      </Route>
      <Route path="/novels/:id">
        <NovelDetail />
      </Route>
      <Route path="/characters">
        <CharactersPage />
      </Route>
      <Route path="/relationships">
        <RelationshipsPage />
      </Route>
      <Route path="/novel-genres">
        <NovelGenresPage />
      </Route>
      <Route path="/admin">
        <AdminPanel />
      </Route>
      <Route path="/settings">
        <SettingsPage />
      </Route>
      <Route path="/import-book">
        <ImportBookPage />
      </Route>
      <Route path="/novels/:id/timeline">
        <TimelinePage />
      </Route>
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <PWAInstallButton />
          <AppLayout>
            <Router />
          </AppLayout>
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
