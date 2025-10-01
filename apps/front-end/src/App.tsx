import './App.css'
import { MetricsPage } from './pages/MetricsPage'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import AppLayout from './domains/layout/components/Layout';



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route path="/" element={<h1>home</h1>} />
          <Route path="/metrics" element={<MetricsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App
