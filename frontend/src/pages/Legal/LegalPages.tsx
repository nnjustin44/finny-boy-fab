import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import './LegalPages.css';

const EFFECTIVE_DATE = 'September 1, 2026';

const policyLinks = [
	{ label: 'Privacy Policy', to: '/privacy' },
	{ label: 'Cookie Policy', to: '/cookies' },
	{ label: 'Terms of Use', to: '/terms' },
];

type LegalPageProps = {
	title: string;
	intro: string;
	summary: ReactNode;
	children: ReactNode;
};

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
	return (
		<a href={href} target='_blank' rel='noreferrer'>
			{children}
			<span className='sr-only'> (opens in a new tab)</span>
		</a>
	);
}

function LegalPage({ title, intro, summary, children }: LegalPageProps) {
	return (
		<section className='section page-section legal-page'>
			<aside className='legal-ledger'>
				<p className='eyebrow'>Policy set</p>
				<nav aria-label='Legal policies'>
					{policyLinks.map((policy) => (
						<NavLink
							key={policy.to}
							to={policy.to}
							className={({ isActive }) => (isActive ? 'active' : undefined)}>
							{policy.label}
						</NavLink>
					))}
				</nav>
				<p className='legal-ledger-note'>Effective {EFFECTIVE_DATE}</p>
			</aside>

			<article className='legal-document'>
				<header className='legal-header'>
					<p className='eyebrow'>Finny Boy Fab legal</p>
					<h1>{title}</h1>
					<p className='legal-effective'>Effective and last updated: {EFFECTIVE_DATE}</p>
					<p className='legal-intro'>{intro}</p>
				</header>

				<div className='legal-summary'>
					<h2>At a glance</h2>
					{summary}
				</div>

				<div className='legal-copy'>{children}</div>
			</article>
		</section>
	);
}

