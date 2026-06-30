'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { applyActionCode } from 'firebase/auth';
import { auth } from '../../../lib/firebase/config';
import { useMemolandumStore } from '../../../store/useMemolandumStore';

export default function AuthActionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('İşleminiz gerçekleştiriliyor...');

  const mode = searchParams.get('mode');
  const actionCode = searchParams.get('oobCode');

  useEffect(() => {
    if (!mode || !actionCode) {
      setStatus('error');
      setMessage('Geçersiz veya eksik bağlantı.');
      return;
    }

    const handleVerifyEmail = async () => {
      try {
        await applyActionCode(auth, actionCode);
        
        if (auth.currentUser) {
          await auth.currentUser.reload();
          const store = useMemolandumStore.getState();
          store.setAuthUser(auth.currentUser);
        }

        setStatus('success');
        setMessage('E-posta adresiniz başarıyla onaylandı!');
        
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } catch (error) {
        console.error("Email verification error:", error);
        setStatus('error');
        if (error.code === 'auth/invalid-action-code') {
          setMessage('Bu doğrulama linki geçersiz veya daha önce kullanılmış.');
        } else {
          setMessage('Doğrulama sırasında bir hata oluştu. Lütfen tekrar deneyin.');
        }
      }
    };

    if (mode === 'verifyEmail') {
      handleVerifyEmail();
    } else {
      setStatus('error');
      setMessage('Desteklenmeyen işlem türü.');
    }
  }, [mode, actionCode, router]);

  return (
    <div className="min-h-screen bg-[#0b101a] flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
        
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500 mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-white mb-2">Lütfen Bekleyin</h2>
            <p className="text-gray-400">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Başarılı!</h2>
            <p className="text-gray-400 mb-6">{message}</p>
            <p className="text-sm text-cyan-500 animate-pulse">Ana sayfaya yönlendiriliyorsunuz...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Hata!</h2>
            <p className="text-gray-400 mb-6">{message}</p>
            <button
              onClick={() => router.push('/')}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-xl transition-colors"
            >
              Ana Sayfaya Dön
            </button>
          </>
        )}

      </div>
    </div>
  );
}
