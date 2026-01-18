import React, { useState, useRef } from 'react';
import { X, Upload, Plus, Trash2, FileText, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useVaccinations } from '@/hooks/useVaccinations';
import { toast } from 'sonner';
import { format, isAfter } from 'date-fns';

interface VaccinationFormProps {
  open: boolean;
  onClose: () => void;
  dogId: string;
  dogName: string;
}

const VACCINATION_TYPES = [
  'Rabies',
  'DHPP (Distemper)',
  'Bordetella',
  'Leptospirosis',
  'Lyme Disease',
  'Canine Influenza',
  'Other'
];

export function VaccinationForm({ open, onClose, dogId, dogName }: VaccinationFormProps) {
  const { records, loading, addRecord, deleteRecord } = useVaccinations(dogId);
  const [vaccinationType, setVaccinationType] = useState('Rabies');
  const [expiryDate, setExpiryDate] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a PDF or image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setDocumentFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!expiryDate) {
      toast.error('Please select an expiry date');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await addRecord(vaccinationType, expiryDate, documentFile || undefined);
      
      if (error) throw error;

      toast.success('Vaccination record added!');
      setVaccinationType('Rabies');
      setExpiryDate('');
      setDocumentFile(null);
    } catch (error) {
      toast.error('Failed to add vaccination record');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (recordId: string) => {
    const { error } = await deleteRecord(recordId);
    if (error) {
      toast.error('Failed to delete record');
    } else {
      toast.success('Record deleted');
    }
  };

  const isExpired = (date: string) => !isAfter(new Date(date), new Date());

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            Vaccinations - {dogName}
          </DialogTitle>
        </DialogHeader>

        {/* Existing Records */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">Vaccination History</h4>
          
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              No vaccination records yet
            </div>
          ) : (
            <div className="space-y-2">
              {records.map(record => (
                <div 
                  key={record.id} 
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isExpired(record.expiry_date) 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-green-50 border-green-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isExpired(record.expiry_date) ? (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <ShieldCheck className="w-5 h-5 text-green-500" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{record.vaccination_type}</p>
                      <p className={`text-xs ${isExpired(record.expiry_date) ? 'text-red-600' : 'text-muted-foreground'}`}>
                        {isExpired(record.expiry_date) ? 'Expired: ' : 'Expires: '}
                        {format(new Date(record.expiry_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {record.document_url && (
                      <a 
                        href={record.document_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-1.5 hover:bg-white/50 rounded-full transition-colors"
                      >
                        <FileText className="w-4 h-4 text-muted-foreground" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(record.id)}
                      className="p-1.5 hover:bg-white/50 rounded-full transition-colors text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add New Record */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t">
          <h4 className="font-medium text-sm text-muted-foreground">Add New Record</h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Vaccination Type</Label>
              <Select value={vaccinationType} onValueChange={setVaccinationType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VACCINATION_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="expiry">Expiry Date</Label>
              <Input
                id="expiry"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="col-span-2">
              <Label>Upload Document (optional)</Label>
              <div className="mt-1">
                {documentFile ? (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm truncate max-w-[180px]">{documentFile.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDocumentFile(null)}
                      className="p-1 hover:bg-muted-foreground/10 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-4 border-2 border-dashed rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    <Upload className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm">Click to upload PDF or image</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Uploading...' : 'Add Vaccination Record'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
