import './App.css';
import Main from './pages/main';
import {
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import QA from './components/qa';
import { QakuContextProvider } from './hooks/useQaku';



function App() {  
  let { id } = useParams<"id">();

  return (
    <div className="App">
      <Routes>
        <Route path='/' element={<Main />}>
          <Route path='q/:id/:password?' element={<QA />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
