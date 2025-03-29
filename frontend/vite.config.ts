import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const pfxPath = process.env.VITE_PFX_PATH || '';
const passphrase = process.env.VITE_PFX_PASSPHRASE || '';

if (!pfxPath || !passphrase) {
    throw new Error('Environment variables VITE_PFX_PATH and VITE_PFX_PASSPHRASE must be set');
}

export default defineConfig({
    plugins: [react()],
    server: {
        https: {
            pfx: fs.readFileSync(path.resolve(__dirname, pfxPath)),
            passphrase: passphrase
        },
    },
    define: {
        'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL),
    },
})
