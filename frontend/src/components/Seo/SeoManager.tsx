import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getProduct } from '../../lib/api';
import type { Product } from '../../types/store';

type SeoPage = {
	title: string;
	description: string;
	index?: boolean;
	canonicalPath?: string;
};

const defaultImage = '/images/optimized/hero-boards.jpg';

const pages: Record<string, SeoPage> = {
	'/': {
		title: 'Handcrafted Cutting Boards | Finny Boy Fab',
		description:
			'Shop handcrafted hardwood cutting boards and serving boards, made in North Carolina by veteran-owned Finny Boy Fab.',
	},
	'/home': {
		title: 'Handcrafted Cutting Boards | Finny Boy Fab',
		description:
			'Shop handcrafted hardwood cutting boards and serving boards, made in North Carolina by veteran-owned Finny Boy Fab.',
		canonicalPath: '/',
	},
	'/shop': {
		title: 'Shop Hardwood Cutting Boards | Finny Boy Fab',
		description:
			'Shop small-batch end-grain cutting boards, charcuterie boards, and serving boards handcrafted from premium hardwoods.',
	},
	'/about': {
		title: 'Our Story | Veteran-Owned Finny Boy Fab',
		description:
			'Meet the family behind Finny Boy Fab, a veteran-owned North Carolina shop making nontoxic hardwood boards by hand.',
	},
	'/learn': {
		title: 'Hardwood Cutting Board Care Guide | Finny Boy Fab',
		description:
			'Learn how to choose, wash, dry, and maintain hardwood cutting boards, plus the differences between end grain and edge grain.',
	},
	'/contact': {
		title: 'Contact Finny Boy Fab',
		description:
			'Contact Finny Boy Fab with questions about handcrafted cutting boards, existing orders, care, or product availability.',
	},
	'/custom-inquiry': {
		title: 'Custom Cutting Board Inquiry | Finny Boy Fab',
		description:
			'Request a one-of-a-kind hardwood cutting board, serving board, or custom woodworking project from Finny Boy Fab.',
	},
	'/cart': {
		title: 'Your Cart | Finny Boy Fab',
		description: 'Review the handcrafted boards in your Finny Boy Fab shopping cart.',
		index: false,
	},
	'/checkout/success': {
		title: 'Order Status | Finny Boy Fab',
		description: 'Review the status of your Finny Boy Fab order.',
		index: false,
	},
	'/privacy': {
		title: 'Privacy Policy | Finny Boy Fab',
		description: 'Learn how Finny Boy Fab collects, uses, shares, and protects personal information.',
	},
	'/cookies': {
		title: 'Cookie Policy | Finny Boy Fab',
		description: 'Learn how the Finny Boy Fab storefront uses essential browser storage and third-party services.',
	},
	'/terms': {
		title: 'Terms of Use | Finny Boy Fab',
		description: 'Read the terms governing use of the Finny Boy Fab storefront and purchases made through it.',
	},
};

function absoluteUrl(path: string) {
	return new URL(path, window.location.origin).toString();
}

function setMeta(attribute: 'name' | 'property', key: string, content: string) {
	let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
	if (!element) {
		element = document.createElement('meta');
		element.setAttribute(attribute, key);
		document.head.appendChild(element);
	}
	element.content = content;
}

function setCanonical(url: string) {
	let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
	if (!link) {
		link = document.createElement('link');
		link.rel = 'canonical';
		document.head.appendChild(link);
	}
	link.href = url;
}

function setStructuredData(value: unknown) {
	let script = document.head.querySelector<HTMLScriptElement>('#seo-structured-data');
	if (!script) {
		script = document.createElement('script');
		script.id = 'seo-structured-data';
		script.type = 'application/ld+json';
		document.head.appendChild(script);
	}
	script.textContent = JSON.stringify(value);
}

function organization(origin: string) {
	return {
		'@type': 'Organization',
		'@id': `${origin}/#organization`,
		name: 'Finny Boy Fab',
		alternateName: 'Finny Boy Fabrications',
		url: `${origin}/`,
		logo: `${origin}/images/optimized/primary-logo-main.png`,
		description:
			'Veteran-owned North Carolina maker of handcrafted hardwood cutting boards and serving boards.',
	};
}

