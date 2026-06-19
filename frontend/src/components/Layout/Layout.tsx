import { Menu, ShoppingBag, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../../lib/cart';
import CartDrawer from '../CartDrawer';
import './Layout.css';

const navItems = [
	{ label: 'Home', to: '/' },
	{ label: 'Shop', to: '/shop' },
	{ label: 'Learn More', to: '/learn' },
	{ label: 'Our Story', to: '/about' },
];

export default function Layout({ children }: { children: ReactNode }) {
	const [menuOpen, setMenuOpen] = useState(false);
	const { cart, openCart } = useCart();

	return (
		<>
			<header className='site-header'>
				<nav
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
						<ShoppingBag size={20} />
						<span className='cart-count'>{cart?.itemCount ?? 0}</span>
					</button>
					<button
						className='icon-button menu-toggle'
						type='button'
						onClick={() => setMenuOpen((open) => !open)}
						aria-label={menuOpen ? 'Close menu' : 'Open menu'}>
						{menuOpen ? <X size={22} /> : <Menu size={22} />}
					</button>
				</div>
			</header>

			<main>{children}</main>

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
				<div className='footer-links'>
					<Link to='/shop'>Shop</Link>
					<Link to='/learn'>Care Guide</Link>
					<Link to='/about'>Our Story</Link>
				</div>
			</footer>

			<CartDrawer />
		</>
	);
}
