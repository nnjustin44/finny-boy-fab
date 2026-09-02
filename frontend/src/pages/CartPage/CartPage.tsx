import { Minus, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../lib/cart';
import { formatMoney } from '../../lib/format';
import '../../styles/cart.css';
import './CartPage.css';

export default function CartPage() {
	const { cart, checkout, removeItem, updateItem, loading } = useCart();
	const [termsAcknowledged, setTermsAcknowledged] = useState(false);
	const [checkoutError, setCheckoutError] = useState<string | null>(null);

	async function handleCheckout() {
		if (!termsAcknowledged) {
			return;
		}
		setCheckoutError(null);
		try {
			const response = await checkout(termsAcknowledged);
			window.location.assign(response.checkoutUrl);
		} catch {
			setCheckoutError('Unable to start secure checkout. Please try again.');
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

			{!cart || cart.items.length === 0 ? (
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
					<div className='cart-page-lines' aria-live='polite' aria-busy={loading}>
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
										line.initialsEngraving) && (
										<div className='cart-line-options'>
											{line.selectedWood && (
												<span>Wood: {line.selectedWood}</span>
											)}
											{line.rubberFeet && <span>Rubber feet +$10</span>}
											{line.initialsEngraving && (
												<span>Initials engraving "{line.initials}" +$10</span>
											)}
										</div>
									)}
									<div className='quantity-row'>
										<button
											type='button'
											onClick={() => updateItem(line.id, line.quantity - 1)}
											disabled={loading}
											aria-label={`Decrease ${line.product.name} quantity`}>
											<Minus size={15} aria-hidden='true' />
										</button>
										<span aria-live='polite' aria-atomic='true'>{line.quantity}</span>
										<button
											type='button'
											onClick={() => updateItem(line.id, line.quantity + 1)}
											disabled={loading}
											aria-label={`Increase ${line.product.name} quantity`}>
											<Plus size={15} aria-hidden='true' />
										</button>
										<button
											type='button'
											className='trash-button'
											onClick={() => removeItem(line.id)}
											disabled={loading}
											aria-label={`Remove ${line.product.name} from cart`}>
											<Trash2 size={15} aria-hidden='true' />
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
							<span>Estimated shipping</span>
							<strong>
								{cart.estimatedShippingCents === 0
									? 'Free'
									: formatMoney(cart.estimatedShippingCents)}
							</strong>
						</div>
						<div className='summary-total'>
							<span>Total</span>
							<strong>{formatMoney(cart.totalCents)}</strong>
						</div>
						<section
							className='order-consent'
							aria-labelledby='order-consent-heading'>
							<h3 id='order-consent-heading'>Before placing your order</h3>
							<ol>
								<li>
									Wood is a natural material. Grain pattern, color, and other
									visual details vary from board to board, so your finished piece
									will be unique and may not look exactly like the product photos.
									Each board is individually selected and crafted in our small shop.
								</li>
								<li>
									Because we continue to fulfill military obligations, please allow
									2-3 weeks for your order to be completed.
								</li>
							</ol>
							<label className='consent-check'>
								<input
									type='checkbox'
									checked={termsAcknowledged}
									onChange={(event) =>
										setTermsAcknowledged(event.target.checked)
									}
								/>
								<span>I acknowledge these terms.</span>
							</label>
						</section>
						<button
							className='button primary full'
							type='button'
							disabled={loading || !termsAcknowledged}
							aria-describedby='order-consent-heading'
							onClick={handleCheckout}>
							{loading ? 'Opening checkout…' : 'Checkout securely'}
						</button>
						{checkoutError && (
							<p className='checkout-error' role='alert'>
								{checkoutError}
							</p>
						)}
					</aside>
				</div>
			)}
		</section>
	);
}
