import './App.css'
import { MetricsPage } from './pages/MetricsPage'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';


function App() {


  return (
    <>
     <header>
      <h1>Pratikoul</h1>
      <p>Practical and hopefully cool</p>
     </header>
     <div className='mainContainer'>
        <Router>
          <Routes>
            <Route path="/" element={<h1>home</h1>} />
            <Route path="/metrics" element={<MetricsPage />} />
          </Routes>
        </Router>

     </div>
    </>
  )
}

export default App
