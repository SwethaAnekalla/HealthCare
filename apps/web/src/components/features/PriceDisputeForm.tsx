import { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { AlertCircle, AlertTriangle } from 'lucide-react';
interface PriceDisputeFormProps {
  appointmentId: string;
  lockedFee: number;
  patientSeenPrice?: number;
  onSuccess?: () => void;
}
export const PriceDisputeForm = ({ appointmentId, lockedFee, patientSeenPrice, onSuccess }: PriceDisputeFormProps) => {
  const [claimedAmount, setClaimedAmount] = useState(patientSeenPrice?.toString() || '');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [automaticMismatch, setAutomaticMismatch] = useState(false);
  
  // **FEATURE 6: DETECT PRICE MISMATCH AUTOMATICALLY**
  useEffect(() => {
    if (patientSeenPrice && patientSeenPrice !== lockedFee) {
      setAutomaticMismatch(true);
      setClaimedAmount((patientSeenPrice / 100).toString());
    }
  }, [patientSeenPrice, lockedFee]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setEvidence(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (!claimedAmount || parseFloat(claimedAmount) >= lockedFee / 100) {
      setError('Claimed amount must be less than locked fee');
      setLoading(false);
      return;
    }
    if (!evidence.length) {
      setError('Please upload evidence of the actual fee charged');
      setLoading(false);
      return;
    }
    try {
      // In a real app, upload files to storage and get URLs
      // For now, we'll use placeholder URLs
      const evidenceUrls = evidence.map((_, idx) => `evidence-${idx}`);
      await apiClient.post('/pricing/disputes', {
        appointmentId,
        claimedAmount: parseInt((parseFloat(claimedAmount) * 100).toString()),
        evidenceUrls,
        description,
      });
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to submit dispute');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="border-success-200 bg-success-50">
        <CardContent className="p-6">
          <p className="text-success-900 font-medium">✓ Dispute submitted successfully</p>
          <p className="text-sm text-success-800 mt-1">
            Our team will review your claim and respond within 24 hours.
          </p>
        </CardContent>
      </Card>
    );
  }

  const difference = claimedAmount ? (parseFloat(claimedAmount) - lockedFee / 100) : 0;
  const hasMismatch = Math.abs(difference) > 0.01;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Price Mismatch</CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          If the clinic charged a different fee than shown in the app, we'll help resolve it.
        </p>
      </CardHeader>
      <CardContent>
        {/* **FEATURE 6: SHOW AUTOMATIC MISMATCH DETECTION** */}
        {automaticMismatch && hasMismatch && (
          <div className="flex items-start space-x-3 p-4 bg-warning-50 border border-warning-200 rounded-lg mb-4">
            <AlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-warning-900">Price Mismatch Detected</p>
              <p className="text-sm text-warning-800 mt-1">
                We detected a difference between the price you saw (₹{(parseFloat(claimedAmount)).toFixed(2)}) and the locked fee (₹{(lockedFee / 100).toFixed(2)}).
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-start space-x-3 p-3 bg-danger-50 border border-danger-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-danger-800">{error}</p>
            </div>
          )}
          {/* Locked Fee Display */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Amount shown in app</p>
            <p className="text-2xl font-bold text-gray-900">₹{(lockedFee / 100).toFixed(2)}</p>
          </div>
          {/* Claimed Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount actually charged
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">₹</span>
              <Input
                type="number"
                step="0.01"
                value={claimedAmount}
                onChange={(e) => setClaimedAmount(e.target.value)}
                placeholder="Enter the amount"
                disabled={loading}
              />
            </div>
            {claimedAmount && hasMismatch && (
              <p className={`text-sm mt-1 ${difference > 0 ? 'text-danger-600' : 'text-success-600'}`}>
                {difference > 0 ? 'Overcharge: ' : 'Undercharge: '}₹{Math.abs(difference).toFixed(2)}
              </p>
            )}
          </div>
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional details
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened (optional)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none h-20"
              disabled={loading}
            />
          </div>
          {/* Evidence Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload proof (receipt, screenshot, etc.)
            </label>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              accept="image/*,.pdf"
              disabled={loading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            {evidence.length > 0 && (
              <p className="text-sm text-gray-600 mt-2">{evidence.length} file(s) selected</p>
            )}
          </div>
          {/* Submit */}
          <Button type="submit" className="w-full" disabled={loading || !claimedAmount || !evidence.length}>
            {loading ? 'Submitting...' : 'Submit Dispute'}
          </Button>
          <div className="p-3 bg-blue-50 rounded-lg text-sm text-gray-600">
            <p className="font-medium mb-1">Price Match Guarantee:</p>
            <ul className="space-y-1 text-xs">
              <li>• We verify your evidence</li>
              <li>• If approved, immediate refund to your wallet</li>
              <li>• Clinic receives compliance penalty</li>
              <li>• 100% transparent dispute resolution</li>
            </ul>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
