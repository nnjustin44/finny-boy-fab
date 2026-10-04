import { ClipboardList, Mail, Ruler, Send, Sparkles } from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { useStorefrontConfig } from '../../lib/storefront';
import './CustomInquiry.css';

type CustomInquiryForm = {
	name: string;
	email: string;
	phone: string;
	projectType: string;
	dimensions: string;
	woodPreference: string;
	budget: string;
	timeline: string;
	message: string;
};

const initialForm: CustomInquiryForm = {
	name: '',
	email: '',
	phone: '',
	projectType: 'Cutting board',
	dimensions: '',
	woodPreference: '',
	budget: '',
	timeline: '',
	message: '',
};

export default function CustomInquiry() {
	const { config, loading, error } = useStorefrontConfig();
	const contactEmail = config.supportEmail;
	const [form, setForm] = useState<CustomInquiryForm>(initialForm);
	const [submittedWithoutEmail, setSubmittedWithoutEmail] = useState(false);
	const [emailOpened, setEmailOpened] = useState(false);

	const mailtoHref = useMemo(() => {
		if (!contactEmail) {
			return '';
		}

		const subject = `Custom inquiry: ${form.projectType}`;
		const body = [
			`Name: ${form.name}`,
			`Email: ${form.email}`,
			`Phone: ${form.phone || 'Not provided'}`,
			`Project type: ${form.projectType}`,
			`Dimensions: ${form.dimensions || 'Not provided'}`,
			`Wood preference: ${form.woodPreference || 'Not provided'}`,
			`Budget: ${form.budget || 'Not provided'}`,
			`Timeline: ${form.timeline || 'Not provided'}`,
			'',
			form.message,
		].join('\n');

		return `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
	}, [contactEmail, form]);

	function updateField(field: keyof CustomInquiryForm, value: string) {
		setSubmittedWithoutEmail(false);
		setEmailOpened(false);
		setForm((current) => ({ ...current, [field]: value }));
	}

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!contactEmail) {
			setSubmittedWithoutEmail(true);
			return;
		}

		window.location.href = mailtoHref;
		setEmailOpened(true);
	}

	return (
		<section className='section page-section custom-inquiry-page'>
			<div className='custom-inquiry-hero'>
				<div>
					<p className='eyebrow'>Custom Inquiry</p>
					<h1>Start a one-of-one build.</h1>
					<p>
						Use this form for custom boards, special serving pieces, unique wood
						pairings, or gifts that need more detail than a standard product
						page can capture.
					</p>
				</div>
				<div className='inquiry-process'>
					<div>
						<ClipboardList size={22} aria-hidden='true' />
						<span>Share the use case</span>
					</div>
					<div>
						<Ruler size={22} aria-hidden='true' />
						<span>Confirm size and materials</span>
					</div>
					<div>
						<Sparkles size={22} aria-hidden='true' />
						<span>Build something specific</span>
					</div>
				</div>
			</div>

			<div className='custom-inquiry-layout'>
				<form className='custom-inquiry-form' onSubmit={handleSubmit}>
					<p>This form prepares a message in your email app. Review it and press Send there; the website does not send it for you.</p>
					<div className='form-row'>
						<label>
							Name (required)
							<input
								type='text'
								name='name'
								value={form.name}
								onChange={(event) => updateField('name', event.target.value)}
								autoComplete='name'
								required
							/>
						</label>
						<label>
							Email (required)
							<input
								type='email'
								name='email'
								value={form.email}
								onChange={(event) => updateField('email', event.target.value)}
								autoComplete='email'
								required
							/>
						</label>
					</div>
					<div className='form-row'>
						<label>
							Phone
							<input
								type='tel'
								name='phone'
								value={form.phone}
								onChange={(event) => updateField('phone', event.target.value)}
								autoComplete='tel'
								inputMode='tel'
							/>
						</label>
						<label>
							Project type
							<select
								name='projectType'
								value={form.projectType}
								onChange={(event) => updateField('projectType', event.target.value)}>
								<option>Cutting board</option>
								<option>Serving board</option>
								<option>Charcuterie board</option>
								<option>One-off special project</option>
								<option>Refinish or refresh</option>
							</select>
						</label>
					</div>
					<div className='form-row'>
						<label>
							Dimensions
							<input
								type='text'
								name='dimensions'
								value={form.dimensions}
								onChange={(event) => updateField('dimensions', event.target.value)}
								placeholder='Example: 12 x 18 inches'
							/>
						</label>
						<label>
							Wood preference
							<input
								type='text'
								name='woodPreference'
								value={form.woodPreference}
								onChange={(event) =>
									updateField('woodPreference', event.target.value)
								}
								placeholder='Walnut, cherry, maple, mixed'
							/>
						</label>
					</div>
					<div className='form-row'>
						<label>
							Budget
							<input
								type='text'
								name='budget'
								value={form.budget}
								onChange={(event) => updateField('budget', event.target.value)}
								placeholder='Optional'
							/>
						</label>
						<label>
							Timeline
							<input
								type='text'
								name='timeline'
								value={form.timeline}
								onChange={(event) => updateField('timeline', event.target.value)}
								placeholder='Optional'
							/>
						</label>
					</div>
					<label>
						Project notes (required)
						<textarea
							name='message'
							value={form.message}
							onChange={(event) => updateField('message', event.target.value)}
							rows={7}
							placeholder='Tell us how the piece will be used, the occasion, or the details that matter.'
							required
						/>
					</label>
					<button className='button primary' type='submit' disabled={loading || !contactEmail}>
						<Send size={18} aria-hidden='true' /> Open custom inquiry email
					</button>
					{(submittedWithoutEmail || error || (!loading && !contactEmail)) && (
						<p className='inquiry-status' role='alert'>
							{error || 'Email inquiries are not available yet. Please check back before placing an order.'}
						</p>
					)}
					{emailOpened && <p className='inquiry-status' role='status'>Your inquiry has not been sent yet. Send it from your email app. If no app opened, copy the details and email {contactEmail} directly.</p>}
				</form>

				<aside className='custom-inquiry-details'>
					<div>
						<Mail size={22} aria-hidden='true' />
						<h2>What happens next</h2>
						{contactEmail && <p>Email directly: <a href={`mailto:${contactEmail}`}>{contactEmail}</a></p>}
						<p>
							We review the details, confirm feasibility, and follow up with
							questions before any custom build is started.
						</p>
					</div>
					<ul>
						<li>No mass production runs.</li>
						<li>Wood availability may shape the final design.</li>
						<li>Custom pricing depends on size, materials, and finish work.</li>
					</ul>
				</aside>
			</div>
		</section>
	);
}
