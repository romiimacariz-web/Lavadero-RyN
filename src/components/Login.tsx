/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, Key, Eye, EyeOff, Sparkles, LogIn, Clipboard, AlertCircle } from 'lucide-react';

interface LoginProps {
  onSuccess?: () => void;
}

export default function Login({ onSuccess }: LoginProps) {
  const { login, signup, loginWithGoogle } = useAuth();
  const [isLogin, setIsLogin] = useState<boolean>(true);
  
  // Form fields
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [nombre, setNombre] = useState<string>('');
  const [rol, setRol] = useState<'Administrador' | 'Empleado'>('Empleado');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  // Feedback States
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    if (!email || !password || (!isLogin && !nombre)) {
      setError('Por favor complete todos los campos requeridos.');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        await login(email, password);
        setSuccessMsg('¡Inicio de sesión exitoso!');
        if (onSuccess) onSuccess();
      } else {
        await signup(email, password, nombre, rol);
        setSuccessMsg('¡Cuenta registrada correctamente!');
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      console.error(err);
      let localizedError = 'Ocurrió un error. Verifique los datos.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        localizedError = 'Credenciales inválidas. Verifique su correo y contraseña.';
      } else if (err.code === 'auth/email-already-in-use') {
        localizedError = 'El correo electrónico ya se encuentra registrado.';
      } else if (err.code === 'auth/weak-password') {
        localizedError = 'La contraseña es muy débil (mínimo 6 caracteres).';
      } else if (err.code === 'auth/invalid-email') {
        localizedError = 'Formato de correo electrónico inválido.';
      } else if (err.message) {
        localizedError = err.message;
      }
      setError(localizedError);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      setSuccessMsg('¡Inicio de sesión con Google exitoso!');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Error al iniciar sesión con Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Visual background ambient glow */}
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-red/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-red/5 rounded-full blur-3xl pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative bg-[#0F0F14] rounded-3xl border border-gray-800/90 shadow-2xl overflow-hidden p-8 space-y-6"
      >
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-brand-red/10 border border-brand-red/20 rounded-2xl flex items-center justify-center text-brand-red shadow-inner">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
          </div>
          <h2 className="text-2xl font-display font-black text-white tracking-tight">
            {isLogin ? 'Lavadero RyN 2.1' : 'Crear Cuenta'}
          </h2>
          <p className="text-xs text-gray-400">
            {isLogin 
              ? 'Panel de Gestión Operativa & Control de Caja' 
              : 'Regístrese para administrar la agenda de lavados'}
          </p>
        </div>

        {/* Tab switchers */}
        <div className="grid grid-cols-2 bg-[#17171E] p-1 rounded-xl border border-gray-800">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setError(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition duration-200 ${
              isLogin 
                ? 'bg-[#252530] text-white shadow-sm' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setError(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition duration-200 ${
              !isLogin 
                ? 'bg-[#252530] text-white shadow-sm' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Registrarse
          </button>
        </div>

        {/* Feedback alerts */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3.5 bg-brand-red/10 border border-brand-red/30 text-brand-red rounded-xl flex items-start gap-2.5 text-xs font-semibold overflow-hidden"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3.5 bg-brand-success/15 border border-brand-success/30 text-brand-success rounded-xl flex items-start gap-2.5 text-xs font-semibold overflow-hidden"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-1.5"
              >
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-mono font-bold block">
                  Nombre Completo
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full bg-[#14141A] border border-gray-800 focus:border-brand-red focus:ring-1 focus:ring-brand-red rounded-xl pl-9.5 pr-3.5 py-2.5 text-xs text-white placeholder-gray-600 outline-none transition"
                    placeholder="Juan Pérez"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider text-gray-400 font-mono font-bold block">
              Correo Electrónico
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#14141A] border border-gray-800 focus:border-brand-red focus:ring-1 focus:ring-brand-red rounded-xl pl-9.5 pr-3.5 py-2.5 text-xs text-white placeholder-gray-600 outline-none transition"
                placeholder="correo@ejemplo.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider text-gray-400 font-mono font-bold block">
              Contraseña
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#14141A] border border-gray-800 focus:border-brand-red focus:ring-1 focus:ring-brand-red rounded-xl pl-9.5 pr-10 py-2.5 text-xs text-white placeholder-gray-600 outline-none transition font-mono"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-300 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-1.5"
              >
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-mono font-bold block">
                  Rol Solicitado
                </label>
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value as any)}
                  className="w-full bg-[#14141A] border border-gray-800 focus:border-brand-red focus:ring-1 focus:ring-brand-red rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition"
                >
                  <option value="Empleado">Empleado (Operativo)</option>
                  <option value="Administrador">Administrador (Acceso Total)</option>
                </select>
                <p className="text-[9px] text-gray-500 italic mt-1 leading-normal">
                  * Nota: El primer usuario registrado y el correo romii.macariz@gmail.com tendrán rol de Administrador automáticamente. Otros roles serán validados por el sistema.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-red hover:bg-red-800 disabled:bg-gray-800 text-white font-black text-xs py-3.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-brand-red/10"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>{isLogin ? 'Ingresar al Panel' : 'Registrar Usuario'}</span>
              </>
            )}
          </button>
        </form>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-gray-800/80"></div>
          <span className="flex-shrink mx-4 text-[9px] uppercase tracking-widest text-gray-600 font-mono">O continuar con</span>
          <div className="flex-grow border-t border-gray-800/80"></div>
        </div>

        {/* Google sign-in prepared button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-[#14141A] hover:bg-[#1A1A22] border border-gray-800 hover:border-gray-700 text-white font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Google Login (Próximamente / Activo)
        </button>
      </motion.div>
    </div>
  );
}
