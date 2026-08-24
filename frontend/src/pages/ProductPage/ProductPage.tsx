import {
	ArrowLeft,
	Check,
	ChevronLeft,
	ChevronRight,
	Minus,
	Plus,
	ShoppingBag,
} from 'lucide-react';
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
	const [activeImageIndex, setActiveImageIndex] = useState(0);
	const [displayedImageIndex, setDisplayedImageIndex] = useState(0);
	const [imageAspectRatios, setImageAspectRatios] = useState<
		Record<string, number>
	>({});
	const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
	const { addItem, loading } = useCart();

	useEffect(() => {
		if (slug) {
			getProduct(slug).then((nextProduct) => {
				setProduct(nextProduct);
				setSelectedWood(nextProduct.woodOptions?.[0] ?? '');
				setActiveImageIndex(0);
				setDisplayedImageIndex(0);
				setLoadedImages({});
			});
		}
	}, [slug]);

	const productImages = product
		? Array.from(new Set([product.imageUrl, ...(product.imageUrls ?? [])]))
		: [];
	const productImagesKey = productImages.join('|');
	const activeImage = productImages[activeImageIndex] ?? product?.imageUrl ?? '';

	useEffect(() => {
		productImages.forEach((imageUrl) => {
			const image = new Image();
			image.src = imageUrl;
		});
	}, [productImagesKey]);

	useEffect(() => {
		if (activeImage && loadedImages[activeImage]) {
			setDisplayedImageIndex(activeImageIndex);
		}
	}, [activeImage, activeImageIndex, loadedImages]);

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
	const selectedWoodPriceCents = selectedWood
		? (product.woodPriceCents?.[selectedWood] ?? product.priceCents)
		: product.priceCents;
	const unitPriceCents = selectedWoodPriceCents + addOnPriceCents;
	const trimmedInitials = initials.trim().toUpperCase();
	const requiresInitials = initialsEngraving && trimmedInitials.length === 0;
	const displayedImage = productImages[displayedImageIndex] ?? activeImage;
	const activeImageAspectRatio = imageAspectRatios[displayedImage] ?? 3 / 2;
	const hasMultipleImages = productImages.length > 1;
	const rememberImageLoad = (imageUrl: string, image: HTMLImageElement) => {
		if (image.naturalWidth > 0 && image.naturalHeight > 0) {
			setImageAspectRatios((currentRatios) => ({
				...currentRatios,
				[imageUrl]: image.naturalWidth / image.naturalHeight,
			}));
		}

		setLoadedImages((currentImages) => ({
			...currentImages,
			[imageUrl]: true,
		}));

		if (imageUrl === activeImage) {
			setDisplayedImageIndex(activeImageIndex);
		}
	};
	const showPreviousImage = () => {
		setActiveImageIndex((currentIndex) =>
			currentIndex === 0 ? productImages.length - 1 : currentIndex - 1,
		);
	};
	const showNextImage = () => {
		setActiveImageIndex((currentIndex) =>
			currentIndex === productImages.length - 1 ? 0 : currentIndex + 1,
		);
	};

	return (
		<section className='section product-detail'>
			<Link
				className='text-link back-link'
				to='/shop'>
				<ArrowLeft size={16} /> Back to shop
			</Link>
			<div className='product-detail-grid'>
				<div
					className='product-detail-image'
					style={{ aspectRatio: activeImageAspectRatio }}>
					{productImages.map((imageUrl, imageIndex) => (
						<img
							key={imageUrl}
							className={
								imageIndex === displayedImageIndex ? 'active' : ''
							}
							src={imageUrl}
							alt={imageIndex === activeImageIndex ? product.name : ''}
							aria-hidden={imageIndex !== activeImageIndex}
							loading='eager'
							decoding='async'
							onLoad={(event) =>
								rememberImageLoad(imageUrl, event.currentTarget)
							}
						/>
					))}
					{hasMultipleImages && (
						<>
							<button
								className='product-image-control previous'
								type='button'
								onClick={showPreviousImage}
								aria-label='Show previous product image'>
								<ChevronLeft size={24} />
							</button>
							<button
								className='product-image-control next'
								type='button'
								onClick={showNextImage}
								aria-label='Show next product image'>
								<ChevronRight size={24} />
							</button>
						</>
					)}
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
