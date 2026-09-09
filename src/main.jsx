import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// StrictMode di-produksi double-invoke effect & interaksi profiler React
// DevTools, yang memicu error "Cannot read properties of undefined (reading
// 'startTime')" berulang di console (live preview / development).
// Layanan ini (Kebunku) mengandalkan side-effect tunggal — StrictMode tidak
// menambah nilai di sini, jadi dilepas agar console bersih.
createRoot(document.getElementById('root')).render(
  <App />,
)
