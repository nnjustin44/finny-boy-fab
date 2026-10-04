import { ArrowRight, Droplet, Hammer, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductGrid from '../../components/ProductGrid';
import { getProducts } from '../../lib/api';
import type { Product } from '../../types/store';
import './Home.css';

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
					src='/images/optimized/hero-boards.jpg'
					alt='Handcrafted walnut and maple cutting boards arranged on a workbench'
					width='1800'
					height='1200'
					fetchPriority='high'
					decoding='async'
				/>
				<div className='hero-copy'>
					<p className='eyebrow'>Handcrafted Hardwood Boards</p>
					<h1>Made for Everyday Use</h1>
					<p>
						Shop small-batch cutting boards and serving pieces built for real
						kitchens, quiet counters, and meals worth lingering over.
					</p>
					<Link
						className='button primary'
						to='/shop'>
						Shop boards <ArrowRight size={18} aria-hidden='true' />
					</Link>
				</div>
			</section>

			<section className='section intro-band'>
				<div>
					<p className='eyebrow'>Made for everyday use</p>
					<h2>Premium hardwood boards proudly made in America.</h2>
					<img
						className='american-made-home '
						src='/images/optimized/american-made.png'
						alt='Heirloom quality, proudly American made and handmade in North Carolina'
						width='900'
						height='900'
						loading='lazy'
						decoding='async'
					/>
				</div>
				<p className='intro-paragraph'>
					Food is so much more than just what we eat. It's in the quiet
					breakfast mornings, the loving “Have you eaten yet?”, the joyful
					celebrations, and even the gentle times of sorrow. We can’t make the
					meals for you, but we can make the boards that help hold all those
					precious moments.
					<br /> <br />
					Each board is made from carefully selected hardwood, so grain and color
					vary from piece to piece. Our current finish is a blend of virgin coconut
					oil and beeswax; see our care guide for upkeep.
				</p>
			</section>

			<section className='section'>
				<div className='section-heading'>
					<div>
						<p className='eyebrow'>Featured boards</p>
						<h2>Made in our workshop</h2>
					</div>
					<Link
						className='text-link'
						to='/shop'>
						View all boards <ArrowRight size={16} aria-hidden='true' />
					</Link>
				</div>
				<ProductGrid products={products} headingLevel={3} />
			</section>

			<section className='feature-strip' aria-label='Why choose Finny Boy Fab'>
				<div>
					<span>
						<Droplet
							size={28}
							aria-hidden='true'
						/>
					</span>
					<h3>Oil and Beeswax Finish</h3>
					<p>
						We finish boards with a blend of virgin coconut oil and beeswax. The
						finish can be refreshed when the surface looks dry.
					</p>
				</div>
				<div>
					<span>
						<Hammer
							size={28}
							aria-hidden='true'
						/>
					</span>
					<h3>Small-Batch Craft</h3>
					<p>
						We make hardwood boards and serving pieces in our North Carolina workshop.
					</p>
				</div>
				<div>
					<span>
						<Star
							size={28}
							aria-hidden='true'
						/>
					</span>
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
