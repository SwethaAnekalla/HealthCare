import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { AlertTriangle, TrendingUp } from 'lucide-react';
export const SymptomMatcher = () => {
  const navigate = useNavigate();
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const handleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.post('/symptom-match', { symptoms });
      setResult(response.data.data);
    } catch (err: any) {
      setError('Failed to match symptoms. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Describe Your Symptoms</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Tell us what's bothering you, and we'll match you with the right specialist
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleMatch} className="space-y-4">
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="E.g., I have been experiencing chest pain and shortness of breath for the past two days..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none h-24"
              disabled={loading}
            />
            <Button type="submit" className="w-full" disabled={loading || !symptoms.trim()}>
              {loading ? 'Matching...' : 'Find Specialists'}
            </Button>
          </form>
        </CardContent>
      </Card>
      {/* Red Flags Warning */}
      {result?.redFlags && result.redFlags.length > 0 && (
        <div className="space-y-3">
          {result.redFlags.map((flag: any, idx: number) => (
            <div key={idx} className="flex items-start space-x-3 p-4 bg-danger-50 rounded-lg border-l-4 border-danger-600">
              <AlertTriangle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-danger-900">{flag.symptom}</p>
                <p className="text-sm text-danger-800 mt-1">{flag.guidance}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {error && (
        <Card className="border-danger-200 bg-danger-50">
          <CardContent>
            <p className="text-danger-800">{error}</p>
          </CardContent>
        </Card>
      )}
      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Matched Specialties */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp size={20} />
                <span>Matched Specialties</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.specialties.map((spec: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{spec.name}</p>
                      <p className="text-sm text-gray-600">{spec.reason}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary-600">{spec.confidence}%</p>
                        <p className="text-xs text-gray-500">match</p>
                      </div>
                      <div className="w-16 bg-gray-200 rounded-full h-2 ml-4">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${spec.confidence}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          {/* **FEATURE 5: Doctors with Booking Buttons */}
          {result.doctors && result.doctors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Available Doctors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {result.doctors.slice(0, 4).map((doctor: any, idx: number) => (
                    <div key={idx} className="p-3 border border-gray-200 rounded-lg">
                      <p className="font-medium text-gray-900">{doctor.name}</p>
                      <p className="text-sm text-gray-600">{doctor.specialties.join(', ')}</p>
                      <div className="mt-2 flex justify-between items-center">
                        <Badge variant={doctor.status === 'AVAILABLE' ? 'success' : 'default'}>
                          {doctor.status}
                        </Badge>
                        <p className="text-sm font-semibold text-gray-900">₹{doctor.fee / 100}</p>
                      </div>
                      <Button
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => navigate(`/doctor/${doctor.id}`)}
                      >
                        Book Appointment
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
