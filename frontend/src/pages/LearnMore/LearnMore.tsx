import { Droplets, Leaf, ShieldCheck, Sparkles, Sun } from 'lucide-react';
import './LearnMore.css';

const careItems = [
	{
		icon: Droplets,
		title: 'Wash by hand',
		body: 'Wash with hot, soapy water after use, rinse, and dry. Avoid long soaking.',
	},
	{
		icon: Sun,
		title: 'Dry upright',
		body: 'Stand the board upright or position it so air can reach both faces while it dries.',
	},
	{
		icon: Sparkles,
		title: 'Refresh the finish',
		body: 'Refresh the surface with the board’s coconut oil and beeswax finish when it looks dry.',
	},
];

const whyWoodLinks = [
	{
		source: 'USDA FSIS',
		title: 'Cutting Boards: cleaning and avoiding cross-contamination',
		href: 'https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/cutting-boards',
	},
];

export default function LearnMore() {
	return (
		<section className='section page-section learn-page'>
			<div className='learn-hero'>
				<p className='eyebrow'>Learn More</p>
				<h1>How to choose and care for a hardwood board.</h1>
				<p>
					Board shape, grain pattern, and dimensions can help you choose a piece
					for food preparation or serving. Explore the details on each product page
					and choose the size and style that fit your kitchen.
				</p>
			</div>

			<div className='care-grid'>
				{careItems.map((item) => {
					const Icon = item.icon;
					return (
						<article key={item.title}>
							<Icon size={24} aria-hidden='true' />
							<h2>{item.title}</h2>
							<p>{item.body}</p>
						</article>
					);
				})}
			</div>

			<div className='material-band transparency-band'>
				<div className='transparency-copy'>
					<p className='transparency-kicker'>Materials and construction</p>
					<h2>Our Commitment to Transparency</h2>
					<p className='transparency-lede'>
						Here are the materials and construction details we can share about our
						current boards.
					</p>
					<div className='transparency-points'>
						<article>
							<Leaf size={22} aria-hidden='true' />
							<div>
								<span>Wood Type</span>
								<p>
									We use hardwoods selected for each board's appearance and
									construction. Grain and color vary between pieces. Wood boards,
									like other cutting surfaces, need regular cleaning and care.
								</p>
							</div>
						</article>
						<article>
							<ShieldCheck size={22} aria-hidden='true' />
							<div>
								<span>Glue Type</span>
								<p>
									We use Titebond III in wood joinery. Adhesive is part of the
									board's construction; it is not the board's surface finish.
								</p>
							</div>
						</article>
						<article>
							<Sparkles size={22} aria-hidden='true' />
							<div>
								<span>Finish</span>
								<p>
									Our current finish is a blend of virgin coconut oil and beeswax.
									The surface can be refreshed when it begins to look dry; see the
									care steps on this page.
								</p>
							</div>
						</article>
					</div>
				</div>
				<div className='transparency-image'>
					<img
						src='/images/optimized/products/end-grain-cutting-board/walnut-end-grain.jpg'
						alt='Walnut end-grain cutting board'
						width='1800'
						height='1200'
						loading='lazy'
						decoding='async'
					/>
				</div>
			</div>
			<div className='material-band branded-band media-first'>
				<div className='band-media-frame'>
					<img
						src='/images/optimized/products/maple-walnut-serving-board/maple-walnut-server.jpg'
						alt='Maple and walnut serving board'
						width='1800'
						height='1200'
						loading='lazy'
						decoding='async'
					/>
				</div>

				<div className='band-copy'>
					<p className='transparency-kicker'>Choosing a board</p>
					<h2>Why Wood?</h2>
					<p>
						Wood and nonporous materials such as plastic are both used for
						cutting boards. USDA guidance notes that nonporous surfaces are easier
						to clean than wood. Choose a surface and size that suit your kitchen,
						and clean it after use.
					</p>
					<p>
						For raw meat, poultry, or seafood, USDA recommends considering a
						separate board from the one used for produce and ready-to-eat foods.
						Wash boards with hot, soapy water, rinse, and air dry or pat dry with
						clean paper towels.
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
								<span className='sr-only'> (opens in a new tab)</span>
							</a>
						))}
					</div>
				</div>
			</div>

			<div className='material-band branded-band construction-band'>
				<div className='band-copy'>
					<p className='transparency-kicker'>Board construction</p>
					<h2>End grain vs. Edge Grain</h2>
					<p>
						End grain shows the ends of the wood fibers at the board's surface;
						edge grain shows the sides of the fibers. These describe how the wood
						is oriented, not a guarantee about how a board will perform. Any board
						used for cutting can show marks over time. Review the construction and
						care details for the individual product you are considering.
					</p>
				</div>
				<div className='band-media-frame'>
					<img
						src='/images/wood-grain.webp'
						alt='Illustration comparing wood fibers to a bundle of straws and showing face, edge, and end grain cuts'
						width='3000'
						height='2000'
						loading='lazy'
						decoding='async'
					/>
				</div>
			</div>
		</section>
	);
}
