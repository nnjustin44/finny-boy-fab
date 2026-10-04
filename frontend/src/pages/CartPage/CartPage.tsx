import { Minus, Plus, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../lib/cart';
import { formatMoney } from '../../lib/format';
import { useStorefrontConfig } from '../../lib/storefront';
import '../../styles/cart.css';
import './CartPage.css';

export default function CartPage() {
	const {
		cart,
		checkout,
		removeItem,
		updateItem,
		loading,
		loadingCart,
		error,
		retryCart,
	} = useCart();
	const {
		config: storefront,
		loading: loadingStorefront,
		error: storefrontError,
	} = useStorefrontConfig();
	const [termsAcknowledged, setTermsAcknowledged] = useState(false);
	const [checkoutError, setCheckoutError] = useState<string | null>(null);
	const [checkoutStarting, setCheckoutStarting] = useState(false);
	const checkoutStartingRef = useRef(false);

	async function handleCheckout() {
		if (
			!termsAcknowledged ||
			!storefront.checkoutEnabled ||
			checkoutStartingRef.current
		) {
			return;
		}
		checkoutStartingRef.current = true;
		setCheckoutStarting(true);
		setCheckoutError(null);
		try {
			const response = await checkout(termsAcknowledged);
			window.location.assign(response.checkoutUrl);
		} catch {
			setCheckoutError(
				'Secure checkout could not be opened. Please try again once. If it still does not open, contact us before attempting another payment.',
			);
			checkoutStartingRef.current = false;
			setCheckoutStarting(false);
		}
	}

	return (
		<section className='section page-section'>
			<div className='section-heading'>
				<div>
					<p className='eyebrow'>Cart</p>
					<h1>Your boards</h1>
				</div>
				<Link
					className='text-link'
					to='/shop'>
					Continue shopping
				</Link>
			</div>
			{error && (
				<div
					className='cart-error'
					role='alert'>
					<p>{error}</p>
					<button
						type='button'
						className='text-link'
						onClick={() => {
							void retryCart();
						}}>
						Refresh cart
					</button>
				</div>
			)}

			{loadingCart && !cart ? (
				<div
					className='cart-empty-page'
					aria-live='polite'>
					<p>Loading your cart…</p>
				</div>
			) : !cart && error ? (
				<div className='cart-empty-page'>
					<p>
						Your saved cart could not be loaded. Use Refresh cart above to try
						again.
					</p>
				</div>
			) : !cart || cart.items.length === 0 ? (
				<div className='cart-empty-page'>
					<p>Your cart is empty.</p>
					<Link
						className='button primary'
						to='/shop'>
						Shop cutting boards
					</Link>
				</div>
			) : (
				<div className='cart-page-grid'>
					<div
						className='cart-page-lines'
						aria-live='polite'
						aria-busy={loading}>
						{cart.items.map((line) => (
							<article
								className='cart-page-line'
								key={line.id}>
								<img
									src={line.product.imageUrl}
									alt={line.product.name}
								/>
								<div>
									<p className='product-meta'>
										{line.selectedWood || line.product.wood}
									</p>
									<h2>{line.product.name}</h2>
									<p>{line.product.dimensions}</p>
									{(line.selectedWood ||
										line.rubberFeet ||
										line.bronzeRubberFeet) && (
										<div className='cart-line-options'>
											{line.selectedWood && (
												<span>Wood: {line.selectedWood}</span>
											)}
											{line.rubberFeet && <span>Rubber feet +$10</span>}
											{line.bronzeRubberFeet && (
												<span>Bronze rubber feet +$20</span>
											)}
										</div>
									)}
									<div className='cart-line-controls'>
										<div
											className='quantity-row'
											aria-label={`${line.product.name} quantity`}>
											<button
												type='button'
												onClick={() => updateItem(line.id, line.quantity - 1)}
												disabled={loading}
												aria-label={`Decrease ${line.product.name} quantity`}>
												<Minus
													size={15}
													aria-hidden='true'
												/>
											</button>
											<span
												aria-live='polite'
												aria-atomic='true'>
												{line.quantity}
											</span>
											<button
												type='button'
												onClick={() => updateItem(line.id, line.quantity + 1)}
												disabled={loading}
												aria-label={`Increase ${line.product.name} quantity`}>
												<Plus
													size={15}
													aria-hidden='true'
												/>
											</button>
										</div>
										<button
											type='button'
											className='trash-button'
											onClick={() => removeItem(line.id)}
											disabled={loading}
											aria-label={`Remove ${line.product.name} from cart`}>
											<Trash2
												size={15}
												aria-hidden='true'
											/>
										</button>
									</div>
								</div>
								<strong>{formatMoney(line.lineTotalCents)}</strong>
							</article>
						))}
					</div>

					<aside className='order-summary'>
						<h2>Order summary</h2>
						<div>
							<span>Subtotal</span>
							<strong>{formatMoney(cart.subtotalCents)}</strong>
						</div>
						<div>
							<span>Shipping </span>
							<strong>
								{cart.estimatedShippingCents === 0
									? 'Free'
									: formatMoney(cart.estimatedShippingCents)}
							</strong>
						</div>
						<div className='summary-total'>
							<span>Estimated total before tax</span>
							<strong>{formatMoney(cart.totalCents)}</strong>
						</div>
						<p className='cart-pricing-note'>
							Orders of $150 or more ship free. Orders under $150 ship for a
							flat $12. Tax is calculated at checkout.
						</p>
						<section
							className='order-consent'
							aria-labelledby='order-consent-heading'>
							<h3 id='order-consent-heading'>Before placing your order</h3>
							<ol>
								<li>
									Wood is a natural material. Grain pattern, color, and other
									visual details vary from board to board, so your finished
									piece will be unique and may not look exactly like the product
									photos. Each board is individually selected and crafted in our
									small shop.
								</li>
								<li>
									Because we continue to fulfill military obligations, please
									allow 2-3 weeks for your order to be completed.
								</li>
							</ol>
							<div className='consent-check'>
								<input
									id='legal-attestation'
									type='checkbox'
									required
									aria-required='true'
									aria-describedby='legal-attestation-detail'
									checked={termsAcknowledged}
									onChange={(event) =>
										setTermsAcknowledged(event.target.checked)
									}
								/>
								<label htmlFor='legal-attestation'>
									I have read and agree to the{' '}
									<Link
										to='/terms'
										target='_blank'
										rel='noreferrer'>
										Terms of Use
										<span className='sr-only'> (opens in a new tab)</span>
									</Link>
									,{' '}
									<Link
										to='/privacy'
										target='_blank'
										rel='noreferrer'>
										Privacy Policy
										<span className='sr-only'> (opens in a new tab)</span>
									</Link>
									, and{' '}
									<Link
										to='/cookies'
										target='_blank'
										rel='noreferrer'>
										Cookie Policy
										<span className='sr-only'> (opens in a new tab)</span>
									</Link>
									.
								</label>
							</div>
							<p
								id='legal-attestation-detail'
								className='consent-detail'>
								Checking this box creates an electronic agreement and is
								required to continue to checkout.
							</p>
						</section>
						<p className='checkout-destination'>
							Card, shipping, and tax details are entered securely on Stripe's
							payment page.
						</p>
						<button
							className='button primary full'
							type='button'
							disabled={
								loading ||
								checkoutStarting ||
								loadingStorefront ||
								!storefront.checkoutEnabled ||
								!termsAcknowledged
							}
							aria-describedby='order-consent-heading legal-attestation-detail'
							onClick={handleCheckout}>
							{checkoutStarting ? 'Opening checkout…' : 'Checkout securely'}
						</button>
						{!loadingStorefront && !storefront.checkoutEnabled && (
							<p
								className='checkout-error'
								role='status'>
								Checkout is temporarily unavailable. Please email{' '}
								<a href={`mailto:${storefront.supportEmail}`}>
									{storefront.supportEmail || 'finnyboyfab@gmail.com'}
								</a>{' '}
								if you have a question about an order.
							</p>
						)}
						{storefrontError && (
							<p
								className='checkout-error'
								role='alert'>
								{storefrontError}
							</p>
						)}
						{checkoutError && (
							<p
								className='checkout-error'
								role='alert'>
								{checkoutError}
							</p>
						)}
					</aside>
				</div>
			)}
		</section>
	);
}
