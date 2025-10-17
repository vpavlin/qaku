import './App.css';
import Main from './pages/main';
import Attendee from './pages/attendee';
import {
  Route,
  Routes,
} from "react-router-dom";

import Settings from './components/settings';
import MainQA from './components/mainqa';
import { WakuContextProvider } from './hooks/useWaku';
import { useToastContext } from './hooks/useToast';



function App() {  
  const {toast} = useToastContext()

  return (
    <WakuContextProvider updateStatus={toast}>
    <div className="App">
      <Routes>
        {/* Attendee view - focused participation without sidebar */}
        <Route path='/a/:id/:password?' element={<Attendee />} />
        
        {/* Main admin/owner view with sidebar */}
        <Route path='/' element={<Main />}>
          <Route path='settings' element={<Settings />} />
          <Route path='q/:id/:password?' element={<MainQA />} />
          <Route path="" element={<MainQA />} />
        </Route>
      </Routes>
    </div>
    </WakuContextProvider>
  );
}

export default App;
