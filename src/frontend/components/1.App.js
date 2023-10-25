import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route
} from "react-router-dom";
import Navbar from './Navbar';
import Home from './Home';
import Create from './Create';
import MyListedItems from './MyListedItems';
import MyPurchases from './MyPurchases';
import './App.css'; // Import your CSS file here

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<Create />} />
          <Route path="/my-listed-items" element={<MyListedItems />} />
          <Route path="/my-purchases" element={<MyPurchases />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
