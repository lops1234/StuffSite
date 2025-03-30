import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const pfxPath = process.env.VITE_PFX_PATH || '';
const passphrase = process.env.VITE_PFX_PASSPHRASE || '';

try {
    const certPath = path.resolve(__dirname, pfxPath);
    console.log('Certificate absolute path:', certPath);
    const cert = fs.readFileSync(certPath);
    console.log('Certificate loaded successfully, size:', cert.length);
} catch (error) {
    console.error('Error reading certificate:', error);
}


if (!pfxPath || !passphrase) {
    throw new Error('Environment variables VITE_PFX_PATH and VITE_PFX_PASSPHRASE must be set');
}

const certPath = pfxPath.startsWith('/') ? pfxPath : path.resolve(__dirname, pfxPath);
console.log('Using certificate path:', certPath);
console.log('Is Docker environment:', !!process.env.DOCKER_ENVIRONMENT);

export default defineConfig({
    plugins: [react()],
    server: {
        https: {
            pfx: fs.readFileSync(certPath),
            passphrase: passphrase
        },
        port: 5173,
        strictPort: true, // This prevents automatic port switching
        host: '0.0.0.0' 
    },

    define: {
        'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL),
    },
})
