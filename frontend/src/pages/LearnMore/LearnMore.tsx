import { Droplets, Sparkles, Sun } from 'lucide-react';
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

			<div className='material-band'>
				<div>
					<h2>Food Grade vs. Food Safe</h2>
					<p>
						Walnut is rich and slightly softer under the knife. Maple is pale,
						dense, and classic. Cherry starts warm and deepens beautifully with
						age.
					</p>
				</div>
				<img
					src='/images/walnut-end-grain.png'
					alt='Walnut end-grain cutting board'
				/>
			</div>
			<div className='material-band'>
				<div className='youtube-container'>
					<iframe
						src='https://www.youtube.com/embed/yM5LxrXoxn0?rel=0&rel=0'
						width='500'
						height='350'
						allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'></iframe>
				</div>

				<div>
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

			<div className='material-band'>
				<div>
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
				<img
					src='/images/wood-grain.webp'
					alt='Walnut end-grain cutting board'
				/>
			</div>
		</section>
	);
}
