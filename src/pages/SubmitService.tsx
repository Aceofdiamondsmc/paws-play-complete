import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Store, ArrowLeft, ArrowRight, Check, Loader2, BadgeCheck, Star, Crown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/hooks/useAuth';
import { useCreateSubmission, useCreateCheckout } from '@/hooks/useServiceSubmissions';
import { toast } from 'sonner';

const CATEGORIES = [
  { id: 'Dog Walkers', label: 'Dog Walkers' },
  { id: 'Groomers', label: 'Groomers' },
  { id: 'Vet Clinics', label: 'Vet Clinics' },
  { id: 'Trainers', label: 'Trainers' },
  { id: 'Daycare', label: 'Daycare' },
];

const PRICING_TIERS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$9.99',
    period: '/month',
    description: 'Get listed and start reaching pet owners',
    features: ['Listed in directory', 'Searchable by category', 'Contact info displayed', 'Cancel anytime'],
    icon: Sparkles,
    popular: false,
  },
  {
    id: 'featured',
    name: 'Featured',
    price: '$19.99',
    period: '/month',
    description: 'Priority placement & badge',
    features: ['Everything in Starter', 'Featured badge', 'Higher in search results', 'Cancel anytime'],
    icon: Star,
    popular: true,
  },
  {
    id: 'basic',
    name: 'Value',
    price: '$29.99',
    period: 'one-time',
    description: 'Everything in Starter for a full year',
    features: ['Listed in directory', 'Searchable by category', 'Contact info displayed', 'Full year coverage'],
    icon: Store,
    popular: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$149.99',
    period: '/year',
    description: 'Top placement & verified status',
    features: ['Everything in Featured', 'Verified badge', 'Top of search results', 'Priority support'],
    icon: Crown,
    popular: false,
  },
];

const formSchema = z.object({
  business_name: z.string().min(2, 'Business name is required').max(100),
  category: z.string().min(1, 'Category is required'),
  description: z.string().max(500).optional(),
  address: z.string().min(5, 'Address is required').max(200),
  city: z.string().min(2, 'City is required').max(100),
  state: z.string().min(2, 'State is required').max(50),
  phone: z.string().max(20).optional(),
  website: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  email: z.string().email('Must be a valid email'),
  submitter_name: z.string().min(2, 'Your name is required').max(100),
});

type FormData = z.infer<typeof formSchema>;

export default function SubmitService() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedTier, setSelectedTier] = useState<string>('starter');
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  const createSubmission = useCreateSubmission();
  const createCheckout = useCreateCheckout();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      business_name: '',
      category: '',
      description: '',
      address: '',
      city: '',
      state: '',
      phone: '',
      website: '',
      email: user?.email || '',
      submitter_name: '',
    },
  });

  // Show canceled message if redirected from Stripe
  if (searchParams.get('canceled') === 'true') {
    toast.info('Checkout canceled', { description: 'No payment was made' });
  }

  const handleBusinessDetailsSubmit = async (data: FormData) => {
    if (!user) {
      toast.error('Please log in to submit a service');
      navigate('/');
      return;
    }

    try {
      const submission = await createSubmission.mutateAsync({
        business_name: data.business_name,
        category: data.category,
        description: data.description,
        address: data.address,
        city: data.city,
        state: data.state,
        phone: data.phone,
        website: data.website,
        email: data.email,
        submitter_name: data.submitter_name,
        subscription_tier: selectedTier as 'starter' | 'basic' | 'featured' | 'premium',
      });
      setSubmissionId(submission.id);
      setStep(2);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleProceedToCheckout = async () => {
    if (!submissionId) {
      toast.error('Submission not found');
      return;
    }

    try {
      const { url } = await createCheckout.mutateAsync({
        submissionId,
        tier: selectedTier,
      });

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Store className="w-12 h-12 mx-auto text-primary mb-2" />
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to submit your business to our directory.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/me')} className="w-full">
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background pb-24">
      {/* Header */}
      <div className="bg-card border-b p-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/services')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Add Your Service</h1>
            <p className="text-sm text-muted-foreground">
              Step {step} of 2
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            {step > 1 ? <Check className="w-4 h-4" /> : '1'}
          </div>
          <div className={`w-16 h-1 rounded ${step > 1 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            2
          </div>
        </div>

        {step === 1 && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleBusinessDetailsSubmit)} className="space-y-6">
              {/* Business Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="w-5 h-5" />
                    Business Details
                  </CardTitle>
                  <CardDescription>
                    Tell us about your pet service business
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="business_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Happy Paws Grooming" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CATEGORIES.map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell pet owners what makes your business special..."
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address *</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main St" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City *</FormLabel>
                          <FormControl>
                            <Input placeholder="Boston" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State *</FormLabel>
                        <FormControl>
                          <Input placeholder="MA" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="submitter_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="John Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="contact@business.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="(555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input type="url" placeholder="https://www.yourbusiness.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Tier Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Choose Your Plan</CardTitle>
                  <CardDescription>
                    Select the listing tier that best fits your needs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {PRICING_TIERS.map(tier => {
                    const Icon = tier.icon;
                    const isSelected = selectedTier === tier.id;
                    
                    return (
                      <div
                        key={tier.id}
                        onClick={() => setSelectedTier(tier.id)}
                        className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {tier.popular && (
                          <div className="absolute -top-2 right-4 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                            Popular
                          </div>
                        )}
                        
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-baseline gap-2">
                              <span className="font-bold">{tier.name}</span>
                              <span className="text-lg font-bold text-primary">{tier.price}</span>
                              <span className="text-sm text-muted-foreground">{tier.period}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
                            
                            <ul className="mt-2 space-y-1">
                              {tier.features.map((feature, i) => (
                                <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <BadgeCheck className="w-3 h-3 text-success" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={createSubmission.isPending}
              >
                {createSubmission.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Continue to Checkout
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </Form>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Review & Pay</CardTitle>
                <CardDescription>
                  Review your submission and complete payment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <h3 className="font-bold">{form.getValues('business_name')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {form.getValues('category')} • {form.getValues('city')}, {form.getValues('state')}
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">
                        {PRICING_TIERS.find(t => t.id === selectedTier)?.name} Plan
                      </span>
                      <p className="text-sm text-muted-foreground">
                        {PRICING_TIERS.find(t => t.id === selectedTier)?.description}
                      </p>
                    </div>
                    <span className="text-xl font-bold text-primary">
                      {PRICING_TIERS.find(t => t.id === selectedTier)?.price}
                      <span className="text-sm font-normal text-muted-foreground">
                        {PRICING_TIERS.find(t => t.id === selectedTier)?.period}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    onClick={handleProceedToCheckout}
                    disabled={createCheckout.isPending}
                    className="flex-1"
                  >
                    {createCheckout.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Proceed to Payment
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  Secure checkout powered by Stripe. Your listing will be reviewed within 24-48 hours after payment.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
