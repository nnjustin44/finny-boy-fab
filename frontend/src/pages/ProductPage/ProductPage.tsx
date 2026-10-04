import { ArrowLeft, Check, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError, getProduct } from '../../lib/api';
import { useCart } from '../../lib/cart';
import { formatMoney } from '../../lib/format';
import type { Product } from '../../types/store';
import ProductGallery from './ProductGallery';
import './ProductPage.css';

export default function ProductPage() {
	const { slug } = useParams();
	const [product, setProduct] = useState<Product | null>(null);
	const [productMissing, setProductMissing] = useState(false);
	const [productError, setProductError] = useState(false);
	const [productRetry, setProductRetry] = useState(0);
	const [quantity, setQuantity] = useState(1);
	const [selectedWood, setSelectedWood] = useState('');
	const [rubberFeet, setRubberFeet] = useState(false);
	const [bronzeRubberFeet, setBronzeRubberFeet] = useState(false);
	const { addItem, loading, error: cartError } = useCart();
	const productImages = useMemo(() => {
		if (!product) return [];

		// Preserve original de-dup behavior, but keep imageUrl first and
		// drop any accidental duplicate from imageUrls rather than relying
		// on Set's insertion-order semantics.
		return [
			product.imageUrl,
			...product.imageUrls.filter((url) => url !== product.imageUrl),
		];
	}, [product]);

	useEffect(() => {
		let active = true;
		if (slug) {
			setProduct(null);
			setProductMissing(false);
			setProductError(false);
			getProduct(slug)
				.then((nextProduct) => {
					if (!active) return;
					setProduct(nextProduct);
					setSelectedWood(nextProduct.woodOptions[0] ?? '');
				})
				.catch((cause) => {
					if (!active) return;
					if (cause instanceof ApiError && cause.status === 404) setProductMissing(true);
					else setProductError(true);
				});
		}
		return () => {
			active = false;
		};
	}, [slug, productRetry]);

	if (productError) {
		return (
			<section className='section page-section' role='alert'>
				<h1>Product details are unavailable</h1>
				<p>Please try loading this board again.</p>
				<button className='button primary' type='button' onClick={() => setProductRetry(count => count + 1)}>Try again</button>
			</section>
		);
	}

	if (productMissing) {
		return (
			<section className='section page-section'>
				<p className='eyebrow'>Product not found</p>
				<h1>That board is no longer in the shop.</h1>
				<p>The product may have sold out or the link may be out of date.</p>
				<Link className='button primary' to='/shop'>
					Browse available boards
				</Link>
			</section>
		);
	}

	if (!product) {
		return (
			<section className='section page-section' aria-busy='true' aria-live='polite'>
				<p className='eyebrow'>Loading</p>
				<h1>Preparing product details</h1>
			</section>
		);
	}

	const addOnPriceCents =
		(rubberFeet ? 1000 : 0) + (bronzeRubberFeet ? 2000 : 0);
	const selectedWoodPriceCents = selectedWood
		? (product.woodPriceCents[selectedWood] ?? product.priceCents)
		: product.priceCents;
	const unitPriceCents = selectedWoodPriceCents + addOnPriceCents;
	return (
		<section className='section product-detail'>
			<Link
				className='text-link back-link'
				to='/shop'>
				<ArrowLeft size={16} aria-hidden='true' /> Back to shop
			</Link>
			<div className='product-detail-grid'>
				<ProductGallery
					images={productImages}
					altText={product.name}
				/>
				<div className='product-detail-copy'>
					<p className='eyebrow'>{product.wood}</p>
					<h1>{product.name}</h1>
					<p className='product-lede'>{product.description}</p>
					<p>{product.story}</p>
					<div className='product-dimensions'>
						<span>Dimensions: </span>
						<strong>{product.dimensions}</strong>
					</div>

					<ul className='detail-list'>
						{product.details.map((detail) => (
							<li key={detail}>
								<Check size={17} aria-hidden='true' /> {detail}
							</li>
						))}
					</ul>
					<fieldset className='customization-panel'>
						<legend className='sr-only'>Board customization</legend>
						{product.woodOptions.length > 0 && (
							<label className='wood-field'>
								<span>Wood</span>
								<select
									value={selectedWood}
									onChange={(event) => setSelectedWood(event.target.value)}>
									{product.woodOptions.map((wood) => (
										<option
											key={wood}
											value={wood}>
											{wood}
										</option>
									))}
								</select>
							</label>
						)}
						<label className='option-row'>
							<input
								type='checkbox'
								checked={rubberFeet}
								onChange={(event) => {
									setRubberFeet(event.target.checked);
									if (event.target.checked) setBronzeRubberFeet(false);
								}}
							/>
							<span>
								<strong>Add rubber feet</strong>
								<small>+$10</small>
							</span>
						</label>
						<label className='option-row'>
							<input
								type='checkbox'
								checked={bronzeRubberFeet}
								onChange={(event) => {
									setBronzeRubberFeet(event.target.checked);
									if (event.target.checked) setRubberFeet(false);
								}}
							/>
							<span>
								<strong>Add bronze rubber feet</strong>
								<small>+$20</small>
							</span>
						</label>
					</fieldset>
					<div className='purchase-row'>
						<strong className='product-price' aria-live='polite' aria-atomic='true'>
							{formatMoney(unitPriceCents)}
						</strong>
						<div
							className='quantity-stepper'
							aria-label='Quantity'>
							<button
								type='button'
								onClick={() => setQuantity(Math.max(1, quantity - 1))}
								disabled={quantity <= 1}
								aria-label='Decrease quantity'>
								<Minus size={16} aria-hidden='true' />
							</button>
							<span aria-live='polite' aria-atomic='true'>{quantity}</span>
							<button
								type='button'
								onClick={() =>
									setQuantity(Math.min(product.inventory, quantity + 1))
								}
								disabled={quantity >= product.inventory}
								aria-label='Increase quantity'>
								<Plus size={16} aria-hidden='true' />
							</button>
						</div>
						<button
							className='button primary'
							type='button'
							disabled={loading}
							onClick={() =>
								addItem(product.id, quantity, {
									selectedWood,
									rubberFeet,
									bronzeRubberFeet,
								})
							}>
							<ShoppingBag size={18} aria-hidden='true' /> {loading ? 'Adding…' : 'Add to cart'}
						</button>
					</div>
					{cartError && <p className='product-cart-error' role='alert'>{cartError}</p>}
					<p className='product-policy-note'>
						14-day returns, no reason required. One-year warranty against deformation
						caused by our workmanship or wood movement. The warranty is void if the board
						is placed in a dishwasher. <Link to='/terms'>Read the full policy.</Link>
					</p>
					</div>
			</div>
		</section>
	);
}
