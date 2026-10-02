import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiClient } from '../lib/api';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Star, MapPin, Award } from 'lucide-react';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const searchDoctors = async () => {
      setLoading(true);
      setError('');

      try {
        const query = searchParams.get('q') || '';
        const response = await apiClient.get('/search/doctors', {
          params: { q: query, limit: 20 },
        });
        setDoctors(response.data.data.items || []);
      } catch (err) {
        setError('Failed to load doctors');
      } finally {
        setLoading(false);
      }
    };

    searchDoctors();
  }, [searchParams]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'success';
      case 'RUNNING_LATE':
        return 'warning';
      case 'ON_LEAVE':
        return 'danger';
      default:
        return 'default';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Search Results</h1>

        {error && (
          <Card className="mb-6 border-danger-200 bg-danger-50">
            <CardContent>
              <p className="text-danger-800">{error}</p>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading doctors...</p>
          </div>
        ) : doctors.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-gray-600 mb-4">No doctors found matching your search.</p>
              <Link to="/">
                <Button variant="outline">Go back home</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {doctors.map((doctor: any) => (
              <Link key={doctor.id} to={`/doctor/${doctor.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{doctor.name}</h3>
                        <p className="text-sm text-gray-600">{doctor.specialties.join(', ')}</p>
                      </div>
                      <Badge variant={getStatusColor(doctor.status)}>
                        {doctor.status === 'AVAILABLE' ? '✓ Available' : doctor.status}
                      </Badge>
                    </div>

                    {/* Stats */}
                    <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
                      <div className="flex items-center text-sm text-gray-600">
                        <Star size={16} className="mr-2 text-warning-500 fill-current" />
                        {doctor.rating.toFixed(1)} ({doctor.reviewCount} reviews)
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Award size={16} className="mr-2" />
                        {doctor.experience} years experience
                      </div>
                    </div>

                    {/* Fee and CTA */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Consultation fee</p>
                        <p className="text-lg font-semibold text-gray-900">₹{doctor.consultationFee / 100}</p>
                      </div>
                      <Button size="sm">Book now</Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
