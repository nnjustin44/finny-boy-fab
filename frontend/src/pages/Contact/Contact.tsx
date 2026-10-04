import { Mail, MapPin, MessageSquareText, Sparkles } from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { useStorefrontConfig } from '../../lib/storefront';
import './Contact.css';

type ContactForm = {
	name: string;
	email: string;
	projectType: string;
	message: string;
};

const initialForm: ContactForm = {
	name: '',
	email: '',
	projectType: 'General question',
	message: '',
};

export default function Contact() {
	const { config, loading, error } = useStorefrontConfig();
	const contactEmail = config.supportEmail;
	const [form, setForm] = useState<ContactForm>(initialForm);
	const [submittedWithoutEmail, setSubmittedWithoutEmail] = useState(false);
	const [emailOpened, setEmailOpened] = useState(false);

	const mailtoHref = useMemo(() => {
		if (!contactEmail) {
			return '';
		}

		const subject = `Finny Boy Fab inquiry: ${form.projectType}`;
		const body = [
			`Name: ${form.name}`,
			`Email: ${form.email}`,
			`Project type: ${form.projectType}`,
			'',
			form.message,
		].join('\n');

		return `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
	}, [contactEmail, form.email, form.message, form.name, form.projectType]);

	function updateField(field: keyof ContactForm, value: string) {
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
		<section className='section page-section contact-page'>
			<div className='contact-hero'>
				<div>
					<p className='eyebrow'>Contact Us</p>
					<h1>Let&apos;s talk through the build.</h1>
					<p>
						Have a question about an order, a care detail, or a one-off piece?
						Send the shop a note and include the wood, size, or occasion you
						have in mind.
					</p>
				</div>
				<div className='contact-callout'>
					<Sparkles
						size={28}
						aria-hidden='true'
					/>
					<h2>Special project inquiries</h2>
					<p>
						For one-of-one pieces, tell us what you are drawn to: serving,
						display, daily prep, unusual wood grain, or a specific gift moment.
					</p>
				</div>
			</div>

			<div className='contact-layout'>
				<form
					className='contact-form'
					onSubmit={handleSubmit}>
					<p>
						This form prepares a message in your email app. Review it and press
						Send there; the website does not send it for you.
					</p>
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
					<label>
						What can we help with?
						<select
							name='projectType'
							value={form.projectType}
							onChange={(event) =>
								updateField('projectType', event.target.value)
							}>
							<option>General question</option>
							<option>Current order</option>
							<option>Special project</option>
							<option>Care and refinishing</option>
						</select>
					</label>
					<label>
						Message (required)
						<textarea
							name='message'
							value={form.message}
							onChange={(event) => updateField('message', event.target.value)}
							rows={7}
							required
						/>
					</label>
					<button
						className='button primary'
						type='submit'
						disabled={loading || !contactEmail}>
						<MessageSquareText
							size={18}
							aria-hidden='true'
						/>{' '}
						Open email draft
					</button>
					{(submittedWithoutEmail || error || (!loading && !contactEmail)) && (
						<p
							className='contact-status'
							role='alert'>
							{error ||
								'Email inquiries are not available yet. Please check back before placing an order.'}
						</p>
					)}
					{emailOpened && (
						<p
							className='contact-status'
							role='status'>
							Your message has not been sent yet. Send it from your email app.
							If no app opened, copy your message and email {contactEmail}{' '}
							directly.
						</p>
					)}
				</form>

				<aside
					className='contact-details'
					aria-label='Contact details'>
					<div>
						<Mail
							size={22}
							aria-hidden='true'
						/>
						<h3>Email</h3>
						{contactEmail ? (
							<a href={`mailto:${contactEmail}`}>{contactEmail}</a>
						) : (
							<p>FinnyBoyFab@gmail.com</p>
						)}
					</div>
					<div>
						<MapPin
							size={22}
							aria-hidden='true'
						/>
						<h3>Shop</h3>
						<p>Veteran-owned small shop based in North Carolina.</p>
					</div>
				</aside>
			</div>
		</section>
	);
}
