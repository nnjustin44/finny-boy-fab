import { ArrowLeft, Check, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProduct } from '../../lib/api';
import { useCart } from '../../lib/cart';
import { formatMoney } from '../../lib/format';
import type { Product } from '../../types/store';
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

	useEffect(() => {
		if (slug) {
			getProduct(slug).then((nextProduct) => {
				setProduct(nextProduct);
				setSelectedWood(nextProduct.woodOptions?.[0] ?? '');
			});
		}
	}, [slug]);

	if (!product) {
		return (
			<section className='section page-section'>
				<p className='eyebrow'>Loading</p>
				<h1>Preparing product details</h1>
			</section>
		);
	}

	const addOnPriceCents =
		(rubberFeet ? 1000 : 0) + (initialsEngraving ? 1000 : 0);
	const unitPriceCents = product.priceCents + addOnPriceCents;
	const trimmedInitials = initials.trim().toUpperCase();
	const requiresInitials = initialsEngraving && trimmedInitials.length === 0;

	return (
		<section className='section product-detail'>
			<Link
				className='text-link back-link'
				to='/shop'>
				<ArrowLeft size={16} /> Back to shop
			</Link>
			<div className='product-detail-grid'>
				<div className='product-detail-image'>
					<img
						src={product.imageUrl}
						alt={product.name}
					/>
				</div>
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
								<Check size={17} /> {detail}
							</li>
						))}
					</ul>
					<div
						className='customization-panel'
						aria-label='Board customization'>
						{(product.woodOptions?.length ?? 0) > 0 && (
							<label className='wood-field'>
								<span>Wood</span>
								<select
									value={selectedWood}
									onChange={(event) => setSelectedWood(event.target.value)}>
									{product.woodOptions?.map((wood) => (
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
								type='text'
								value={initials}
								maxLength={3}
								disabled={!initialsEngraving}
								placeholder='ABC'
								onChange={(event) =>
									setInitials(
										event.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase(),
									)
								}
							/>
						</label>
					</div>
					<div className='purchase-row'>
						<strong className='product-price'>
							{formatMoney(unitPriceCents)}
						</strong>
						<div
							className='quantity-stepper'
							aria-label='Quantity'>
							<button
								type='button'
								onClick={() => setQuantity(Math.max(1, quantity - 1))}
								aria-label='Decrease quantity'>
								<Minus size={16} />
							</button>
							<span>{quantity}</span>
							<button
								type='button'
								onClick={() =>
									setQuantity(Math.min(product.inventory, quantity + 1))
								}
								aria-label='Increase quantity'>
								<Plus size={16} />
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
							<ShoppingBag size={18} /> Add to cart
						</button>
					</div>
				</div>
			</div>
		</section>
	);
}
