import { Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import FormPages from './pages/FormPages';
import InterviewSession from './pages/InterviewSession';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/setup" element={<FormPages />} />
      <Route path="/interview" element={<InterviewSession />} />
    </Routes>
  );
}
