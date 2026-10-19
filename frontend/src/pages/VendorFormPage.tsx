import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import { Building2, ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { api } from '../api/client';

const vendorValidationSchema = Yup.object().shape({
  company_name: Yup.string()
    .trim()
    .min(3, 'Company legal name must be at least 3 characters')
    .max(255, 'Company name is too long')
    .test('not-single-word', 'Please enter the full legal business name (e.g. Acme Technologies Pvt Ltd). Single words not accepted.', (val) => {
      if (!val) return false;
      return val.trim().split(/\s+/).length >= 2;
    })
    .required('Company legal name is required'),
  contact_person: Yup.string()
    .trim()
    .min(3, 'Contact person name must be at least 3 characters')
    .max(255, 'Contact person name is too long')
    .matches(/^[a-zA-Z\s.'-]+$/, 'Contact person name must contain letters and spaces only')
    .test('full-name', 'Please enter full contact name (First & Last name, e.g. Rohan Sharma). Single words not accepted.', (val) => {
      if (!val) return false;
      return val.trim().split(/\s+/).length >= 2;
    })
    .required('Contact person name is required'),
  email: Yup.string()
    .trim()
    .email('Please enter a valid corporate email address (e.g. compliance@company.com)')
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please enter a valid corporate email address')
    .required('Registered corporate email is required'),
  phone: Yup.string()
    .trim()
    .test('valid-phone', 'Must be a valid phone number with at least 10 digits (e.g. +91 98765 43210). Words are not accepted.', (val) => {
      if (!val) return false;
      const digits = val.replace(/\D/g, '');
      return digits.length >= 10 && digits.length <= 15 && !/[a-zA-Z]/.test(val);
    })
    .required('Phone number is required'),
  address: Yup.string()
    .trim()
    .min(10, 'Registered office address must be at least 10 characters')
    .test('address-words', 'Please enter a complete registered office address (at least 3 words). Single words not accepted.', (val) => {
      if (!val) return false;
      return val.trim().split(/\s+/).length >= 3;
    })
    .required('Registered office address is required'),
  registration_number: Yup.string()
    .trim()
    .transform((val) => (val ? val.toUpperCase().replace(/\s+/g, '') : val))
    .matches(
      /^(?:[LUlu][0-9]{5}[A-Za-z]{2}[0-9]{4}[A-Za-z]{3}[0-9]{6}|(?=.*[0-9])(?=.*[A-Za-z])[A-Za-z0-9-]{7,25})$/,
      'Must be a valid 21-character CIN (e.g. U72900KA2021PTC145678) or Registration ID with letters & digits. Single words not accepted.'
    )
    .required('Company registration number / CIN is required'),
  gst_number: Yup.string()
    .trim()
    .transform((val) => (val ? val.toUpperCase().replace(/\s+/g, '') : val))
    .matches(
      /^(?:[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}[1-9A-Za-z]{1}[Zz][0-9A-Za-z]{1}|(?=.*[0-9])(?=.*[A-Za-z])[A-Za-z0-9-]{9,18})$/,
      'Must be a valid 15-character GSTIN (e.g. 29ABCDE1234F1Z5) or official Tax ID with letters & digits. Single words not accepted.'
    )
    .required('GSTIN or official Tax ID is required'),
  bank_account_number: Yup.string()
    .trim()
    .matches(/^[0-9]{9,18}$/, 'Must be between 9 and 18 numeric digits only (e.g. 987654321098). Letters and words are not accepted.')
    .required('Settlement bank account number is required'),
  ifsc_code: Yup.string()
    .trim()
    .transform((val) => (val ? val.toUpperCase().replace(/\s+/g, '') : val))
    .matches(
      /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/,
      'Must be a valid 11-character IFSC code (e.g. HDFC0001234: 4 letters + 0 + 6 alphanumeric). Single words not accepted.'
    )
    .required('Bank IFSC or routing code is required'),
  change_reason: Yup.string().optional(),
});

export const VendorFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [serverError, setServerError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      company_name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      registration_number: '',
      gst_number: '',
      bank_account_number: '',
      ifsc_code: '',
      change_reason: 'Updated vendor profile details',
    },
    validationSchema: vendorValidationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        setServerError(null);
        if (isEdit && id) {
          await api.vendors.update(Number(id), values);
          toast.success(`Vendor ${values.company_name} updated successfully! New version recorded in history.`);
          navigate(`/vendors/${id}`);
        } else {
          const created = await api.vendors.create(values);
          toast.success(`Vendor ${created.company_name} created successfully! Initialized compliance checklist.`);
          navigate(`/vendors/${created.id}`);
        }
      } catch (e: any) {
        const detail = e.response?.data?.detail;
        const msg = typeof detail === 'string' ? detail : 'An error occurred while saving vendor record.';
        setServerError(msg);
        toast.error(msg);
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (isEdit && id) {
      const fetchVendor = async () => {
        try {
          setInitialLoading(true);
          const data = await api.vendors.get(Number(id), true);
          formik.setValues({
            company_name: data.company_name,
            contact_person: data.contact_person,
            email: data.email,
            phone: data.phone,
            address: data.address,
            registration_number: data.registration_number,
            gst_number: data.gst_number,
            bank_account_number: data.bank_account_number || '',
            ifsc_code: data.ifsc_code,
            change_reason: 'Updated vendor profile details',
          });
        } catch (e: any) {
          setServerError('Failed to fetch existing vendor data.');
          toast.error('Failed to load existing vendor details.');
        } finally {
          setInitialLoading(false);
        }
      };
      fetchVendor();
    }
  }, [id, isEdit]);

  if (initialLoading) {
    return <div className="p-12 text-center text-slate-400 text-xs">Loading vendor data...</div>;
  }

  const { getFieldProps, errors, touched, handleSubmit, isSubmitting } = formik;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-3">
        <Link
          to={isEdit ? `/vendors/${id}` : '/vendors'}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {isEdit ? 'Edit Vendor Profile' : 'Onboard New Vendor'}
          </h1>
          <p className="text-xs text-slate-500">
            {isEdit
              ? 'Changes will be validated by Formik and version-controlled in the audit history.'
              : 'Formik-validated registration form to initialize the compliance dossier.'}
          </p>
        </div>
      </div>

      {serverError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        {/* Section 1: Corporate Entity Information */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand-600" />
            <span>Corporate Identity & Contact</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company Legal Name *</label>
              <input
                type="text"
                {...getFieldProps('company_name')}
                placeholder="e.g. ABC Technologies Pvt Ltd"
                className={`w-full text-xs rounded-xl border p-2.5 outline-none transition-all ${
                  touched.company_name && errors.company_name
                    ? 'border-red-400 bg-red-50/20'
                    : 'border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
                }`}
              />
              {touched.company_name && errors.company_name && (
                <p className="text-[11px] text-red-500 mt-1">{errors.company_name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person Name *</label>
              <input
                type="text"
                {...getFieldProps('contact_person')}
                placeholder="e.g. Rohan Sharma"
                className={`w-full text-xs rounded-xl border p-2.5 outline-none transition-all ${
                  touched.contact_person && errors.contact_person
                    ? 'border-red-400 bg-red-50/20'
                    : 'border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
                }`}
              />
              {touched.contact_person && errors.contact_person && (
                <p className="text-[11px] text-red-500 mt-1">{errors.contact_person}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Registered Email *</label>
              <input
                type="email"
                {...getFieldProps('email')}
                placeholder="e.g. compliance@abctechnologies.com"
                className={`w-full text-xs rounded-xl border p-2.5 outline-none transition-all ${
                  touched.email && errors.email
                    ? 'border-red-400 bg-red-50/20'
                    : 'border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
                }`}
              />
              {touched.email && errors.email && (
                <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                {...getFieldProps('phone')}
                placeholder="e.g. +91 98765 43210"
                className={`w-full text-xs rounded-xl border p-2.5 outline-none transition-all ${
                  touched.phone && errors.phone
                    ? 'border-red-400 bg-red-50/20'
                    : 'border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
                }`}
              />
              {touched.phone && errors.phone && (
                <p className="text-[11px] text-red-500 mt-1">{errors.phone}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Registered Office Address *</label>
            <textarea
              rows={2}
              {...getFieldProps('address')}
              placeholder="Full registered address as it appears on official incorporation filings..."
              className={`w-full text-xs rounded-xl border p-2.5 outline-none transition-all ${
                touched.address && errors.address
                  ? 'border-red-400 bg-red-50/20'
                  : 'border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
              }`}
            />
            {touched.address && errors.address && (
              <p className="text-[11px] text-red-500 mt-1">{errors.address}</p>
            )}
          </div>
        </div>

        {/* Section 2: Identifiers & Banking */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
            Taxation & Financial Settlement Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Registration Number / CIN *</label>
                <span className="text-[10px] font-mono text-slate-400">21-char CIN / Reg ID</span>
              </div>
              <input
                type="text"
                name="registration_number"
                value={formik.values.registration_number}
                onChange={(e) => formik.setFieldValue('registration_number', e.target.value.toUpperCase().replace(/\s+/g, ''))}
                onBlur={formik.handleBlur}
                placeholder="E.G. U72900KA2021PTC145678"
                className={`w-full text-xs font-mono uppercase rounded-xl border p-2.5 outline-none transition-all ${
                  touched.registration_number && errors.registration_number
                    ? 'border-red-400 bg-red-50/20'
                    : 'border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
                }`}
              />
              {touched.registration_number && errors.registration_number ? (
                <p className="text-[11px] text-red-500 mt-1">{errors.registration_number}</p>
              ) : (
                <p className="text-[10px] text-slate-400 mt-0.5">Must be valid CIN or alphanumeric registration with letters & numbers.</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">GST / Tax Identification # *</label>
                <span className="text-[10px] font-mono text-slate-400">15-char GSTIN</span>
              </div>
              <input
                type="text"
                name="gst_number"
                value={formik.values.gst_number}
                onChange={(e) => formik.setFieldValue('gst_number', e.target.value.toUpperCase().replace(/\s+/g, ''))}
                onBlur={formik.handleBlur}
                placeholder="E.G. 29ABCDE1234F1Z5"
                className={`w-full text-xs font-mono uppercase rounded-xl border p-2.5 outline-none transition-all ${
                  touched.gst_number && errors.gst_number
                    ? 'border-red-400 bg-red-50/20'
                    : 'border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
                }`}
              />
              {touched.gst_number && errors.gst_number ? (
                <p className="text-[11px] text-red-500 mt-1">{errors.gst_number}</p>
              ) : (
                <p className="text-[10px] text-slate-400 mt-0.5">Must be valid 15-character GSTIN (e.g. 29ABCDE1234F1Z5) or Tax ID.</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Bank Account Number *</label>
                <span className="text-[10px] font-mono text-slate-400">9-18 Digits (Numbers only)</span>
              </div>
              <input
                type="text"
                name="bank_account_number"
                value={formik.values.bank_account_number}
                onChange={(e) => formik.setFieldValue('bank_account_number', e.target.value.replace(/\D/g, ''))}
                onBlur={formik.handleBlur}
                placeholder="e.g. 987654321098"
                maxLength={18}
                className={`w-full text-xs font-mono rounded-xl border p-2.5 outline-none transition-all ${
                  touched.bank_account_number && errors.bank_account_number
                    ? 'border-red-400 bg-red-50/20'
                    : 'border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
                }`}
              />
              {touched.bank_account_number && errors.bank_account_number ? (
                <p className="text-[11px] text-red-500 mt-1">{errors.bank_account_number}</p>
              ) : (
                <p className="text-[10px] text-slate-400 mt-0.5">Numeric digits only. Letters and single words are not accepted.</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Bank IFSC / Routing Code *</label>
                <span className="text-[10px] font-mono text-slate-400">11-char IFSC</span>
              </div>
              <input
                type="text"
                name="ifsc_code"
                value={formik.values.ifsc_code}
                onChange={(e) => formik.setFieldValue('ifsc_code', e.target.value.toUpperCase().replace(/\s+/g, ''))}
                onBlur={formik.handleBlur}
                placeholder="E.G. HDFC0001234"
                maxLength={11}
                className={`w-full text-xs font-mono uppercase rounded-xl border p-2.5 outline-none transition-all ${
                  touched.ifsc_code && errors.ifsc_code
                    ? 'border-red-400 bg-red-50/20'
                    : 'border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
                }`}
              />
              {touched.ifsc_code && errors.ifsc_code ? (
                <p className="text-[11px] text-red-500 mt-1">{errors.ifsc_code}</p>
              ) : (
                <p className="text-[10px] text-slate-400 mt-0.5">Format: 4 letters + 0 + 6 alphanumeric (e.g. HDFC0001234).</p>
              )}
            </div>
          </div>

          {isEdit && (
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Audit Log Reason for Changes</label>
              <input
                type="text"
                {...getFieldProps('change_reason')}
                placeholder="Brief reason for this revision (recorded in immutable history)..."
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-brand-500"
              />
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Link
            to={isEdit ? `/vendors/${id}` : '/vendors'}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving with Formik...' : isEdit ? 'Save Changes & Record Version' : 'Create Vendor Profile'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