function pageStructuredData(pathname: string, title: string, description: string) {
	const origin = window.location.origin;
	const canonicalPath = pages[pathname]?.canonicalPath ?? pathname;
	const graph: unknown[] = [organization(origin)];

	if (canonicalPath === '/') {
		graph.push({
			'@type': 'WebSite',
			'@id': `${origin}/#website`,
			url: `${origin}/`,
			name: 'Finny Boy Fab',
			description,
			publisher: { '@id': `${origin}/#organization` },
			inLanguage: 'en-US',
		});
	} else {
		graph.push({
			'@type': 'WebPage',
			'@id': `${origin}${canonicalPath}#webpage`,
			url: `${origin}${canonicalPath}`,
			name: title,
			description,
			isPartOf: { '@id': `${origin}/#website` },
			inLanguage: 'en-US',
		});
	}

	return { '@context': 'https://schema.org', '@graph': graph };
}

function productStructuredData(product: Product) {
	const origin = window.location.origin;
	const productPath = `/products/${product.slug}`;
	const images = [product.imageUrl, ...product.imageUrls.filter((image) => image !== product.imageUrl)]
		.map(absoluteUrl);

	return {
		'@context': 'https://schema.org',
		'@graph': [
			organization(origin),
			{
				'@type': 'BreadcrumbList',
				itemListElement: [
					{ '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
					{ '@type': 'ListItem', position: 2, name: 'Shop', item: `${origin}/shop` },
					{ '@type': 'ListItem', position: 3, name: product.name, item: `${origin}${productPath}` },
				],
			},
			{
				'@type': 'Product',
				'@id': `${origin}${productPath}#product`,
				name: product.name,
				description: `${product.description} ${product.story}`,
				image: images,
				sku: product.id,
				brand: { '@type': 'Brand', name: 'Finny Boy Fab' },
				material: product.wood,
				size: product.dimensions,
				category: 'Cutting Boards & Serving Boards',
				offers: {
					'@type': 'Offer',
					url: `${origin}${productPath}`,
					priceCurrency: 'USD',
					price: (product.priceCents / 100).toFixed(2),
					availability:
						product.inventory > 0
							? 'https://schema.org/InStock'
							: 'https://schema.org/OutOfStock',
					itemCondition: 'https://schema.org/NewCondition',
					seller: { '@id': `${origin}/#organization` },
				},
			},
		],
	};
}

function applySeo(page: SeoPage, pathname: string, product?: Product) {
	const canonicalPath = page.canonicalPath ?? pathname;
	const canonical = absoluteUrl(canonicalPath);
	const image = absoluteUrl(product?.imageUrl ?? defaultImage);
	const robots = page.index === false
		? 'noindex, follow'
		: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

	document.title = page.title;
	setMeta('name', 'description', page.description);
	setMeta('name', 'robots', robots);
	setMeta('name', 'googlebot', robots);
	setCanonical(canonical);
	setMeta('property', 'og:site_name', 'Finny Boy Fab');
	setMeta('property', 'og:locale', 'en_US');
	setMeta('property', 'og:type', product ? 'product' : 'website');
	setMeta('property', 'og:title', page.title);
	setMeta('property', 'og:description', page.description);
	setMeta('property', 'og:url', canonical);
	setMeta('property', 'og:image', image);
	setMeta('property', 'og:image:alt', product?.name ?? 'Handcrafted hardwood boards by Finny Boy Fab');
	setMeta('name', 'twitter:card', 'summary_large_image');
	setMeta('name', 'twitter:title', page.title);
	setMeta('name', 'twitter:description', page.description);
	setMeta('name', 'twitter:image', image);
	setStructuredData(product
		? productStructuredData(product)
		: pageStructuredData(pathname, page.title, page.description));
}

export default function SeoManager() {
	const { pathname } = useLocation();

	useEffect(() => {
		let active = true;
		const productMatch = pathname.match(/^\/products\/([^/]+)$/);

		if (productMatch) {
			const slug = decodeURIComponent(productMatch[1]);
			void getProduct(slug)
				.then((product) => {
					if (!active) return;
					applySeo({
						title: `${product.name} | Finny Boy Fab`,
						description: `${product.description} ${product.wood}. ${product.dimensions}.`,
					}, pathname, product);
				})
				.catch(() => {
					if (!active) return;
					applySeo({
						title: 'Product Not Found | Finny Boy Fab',
						description: 'The requested Finny Boy Fab product could not be found.',
						index: false,
					}, pathname);
				});
		} else {
			applySeo(pages[pathname] ?? {
				title: 'Page Not Found | Finny Boy Fab',
				description: 'The requested page could not be found.',
				index: false,
			}, pathname);
		}

		return () => {
			active = false;
		};
	}, [pathname]);

	return null;
}