export function PrivacyPolicy() {
	return (
		<LegalPage
			title='Privacy Policy'
			intro='This policy explains what information Finny Boy Fab collects, why we use it, and the choices available to you when you browse, contact us, subscribe, or place an order.'
			summary={
				<p>
					We use personal information to operate the shop, fulfill orders, answer
					inquiries, and send newsletters you request. We do not sell personal
					information or use it for cross-context behavioral advertising.
				</p>
			}>
			<section id='privacy-information'>
				<h2>1. Information we collect</h2>
				<h3>Orders and checkout</h3>
				<p>
					When you place an order, we may receive your name, email address, phone
					number, shipping and billing details, products selected, wood selection,
					engraving details, other options, transaction status, and related order
					information. Payment information is entered directly into Stripe's hosted
					checkout. Finny Boy Fab does not intentionally receive or store your full
					card number.
				</p>
				<h3>Inquiries</h3>
				<p>
					If you contact us or begin a custom inquiry, you may provide your name,
					email address, phone number, message, dimensions, materials, intended use,
					budget, timeline, and other project details. Our current contact forms open
					your email application, so your email provider also processes that message.
				</p>
				<h3>Newsletter sign-up</h3>
				<p>
					If you subscribe, we may collect your email address, first name, and last
					name and send them to Mailchimp to manage the mailing list.
				</p>
				<h3>Browser and technical information</h3>
				<p>
					The store saves a randomly generated cart identifier in your browser's
					local storage so it can retrieve your active cart. Our hosting and service
					providers may also process standard technical information such as an IP
					address, browser type, device information, request time, and diagnostic or
					security logs.
				</p>
			</section>

			<section>
				<h2>2. How we use information</h2>
				<p>We use information as reasonably necessary to:</p>
				<ul>
					<li>create and maintain a cart and process, customize, ship, and support orders;</li>
					<li>send receipts, order updates, and service communications;</li>
					<li>respond to questions and custom project inquiries;</li>
					<li>send newsletters or marketing messages you requested;</li>
					<li>protect the store, prevent fraud, troubleshoot, and enforce our terms;</li>
					<li>comply with legal, tax, accounting, and regulatory obligations; and</li>
					<li>understand and improve the reliability and usability of the store.</li>
				</ul>
			</section>

			<section>
				<h2>3. When we share information</h2>
				<p>
					We share information only as needed for the purposes described above,
					including with:
				</p>
				<ul>
					<li>
						<strong>Stripe</strong>, which hosts checkout and processes payments,
						fraud signals, and transaction data. See the{' '}
						<ExternalLink href='https://stripe.com/privacy'>Stripe Privacy Policy</ExternalLink>.
					</li>
					<li>
						<strong>Mailchimp</strong>, if you subscribe to the newsletter. See{' '}
						<ExternalLink href='https://mailchimp.com/legal/'>Mailchimp Legal Policies</ExternalLink>.
					</li>
					<li>hosting, email, shipping, professional, security, and technical service providers;</li>
					<li>government authorities or other parties when required by law or needed to protect rights and safety; and</li>
					<li>a successor in connection with a merger, sale, financing, reorganization, or transfer of the business.</li>
				</ul>
				<p>
					We do not sell personal information or share it for cross-context behavioral
					advertising. If our practices change, we will update this policy and provide
					any choices required by law.
				</p>
			</section>

			<section>
				<h2>4. Retention</h2>
				<p>
					We retain information only as long as reasonably needed to fulfill the
					purposes described here, maintain business and tax records, resolve
					disputes, enforce agreements, and comply with law. Retention periods vary
					by the type of information and the service provider involved. You can clear
					the cart identifier from your browser at any time, though doing so may make
					the current cart unavailable on that device.
				</p>
			</section>

			<section>
				<h2>5. Your choices and privacy rights</h2>
				<p>
					You may unsubscribe from a marketing email using the link in that message.
					You may also ask to access, correct, or delete personal information, or to
					withdraw consent where applicable. Rights and exceptions differ by
					location, and we may need to verify your identity before completing a
					request. We will not discriminate against you for exercising a right
					provided by applicable law. To make a request, use our{' '}
					<Link to='/contact'>contact page</Link>.
				</p>
			</section>

			<section>
				<h2>6. Children</h2>
				<p>
					This store is not directed to children under 13, and we do not knowingly
					collect personal information from them. If you believe a child under 13 has
					provided personal information, please use our{' '}
					<Link to='/contact'>contact page</Link> so we can review and delete it as
					appropriate.
				</p>
			</section>

			<section>
				<h2>7. Security</h2>
				<p>
					We use reasonable administrative, technical, and organizational safeguards
					designed to protect information. No internet transmission or storage system
					is completely secure, so we cannot guarantee absolute security.
				</p>
			</section>

			<section>
				<h2>8. Processing in other locations</h2>
				<p>
					Our providers may process information in the United States and other
					countries where they operate. Those locations may have different data
					protection laws from your own.
				</p>
			</section>

			<section>
				<h2>9. Changes to this policy</h2>
				<p>
					We may update this policy as the store or legal requirements change. The
					date above shows when the current version became effective. Material
					changes will be highlighted through the store when required by law.
				</p>
			</section>

			<section>
				<h2>10. Contact us</h2>
				<p>
					Finny Boy Fab is based in North Carolina, United States. For privacy
					questions or requests, please use our <Link to='/contact'>contact page</Link>.
				</p>
			</section>
		</LegalPage>
	);
}

