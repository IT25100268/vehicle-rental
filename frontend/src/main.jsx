import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import { getApiBaseUrl } from './api/apiConfig.js'
import './index.css'
import App from './App.jsx'

axios.defaults.baseURL = getApiBaseUrl()
axios.defaults.headers.post['Content-Type'] = 'application/json'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
