'use client';

import { useState, useCallback } from 'react';
import { Loader2, CheckCircle } from 'lucide-react';

interface FormData {
  name: string;
  email: string;
  phone: string;
  businessName: string;
  businessType: string;
  message: string;
  source: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  businessName?: string;
  businessType?: string;
  message?: string;
}

const BUSINESS_TYPES = [
  'Restaurant / Takeaway',
  'Garage / MOT Centre',
  'Salon / Beauty',
  'Cleaning / Exterior',
  'Dry Cleaning / Laundry',
  'Other',
];

const UK_PHONE_REGEX = /^(?:(?:\+44\s?|0)(?:\d\s?){9,10})$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateField(field: keyof FormData, value: string): string | undefined {
  switch (field) {
    case 'name':
      if (!value.trim()) return 'Name is required';
      break;
    case 'email':
      if (!value.trim()) return 'Email is required';
      if (!EMAIL_REGEX.test(value)) return 'Please enter a valid email address';
      break;
    case 'phone':
      if (value.trim() && !UK_PHONE_REGEX.test(value.replace(/\s/g, ''))) {
        return 'Please enter a valid UK phone number';
      }
      break;
    case 'businessName':
      if (!value.trim()) return 'Business name is required';
      break;
    case 'businessType':
      if (!value) return 'Please select a business type';
      break;
    case 'message':
      if (!value.trim()) return 'Message is required';
      break;
  }
  return undefined;
}

export default function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    businessType: '',
    message: '',
    source: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));

      // Clear error on change if field was touched
      if (touched[name as keyof FormData]) {
        const error = validateField(name as keyof FormData, value);
        setErrors((prev) => ({ ...prev, [name]: error }));
      }
    },
    [touched],
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));
      const error = validateField(name as keyof FormData, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    },
    [],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isSubmitting) return;

      // Validate all fields
      const newErrors: FormErrors = {};
      const fieldsToValidate: (keyof FormData)[] = [
        'name',
        'email',
        'phone',
        'businessName',
        'businessType',
        'message',
      ];
      let hasErrors = false;

      for (const field of fieldsToValidate) {
        const error = validateField(field, formData[field]);
        if (error) {
          newErrors[field as keyof FormErrors] = error;
          hasErrors = true;
        }
      }

      setErrors(newErrors);
      setTouched({
        name: true,
        email: true,
        phone: true,
        businessName: true,
        businessType: true,
        message: true,
      });

      if (hasErrors) return;

      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error('Failed to send message. Please try again.');
        }

        setIsSuccess(true);
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : 'Something went wrong. Please try again.',
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, isSubmitting],
  );

  if (isSuccess) {
    return (
      <div
        className="flex flex-col items-center gap-4 rounded-xl border border-emerald-400 bg-emerald-400/10 p-8 text-center"
        role="status"
        aria-live="polite"
      >
        <CheckCircle className="h-12 w-12 text-emerald-400" aria-hidden="true" />
        <h3 className="text-h3 text-gray-900">Message Sent</h3>
        <p className="text-body text-gray-500">
          Thank you for getting in touch. We will get back to you within one working day.
        </p>
      </div>
    );
  }

  const inputClasses = (field: keyof FormErrors) =>
    `w-full rounded-xl border px-4 py-3 text-body text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 ${
      errors[field] && touched[field as keyof FormData]
        ? 'border-rose-400'
        : 'border-gray-200'
    }`;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Hidden source field */}
      <input type="hidden" name="source" value={formData.source} />

      {/* Name */}
      <div>
        <label htmlFor="contact-name" className="mb-1.5 block text-small font-medium text-gray-700">
          Name <span aria-hidden="true">*</span>
        </label>
        <input
          id="contact-name"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          onBlur={handleBlur}
          className={inputClasses('name')}
          placeholder="Your full name"
          required
          aria-required="true"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'error-name' : undefined}
        />
        {errors.name && touched.name && (
          <p id="error-name" className="mt-1 text-small text-rose-400" role="alert">
            {errors.name}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="contact-email" className="mb-1.5 block text-small font-medium text-gray-700">
          Email <span aria-hidden="true">*</span>
        </label>
        <input
          id="contact-email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          className={inputClasses('email')}
          placeholder="you@business.co.uk"
          required
          aria-required="true"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'error-email' : undefined}
        />
        {errors.email && touched.email && (
          <p id="error-email" className="mt-1 text-small text-rose-400" role="alert">
            {errors.email}
          </p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="contact-phone" className="mb-1.5 block text-small font-medium text-gray-700">
          Phone
        </label>
        <input
          id="contact-phone"
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          onBlur={handleBlur}
          className={inputClasses('phone')}
          placeholder="07XXX XXXXXX"
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? 'error-phone' : undefined}
        />
        {errors.phone && touched.phone && (
          <p id="error-phone" className="mt-1 text-small text-rose-400" role="alert">
            {errors.phone}
          </p>
        )}
      </div>

      {/* Business Name */}
      <div>
        <label
          htmlFor="contact-business-name"
          className="mb-1.5 block text-small font-medium text-gray-700"
        >
          Business Name <span aria-hidden="true">*</span>
        </label>
        <input
          id="contact-business-name"
          type="text"
          name="businessName"
          value={formData.businessName}
          onChange={handleChange}
          onBlur={handleBlur}
          className={inputClasses('businessName')}
          placeholder="Your business name"
          required
          aria-required="true"
          aria-invalid={!!errors.businessName}
          aria-describedby={errors.businessName ? 'error-businessName' : undefined}
        />
        {errors.businessName && touched.businessName && (
          <p id="error-businessName" className="mt-1 text-small text-rose-400" role="alert">
            {errors.businessName}
          </p>
        )}
      </div>

      {/* Business Type */}
      <div>
        <label
          htmlFor="contact-business-type"
          className="mb-1.5 block text-small font-medium text-gray-700"
        >
          Business Type <span aria-hidden="true">*</span>
        </label>
        <select
          id="contact-business-type"
          name="businessType"
          value={formData.businessType}
          onChange={handleChange}
          onBlur={handleBlur}
          className={inputClasses('businessType')}
          required
          aria-required="true"
          aria-invalid={!!errors.businessType}
          aria-describedby={errors.businessType ? 'error-businessType' : undefined}
        >
          <option value="">Select your business type</option>
          {BUSINESS_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        {errors.businessType && touched.businessType && (
          <p id="error-businessType" className="mt-1 text-small text-rose-400" role="alert">
            {errors.businessType}
          </p>
        )}
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="contact-message"
          className="mb-1.5 block text-small font-medium text-gray-700"
        >
          Message <span aria-hidden="true">*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`${inputClasses('message')} min-h-[120px] resize-y`}
          placeholder="Tell us about your business and what you're looking for..."
          rows={4}
          required
          aria-required="true"
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'error-message' : undefined}
        />
        {errors.message && touched.message && (
          <p id="error-message" className="mt-1 text-small text-rose-400" role="alert">
            {errors.message}
          </p>
        )}
      </div>

      {/* Submit error */}
      {submitError && (
        <p className="text-small text-rose-400" role="alert">
          {submitError}
        </p>
      )}

      {/* Submit button */}
      <button
        type="submit"
        className="btn-primary w-full"
        disabled={isSubmitting}
        aria-label="Send your message"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            Sending...
          </>
        ) : (
          'Send Message'
        )}
      </button>
    </form>
  );
}
