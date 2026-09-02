import { CheckCircle2, CircleAlert, LoaderCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getCheckoutSession } from '../../lib/api';
import { useCart } from '../../lib/cart';
import './CheckoutSuccessPage.css';

type PaymentState = 'loading' | 'paid' | 'processing' | 'error';

export default function CheckoutSuccessPage() {
	const [searchParams] = useSearchParams();
	const { startNewCart } = useCart();
	const [paymentState, setPaymentState] = useState<PaymentState>('loading');
	const verificationStarted = useRef(false);

	useEffect(() => {
		if (verificationStarted.current) {
			return;
		}
		verificationStarted.current = true;

		const sessionId = searchParams.get('session_id');
		if (!sessionId) {
			setPaymentState('error');
			return;
		}

		void getCheckoutSession(sessionId)
			.then(async (session) => {
				if (session.paymentStatus === 'paid' || session.paymentStatus === 'no_payment_required') {
					await startNewCart();
					setPaymentState('paid');
					return;
				}
				setPaymentState(session.status === 'complete' ? 'processing' : 'error');
			})
			.catch(() => setPaymentState('error'));
	}, [searchParams, startNewCart]);

	return (
		<section
			className='section page-section checkout-result'
			aria-live='polite'
			aria-busy={paymentState === 'loading'}>
			{paymentState === 'loading' && (
				<>
					<LoaderCircle className='checkout-spinner' size={42} aria-hidden='true' />
					<p className='eyebrow'>Verifying payment</p>
					<h1>One moment</h1>
				</>
			)}

			{paymentState === 'paid' && (
				<>
					<CheckCircle2 size={42} aria-hidden='true' />
					<p className='eyebrow'>Payment received</p>
					<h1>Thank you for your order</h1>
					<p>A receipt and order details will be sent to the email entered at checkout.</p>
					<Link className='button primary' to='/shop'>
						Keep shopping
					</Link>
				</>
			)}

			{paymentState === 'processing' && (
				<>
					<LoaderCircle className='checkout-spinner' size={42} aria-hidden='true' />
					<p className='eyebrow'>Payment processing</p>
					<h1>Your payment is still processing</h1>
					<p>Stripe will email you when the payment is complete.</p>
				</>
			)}

			{paymentState === 'error' && (
				<>
					<CircleAlert size={42} aria-hidden='true' />
					<p className='eyebrow'>Unable to verify payment</p>
					<h1>Check your payment status</h1>
					<p>Your cart has been kept. Return to it to try again.</p>
					<Link className='button primary' to='/cart'>
						Return to cart
					</Link>
				</>
			)}
		</section>
	);
}
