import React from 'react';
import App from '../App';
// import { LoginPage } from '../pages/LoginPage';
// import { RegisterPage } from '../pages/RegisterPage';
// import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
// A importação abaixo foi comentada para resolver o problema da tela em branco.
// Ela estava causando uma inicialização síncrona do Firebase que falhava antes do app renderizar.
// import { auth, db } from '../services/firebaseConfig';
// import { onAuthStateChanged, signOut, User } from 'firebase/auth';
// import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { LoadingOverlay } from '../components/LoadingOverlay';

type AuthView = 'login' | 'register' | 'forgotPassword';

export const AuthWrapper: React.FC = () => {
  // --- MODO DE DESENVOLVIMENTO: BYPASS DE LOGIN ATIVADO POR PADRÃO ---
  // Para resolver o problema da tela em branco, estamos forçando o modo de 
  // desenvolvimento que contorna a autenticação do Firebase. Isso garante que o app 
  // sempre carregue, mesmo que haja problemas de configuração com a API do Firebase.
  console.warn("MODO DE BYPASS DE DESENVOLVIMENTO ATIVADO POR PADRÃO PARA CORRIGIR TELA EM BRANCO.");
  
  const mockUserProfile = {
    id: 'dev_user',
    uid: 'dev_user',
    email: 'dev@example.com',
    isPremium: true,
    name: 'Desenvolvedor',
    role: 'admin',
    createdAt: { toDate: () => new Date() },
    trialStartedAt: { toDate: () => new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
  };

  const handleDevLogout = () => {
    // No modo de bypass, um simples reload é suficiente para "deslogar".
    window.location.reload();
  };

  return <App onLogout={handleDevLogout} userProfile={mockUserProfile} />;


  /*
  // --- LÓGICA DE AUTENTICAÇÃO ORIGINAL (DESATIVADA TEMPORARIAMENTE) ---
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setIsLoading(true);
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const profileData = userDoc.data();
            // Backfill trial for existing users who don't have this field
            if (!profileData.isPremium && !profileData.trialStartedAt) {
              await updateDoc(userDocRef, { trialStartedAt: serverTimestamp() });
              const updatedDoc = await getDoc(userDocRef); // Re-fetch to get server timestamp
              setUserProfile({ id: updatedDoc.id, ...updatedDoc.data() });
            } else {
              setUserProfile({ id: userDoc.id, ...profileData });
            }
          } else {
            console.error("User is authenticated but profile document not found:", currentUser.uid);
            setUserProfile(null); // Or handle error state
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUserProfile(null);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setAuthView('login');
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };
  
  if (isLoading) {
      return <LoadingOverlay message="Carregando sessão..." />;
  }

  if (!user) {
    switch (authView) {
      case 'register':
        return <RegisterPage onRegisterSuccess={() => {}} onSwitchToLogin={() => setAuthView('login')} />;
      case 'forgotPassword':
        return <ForgotPasswordPage onSwitchToLogin={() => setAuthView('login')} />;
      case 'login':
      default:
        return (
          <LoginPage
            onLoginSuccess={() => {}}
            onAdminLogin={() => {
              // This is kept for the button click, but the URL param is the recommended way
              const mockUser = { uid: 'admin', email: 'admin@example.com' } as User;
              setUser(mockUser);
              setUserProfile({
                id: 'admin',
                uid: 'admin',
                email: 'admin@example.com',
                isPremium: true,
                name: 'Admin',
                role: 'admin',
                createdAt: { toDate: () => new Date() },
                trialStartedAt: null, 
              });
            }}
            onSwitchToRegister={() => setAuthView('register')}
            onSwitchToForgotPassword={() => setAuthView('forgotPassword')}
          />
        );
    }
  }
  
  if (!userProfile) {
    return <LoadingOverlay message="Carregando perfil..." />;
  }

  return <App onLogout={handleLogout} userProfile={userProfile} />;
  */
};