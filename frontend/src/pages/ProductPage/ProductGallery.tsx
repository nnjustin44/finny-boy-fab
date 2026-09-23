import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type ImageLoadState = {
	loaded: boolean;
	aspectRatio: number;
};

type ProductGalleryProps = {
	images: string[];
	altText: string;
};

const SWIPE_THRESHOLD_PX = 50;

export default function ProductGallery({
	images,
	altText,
}: ProductGalleryProps) {
	const [activeImageIndex, setActiveImageIndex] = useState(0);
	const [displayedImageIndex, setDisplayedImageIndex] = useState(0);
	const [imageLoadStates, setImageLoadStates] = useState<
		Record<string, ImageLoadState>
	>({});
	const touchStartX = useRef<number | null>(null);
	const galleryRef = useRef<HTMLDivElement>(null);
	const imageSetKey = images.join('\u0000');

	const rememberLoadedImage = (
		imageUrl: string,
		naturalWidth: number,
		naturalHeight: number,
	) => {
		if (naturalWidth === 0 || naturalHeight === 0) {
			return;
		}

		setImageLoadStates((currentStates) => {
			// Image may already be cached and marked loaded; avoid a redundant
			// state update that would re-trigger effects for no reason.
			if (currentStates[imageUrl]?.loaded) {
				return currentStates;
			}
			return {
				...currentStates,
				[imageUrl]: {
					loaded: true,
					aspectRatio: naturalWidth / naturalHeight,
				},
			};
		});
	};

	// Reset gallery state whenever the underlying image set changes
	// (e.g. navigating to a different product)
	useEffect(() => {
		setActiveImageIndex(0);
		setDisplayedImageIndex(0);
		setImageLoadStates({});
	}, [imageSetKey]);

	useEffect(() => {
		let cancelled = false;
		const preloadedImages = images.map((imageUrl) => {
			const preloadedImage = new Image();

			preloadedImage.decoding = 'async';
			preloadedImage.onload = () => {
				if (!cancelled) {
					rememberLoadedImage(
						imageUrl,
						preloadedImage.naturalWidth,
						preloadedImage.naturalHeight,
					);
				}
			};
			preloadedImage.src = imageUrl;

			if (preloadedImage.complete) {
				rememberLoadedImage(
					imageUrl,
					preloadedImage.naturalWidth,
					preloadedImage.naturalHeight,
				);
			}

			return preloadedImage;
		});

		return () => {
			cancelled = true;
			preloadedImages.forEach((preloadedImage) => {
				preloadedImage.onload = null;
			});
		};
	}, [imageSetKey]);

	const activeImage = images[activeImageIndex] ?? '';

	useEffect(() => {
		if (activeImage && imageLoadStates[activeImage]?.loaded) {
			setDisplayedImageIndex(activeImageIndex);
		}
	}, [activeImage, activeImageIndex, imageLoadStates]);

	const displayedImage = images[displayedImageIndex] ?? activeImage;
	const activeImageAspectRatio =
		imageLoadStates[displayedImage]?.aspectRatio ?? 3 / 2;
	const hasMultipleImages = images.length > 1;

	const rememberImageLoad = (imageUrl: string, image: HTMLImageElement) => {
		rememberLoadedImage(imageUrl, image.naturalWidth, image.naturalHeight);

		if (imageUrl === activeImage) {
			setDisplayedImageIndex(activeImageIndex);
		}
	};

	const changeImage = (offset: number) => {
		setActiveImageIndex(
			(currentIndex) => (currentIndex + offset + images.length) % images.length,
		);
	};

	const goToImage = (index: number) => {
		setActiveImageIndex(index);
	};

	// Keyboard navigation — only active while the gallery has focus,
	// so it doesn't hijack arrow keys used elsewhere on the page.
	const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
		if (!hasMultipleImages) return;
		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			changeImage(-1);
		} else if (event.key === 'ArrowRight') {
			event.preventDefault();
			changeImage(1);
		}
	};

	const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
		touchStartX.current = event.touches[0].clientX;
	};

	const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
		if (touchStartX.current === null) return;
		const deltaX = event.changedTouches[0].clientX - touchStartX.current;
		touchStartX.current = null;

		if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
		changeImage(deltaX > 0 ? -1 : 1);
	};

	return (
		<div
			className='product-detail-image'
			style={{ aspectRatio: activeImageAspectRatio }}
			ref={galleryRef}
			tabIndex={0}
			role='group'
			aria-label={`${altText} image gallery. Use left and right arrow keys to change images.`}
			aria-roledescription='carousel'
			onKeyDown={handleKeyDown}
			onTouchStart={handleTouchStart}
			onTouchEnd={handleTouchEnd}>
			{images.map((imageUrl, imageIndex) => (
				<img
					key={imageUrl}
					className={imageIndex === displayedImageIndex ? 'active' : ''}
					src={imageUrl}
					alt={imageIndex === displayedImageIndex ? `${altText}, image ${imageIndex + 1} of ${images.length}` : ''}
					aria-hidden={imageIndex !== displayedImageIndex}
					loading='eager'
					decoding='async'
					fetchPriority={imageIndex === 0 ? 'high' : 'low'}
					onLoad={(event) => rememberImageLoad(imageUrl, event.currentTarget)}
				/>
			))}
			{hasMultipleImages && (
				<>
					<button
						className='product-image-control previous'
						type='button'
						onClick={() => changeImage(-1)}
						aria-label='Show previous product image'>
						<ChevronLeft size={24} aria-hidden='true' />
					</button>
					<button
						className='product-image-control next'
						type='button'
						onClick={() => changeImage(1)}
						aria-label='Show next product image'>
						<ChevronRight size={24} aria-hidden='true' />
					</button>
					<div className='product-image-dots' role='group' aria-label='Select product image'>
						{images.map((imageUrl, imageIndex) => (
							<button
								key={imageUrl}
								className={
									imageIndex === activeImageIndex
										? 'product-image-dot active'
										: 'product-image-dot'
								}
								type='button'
								aria-pressed={imageIndex === activeImageIndex}
								aria-label={`Show image ${imageIndex + 1} of ${images.length}`}
								onClick={() => goToImage(imageIndex)}
							/>
						))}
					</div>
					<p className='sr-only' aria-live='polite' aria-atomic='true'>
						Showing image {activeImageIndex + 1} of {images.length}
					</p>
				</>
			)}
		</div>
	);
}
