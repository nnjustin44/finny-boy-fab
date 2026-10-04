import { Menu, Share, ShoppingBag, X } from 'lucide-react';
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useCart } from '../../lib/cart';
import CartDrawer from '../CartDrawer';
import SeoManager from '../Seo';
import './Layout.css';

const navItems = [
	{ label: 'Home', to: '/' },
	{ label: 'Shop', to: '/shop' },
	{ label: 'Learn More', to: '/learn' },
	{ label: 'Our Story', to: '/about' },
	{ label: 'Custom Inquiry', to: '/custom-inquiry' },
	{ label: 'Contact', to: '/contact' },
];

const INSTALL_BANNER_DISMISSED_KEY = 'finnyboyfab-install-banner-dismissed';

function shouldShowInstallBanner() {
	const userAgent = window.navigator.userAgent;
	const isAppleMobile =
		/iPhone|iPad|iPod/i.test(userAgent) ||
		(window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
	const isSafari = /Safari/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent);
	const isStandalone =
		window.matchMedia('(display-mode: standalone)').matches ||
		('standalone' in window.navigator &&
			(window.navigator as Navigator & { standalone?: boolean }).standalone === true);

	return (
		isAppleMobile &&
		isSafari &&
		!isStandalone &&
		window.localStorage.getItem(INSTALL_BANNER_DISMISSED_KEY) !== 'true'
	);
}

export default function Layout({ children }: { children: ReactNode }) {
	const [menuOpen, setMenuOpen] = useState(false);
	const [showInstallBanner, setShowInstallBanner] = useState(false);
	const { cart, openCart } = useCart();
	const location = useLocation();
	const mainRef = useRef<HTMLElement>(null);
	const isInitialRoute = useRef(true);

	useEffect(() => {
		setShowInstallBanner(shouldShowInstallBanner());
	}, []);

	useEffect(() => {
		setMenuOpen(false);
		if (isInitialRoute.current) {
			isInitialRoute.current = false;
			return;
		}
		mainRef.current?.focus();
	}, [location.pathname]);

	useEffect(() => {
		if (!menuOpen) return;
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setMenuOpen(false);
		};
		document.addEventListener('keydown', closeOnEscape);
		return () => document.removeEventListener('keydown', closeOnEscape);
	}, [menuOpen]);

	function skipToMain(event: MouseEvent<HTMLAnchorElement>) {
		event.preventDefault();
		mainRef.current?.focus();
		mainRef.current?.scrollIntoView({ block: 'start' });
	}

	function dismissInstallBanner() {
		window.localStorage.setItem(INSTALL_BANNER_DISMISSED_KEY, 'true');
		setShowInstallBanner(false);
	}

	return (
		<>
			<SeoManager />
			<a className='skip-link' href='#main-content' onClick={skipToMain}>
				Skip to main content
			</a>
			<header className='site-header'>
				<nav
					id='primary-navigation'
					className={menuOpen ? 'main-nav open' : 'main-nav'}
					aria-label='Primary'>
					{navItems.map((item) => (
						<NavLink
							key={item.to}
							to={item.to}
							onClick={() => setMenuOpen(false)}
							className={({ isActive }) => (isActive ? 'active' : undefined)}>
							{item.label}
						</NavLink>
					))}
				</nav>
				<Link
					className='brand'
					to='/'
					onClick={() => setMenuOpen(false)}
					aria-label='Finny Boy Fab home'>
					<img
						className='brand-logo'
						src='/images/optimized/primary-logo-main.png'
						alt='Finny Boy Fab'
						width='720'
						height='266'
					/>
				</Link>
				<div className='header-actions'>
					<button
						className='icon-button'
						type='button'
						onClick={openCart}
						aria-label='Open cart'>
						<ShoppingBag size={20} aria-hidden='true' />
						<span className='cart-count' aria-live='polite' aria-atomic='true'>
							{cart?.itemCount ?? 0}
						</span>
					</button>
					<button
						className='icon-button menu-toggle'
						type='button'
						onClick={() => setMenuOpen((open) => !open)}
						aria-label={menuOpen ? 'Close menu' : 'Open menu'}
						aria-expanded={menuOpen}
						aria-controls='primary-navigation'>
						{menuOpen ? <X size={22} aria-hidden='true' /> : <Menu size={22} aria-hidden='true' />}
					</button>
				</div>
			</header>
			{showInstallBanner && (
				<aside className='install-banner' aria-label='Add Finny Boy Fab to your Home Screen'>
					<Share className='install-banner-icon' size={20} aria-hidden='true' />
					<p>
						Open Finny Boy Fab like an app. Tap <strong>Share</strong>, then{' '}
						<strong>Add to Home Screen</strong>. No App Store needed.
					</p>
					<button
						className='install-banner-dismiss'
						type='button'
						onClick={dismissInstallBanner}
						aria-label='Dismiss Home Screen instructions'>
						<X size={18} aria-hidden='true' />
					</button>
				</aside>
			)}

			<main id='main-content' ref={mainRef} tabIndex={-1}>
				{children}
			</main>

			<footer className='site-footer'>
				<div>
					<p className='footer-brand'>Finny Boy Fab</p>
					<p>
						Handcrafted hardwood boards for prep, service, and everyday kitchen
						rituals.
					</p>
					<img
						className='finn-approved'
						src='/images/optimized/finn-approved.png'
						alt='Finn approved'
						width='680'
						height='159'
						loading='lazy'
						decoding='async'
					/>
				</div>
				<nav className='footer-links' aria-label='Footer'>
					<Link to='/shop'>Shop</Link>
					<Link to='/learn'>Care Guide</Link>
					<Link to='/about'>Our Story</Link>
					<Link to='/custom-inquiry'>Custom Inquiry</Link>
					<Link to='/contact'>Contact</Link>
					<Link to='/privacy'>Privacy</Link>
					<Link to='/cookies'>Cookies</Link>
					<Link to='/terms'>Terms</Link>
				</nav>
			</footer>

			<CartDrawer />
		</>
	);
}
