import { Droplets, Leaf, ShieldCheck, Sparkles, Sun } from 'lucide-react';
import './LearnMore.css';

const careItems = [
	{
		icon: Droplets,
		title: 'Wash by hand',
		body: 'Use warm water and mild soap. Skip the dishwasher and long soaking.',
	},
	{
		icon: Sun,
		title: 'Dry upright',
		body: 'Let both faces breathe so the board dries evenly after each use.',
	},
	{
		icon: Sparkles,
		title: 'Refresh the finish',
		body: 'Apply virgin coconut oil and beeswax when the surface starts looking dry.',
	},
];

const whyWoodLinks = [
	{
		source: 'PubMed',
		title:
			'Cutting Boards of Plastic and Wood Contaminated Experimentally with Bacteria',
		href: 'https://pubmed.ncbi.nlm.nih.gov/31113021/',
	},
	{
		source: 'ScienceDirect',
		title:
			'The measurement of food safety and security risks associated with micro- and nanoplastic pollution',
		href: 'https://www.sciencedirect.com/science/article/pii/S0165993623000808?via%3Dihub',
	},
	{
		source: 'University of Wisconsin',
		title: 'Wood vs. Plastic boards',
		href: 'https://butcherblock.com/wp-content/uploads/2023/02/University_of_Wisconsin_ScienceReport_2023.pdf',
	},
	{
		source: 'Video',
		title: 'Watch: Why wood cutting boards are safer than plastic',
		href: 'https://www.youtube.com/watch?v=yM5LxrXoxn0',
	},
];

export default function LearnMore() {
	return (
		<section className='section page-section learn-page'>
			<div className='learn-hero'>
				<p className='eyebrow'>Learn More</p>
				<h1>How to choose and care for a hardwood board.</h1>
				<p>
					End-grain boards are best for heavy prep, long serving boards are best
					for table presentation, and round boards bring a softer shape to
					charcuterie or pastry service.
				</p>
			</div>

			<div className='care-grid'>
				{careItems.map((item) => {
					const Icon = item.icon;
					return (
						<article key={item.title}>
							<Icon size={24} />
							<h2>{item.title}</h2>
							<p>{item.body}</p>
						</article>
					);
				})}
			</div>

			<div className='material-band transparency-band'>
				<div className='transparency-copy'>
					<p className='transparency-kicker'>Food-safe by design</p>
					<h2>Our Commitment to Transparency</h2>
					<p className='transparency-lede'>
						Every board is built around three choices we are comfortable naming:
						the wood, the adhesive, and the finish your food touches every day.
					</p>
					<div className='transparency-points'>
						<article>
							<Leaf size={22} />
							<div>
								<span>Wood Type</span>
								<p>
									The FDA does not maintain an explicit approved wood list.
									Instead, wood must be smooth, nonporous, and easily cleanable
									per FDA Food Code guidelines (Section 4-101.11). We use
									closed-grain woods that meet that standard and reduce places
									where bacteria can hide.
								</p>
							</div>
						</article>
						<article>
							<ShieldCheck size={22} />
							<div>
								<span>Glue Type</span>
								<p>
									We use Titebond III for wood joinery. Once cured, it forms a
									waterproof bond stronger than the wood itself and meets 21 CFR
									175.105 for adhesives used around food-contact surfaces. For
									customers who want no glue contact at all, The Perfect Board
									is a single solid piece of hardwood.
								</p>
							</div>
						</article>
						<article>
							<Sparkles size={22} />
							<div>
								<span>Finish</span>
								<p>
									We skip mineral oil and finish every board with a virgin
									coconut oil and beeswax blend. The oil is natural and food
									safe, while the beeswax seals and hardens the surface so it
									can be refreshed for years of use.
								</p>
							</div>
						</article>
					</div>
				</div>
				<div className='transparency-image'>
					<img
						src='/images/products/end-grain-cutting-board/walnut-end-grain.png'
						alt='Walnut end-grain cutting board'
					/>
				</div>
			</div>
			<div className='material-band branded-band media-first'>
				<div className='band-media-frame'>
					<img
						src='/images/products/maple-walnut-serving-board/maple-walnut-server.png'
						alt='Maple and walnut serving board'
					/>
				</div>

				<div className='band-copy'>
					<p className='transparency-kicker'>Material science</p>
					<h2>Why Wood?</h2>
					<p>
						Not only do they eliminate microplastics, science has proven over
						the years that wood does not allow for bacteria growth compared to
						plastic. Some studies even suggest having anti-bacterial properties.
					</p>
					<p>
						Although better than plastic, we tend to steer away from bamboo
						boards due to the amount of glue used to make them.
					</p>
					<div className='source-list'>
						<p className='source-list-label'>Further reading</p>
						{whyWoodLinks.map((link) => (
							<a
								key={link.href}
								className='source-card'
								href={link.href}
								target='_blank'
								rel='noreferrer'>
								<span className='source-tag'>{link.source}</span>
								<span className='source-title'>{link.title}</span>
							</a>
						))}
					</div>
				</div>
			</div>

			<div className='material-band branded-band'>
				<div className='band-copy'>
					<p className='transparency-kicker'>Board construction</p>
					<h2>End grain vs. Edge Grain</h2>
					<p>
						Imagine wood like a bundle of straws. When looking at the bundle
						long ways, thats calls the face or edge grain. While looking at the
						bundle straight down through the openings that is called the end
						grain. The fibers of an end grain board will move out of the way for
						a knife's edge. This will 'heal' the surface of the board usually
						leaving not visible marks on the surface of the board. While edge
						grain boards will mar and scratch more quickly over time. Edge grain
						boards tend to be more beautiful for serving. The Flag Ship board
						can be reversed to both serve and food prep if no rubber feet are
						installed.
					</p>
				</div>
				<div className='band-media-frame'>
					<img
						src='/images/wood-grain.webp'
						alt='Walnut end-grain cutting board'
					/>
				</div>
			</div>
		</section>
	);
}
