import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { AIAnalysisPage } from "../pages/AIAnalysisPage";
import { DashboardPage } from "../pages/DashboardPage";
import { JournalPage } from "../pages/JournalPage";
import { LoginPage } from "../pages/LoginPage";
import { SettingsPage } from "../pages/SettingsPage";
import { WeeklyAnalysisPage } from "../pages/WeeklyAnalysisPage";
import { ProtectedRoute } from "./ProtectedRoute";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/", element: <DashboardPage /> },
          { path: "/journal", element: <JournalPage /> },
          { path: "/ai-analysis", element: <AIAnalysisPage /> },
          { path: "/weekly-analysis", element: <WeeklyAnalysisPage /> },
          { path: "/settings", element: <SettingsPage /> },
        ],
      },
    ],
  },
]);
