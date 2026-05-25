import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Leaf, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const navigate = useNavigate();
  const { login, register, forgotPassword } = useAuth();

  //email validator
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateName = (name: string) => {
    return /^[a-zA-Z\s]+$/.test(name.trim());
  };
  
  //password strength checker
  const getPasswordStrength = (password: string) => {
    if (password.length < 8) return 'Weak';

    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (hasLowerCase && hasUpperCase && hasNumber && hasSpecialChar) {
      return 'Strong';
    }

    return 'Medium';
  };

  const passwordStrength = useMemo(
    () => getPasswordStrength(formData.password),
    [formData.password]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value
    });

    setFieldErrors({
      ...fieldErrors,
      [name]: ''
    });

    setError('');

    if (name === 'email') {
      const trimmedValue = value.trim();
      if (!trimmedValue) {
        setFieldErrors((prev) => ({
          ...prev,
          email: 'Email is required.'
        }));
      } else if (!validateEmail(trimmedValue)) {
        setFieldErrors((prev) => ({
          ...prev,
          email: 'Please enter a valid email address.'
        }));
      } else {
        setFieldErrors((prev) => ({
          ...prev,
          email: ''
        }));
      }
    }

    //name validation
    if (name === 'name' ) {
      const trimmedValue = value.trim();
      if (!trimmedValue) {
        setFieldErrors((prev) => ({
          ...prev,
          name: 'Name is required.'
        }));
      } else if (trimmedValue.length < 3) {
        setFieldErrors((prev) => ({
          ...prev,
          name: 'Name must be at least 3 characters'
        }));
      } else if (!validateName(trimmedValue)) {
        setFieldErrors((prev) => ({
          ...prev,
          name: 'Name should contain only letters and spaces.'
        }));
      } else {
        setFieldErrors((prev) => ({
          ...prev,
          name: ''
        }));
      }
    }

    //password validation
    if (name === 'password' && !isLogin) {
      const errors: string[] = [];

      if (value.length < 8) {
        errors.push('At least 8 characters');
      }

      if (!/[A-Z]/.test(value)) {
        errors.push('One uppercase letter');
      }

      if (!/[a-z]/.test(value)) {
        errors.push('One lowercase letter');
      }

      if (!/\d/.test(value)) {
        errors.push('One number');
      }

      if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
        errors.push('One special character');
      }

      setFieldErrors((prev) => ({
        ...prev,
        password: errors.join(', '),

        confirmPassword:
          formData.confirmPassword &&
          value !== formData.confirmPassword
            ? 'Passwords do not match.'
            : ''
      }));
    }

    //confirmation of password
    if (name === 'confirmPassword') {
      if (value && value !== formData.password) {
        setFieldErrors((prev) => ({
          ...prev,
          confirmPassword: 'Passwords do not match.'
        }));
      } else {
        setFieldErrors((prev) => ({
          ...prev,
          confirmPassword: ''
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const result = await login(
          formData.email.trim(),
          formData.password.trim()
        );
        if (!result.success) {
          setError(result.error || 'Login failed.');
          return;
        }
        navigate('/dashboard');
      } else {
        if (!validateName(formData.name)) {
          setError('Please enter a valid name.');
          return;
        }

        if (!validateEmail(formData.email)) {
          setError('Please enter a valid email.');
          return;
        }

        const password = formData.password;
        if (
          password.length < 8 ||
          !/[A-Z]/.test(password) ||
          !/[a-z]/.test(password) ||
          !/\d/.test(password) ||
          !/[!@#$%^&*(),.?":{}|<>]/.test(password)
        ) {
          setError(
            'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.'
          );
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match.');
          return;
        }
        const result = await register(
          formData.name.trim(),
          formData.email.trim(),
          formData.password.trim()
        );
        if (!result.success) {
          setError(result.error || 'Registration failed.');
          return;
        }
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.8 }}
            className="bg-green-500 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center"
          >
            <Leaf className="h-8 w-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isLogin ? 'Welcome Back!' : 'Join EcoPlay'}
          </h1>
          <p className="text-blue-100">
            {isLogin ? 'Continue your environmental journey' : 'Start your eco-friendly adventure'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <label className="block text-white font-medium mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 h-5 w-5" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  aria-invalid={!!fieldErrors.name}
                  aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                  className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                  placeholder="Enter your full name"
                  required={!isLogin}
                />
              </div>
              {fieldErrors.name && (
                <p id="name-error" role="alert" className="text-red-300 text-sm mt-2">
                  {fieldErrors.name}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-white font-medium mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 h-5 w-5" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                placeholder="Enter your email"
                required
              />
            </div>
            {fieldErrors.email && (
              <p id="email-error" role="alert" className="text-red-300 text-sm mt-2" >
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 h-5 w-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {!isLogin && formData.password && (
              <div className="mt-2">
                <p className="text-sm text-gray-300">
                  Password Strength:
                  <span
                    className={`ml-2 font-semibold ${
                      passwordStrength === 'Weak'
                        ? 'text-red-400'
                        : passwordStrength === 'Medium'
                        ? 'text-yellow-400'
                        : 'text-green-400'
                    }`}
                  >
                    {passwordStrength}
                  </span>
                </p>
              </div>
            )}

            {fieldErrors.password && (
              <p id="password-error" role="alert" className="text-red-300 text-sm mt-2">
                {fieldErrors.password}
              </p>
            )}
          </div>

          {isLogin && (
            <div className="flex justify-end -mt-2">
              <button
                type="button"
                onClick={async () => {
                  if (!formData.email) {
                    setError('Please enter your email first.');
                    return;
                  }

                  setLoading(true);

                  const result = await forgotPassword(formData.email);

                  if (!result.success) {
                    setError(result.error || 'Failed to send reset email.');
                  } else {
                    setError('');
                    alert('Password reset email sent! Check your inbox.');
                  }

                  setLoading(false);
                }}
                className="text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {!isLogin && (
            <div>
              <label className="block text-white font-medium mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 h-5 w-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  aria-invalid={!!fieldErrors.confirmPassword}
                  aria-describedby={fieldErrors.confirmPassword ? 'confirmPassword-error' : undefined}
                  className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                  placeholder="Confirm your password"
                  required={!isLogin}
                />
              </div>
              {fieldErrors.confirmPassword && (
                <p id="confirmPassword-error" role="alert" className="text-red-300 text-sm mt-2">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              role="alert"
              aria-live="polite"
              className="bg-red-500/20 border border-red-400/30 text-red-300 p-3 rounded-xl text-sm"
            >
              {error}
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={
              loading ||
              !formData.email.trim() ||
              !formData.password.trim() ||
              !!fieldErrors.email ||
              !!fieldErrors.password ||
              (!isLogin &&
                (
                  !formData.name.trim() ||
                  !formData.confirmPassword.trim() ||
                  formData.password !== formData.confirmPassword ||
                  !!fieldErrors.name ||
                  !!fieldErrors.confirmPassword
                ))
            }
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold py-3 px-6 rounded-xl hover:from-green-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </motion.button>
        </form>

        {/* Toggle */}
        <div className="mt-6 text-center">
          <p className="text-blue-100">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
          </p>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setFieldErrors({ email: '', password: '', name: '', confirmPassword: '' });//Clearing error while toggle
              setFormData({ email: '', password: '', name: '', confirmPassword: '' });  
            }}
            className="text-green-400 hover:text-green-300 font-medium mt-2 transition-colors"
          >
            {isLogin ? 'Sign up here' : 'Sign in here'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;