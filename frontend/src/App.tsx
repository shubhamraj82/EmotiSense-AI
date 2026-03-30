import { Route, Routes, useLocation } from "react-router-dom";
import HomePage from "./pages/HomePage";
import FormPages from "./pages/FormPages";
import InterviewSession from "./pages/InterviewSession";
import Login from "./components/login";
import LanguageSelectPage from "./pages/LanguageSelectPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import LenisScroll from "./components/lenis-scroll";

export default function App() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <Toaster />
      <LenisScroll />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/language-select"
          element={
            <ProtectedRoute>
              <LanguageSelectPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/setup"
          element={
            <ProtectedRoute>
              <FormPages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview"
          element={
            <ProtectedRoute>
              <InterviewSession />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}
