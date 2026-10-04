import { CheckCircle2, CircleAlert, LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getCheckoutSession } from '../../lib/api';
import { useCart } from '../../lib/cart';
import './CheckoutSuccessPage.css';

type PaymentState = 'checking' | 'paid' | 'processing' | 'unknown';
const MAX_CHECKS = 8;
const CHECK_INTERVAL_MS = 2500;

export default function CheckoutSuccessPage() {
	const [searchParams] = useSearchParams();
	const sessionId = searchParams.get('session_id');
	const { startNewCartIfMatches } = useCart();
	const [paymentState, setPaymentState] = useState<PaymentState>('checking');
	const [retryCount, setRetryCount] = useState(0);

	useEffect(() => {
		if (!sessionId) {
			setPaymentState('unknown');
			return;
		}

		let active = true;
		let timer: ReturnType<typeof setTimeout> | undefined;
		setPaymentState('checking');

		const check = async (attempt: number, sawProcessing = false) => {
			let processing = sawProcessing;
			try {
				const session = await getCheckoutSession(sessionId);
				if (!active) return;
				if (session.paymentStatus === 'paid' || session.paymentStatus === 'no_payment_required') {
					setPaymentState('paid');
					// Cart preparation is separate from payment confirmation.
					void startNewCartIfMatches(session.cartId);
					return;
				}
				processing = session.status === 'complete' || session.paymentStatus === 'processing';
			} catch {
				if (!active) return;
			}

			if (attempt >= MAX_CHECKS) {
				setPaymentState(processing ? 'processing' : 'unknown');
				return;
			}
			timer = setTimeout(() => { void check(attempt + 1, processing); }, CHECK_INTERVAL_MS);
		};

		void check(1);
		return () => {
			active = false;
			if (timer) clearTimeout(timer);
		};
	}, [sessionId, retryCount, startNewCartIfMatches]);

	return (
		<section
			className='section page-section checkout-result'
			aria-live='polite'
			aria-busy={paymentState === 'checking'}>
			{paymentState === 'checking' && (
				<>
					<LoaderCircle className='checkout-spinner' size={42} aria-hidden='true' />
					<p className='eyebrow'>Checking payment</p>
					<h1>One moment</h1>
					<p>We are checking the status of your payment.</p>
				</>
			)}

			{paymentState === 'paid' && (
				<>
					<CheckCircle2 size={42} aria-hidden='true' />
					<p className='eyebrow'>Payment received</p>
					<h1>Thank you for your order</h1>
					<p>Your payment is confirmed. Keep the reference below for any questions about your order.</p>
					<Link className='button primary' to='/shop'>Keep shopping</Link>
				</>
			)}

			{paymentState === 'processing' && (
				<>
					<LoaderCircle className='checkout-spinner' size={42} aria-hidden='true' />
					<p className='eyebrow'>Payment processing</p>
					<h1>Payment is not confirmed yet</h1>
					<p>Please check again before taking any further payment action. You can contact us with the reference below if the status does not change.</p>
					<button className='button primary' type='button' onClick={() => setRetryCount(count => count + 1)}>Check again</button>
				</>
			)}

			{paymentState === 'unknown' && (
				<>
					<CircleAlert size={42} aria-hidden='true' />
					<p className='eyebrow'>Payment status unavailable</p>
					<h1>Check your payment status</h1>
					<p>We could not confirm the payment. Please check again or contact us with the reference below before taking any further payment action.</p>
					{sessionId && <button className='button primary' type='button' onClick={() => setRetryCount(count => count + 1)}>Check again</button>}
				</>
			)}

			{sessionId && <p className='checkout-reference'>Checkout reference: <code>{sessionId}</code></p>}
			{paymentState !== 'checking' && paymentState !== 'paid' && <Link className='text-link' to='/contact'>Contact us</Link>}
		</section>
	);
}
