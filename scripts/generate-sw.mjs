// scripts/generate-sw.mjs

import esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// .env.local 
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase config
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};


try {
    await esbuild.build({
        entryPoints: [path.join(__dirname, 'firebase-messaging-sw-template.js')],
        outfile: path.join(__dirname, '../public/firebase-messaging-sw.js'),
        bundle: true, 
        platform: 'browser',
        format: 'iife', 
        define: {
            'SCRIPT_REPLACE_FIREBASE_CONFIG': JSON.stringify(firebaseConfig),
        },
    });
    console.log('✅ Service worker bundled successfully at public/firebase-messaging-sw.js');
} catch (e) {
    console.error('❌ Service worker bundling failed:', e);
    process.exit(1);
}