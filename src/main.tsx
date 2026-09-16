import { createRoot } from 'react-dom/client';
import '@fontsource-variable/archivo/wdth.css';
import '@fontsource/instrument-serif';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/instrument-sans';
import '@fontsource-variable/geist-mono';
import 'lenis/dist/lenis.css';
import './styles.css';
import './demand.css';
import './business.css';
import App from './App';

createRoot(document.getElementById('root')!).render(<App />);
