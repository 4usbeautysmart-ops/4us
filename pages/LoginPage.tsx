import React, { useState } from 'react';
import { Logo } from '../components/Logo';
import { Icon } from '../components/Icon';
import { auth } from '../services/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';

interface LoginPageProps {
  onLoginSuccess: () => void;
  onAdminLogin: () => void;
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onAdminLogin, onSwitchToRegister, onSwitchToForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<React.ReactNode>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
        setError('Preencha ambos os campos.');
        return;
    }

    setIsLoading(true);

    // Admin bypass: Se o email contiver "admin", permite o login com qualquer senha.
    if (email.toLowerCase().includes('admin')) {
        console.log("Acesso de administrador concedido.");
        onAdminLogin();
        setIsLoading(false);
        return;
    }
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Login de sucesso! Usuário:", userCredential.user.uid);
      onLoginSuccess();
    } catch (firebaseError: any) {
      console.error("Erro no login:", firebaseError.code);
      
      let msg: React.ReactNode = 'Ocorreu um erro ao tentar conectar.';

      if (firebaseError.code === 'auth/invalid-credential') {
        msg = 'Email ou senha inválidos.';
      } else if (firebaseError.code === 'auth/too-many-requests') {
        msg = 'Muitas tentativas falhas. Acesso bloqueado temporariamente.';
      } else if (firebaseError.code === 'auth/network-request-failed') {
        msg = 'Erro de rede. Verifique sua conexão com a internet.';
      } else if (firebaseError.code === 'auth/invalid-email') {
        msg = 'Formato de email inválido.';
      } else if (firebaseError.code === 'auth/configuration-not-found') {
        const firebaseConsoleUrl = "https://console.firebase.google.com/project/engenharia-de-cortes-5d/authentication/providers";
        msg = (
            <span>
                Erro de config: Login por E-mail/Senha desativado. 
                <a href={firebaseConsoleUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-emerald-300 ml-1">
                    Clique aqui para ativar.
                </a>
            </span>
        );
      } else if (firebaseError.code) {
        msg = `Erro: ${firebaseError.code}`;
      }
      
      setError(msg);
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
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500">Engenharia de Cortes 5D</span>
          </h1>
          <p className="text-gray-400 mt-2">Acesse sua conta para continuar</p>
        </div>

        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl shadow-emerald-500/10">
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
                  placeholder="Email do Hairstylist"
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
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha"
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
                    <span>Entrando...</span>
                    </>
                ) : (
                    'Entrar'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm">
            <button onClick={onSwitchToForgotPassword} className="font-medium text-emerald-400 hover:text-emerald-300">
              Esqueceu sua senha?
            </button>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-400">
          <p>
            Não tem uma conta?{' '}
            <button onClick={onSwitchToRegister} className="font-medium text-emerald-400 hover:text-emerald-300">
              Crie uma agora
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};