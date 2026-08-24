import { ArrowRight, Sparkles, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductGrid from '../../components/ProductGrid';
import { getProducts } from '../../lib/api';
import type { Product } from '../../types/store';
import './Shop.css';

export default function Shop() {
	const [products, setProducts] = useState<Product[]>([]);
	const [wood, setWood] = useState('All');

	useEffect(() => {
		getProducts().then(setProducts);
	}, []);

	const woods = useMemo(
		() => [
			'All',
			...Array.from(new Set(products.map((product) => product.wood))),
		],
		[products],
	);
	const filtered =
		wood === 'All'
			? products
			: products.filter((product) => product.wood === wood);

	return (
		<section className='section page-section'>
			<div className='shop-heading'>
				<div>
					<p className='eyebrow'>Shop</p>
					<h1>Cutting boards and serving boards</h1>
					<p>
						Small-batch hardwood boards made for daily prep, easy serving, and
						long-term care.
					</p>
				</div>
				<div
					className='filter-control'
					aria-label='Filter products by wood'>
					<SlidersHorizontal size={17} />
					<select
						value={wood}
						onChange={(event) => setWood(event.target.value)}>
						{woods.map((option) => (
							<option key={option}>{option}</option>
						))}
					</select>
				</div>
			</div>
			<ProductGrid products={filtered} />
			<section
				className='special-projects'
				aria-labelledby='special-projects-title'>
				<div className='special-projects-copy'>
					<p className='eyebrow'>Special Projects</p>
					<h2 id='special-projects-title'>One-off pieces from the bench</h2>
					<p>
						Occasionally, the shop turns out a single unique piece: an unusual
						slab, a limited wood pairing, a serving board with extra character,
						or a custom build that will not be repeated.
					</p>
					<Link
						className='text-link'
						to='/custom-inquiry'>
						Start a custom inquiry <ArrowRight size={16} />
					</Link>
				</div>
				<div className='special-projects-card'>
					<Sparkles
						size={26}
						aria-hidden='true'
					/>
					<h3>Coming soon</h3>
					<p>
						Watch this space for special releases and one-of-one pieces when
						they come off the bench.
					</p>
				</div>
			</section>
		</section>
	);
}
