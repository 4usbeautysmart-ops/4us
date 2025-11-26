// A mock auth service to simulate user authentication without a backend.
// In a real application, this would make API calls to a server.

const FAKE_DELAY = 500;
const USER_STORAGE_KEY = 'auth_user';
const USERS_DB_KEY = 'users_db';

// Simulate a database of users in localStorage
const getUsers = async (): Promise<Map<string, any>> => {
  const dbString = localStorage.getItem(USERS_DB_KEY);
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(dbString ? new Map(JSON.parse(dbString)) : new Map());
    }, 100);
  });
};

const saveUsers = async (users: Map<string, any>) => {
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(Array.from(users.entries())));
};

export const authService = {
  login: async (email: string, password: string): Promise<any> => {
    const users = await getUsers();
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = users.get(email.toLowerCase());
        if (user && user.password === password) {
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
          resolve(user);
        } else {
          reject(new Error('Email ou senha inválidos.'));
        }
      }, FAKE_DELAY);
    });
  },

  register: async (name: string, email: string, password: string): Promise<any> => {
    const users = await getUsers();
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        if (users.has(email.toLowerCase())) {
          reject(new Error('Este e-mail já está em uso.'));
          return;
        }
        const newUser = { name, email: email.toLowerCase(), password };
        users.set(email.toLowerCase(), newUser);
        await saveUsers(users);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
        resolve(newUser);
      }, FAKE_DELAY);
    });
  },

  logout: async (): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(() => {
            localStorage.removeItem(USER_STORAGE_KEY);
            resolve();
        }, 100);
    });
  },

  getCurrentUser: async (): Promise<any | null> => {
    return new Promise(resolve => {
      setTimeout(() => {
        const userString = localStorage.getItem(USER_STORAGE_KEY);
        resolve(userString ? JSON.parse(userString) : null);
      }, 100);
    });
  },

  sendPasswordResetEmail: async (email: string): Promise<void> => {
    return new Promise((resolve) => {
      // In a real app, this would trigger a backend service to send an email.
      // Here, we just simulate the process. We don't need to reject if the user doesn't exist
      // for security reasons (to prevent email enumeration).
      console.log(`Password reset link sent to ${email} (simulation).`);
      setTimeout(() => {
        resolve();
      }, FAKE_DELAY);
    });
  },
};
