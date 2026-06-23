import { createRoot } from 'react-dom/client'
import { Chart as ChartJS, registerables } from 'chart.js'
import './index.css'
import App from './App.jsx'

ChartJS.register(...registerables)

createRoot(document.getElementById('root')).render(<App />)
