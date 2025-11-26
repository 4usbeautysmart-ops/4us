
import React, { useState } from 'react';
import { auth } from '../services/firebaseConfig';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Logo } from '../components/Logo';

interface ForgotPasswordPageProps {
  onSwitchToLogin: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (!email) {
      setError('Por favor, insira seu e-mail.');
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Se uma conta com este e-mail existir, um link de redefinição de senha foi enviado.');
    } catch (err: any) {
      console.error("Password reset error:", err);
      if (err.code === 'auth/user-not-found') {
         // For security, we might want to show the same success message, but for UX we can be vague
         setMessage('Se uma conta com este e-mail existir, um link de redefinição de senha foi enviado.');
      } else if (err.code === 'auth/invalid-email') {
         setError('Formato de e-mail inválido.');
      } else {
         setError('Ocorreu um erro ao tentar enviar o e-mail. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Logo className="w-24 h-24" />
          <h1 className="text-3xl font-light tracking-wider mt-4 text-center">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500">Recuperar Senha</span>
          </h1>
          <p className="text-gray-400 mt-2 text-center">Insira seu e-mail para receber o link de recuperação.</p>
        </div>

        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl shadow-emerald-500/10">
          {message ? (
            <div className="text-center">
                <p className="text-emerald-300 mb-4">{message}</p>
                 <button onClick={onSwitchToLogin} className="w-full py-3 px-4 rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors">
                    Voltar para Login
                </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {error && <p className="text-red-400 text-sm text-center">{error}</p>}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 transition-colors"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Enviando...</span>
                    </>
                  ) : (
                    'Enviar Link de Recuperação'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="mt-8 text-center text-sm text-gray-400">
            <button onClick={onSwitchToLogin} className="font-medium text-emerald-400 hover:text-emerald-300">
              Lembrou a senha? Faça login
            </button>
        </div>
      </div>
    </div>
  );
};
