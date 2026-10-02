import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { Heart, Clock, MessageSquare, TrendingUp } from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Healthcare Appointments,<br />
            <span className="text-primary-600">Made Simple & Transparent</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Find the right doctor, book instantly, and enjoy transparent pricing and real-time updates.
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Search by doctor name, specialty, or symptom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 h-12"
            />
            <Button size="lg" type="submit">
              Search
            </Button>
          </div>
        </form>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: <Heart className="w-6 h-6 text-primary-600" />,
              title: 'Live Status',
              description: 'Real-time doctor availability updates',
            },
            {
              icon: <Clock className="w-6 h-6 text-primary-600" />,
              title: 'Fast Refunds',
              description: 'Transparent, instant refunds to wallet',
            },
            {
              icon: <MessageSquare className="w-6 h-6 text-primary-600" />,
              title: 'Real Support',
              description: 'Talk to humans, not bots',
            },
            {
              icon: <TrendingUp className="w-6 h-6 text-primary-600" />,
              title: 'Fair Pricing',
              description: 'Guaranteed price match guarantee',
            },
          ].map((feature, idx) => (
            <Card key={idx}>
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-4">{feature.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to book an appointment?</h2>
          <p className="text-lg mb-8 text-primary-100">
            Search for doctors or describe your symptoms to find the right specialist.
          </p>
          <Button size="lg" variant="outline" onClick={() => navigate('/search')}>
            Start searching
          </Button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
