import { Menu, ShoppingBag, X } from 'lucide-react';
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useCart } from '../../lib/cart';
import CartDrawer from '../CartDrawer';
import './Layout.css';

const navItems = [
	{ label: 'Home', to: '/' },
	{ label: 'Shop', to: '/shop' },
	{ label: 'Learn More', to: '/learn' },
	{ label: 'Our Story', to: '/about' },
	{ label: 'Custom Inquiry', to: '/custom-inquiry' },
	{ label: 'Contact', to: '/contact' },
];

export default function Layout({ children }: { children: ReactNode }) {
	const [menuOpen, setMenuOpen] = useState(false);
	const { cart, openCart } = useCart();
	const location = useLocation();
	const mainRef = useRef<HTMLElement>(null);
	const isInitialRoute = useRef(true);

	useEffect(() => {
		setMenuOpen(false);
		const pageTitles: Record<string, string> = {
			'/': 'Home',
			'/home': 'Home',
			'/shop': 'Shop',
			'/about': 'Our Story',
			'/learn': 'Board Care Guide',
			'/contact': 'Contact',
			'/custom-inquiry': 'Custom Inquiry',
			'/cart': 'Cart',
			'/checkout/success': 'Order Status',
		};
		const pageTitle = location.pathname.startsWith('/products/')
			? 'Product Details'
			: (pageTitles[location.pathname] ?? 'Page Not Found');
		document.title = `${pageTitle} | Finny Boy Fab`;
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

	return (
		<>
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
						src='/images/primary-logo-main.png'
						alt='Finny Boy Fab'
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
						src='/images/finn-approved.png'
						alt='Finn approved'
					/>
				</div>
				<nav className='footer-links' aria-label='Footer'>
					<Link to='/shop'>Shop</Link>
					<Link to='/learn'>Care Guide</Link>
					<Link to='/about'>Our Story</Link>
					<Link to='/custom-inquiry'>Custom Inquiry</Link>
					<Link to='/contact'>Contact</Link>
				</nav>
			</footer>

			<CartDrawer />
		</>
	);
}
