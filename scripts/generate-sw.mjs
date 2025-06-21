// scripts/generate-sw.mjs

import esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// .env.local 파일 로드
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase 구성 객체 생성 (esbuild의 'define' 옵션으로 주입될 것임)
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// esbuild를 사용하여 서비스 워커 템플릿을 번들링
try {
    await esbuild.build({
        entryPoints: [path.join(__dirname, 'firebase-messaging-sw-template.js')],
        outfile: path.join(__dirname, '../public/firebase-messaging-sw.js'),
        bundle: true, // 이게 핵심: 모든 import를 하나의 파일로 합칩니다.
        platform: 'browser',
        format: 'iife', // 브라우저에서 즉시 실행 가능한 포맷
        define: {
            // 템플릿 파일 내에서 process.env.FIREBASE_CONFIG를 사용할 수 있도록 값을 주입합니다.
            'process.env.FIREBASE_CONFIG': JSON.stringify(firebaseConfig),
        },
    });
    console.log('✅ Service worker bundled successfully at public/firebase-messaging-sw.js');
} catch (e) {
    console.error('❌ Service worker bundling failed:', e);
    process.exit(1);
}