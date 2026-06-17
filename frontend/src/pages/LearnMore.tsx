import { Droplets, Sparkles, Sun } from 'lucide-react';

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
		body: 'Apply mineral oil and board wax when the surface starts looking dry.',
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
				<img
					src='/images/walnut-end-grain.png'
					alt='Walnut end-grain cutting board'
				/>
				<div>
					<h2>Why Wood?</h2>
					<p>
						Walnut is rich and slightly softer under the knife. Maple is pale,
						dense, and classic. Cherry starts warm and deepens beautifully with
						age.
					</p>
				</div>
			</div>

			<div className='material-band'>
				<div>
					<h2>End grain vs. Edge Grain</h2>
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
		</section>
	);
}
