// Reconcile against the live DOM, not a cached earnings value: React refreshes
// can replace digit strips and reset SVG attributes without changing the total.
export function syncBusinessMetrics(root, metrics, animate = false) {
 const get = selector => root.querySelector(selector);
 const attr = (node, key, value) => { if (node.getAttribute(key) !== value) node.setAttribute(key, value); };
 const text = (selector, value) => { const node = get(selector); if (node.textContent !== value) node.textContent = value; };
 const formatted = metrics.earnings.toLocaleString('en-US');
 text('.earnings-readable', formatted);
 attr(get('.business-earnings'), 'aria-label', `${formatted} dollars in illustrative monthly gross revenue`);
 for (const group of root.querySelectorAll('.earnings-digit-group')) {
  const place = Number(group.dataset.place);
  const display = metrics.earnings >= place || place === 1 ? 'flex' : 'none';
  if (group.style.display !== display) group.style.display = display;
  const strip = group.querySelector('.earnings-digit-strip');
  const transition = animate ? 'transform 140ms cubic-bezier(.2,.7,.2,1)' : 'none';
  if (strip.style.transition !== transition) strip.style.transition = transition;
  const transform = `translateY(-${Math.floor(metrics.earnings / place) % 10}em)`;
  if (strip.style.transform !== transform) strip.style.transform = transform;
 }
 text('.business-subscribers', metrics.subscribers.toLocaleString('en-US'));
 text('.business-purchases', metrics.purchases.toLocaleString('en-US'));
 text('.subscription-revenue', `$${metrics.subscriptionsRevenue.toLocaleString('en-US')}`);
 text('.purchase-revenue', `$${metrics.purchasesRevenue.toLocaleString('en-US')}`);
 const fraction = metrics.earnings / 80000, xEnd = 600 * fraction;
 const points = Array.from({length:31}, (_, i) => `${i === 0 ? 'M' : 'L'}${xEnd*i/30},${149-143*fraction*(i/30)**1.6}`).join(' ');
 attr(get('.revenue-line'), 'd', points);
 attr(get('.revenue-area'), 'd', `${points} L${xEnd},149 L0,149Z`);
 attr(get('.revenue-dot'), 'cx', String(xEnd));
 attr(get('.revenue-dot'), 'cy', String(149-143*fraction));
}
