import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RoleSelectPage } from './pages/RoleSelectPage';
import { DraftInputPage } from './pages/DraftInputPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { BuildGuidePage } from './pages/BuildGuidePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoleSelectPage />} />
        <Route path="/draft" element={<DraftInputPage />} />
        <Route path="/recommendations" element={<RecommendationsPage />} />
        <Route path="/build" element={<BuildGuidePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
