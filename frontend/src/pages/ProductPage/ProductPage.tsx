import { ArrowLeft, Check, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProduct } from '../../lib/api';
import { useCart } from '../../lib/cart';
import { formatMoney } from '../../lib/format';
import type { Product } from '../../types/store';
import ProductGallery from './ProductGallery';
import './ProductPage.css';

export default function ProductPage() {
	const { slug } = useParams();
	const [product, setProduct] = useState<Product | null>(null);
	const [quantity, setQuantity] = useState(1);
	const [selectedWood, setSelectedWood] = useState('');
	const [rubberFeet, setRubberFeet] = useState(false);
	const [initialsEngraving, setInitialsEngraving] = useState(false);
	const [initials, setInitials] = useState('');
	const { addItem, loading } = useCart();
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
		if (slug) {
			getProduct(slug).then((nextProduct) => {
				setProduct(nextProduct);
				setSelectedWood(nextProduct.woodOptions[0] ?? '');
			});
		}
	}, [slug]);

	useEffect(() => {
		if (product) document.title = `${product.name} | Finny Boy Fab`;
	}, [product]);

	if (!product) {
		return (
			<section className='section page-section' aria-busy='true' aria-live='polite'>
				<p className='eyebrow'>Loading</p>
				<h1>Preparing product details</h1>
			</section>
		);
	}

	const addOnPriceCents =
		(rubberFeet ? 1000 : 0) + (initialsEngraving ? 1000 : 0);
	const selectedWoodPriceCents = selectedWood
		? (product.woodPriceCents[selectedWood] ?? product.priceCents)
		: product.priceCents;
	const unitPriceCents = selectedWoodPriceCents + addOnPriceCents;
	const trimmedInitials = initials.trim().toUpperCase();
	const requiresInitials = initialsEngraving && trimmedInitials.length === 0;

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
								onChange={(event) => setRubberFeet(event.target.checked)}
							/>
							<span>
								<strong>Add rubber feet</strong>
								<small>+$10</small>
							</span>
						</label>
						<label className='option-row'>
							<input
								type='checkbox'
								checked={initialsEngraving}
								onChange={(event) => {
									setInitialsEngraving(event.target.checked);
									if (!event.target.checked) {
										setInitials('');
									}
								}}
							/>
							<span>
								<strong>Add initials engraving</strong>
								<small>+$10</small>
							</span>
						</label>
						<label className='initials-field'>
							<span>Initials</span>
							<input
								id='product-initials'
								type='text'
								value={initials}
								maxLength={3}
								disabled={!initialsEngraving}
								required={initialsEngraving}
								aria-invalid={requiresInitials}
								aria-describedby={initialsEngraving ? 'initials-help' : undefined}
								placeholder='ABC'
								onChange={(event) =>
									setInitials(
										event.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase(),
									)
								}
							/>
							{initialsEngraving && (
								<small id='initials-help' className={requiresInitials ? 'field-error' : undefined}>
									Enter 1 to 3 letters.
								</small>
							)}
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
							disabled={loading || requiresInitials}
							onClick={() =>
								addItem(product.id, quantity, {
									selectedWood,
									rubberFeet,
									initialsEngraving,
									initials: trimmedInitials,
								})
							}>
							<ShoppingBag size={18} aria-hidden='true' /> {loading ? 'Adding…' : 'Add to cart'}
						</button>
					</div>
				</div>
			</div>
		</section>
	);
}
