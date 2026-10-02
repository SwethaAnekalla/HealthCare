import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterInput, UserRole } from '@caresync/shared';
import { apiClient } from '../lib/api';
import { useAuthStore } from '../store/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

const SignupPage = () => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('PATIENT');

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'PATIENT' as UserRole,
      name: '',
      email: '',
      phone: '',
      password: '',
    },
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setError('');

    try {
      const payload = {
        ...data,
        role: selectedRole,
      };

      const response = await apiClient.post('/auth/register', payload);
      const { user, accessToken } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      setUser(user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Create CareSync Account</CardTitle>
          <p className="text-sm text-gray-600 mt-1">Join our healthcare platform</p>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">I am a:</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="PATIENT"
                    checked={selectedRole === 'PATIENT'}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="mr-2"
                    disabled={isLoading}
                  />
                  <span className="text-sm">Patient</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="DOCTOR"
                    checked={selectedRole === 'DOCTOR'}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="mr-2"
                    disabled={isLoading}
                  />
                  <span className="text-sm">Doctor</span>
                </label>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <Input
                type="text"
                placeholder="John Doe"
                {...register('name')}
                disabled={isLoading}
              />
              {errors.name && <p className="text-sm text-danger-600 mt-1">{String(errors.name.message)}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                disabled={isLoading}
              />
              {errors.email && <p className="text-sm text-danger-600 mt-1">{String(errors.email.message)}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <Input
                type="tel"
                placeholder="+1234567890"
                {...register('phone')}
                disabled={isLoading}
              />
              {errors.phone && <p className="text-sm text-danger-600 mt-1">{String(errors.phone.message)}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                {...register('password')}
                disabled={isLoading}
              />
              {errors.password && <p className="text-sm text-danger-600 mt-1">{String(errors.password.message)}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Sign up'}
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignupPage;
