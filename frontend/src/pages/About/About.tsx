import './About.css';

export default function About() {
	return (
		<section className='section page-section about-page'>
			<div>
				<p className='eyebrow'>Our Story</p>
				<h1>From our shop to your kitchen.</h1>
				<p>
					Finny Boy Fabrications started in our garage with a table saw, a pile
					of wood, and our dog Finn underfoot supervising everything. We're a
					veteran-owned small shop in North Carolina making handcrafted wood
					products the right way — with real wood, food-safe finishes, and the
					kind of attention to detail that comes from caring about what you put
					your name on. This business grew out of our own journey removing
					toxins from our household — especially around food. Every nontoxic
					option we found was ugly and meant to be thrown away. We wanted
					something nontoxic we could trust completely and built to last, so we
					made it ourselves.
				</p>
				<p>
					Every board that leaves our shop has been touched by our hands,
					finished with care, and approved by Finn.
				</p>
				<p className='letter-signoff'>
					<span>With gratitude,</span>
					<span>Justin, Leigh Ann, and Finn</span>
				</p>
			</div>
			<div className='about-stat-grid'>
				<img
					className='family-pic'
					src='/images/optimized/family-pic.jpg'
					alt='Justin and Leigh Ann with Finn, the family behind Finny Boy Fab'
					width='1066'
					height='1800'
					loading='lazy'
					decoding='async'
				/>
			</div>
		</section>
	);
}
