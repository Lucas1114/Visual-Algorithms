import { Navigate, Route, Routes } from 'react-router-dom';
import { ThemeToggle } from './components/ThemeToggle';
import { Home } from './pages/Home';
import { KmpPage } from './pages/kmp/KmpPage';
import { ManacherPage } from './pages/manacher/ManacherPage';
import { FloydPage } from './pages/floyd/FloydPage';
import { About } from './pages/About';

function App() {
  return (
    <>
      <ThemeToggle />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/kmp" element={<KmpPage />} />
        <Route path="/manacher" element={<ManacherPage />} />
        <Route path="/floyd" element={<FloydPage />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
