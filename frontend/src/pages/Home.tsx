import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductGrid from '../components/ProductGrid';
import { getProducts } from '../lib/api';
import type { Product } from '../types/store';

export default function Home() {
	const [products, setProducts] = useState<Product[]>([]);

	useEffect(() => {
		getProducts().then((items) =>
			setProducts(items.filter((item) => item.featured)),
		);
	}, []);

	return (
		<>
			<section className='hero'>
				<img
					src='/images/hero-boards.png'
					alt='Collection of handcrafted hardwood cutting boards'
				/>
				<div className='hero-copy'>
					<p className='eyebrow'>Handcrafted Hardwood Boards</p>
					<h1>Heirloom Quality</h1>
					<p>
						Shop small-batch cutting boards and serving pieces built for real
						kitchens, quiet counters, and meals worth lingering over.
					</p>
					<Link
						className='button primary'
						to='/shop'>
						Shop boards <ArrowRight size={18} />
					</Link>
				</div>
			</section>

			<section className='section intro-band'>
				<div>
					<p className='eyebrow'>Made for everyday use</p>
					<h2>Premium hardwood boards proudly made in America.</h2>
				</div>
				<p>
					Every board begins with hand selected hardwoods for it's grain
					pattern, beauty, and uniqueness. All boards are meticulously assembled
					using non-toxic materials and finished with the highest quality
					food-safe finish. The result is simple, beautiful, and substantial
					enough to leave on display.
				</p>
			</section>

			<section className='section'>
				<div className='section-heading'>
					<div>
						<p className='eyebrow'>Featured boards</p>
						<h2>Customer-ready MVP catalog</h2>
					</div>
					<Link
						className='text-link'
						to='/shop'>
						View all <ArrowRight size={16} />
					</Link>
				</div>
				<ProductGrid products={products} />
			</section>

			<section className='feature-strip'>
				<div>
					<span>01</span>
					<h3>Food-Grade Finish</h3>
					<p>
						Coconut oil and beeswax protect the wood while keeping care simple.
					</p>
				</div>
				<div>
					<span>02</span>
					<h3>Built to Order</h3>
					<p>
						Inventory stays intentionally limited for beauty and sustainability.
					</p>
				</div>
				<div>
					<span>03</span>
					<h3>Veteran Owned and Operated</h3>
					<p>
						We bring the same discipline, attention to detail, and commitment to
						excellence into every board we craft.
					</p>
				</div>
			</section>
		</>
	);
}
