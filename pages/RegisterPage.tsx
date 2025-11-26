

import React, { useState } from 'react';
import { Logo } from '../components/Logo';
import { Icon } from '../components/Icon';
import { auth, db } from '../services/firebaseConfig';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';


interface RegisterPageProps {
  onRegisterSuccess: () => void;
  onSwitchToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onRegisterSuccess, onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<React.ReactNode>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres.');
        setIsLoading(false);
        return;
    }
    
    let user = null; // Variable to hold the created user for potential rollback

    try {
        // 1. Create the user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        user = userCredential.user;

        // 2. Create the user's profile document in Firestore
        // If this fails, the catch block will handle the rollback.
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            email: user.email,
            name: name,
            createdAt: serverTimestamp(),
            isPremium: false,
            role: 'hairstylist',
            trialStartedAt: serverTimestamp() // Start the 48h trial
        });

        console.log("Registro bem-sucedido e perfil criado! Usuário ID:", user.uid);
        
        // onAuthStateChanged in AuthWrapper will handle the redirect.
        onRegisterSuccess();

    } catch (err: any) {
        console.error("Erro no processo de registro:", err);
        
        // ROLLBACK: If the user was created in Auth but Firestore failed, delete the user.
        if (user) {
            try {
                await deleteUser(user);
                console.log("Rollback bem-sucedido: Usuário órfão deletado do Auth.");
            } catch (deleteError) {
                console.error("FALHA CRÍTICA NO ROLLBACK: Um usuário órfão pode existir.", deleteError);
                // Inform the developer of this critical state.
                setError("Erro crítico ao registrar. Contate o suporte.");
                setIsLoading(false);
                return;
            }
        }
        
        let errorMessage: React.ReactNode = 'Ocorreu um erro ao criar a conta.';
        
        switch (err.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'Este e-mail já está cadastrado. Tente fazer login.';
                break;
            case 'auth/weak-password':
                errorMessage = 'A senha é muito fraca. Use pelo menos 6 caracteres.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'O formato do e-mail é inválido.';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Falha na conexão. Verifique sua internet.';
                break;
            case 'auth/operation-not-allowed':
                errorMessage = 'O registro por e-mail/senha não está habilitado.';
                break;
            case 'auth/configuration-not-found':
                const firebaseConsoleUrl = "https://console.firebase.google.com/project/engenharia-de-cortes-5d/authentication/providers";
                errorMessage = (
                    <span>
                        Erro de config: Login por E-mail/Senha desativado. 
                        <a href={firebaseConsoleUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-emerald-300 ml-1">
                            Clique aqui para ativar.
                        </a>
                    </span>
                );
                break;
            default:
                // This will catch Firestore errors (which don't have a 'code') or other Auth errors.
                errorMessage = 'Falha ao salvar o perfil do usuário. Por favor, tente novamente.';
                break;
        }
        
        setError(errorMessage);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Logo className="w-24 h-24" />
          <h1 className="text-3xl font-light tracking-wider mt-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500">Crie sua Conta</span>
          </h1>
          <p className="text-gray-400 mt-2">Comece sua jornada na barbearia do futuro.</p>
        </div>

        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl shadow-emerald-500/10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300">Nome Completo</label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

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

            <div>
              <label htmlFor="password"className="block text-sm font-medium text-gray-300">Senha</label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={isPasswordVisible ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                 <button
                  type="button"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-emerald-300"
                  aria-label={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  <Icon name={isPasswordVisible ? 'eye-slash' : 'eye'} className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Mínimo de 6 caracteres</p>
            </div>

            {error && <div className="text-red-400 text-sm text-center font-medium bg-red-900/20 p-3 rounded-md">{error}</div>}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 transition-colors"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Criando...</span>
                  </>
                ) : (
                  'Criar Conta'
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 text-center text-sm text-gray-400">
          <p>
            Já tem uma conta?{' '}
            <button onClick={onSwitchToLogin} className="font-medium text-emerald-400 hover:text-emerald-300">
              Faça login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};