'use client';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export function ToastViewport() {
    return (
        <ToastContainer
            position="top-right"
            autoClose={5000}
            newestOnTop
            closeOnClick
            pauseOnFocusLoss={false}
            draggable
            pauseOnHover
            theme="dark"
        />
    );
}
