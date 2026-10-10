import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { SessionProvider, useSessions } from "./auth/SessionContext";
import { LinkHandlerProvider, useLinkHandler } from "./links/LinkHandler";
import { clearBadge, onPushTap, refreshPushRegistration } from "./push/push";
import { AccountScreen } from "./screens/AccountScreen";
import { ClubLoginScreen, StartScreen, WelcomeScreen } from "./screens/AuthScreens";
import * as S from "./screens/ClubScreens";
import { MobileShell } from "./shell/MobileShell";

/** Notifications : un tap ouvre la destination avec le MÊME routeur que les liens ; badge remis à zéro à l'ouverture. */
function PushBridge() {
  const { handle } = useLinkHandler();
  const sessions = useSessions();
  useEffect(() => onPushTap((path) => void handle(path)), [handle]);
  useEffect(() => {
    void clearBadge();
    if (sessions) void refreshPushRegistration(Object.values(sessions.clubs));
    // Une fois par lancement (et à chaque nouveau club connecté).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions ? Object.keys(sessions.clubs).join(",") : null]);
  return null;
}

/**
 * Routes de l'app = chemins du site (`/public/{slug}/…`) : un Universal Link,
 * un lien email ou une notification ouvrent l'écran correspondant sans table
 * de correspondance. `/app/…` = écrans propres à l'app (bienvenue, connexion).
 */
export function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <LinkHandlerProvider>
          <PushBridge />
          <Routes>
            <Route path="/" element={<StartScreen />} />
            <Route path="/index.html" element={<StartScreen />} />
            <Route path="/app/bienvenue" element={<WelcomeScreen />} />
            <Route path="/app/connexion/:clubSlug" element={<ClubLoginScreen />} />
            <Route path="/public/:clubSlug" element={<MobileShell />}>
              <Route index element={<S.HomeScreen />} />
              <Route path="accueil" element={<S.HomeScreen />} />
              <Route path="planning" element={<S.PlanningScreen />} />
              <Route path="equipes" element={<S.TeamsScreen />} />
              <Route path="equipes/:teamId" element={<S.TeamScreen />} />
              <Route path="matchs" element={<S.MatchesScreen />} />
              <Route path="matchs/:matchId" element={<S.MatchScreen />} />
              <Route path="resultats" element={<S.ResultsScreen />} />
              <Route path="entrainements" element={<S.TrainingsScreen />} />
              <Route path="derogations" element={<S.DerogationsScreen />} />
              <Route path="derogations/nouvelle" element={<S.NewDerogationScreen />} />
              <Route path="derogations/:requestId" element={<S.DerogationScreen />} />
              <Route path="tables" element={<S.TablesScreen />} />
              <Route path="tables/classement" element={<S.TableLeaderboardScreen />} />
              <Route path="joueurs/:licencieId" element={<S.PlayerScreen />} />
              <Route path="compte" element={<AccountScreen />} />
              <Route path="*" element={<S.HomeScreen />} />
            </Route>
            <Route path="*" element={<StartScreen />} />
          </Routes>
        </LinkHandlerProvider>
      </SessionProvider>
    </BrowserRouter>
  );
}