export function CookiePolicy() {
	return (
		<LegalPage
			title='Cookie Policy'
			intro='This policy explains how the Finny Boy Fab store uses browser storage and how third-party services may use cookies or similar technology.'
			summary={
				<p>
					The storefront currently uses one essential local-storage item to remember
					your cart. We do not currently set analytics, advertising, or social-media
					cookies on this storefront.
				</p>
			}>
			<section>
				<h2>1. Cookies and similar technology</h2>
				<p>
					Cookies are small text files a website can save in a browser. Local storage
					is a related browser feature that stores information on a device. This
					policy uses “browser storage” to describe both technologies where
					appropriate.
				</p>
			</section>

			<section>
				<h2>2. What this storefront uses</h2>
				<div className='legal-table-wrap'>
					<table>
						<caption>Browser storage currently used by Finny Boy Fab</caption>
						<thead>
							<tr>
								<th scope='col'>Name</th>
								<th scope='col'>Type</th>
								<th scope='col'>Purpose</th>
								<th scope='col'>Duration</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td><code>finnyboyfab.cartId</code></td>
								<td>Essential first-party local storage</td>
								<td>Identifies and retrieves the active shopping cart.</td>
								<td>Until you clear site data or it is replaced.</td>
							</tr>
						</tbody>
					</table>
				</div>
				<p>
					Because this storage is necessary to provide the cart you request, it is
					used when you use the shopping cart. The storefront does not currently set
					optional analytics, advertising, or social-media cookies.
				</p>
			</section>

			<section>
				<h2>3. Stripe-hosted checkout</h2>
				<p>
					When you select secure checkout, you leave this storefront and visit a page
					hosted by Stripe. Stripe may use cookies and similar technologies for
					security, fraud prevention, checkout functionality, preferences, and other
					purposes described in its{' '}
					<ExternalLink href='https://stripe.com/legal/cookies-policy'>Cookie Policy</ExternalLink>.
					Stripe controls the technologies on its hosted pages and may offer controls
					based on your location.
				</p>
			</section>

			<section>
				<h2>4. Newsletter technology</h2>
				<p>
					If you subscribe, newsletter messages managed through Mailchimp may contain
					links, pixels, or similar features as described in Mailchimp's{' '}
					<ExternalLink href='https://mailchimp.com/legal/cookies/'>Cookie Statement</ExternalLink>.
					The Finny Boy Fab storefront does not currently load a Mailchimp tracking
					script in its pages.
				</p>
			</section>

			<section>
				<h2>5. Your controls</h2>
				<p>
					Most browsers let you inspect, delete, or block cookies and local storage.
					Clearing <code>finnyboyfab.cartId</code> may make your current cart
					unavailable on that device. Controls for Stripe-hosted checkout are governed
					by Stripe and your browser settings.
				</p>
			</section>

			<section>
				<h2>6. Changes and contact</h2>
				<p>
					We will update this policy if our use of browser storage changes. For
					questions, please use our <Link to='/contact'>contact page</Link>.
				</p>
			</section>
		</LegalPage>
	);
}

export function TermsOfUse() {
	return (
		<LegalPage
			title='Terms of Use'
			intro='These terms govern your use of the Finny Boy Fab store and any order you place through it. Please read them before using the store or checking the agreement box at checkout.'
			summary={
				<p>
					By using the store, and specifically by checking the required agreement box
					before checkout, you agree to these Terms of Use, the Privacy Policy, and
					the Cookie Policy.
				</p>
			}>
			<section>
				<h2>1. Acceptance and electronic agreement</h2>
				<p>
					These Terms of Use are a binding agreement between you and Finny Boy Fab.
					By accessing or using the store, you agree to these terms. When you check
					the required agreement box before checkout, you also affirmatively consent
					to conduct the transaction electronically and agree to the version of these
					terms, our <Link to='/privacy'>Privacy Policy</Link>, and our{' '}
					<Link to='/cookies'>Cookie Policy</Link> then posted. If you do not agree,
					do not use the store or place an order.
				</p>
			</section>

			<section>
				<h2>2. Eligibility</h2>
				<p>
					You must be at least 18 years old, or the age of legal majority where you
					live, and able to enter a binding contract to place an order. If you use the
					store for an organization, you represent that you have authority to bind it.
				</p>
			</section>

			<section>
				<h2>3. Handmade products and custom details</h2>
				<p>
					Wood is a natural material. Grain, color, texture, knots, mineral streaks,
					and other visual details vary, so a finished item will be unique and may
					not exactly match photographs. Dimensions and colors shown online are
					reasonable representations and may vary slightly because products are made
					by hand and screens display color differently.
				</p>
				<p>
					You are responsible for reviewing selections, initials, spelling,
					dimensions, and other customization details before ordering. We may contact
					you to clarify a custom request and may decline work we cannot safely or
					reasonably complete.
				</p>
			</section>

			<section>
				<h2>4. Orders, prices, and availability</h2>
				<p>
					Prices are shown in U.S. dollars unless stated otherwise. Taxes, shipping,
					and other charges are shown when applicable during checkout. Product,
					pricing, and availability information may occasionally contain errors. We
					may correct an error or refuse, limit, or cancel an order before acceptance,
					including for suspected fraud, unavailable materials, or an incorrect price.
					If payment was collected for a canceled order, we will issue an appropriate
					refund. An automated confirmation does not by itself mean we accepted an
					order.
				</p>
			</section>

			<section>
				<h2>5. Production, shipping, and delivery</h2>
				<p>
					Finny Boy Fab is a small shop that continues to fulfill military
					obligations. Please allow approximately 2–3 weeks for an order to be
					completed before shipment unless a different estimate is stated. Production
					and delivery dates are good-faith estimates, not guarantees, and can be
					affected by customization, material availability, carrier delays, weather,
					and other events outside our reasonable control. Risk of loss and title
					transfer as provided by applicable law.
				</p>
			</section>

			<section>
				<h2>6. Payments</h2>
				<p>
					Payments are processed through Stripe. Your use of Stripe's hosted checkout
					is also subject to Stripe's applicable terms and{' '}
					<ExternalLink href='https://stripe.com/privacy'>Privacy Policy</ExternalLink>.
					You represent that you are authorized to use the payment method submitted.
				</p>
			</section>

			<section>
				<h2>7. Returns, damage, and order concerns</h2>
				<p>
					Please inspect an order when it arrives and contact us promptly about damage,
					an incorrect item, or another concern. Eligibility for a return, replacement,
					or refund depends on the circumstances, the condition of the item, any policy
					presented with the sale, and applicable law. Personalized and custom-made
					items may have different return eligibility. Nothing in these terms limits a
					right or remedy that cannot lawfully be limited.
				</p>
			</section>

			<section>
				<h2>8. Acceptable use</h2>
				<p>You may not:</p>
				<ul>
					<li>use the store unlawfully, fraudulently, or to harm another person;</li>
					<li>interfere with security, operation, accounts, networks, or other users;</li>
					<li>introduce malicious code, scrape the store excessively, or attempt unauthorized access;</li>
					<li>misrepresent your identity, authority, payment information, or order details; or</li>
					<li>copy or exploit store content except as permitted by law or written permission.</li>
				</ul>
			</section>

			<section>
				<h2>9. Intellectual property</h2>
				<p>
					The store and its original text, graphics, photographs, logos, product
					designs, layout, and software are owned by Finny Boy Fab or used with
					permission and are protected by applicable intellectual-property laws. We
					grant you a limited, revocable, non-transferable right to use the store for
					personal shopping and informational purposes.
				</p>
			</section>

			<section>
				<h2>10. Third-party services and links</h2>
				<p>
					The store may link to or use services we do not control, including Stripe,
					Mailchimp, email providers, and shipping providers. Their terms and privacy
					practices govern their services. We are not responsible for third-party
					sites or services except to the extent required by law.
				</p>
			</section>

			<section>
				<h2>11. Disclaimers</h2>
				<p>
					To the fullest extent permitted by law, the store and its content are
					provided “as is” and “as available.” We disclaim implied warranties of
					merchantability, fitness for a particular purpose, and non-infringement to
					the extent they may lawfully be disclaimed. Product care, food-safety, and
					use instructions must be followed; natural wood products can be damaged by
					improper use, heat, soaking, dishwashers, or inadequate maintenance. Some
					jurisdictions do not allow certain disclaimers, so parts of this section may
					not apply to you.
				</p>
			</section>

			<section>
				<h2>12. Limitation of liability</h2>
				<p>
					To the fullest extent permitted by law, Finny Boy Fab will not be liable for
					indirect, incidental, special, consequential, exemplary, or punitive damages,
					or loss of profits, data, or goodwill, arising from the store or an order.
					To the fullest extent permitted by law, our total liability for a claim will
					not exceed the amount you paid for the product giving rise to that claim.
					These limits do not apply where prohibited or to liability that cannot
					lawfully be limited.
				</p>
			</section>

			<section>
				<h2>13. Governing law</h2>
				<p>
					These terms are governed by the laws of North Carolina, without regard to
					conflict-of-law rules, except that mandatory consumer protections in your
					place of residence continue to apply. Subject to those protections, disputes
					may be brought in a state or federal court with jurisdiction in North
					Carolina.
				</p>
			</section>

			<section>
				<h2>14. Changes, severability, and entire agreement</h2>
				<p>
					We may update these terms for future use of the store and future orders. The
					date above identifies the current version. If a provision is unenforceable,
					the remaining provisions continue in effect. A failure to enforce a provision
					is not a waiver. These terms and the policies incorporated here are the entire
					agreement about use of the store, except for additional written terms that
					apply to a specific order or custom project.
				</p>
			</section>

			<section>
				<h2>15. Contact us</h2>
				<p>
					For questions about these terms or an order, please use our{' '}
					<Link to='/contact'>contact page</Link>.
				</p>
			</section>
		</LegalPage>
	);
}
